import type { Fish, FishTier, Prisma, User } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { clamp, weightedPick } from '../../utils/format';
import { getGameTime, timeMatches, type GameTime } from '../weather/timeSystem';
import { getWeather } from '../weather/weatherService';
import { getActiveValueMultiplier, getMarketMultiplier } from '../economy/marketService';
import { recordCatchProgress } from '../quest/questService';
import { addSeasonExp } from '../event/seasonService';
import { addTeamScore } from '../guild/teamService';

export type FishingContext = {
  user: User;
  mapId: string;
  bait?: string;
  now?: Date;
};

export type Encounter = {
  map: Prisma.MapGetPayload<{ include: { weatherState: true } }>;
  fish: Fish;
  weather: string;
  time: GameTime;
  difficulty: number;
  control: number;
  speed: number;
};

export type CatchResult = {
  fish: Fish;
  size: number;
  quality: number;
  shiny: boolean;
  value: number;
  pearls: number;
  exp: number;
};

const tierLuckWeight: Record<FishTier, number> = {
  Common: 0,
  Uncommon: 2,
  Rare: 6,
  Epic: 10,
  Legendary: 16,
  Mythic: 22,
  Secret: 28,
};

const tierPearls: Record<FishTier, number> = {
  Common: 0,
  Uncommon: 0,
  Rare: 1,
  Epic: 2,
  Legendary: 5,
  Mythic: 9,
  Secret: 15,
};

const fishPoolCache = new Map<string, Fish[]>();

export async function createEncounter(context: FishingContext): Promise<Encounter> {
  const [userMap, map, equipped, pet, fishPool] = await Promise.all([
    prisma.userMap.findUnique({
      where: { userId_mapId: { userId: context.user.id, mapId: context.mapId } },
    }),
    prisma.map.findUnique({
      where: { id: context.mapId },
      include: { weatherState: true },
    }),
    prisma.userRod.findFirst({
      where: { userId: context.user.id, isEquipped: true },
      include: { rod: true },
    }),
    prisma.userPet.findFirst({
      where: { userId: context.user.id, equipped: true },
      include: { pet: true },
    }),
    getFishPool(context.mapId),
  ]);

  if (!map) {
    throw new Error('MAP_NOT_FOUND');
  }
  if (!userMap) {
    throw new Error('MAP_LOCKED');
  }

  const weatherState = map.weatherState ?? (await getWeather(map.id));
  const weather = weatherState?.currentWeather ?? 'Sunny';
  const time = getGameTime(context.now);
  if (!equipped) {
    throw new Error('ROD_NOT_FOUND');
  }

  if (fishPool.length === 0) {
    throw new Error('NO_FISH');
  }

  const luck =
    equipped.rod.luck +
    equipped.level * 1.5 +
    equipped.prestigeCount * 4 +
    (pet ? Math.max(1, pet.level) : 0);
  const power = equipped.rod.power + equipped.level * 2 + equipped.prestigeCount * 6;
  const speed = equipped.rod.speed + equipped.level + equipped.prestigeCount * 2;

  const fish = weightedPick(
    fishPool.map((candidate) => {
      const weatherBonus = candidate.preferredWeather.includes(weather) ? 22 : 0;
      const timeBonus = timeMatches(candidate.preferredTime, time) ? 16 : 0;
      const baitBonus = context.bait && candidate.preferredBait.includes(context.bait) ? 24 : 0;
      const luckBonus = (luck * tierLuckWeight[candidate.tier]) / 28;
      const secretPenalty = candidate.tier === 'Secret' ? secretSpotWeight(map.secretSpotCondition, weather, time, context.bait) : 1;
      return {
        item: candidate,
        weight: Math.max(0.1, candidate.catchRate + weatherBonus + timeBonus + baitBonus + luckBonus) * secretPenalty,
      };
    }),
  );

  return {
    map,
    fish,
    weather,
    time,
    difficulty: clamp(map.difficulty + (100 - fish.catchRate) + weatherDifficulty(weather), 1, 320),
    control: clamp(power + luck * 0.25, 1, 220),
    speed,
  };
}

async function getFishPool(mapId: string): Promise<Fish[]> {
  const cached = fishPoolCache.get(mapId);
  if (cached) return cached;

  const fishPool = await prisma.fish.findMany({
    where: { habitat: { has: mapId } },
  });
  fishPoolCache.set(mapId, fishPool);
  return fishPool;
}

export async function recordCatch(
  userId: string,
  fish: Fish,
  perfect: boolean,
  score: number,
): Promise<CatchResult> {
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId } });
  const hardcoreMultiplier = profile.hardcore ? 2 : 1;
  const quality = clamp(Math.ceil(score / 22) + (perfect ? 1 : 0), 1, 5);
  const size = Number((0.2 + Math.random() * 14 + quality * 0.55).toFixed(2));
  const shiny = Math.floor(Math.random() * 4096) === 0;
  const value = Math.min(
    1_000_000,
    Math.round(fish.baseValue * (1 + quality * 0.18) * (perfect ? 1.12 : 1) * (shiny ? 10 : 1) * hardcoreMultiplier),
  );
  const pearls = Math.round((tierPearls[fish.tier] + (shiny ? 5 : 0)) * hardcoreMultiplier);
  const exp = Math.round((12 + quality * 5 + value / 5000) * hardcoreMultiplier);

  await prisma.$transaction(async (tx) => {
    await tx.catchRecord.create({
      data: {
        userId,
        fishId: fish.id,
        size,
        quality,
        shiny,
        value,
      },
    });

    const existing = await tx.userFish.findUnique({
      where: { userId_fishId: { userId, fishId: fish.id } },
    });

    await tx.userFish.upsert({
      where: { userId_fishId: { userId, fishId: fish.id } },
      update: {
        count: { increment: 1 },
        inventoryCount: { increment: 1 },
        shinyCount: { increment: shiny ? 1 : 0 },
        largestSize: Math.max(existing?.largestSize ?? 0, size),
        smallestSize: existing?.smallestSize ? Math.min(existing.smallestSize, size) : size,
        caughtAt: { push: new Date() },
      },
      create: {
        userId,
        fishId: fish.id,
        count: 1,
        inventoryCount: 1,
        largestSize: size,
        smallestSize: size,
        shinyCount: shiny ? 1 : 0,
        caughtAt: [new Date()],
      },
    });

    await tx.profile.update({
      where: { userId },
      data: {
        pearls: { increment: pearls },
        totalFishCaught: { increment: 1 },
        exp: { increment: exp },
      },
    });
  });

  await Promise.all([
    applyLevelUps(userId),
    applyRodExp(userId, exp),
    recordCatchProgress(userId),
    addSeasonExp(userId, exp),
    addTeamScore(userId, value),
  ]);

  return {
    fish,
    size,
    quality,
    shiny,
    value,
    pearls,
    exp,
  };
}

export async function applyHardcoreFailure(userId: string): Promise<boolean> {
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId } });
  if (!profile.hardcore) return false;
  await prisma.profile.update({
    where: { userId },
    data: {
      coins: Math.floor(profile.coins * 0.5),
      pearls: Math.floor(profile.pearls * 0.5),
    },
  });
  return true;
}

export async function sellInventory(userId: string): Promise<{ count: number; coins: number; multiplier: number }> {
  const unsold = await prisma.catchRecord.findMany({
    where: { userId, sold: false, listed: false },
    include: { fish: true },
  });
  if (unsold.length === 0) {
    return { count: 0, coins: 0, multiplier: 1 };
  }

  let coins = 0;
  let totalMultiplier = 0;
  const eventMultiplier = await getActiveValueMultiplier();
  const uniqueFishIds = [...new Set(unsold.map((record) => record.fishId))];
  const marketMultipliers = new Map(
    await Promise.all(uniqueFishIds.map(async (fishId) => [fishId, await getMarketMultiplier(fishId)] as const)),
  );

  for (const record of unsold) {
    const multiplier = marketMultipliers.get(record.fishId) ?? 1;
    totalMultiplier += multiplier * eventMultiplier;
    coins += Math.round(record.value * multiplier * eventMultiplier);
  }
  coins = Math.min(1_000_000_000, coins);

  await prisma.$transaction([
    prisma.catchRecord.updateMany({
      where: { userId, sold: false, listed: false },
      data: { sold: true },
    }),
    prisma.userFish.updateMany({
      where: { userId },
      data: { inventoryCount: 0 },
    }),
    prisma.profile.update({
      where: { userId },
      data: {
        coins: { increment: coins },
        totalMoneyEarned: { increment: coins },
      },
    }),
  ]);

  return {
    count: unsold.length,
    coins,
    multiplier: Number((totalMultiplier / unsold.length).toFixed(2)),
  };
}

async function applyLevelUps(userId: string): Promise<void> {
  let profile = await prisma.profile.findUniqueOrThrow({ where: { userId } });
  while (profile.exp >= requiredExp(profile.level)) {
    profile = await prisma.profile.update({
      where: { userId },
      data: {
        exp: { decrement: requiredExp(profile.level) },
        level: { increment: 1 },
        milkDrops: { increment: profile.level % 5 === 0 ? 2 : 0 },
      },
    });
  }
}

function requiredExp(level: number): number {
  return 120 + level * level * 18;
}

async function applyRodExp(userId: string, exp: number): Promise<void> {
  const equipped = await prisma.userRod.findFirst({
    where: { userId, isEquipped: true },
    include: { rod: true },
  });
  if (!equipped || equipped.level >= equipped.rod.maxLevel) return;

  let nextLevel = equipped.level;
  let nextExp = equipped.exp + exp;
  while (nextLevel < equipped.rod.maxLevel && nextExp >= requiredRodExp(nextLevel)) {
    nextExp -= requiredRodExp(nextLevel);
    nextLevel += 1;
  }

  await prisma.userRod.update({
    where: { userId_rodId: { userId, rodId: equipped.rodId } },
    data: { level: nextLevel, exp: nextExp },
  });
}

function requiredRodExp(level: number): number {
  return 90 + level * level * 14;
}

function weatherDifficulty(weather: string): number {
  if (['Stormy', 'BloodMoon', 'VoidRain', 'Ashfall'].includes(weather)) return 22;
  if (['Foggy', 'Snowy'].includes(weather)) return 10;
  return 0;
}

function secretSpotWeight(condition: unknown, weather: string, time: GameTime, bait?: string): number {
  if (!condition || typeof condition !== 'object' || Array.isArray(condition)) {
    return 0.05;
  }
  const data = condition as Record<string, unknown>;
  const weatherOk = data.weather === weather;
  const timeOk = data.time === 'Any' || data.time === time;
  const itemOk = data.item === 'none' || data.item === bait;
  return weatherOk && timeOk && itemOk ? 1 : 0.02;
}
