import { prisma } from '../../database/prisma';
import { weightedPick } from '../../utils/format';

export async function cleanupExpiredEvent(): Promise<void> {
  const config = await prisma.config.findUnique({ where: { key: 'event.current' } });
  const value = config?.value;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  const data = value as Record<string, unknown>;
  const endsAt = typeof data.endsAt === 'string' ? new Date(data.endsAt) : null;
  if (endsAt && endsAt.getTime() <= Date.now()) {
    await prisma.config.update({
      where: { key: 'event.current' },
      data: { value: { type: 'none' } },
    });
  }
}

export async function maybeSpawnWorldBoss(): Promise<boolean> {
  const activeBoss = await prisma.worldBoss.findFirst({ where: { defeatedAt: null } });
  if (activeBoss || Math.random() > 0.18) {
    return false;
  }
  const maps = await prisma.map.findMany({
    where: {
      id: { not: 'team_jail_pond' },
      difficulty: { gte: 40 },
    },
  });
  if (maps.length === 0) return false;

  const map = weightedPick(
    maps.map((entry) => ({
      item: entry,
      weight: Math.max(1, entry.difficulty),
    })),
  );
  await prisma.worldBoss.create({
    data: {
      name: bossNameForBiome(map.biome),
      hp: 120_000 + map.difficulty * 2500,
      maxHp: 120_000 + map.difficulty * 2500,
      spawnMap: map.id,
    },
  });
  return true;
}

export async function damageActiveBoss(userId: string, damage: number): Promise<void> {
  const boss = await prisma.worldBoss.findFirst({ where: { defeatedAt: null }, orderBy: { spawnedAt: 'desc' } });
  if (!boss) return;
  const cleanDamage = Math.max(1, Math.floor(damage));
  await prisma.$transaction([
    prisma.worldBoss.update({
      where: { id: boss.id },
      data: {
        hp: { decrement: cleanDamage },
        defeatedAt: boss.hp - cleanDamage <= 0 ? new Date() : undefined,
      },
    }),
    prisma.bossParticipation.upsert({
      where: { bossId_userId: { bossId: boss.id, userId } },
      update: { damage: { increment: cleanDamage } },
      create: { bossId: boss.id, userId, damage: cleanDamage },
    }),
  ]);
}

function bossNameForBiome(biome: string): string {
  const names: Record<string, string> = {
    Ocean: 'Whitewave Colossus',
    Volcanic: 'Obsidian Dairy Dragon',
    Abyss: 'Black Pearl Maw',
    Void: 'The Unlisted Catch',
    Skysea: 'Festival Phoenix Whale',
  };
  return names[biome] ?? `${biome} World Boss`;
}
