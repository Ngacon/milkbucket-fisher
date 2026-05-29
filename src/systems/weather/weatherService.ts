import type { Map, WeatherState } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { weightedPick } from '../../utils/format';

export type WeatherPattern = Record<string, number>;

function parseWeatherPattern(value: unknown): WeatherPattern {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { Sunny: 100 };
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .map(([weather, weight]) => ({ weather, weight: Number(weight) }))
    .filter((entry) => Number.isFinite(entry.weight) && entry.weight > 0);
  if (entries.length === 0) {
    return { Sunny: 100 };
  }
  return Object.fromEntries(entries.map((entry) => [entry.weather, entry.weight]));
}

export function pickWeather(pattern: WeatherPattern): string {
  return weightedPick(
    Object.entries(pattern).map(([weather, weight]) => ({
      item: weather,
      weight,
    })),
  );
}

export async function getWeather(mapId: string): Promise<WeatherState | null> {
  return prisma.weatherState.findUnique({ where: { mapId } });
}

export async function rotateWeatherForMap(map: Map, now = new Date()): Promise<WeatherState> {
  const currentWeather = pickWeather(parseWeatherPattern(map.weatherPattern));
  return prisma.weatherState.upsert({
    where: { mapId: map.id },
    update: {
      currentWeather,
      nextChangeAt: new Date(now.getTime() + 30 * 60 * 1000),
    },
    create: {
      mapId: map.id,
      currentWeather,
      nextChangeAt: new Date(now.getTime() + 30 * 60 * 1000),
    },
  });
}

export async function rotateDueWeather(now = new Date()): Promise<number> {
  const states = await prisma.weatherState.findMany({
    where: { nextChangeAt: { lte: now } },
    include: { map: true },
  });

  await Promise.all(states.map((state) => rotateWeatherForMap(state.map, now)));
  return states.length;
}
