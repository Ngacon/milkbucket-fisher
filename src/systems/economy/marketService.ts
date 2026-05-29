import { prisma } from '../../database/prisma';
import { clamp } from '../../utils/format';
import { env } from '../../config/env';

type MarketMultipliers = Record<string, number>;
const CONFIG_CACHE_TTL_MS = 15_000;

let multiplierCache: { value: MarketMultipliers; expiresAt: number } | undefined;
let taxRateCache: { value: number; expiresAt: number } | undefined;
let eventMultiplierCache: { value: number; expiresAt: number } | undefined;

export async function getMarketMultiplier(fishId: string): Promise<number> {
  const multipliers = await getMarketMultipliers();
  const multiplier = Number(multipliers[fishId] ?? 1);
  return Number.isFinite(multiplier) ? clamp(multiplier, 0.55, 1.65) : 1;
}

async function getMarketMultipliers(): Promise<MarketMultipliers> {
  if (multiplierCache && multiplierCache.expiresAt > Date.now()) {
    return multiplierCache.value;
  }

  const config = await prisma.config.findUnique({ where: { key: 'market.globalMultipliers' } });
  const value = config?.value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    multiplierCache = { value: {}, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS };
    return multiplierCache.value;
  }

  multiplierCache = { value: value as MarketMultipliers, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS };
  return multiplierCache.value;
}

export async function getTaxRate(): Promise<number> {
  if (taxRateCache && taxRateCache.expiresAt > Date.now()) {
    return taxRateCache.value;
  }

  const config = await prisma.config.findUnique({ where: { key: 'market.taxRate' } });
  const value = Number(config?.value ?? env.MARKET_TAX_RATE);
  const taxRate = Number.isFinite(value) ? clamp(value, 0, 0.25) : env.MARKET_TAX_RATE;
  taxRateCache = { value: taxRate, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS };
  return taxRate;
}

export async function getActiveValueMultiplier(): Promise<number> {
  if (eventMultiplierCache && eventMultiplierCache.expiresAt > Date.now()) {
    return eventMultiplierCache.value;
  }

  const config = await prisma.config.findUnique({ where: { key: 'event.current' } });
  const value = config?.value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    eventMultiplierCache = { value: 1, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS };
    return 1;
  }
  const data = value as Record<string, unknown>;
  if (data.type !== 'golden_hour') {
    eventMultiplierCache = { value: 1, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS };
    return 1;
  }
  const endsAt = typeof data.endsAt === 'string' ? new Date(data.endsAt) : null;
  if (!endsAt || Number.isNaN(endsAt.getTime()) || endsAt.getTime() < Date.now()) {
    eventMultiplierCache = { value: 1, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS };
    return 1;
  }
  const multiplier = Number(data.multiplier ?? 1);
  const eventMultiplier = Number.isFinite(multiplier) ? clamp(multiplier, 1, 3) : 1;
  eventMultiplierCache = { value: eventMultiplier, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS };
  return eventMultiplier;
}

export async function resetMarketMultipliers(): Promise<MarketMultipliers> {
  const soldSince = new Date(Date.now() - 6 * 60 * 60 * 1000);
  const sold = await prisma.catchRecord.groupBy({
    by: ['fishId'],
    where: {
      sold: true,
      caughtAt: { gte: soldSince },
    },
    _count: { fishId: true },
  });

  const fish = await prisma.fish.findMany({ select: { id: true, tier: true } });
  const supply = new Map(sold.map((entry) => [entry.fishId, entry._count.fishId]));
  const multipliers: MarketMultipliers = {};

  for (const entry of fish) {
    const count = supply.get(entry.id) ?? 0;
    const scarcityBoost = count === 0 ? 1.18 : 1 / (1 + count / 120);
    const tierFloor = entry.tier === 'Common' ? 0.7 : entry.tier === 'Secret' ? 0.9 : 0.75;
    multipliers[entry.id] = Number(clamp(scarcityBoost, tierFloor, 1.55).toFixed(2));
  }

  await prisma.config.upsert({
    where: { key: 'market.globalMultipliers' },
    update: { value: multipliers },
    create: { key: 'market.globalMultipliers', value: multipliers },
  });

  multiplierCache = { value: multipliers, expiresAt: Date.now() + CONFIG_CACHE_TTL_MS };
  return multipliers;
}

export async function transferCoins(senderId: string, receiverId: string, amount: number): Promise<number> {
  const taxRate = await getTaxRate();
  const tax = Math.floor(amount * taxRate);
  const received = amount - tax;

  await prisma.$transaction(async (tx) => {
    const sender = await tx.profile.findUniqueOrThrow({ where: { userId: senderId } });
    if (sender.coins < amount) {
      throw new Error('INSUFFICIENT_FUNDS');
    }

    await tx.profile.update({
      where: { userId: senderId },
      data: { coins: { decrement: amount } },
    });
    await tx.profile.update({
      where: { userId: receiverId },
      data: { coins: { increment: received } },
    });
  });

  return tax;
}
