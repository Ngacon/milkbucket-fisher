import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient, type FishTier, type PetRarity, type Prisma, type QuestType } from '@prisma/client';

const prisma = new PrismaClient();
const seedDir = path.join(process.cwd(), 'src', 'database', 'seed-data');

async function readJson<T>(fileName: string): Promise<T> {
  const file = await readFile(path.join(seedDir, fileName), 'utf8');
  return JSON.parse(file) as T;
}

type RodSeed = {
  id: string;
  name: string;
  power: number;
  luck: number;
  speed: number;
  ability: unknown;
  maxLevel: number;
  price: number;
};

type MapSeed = {
  id: string;
  name: string;
  biome: string;
  difficulty: number;
  price: number;
  weatherPattern: Record<string, number>;
  secretSpotCondition: unknown;
};

type FishTuple = [
  id: string,
  name: string,
  tier: FishTier,
  baseValue: number,
  catchRate: number,
  lore: string,
];

type FishCatalog = {
  habitat: string;
  weather: string[];
  time: string[];
  bait: string[];
  fish: FishTuple[];
};

type PetSeed = {
  id: string;
  name: string;
  type: string;
  ability: unknown;
  rarity: PetRarity;
};

type QuestSeed = {
  id: string;
  type: QuestType;
  requirement: unknown;
  reward: unknown;
};

type AchievementSeed = {
  id: string;
  name: string;
  description: string;
  tiers: unknown;
  rewards: unknown;
};

type SeasonSeed = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  theme: string;
  active: boolean;
};

type ConfigSeed = {
  key: string;
  value: unknown;
};

function chooseInitialWeather(pattern: Record<string, number>): string {
  const [first] = Object.keys(pattern);
  return first ?? 'Sunny';
}

async function main(): Promise<void> {
  const [rods, maps, fishCatalog, pets, quests, achievements, seasons, configs] =
    await Promise.all([
      readJson<RodSeed[]>('rods.json'),
      readJson<MapSeed[]>('maps.json'),
      readJson<FishCatalog[]>('fish.catalog.json'),
      readJson<PetSeed[]>('pets.json'),
      readJson<QuestSeed[]>('quests.json'),
      readJson<AchievementSeed[]>('achievements.json'),
      readJson<SeasonSeed[]>('seasons.json'),
      readJson<ConfigSeed[]>('configs.json'),
    ]);

  for (const rod of rods) {
    await prisma.rod.upsert({
      where: { id: rod.id },
      update: {
        name: rod.name,
        power: rod.power,
        luck: rod.luck,
        speed: rod.speed,
        ability: rod.ability as Prisma.InputJsonValue,
        maxLevel: rod.maxLevel,
        price: rod.price,
      },
      create: {
        id: rod.id,
        name: rod.name,
        power: rod.power,
        luck: rod.luck,
        speed: rod.speed,
        ability: rod.ability as Prisma.InputJsonValue,
        maxLevel: rod.maxLevel,
        price: rod.price,
      },
    });
  }

  for (const map of maps) {
    await prisma.map.upsert({
      where: { id: map.id },
      update: {
        name: map.name,
        biome: map.biome,
        difficulty: map.difficulty,
        price: map.price,
        weatherPattern: map.weatherPattern as Prisma.InputJsonValue,
        secretSpotCondition: map.secretSpotCondition as Prisma.InputJsonValue,
      },
      create: {
        id: map.id,
        name: map.name,
        biome: map.biome,
        difficulty: map.difficulty,
        price: map.price,
        weatherPattern: map.weatherPattern as Prisma.InputJsonValue,
        secretSpotCondition: map.secretSpotCondition as Prisma.InputJsonValue,
      },
    });

    await prisma.weatherState.upsert({
      where: { mapId: map.id },
      update: {},
      create: {
        mapId: map.id,
        currentWeather: chooseInitialWeather(map.weatherPattern),
        nextChangeAt: new Date(Date.now() + 30 * 60 * 1000),
      },
    });
  }

  for (const group of fishCatalog) {
    for (const [id, name, tier, baseValue, catchRate, lore] of group.fish) {
      await prisma.fish.upsert({
        where: { id },
        update: {
          name,
          tier,
          baseValue,
          habitat: [group.habitat],
          preferredWeather: group.weather,
          preferredTime: group.time,
          preferredBait: group.bait,
          lore,
          catchRate,
        },
        create: {
          id,
          name,
          tier,
          baseValue,
          habitat: [group.habitat],
          preferredWeather: group.weather,
          preferredTime: group.time,
          preferredBait: group.bait,
          lore,
          catchRate,
        },
      });
    }
  }

  for (const pet of pets) {
    await prisma.pet.upsert({
      where: { id: pet.id },
      update: {
        name: pet.name,
        type: pet.type,
        ability: pet.ability as Prisma.InputJsonValue,
        rarity: pet.rarity,
      },
      create: {
        id: pet.id,
        name: pet.name,
        type: pet.type,
        ability: pet.ability as Prisma.InputJsonValue,
        rarity: pet.rarity,
      },
    });
  }

  for (const quest of quests) {
    await prisma.quest.upsert({
      where: { id: quest.id },
      update: {
        type: quest.type,
        requirement: quest.requirement as Prisma.InputJsonValue,
        reward: quest.reward as Prisma.InputJsonValue,
      },
      create: {
        id: quest.id,
        type: quest.type,
        requirement: quest.requirement as Prisma.InputJsonValue,
        reward: quest.reward as Prisma.InputJsonValue,
      },
    });
  }

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { id: achievement.id },
      update: {
        name: achievement.name,
        description: achievement.description,
        tiers: achievement.tiers as Prisma.InputJsonValue,
        rewards: achievement.rewards as Prisma.InputJsonValue,
      },
      create: {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        tiers: achievement.tiers as Prisma.InputJsonValue,
        rewards: achievement.rewards as Prisma.InputJsonValue,
      },
    });
  }

  for (const season of seasons) {
    await prisma.season.upsert({
      where: { id: season.id },
      update: {
        name: season.name,
        startDate: new Date(season.startDate),
        endDate: new Date(season.endDate),
        theme: season.theme,
        active: season.active,
      },
      create: {
        id: season.id,
        name: season.name,
        startDate: new Date(season.startDate),
        endDate: new Date(season.endDate),
        theme: season.theme,
        active: season.active,
      },
    });
  }

  for (const config of configs) {
    await prisma.config.upsert({
      where: { key: config.key },
      update: { value: config.value as Prisma.InputJsonValue },
      create: { key: config.key, value: config.value as Prisma.InputJsonValue },
    });
  }

  const fishCount = await prisma.fish.count();
  console.log(`Seeded Milkbucket world: ${rods.length} rods, ${maps.length} maps, ${fishCount} fish.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
