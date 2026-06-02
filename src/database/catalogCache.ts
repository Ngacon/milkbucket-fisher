import type { Achievement, Fish, Pet, Prisma, Quest, Rod, Season } from '@prisma/client';
import { prisma } from './prisma';

type MapWithWeather = Prisma.MapGetPayload<{ include: { weatherState: true } }>;
type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const STATIC_TTL_MS = 5 * 60 * 1000;
const WEATHER_TTL_MS = 15 * 1000;

let fishCache: CacheEntry<Fish[]> | undefined;
let rodCache: CacheEntry<Rod[]> | undefined;
let mapCache: CacheEntry<MapWithWeather[]> | undefined;
let petCache: CacheEntry<Pet[]> | undefined;
let questCache: CacheEntry<Quest[]> | undefined;
let achievementCache: CacheEntry<Achievement[]> | undefined;
let seasonCache: CacheEntry<Season[]> | undefined;

export async function warmCatalogCaches(): Promise<void> {
  await Promise.all([
    getCatalogFish(),
    getCatalogRods(),
    getCatalogMaps(),
    getCatalogPets(),
    getCatalogQuests(),
    getCatalogAchievements(),
    getCatalogSeasons(),
  ]);
}

export async function getCatalogFish(): Promise<Fish[]> {
  fishCache = await loadCached(fishCache, STATIC_TTL_MS, () =>
    prisma.fish.findMany({ orderBy: [{ baseValue: 'asc' }, { id: 'asc' }] }),
  );
  return fishCache.value;
}

export async function getCatalogRods(): Promise<Rod[]> {
  rodCache = await loadCached(rodCache, STATIC_TTL_MS, () =>
    prisma.rod.findMany({ orderBy: [{ price: 'asc' }, { id: 'asc' }] }),
  );
  return rodCache.value;
}

export async function getCatalogMaps(): Promise<MapWithWeather[]> {
  mapCache = await loadCached(mapCache, WEATHER_TTL_MS, () =>
    prisma.map.findMany({
      orderBy: [{ difficulty: 'asc' }, { id: 'asc' }],
      include: { weatherState: true },
    }),
  );
  return mapCache.value;
}

export async function getCatalogPets(): Promise<Pet[]> {
  petCache = await loadCached(petCache, STATIC_TTL_MS, () =>
    prisma.pet.findMany({ orderBy: [{ rarity: 'asc' }, { id: 'asc' }] }),
  );
  return petCache.value;
}

export async function getCatalogQuests(): Promise<Quest[]> {
  questCache = await loadCached(questCache, STATIC_TTL_MS, () =>
    prisma.quest.findMany({ orderBy: [{ type: 'asc' }, { id: 'asc' }] }),
  );
  return questCache.value;
}

export async function getCatalogAchievements(): Promise<Achievement[]> {
  achievementCache = await loadCached(achievementCache, STATIC_TTL_MS, () =>
    prisma.achievement.findMany({ orderBy: [{ id: 'asc' }] }),
  );
  return achievementCache.value;
}

export async function getCatalogSeasons(): Promise<Season[]> {
  seasonCache = await loadCached(seasonCache, STATIC_TTL_MS, () =>
    prisma.season.findMany({ orderBy: [{ startDate: 'desc' }] }),
  );
  return seasonCache.value;
}

async function loadCached<T>(
  cache: CacheEntry<T> | undefined,
  ttlMs: number,
  loader: () => Promise<T>,
): Promise<CacheEntry<T>> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache;
  }

  return {
    value: await loader(),
    expiresAt: Date.now() + ttlMs,
  };
}
