import { prisma } from '../../database/prisma';

export async function addSeasonExp(userId: string, exp: number): Promise<void> {
  const season = await prisma.season.findFirst({
    where: {
      active: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() },
    },
  });
  if (!season) return;
  await prisma.seasonProgress.upsert({
    where: { userId_seasonId: { userId, seasonId: season.id } },
    update: { exp: { increment: exp } },
    create: { userId, seasonId: season.id, exp },
  });
}

export async function buyPremiumTrack(userId: string): Promise<void> {
  const season = await prisma.season.findFirstOrThrow({ where: { active: true } });
  await prisma.$transaction(async (tx) => {
    const profile = await tx.profile.findUniqueOrThrow({ where: { userId } });
    if (profile.milkDrops < 250) throw new Error('INSUFFICIENT_FUNDS');
    await tx.profile.update({ where: { userId }, data: { milkDrops: { decrement: 250 } } });
    await tx.seasonProgress.upsert({
      where: { userId_seasonId: { userId, seasonId: season.id } },
      update: { premium: true },
      create: { userId, seasonId: season.id, premium: true },
    });
  });
}
