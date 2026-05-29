import { prisma } from '../../database/prisma';

type Requirement = {
  kind?: string;
  count?: number;
};

type AchievementRewards = {
  coins?: number[];
  pearls?: number[];
  milkDrops?: number[];
};

export async function recordCatchProgress(userId: string): Promise<void> {
  const quests = await prisma.quest.findMany();
  for (const quest of quests) {
    const requirement = quest.requirement as Requirement;
    if (requirement.kind !== 'catch' || !requirement.count) continue;
    await prisma.userQuest.upsert({
      where: { userId_questId: { userId, questId: quest.id } },
      update: {
        progress: { increment: 1 },
        completed: false,
      },
      create: {
        userId,
        questId: quest.id,
        progress: 1,
        completed: requirement.count <= 1,
      },
    });
    await prisma.userQuest.updateMany({
      where: {
        userId,
        questId: quest.id,
        progress: { gte: requirement.count },
      },
      data: { completed: true },
    });
  }

  await updateCatchAchievement(userId);
}

async function updateCatchAchievement(userId: string): Promise<void> {
  const [achievement, profile] = await Promise.all([
    prisma.achievement.findUnique({ where: { id: 'catch_count' } }),
    prisma.profile.findUniqueOrThrow({ where: { userId } }),
  ]);
  if (!achievement) return;
  const tiers = Array.isArray(achievement.tiers) ? achievement.tiers.map(Number) : [];
  const nextTier = tiers.reduce((tier, requirement, index) => (profile.totalFishCaught >= requirement ? index + 1 : tier), 0);
  if (nextTier <= 0) return;

  const existing = await prisma.userAchievement.findUnique({
    where: { userId_achievementId: { userId, achievementId: achievement.id } },
  });
  if (existing && existing.tier >= nextTier) return;

  const rewards = achievement.rewards as AchievementRewards;
  const rewardIndex = nextTier - 1;
  await prisma.$transaction([
    prisma.userAchievement.upsert({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
      update: { tier: nextTier, unlockedAt: new Date() },
      create: { userId, achievementId: achievement.id, tier: nextTier },
    }),
    prisma.profile.update({
      where: { userId },
      data: {
        coins: { increment: rewards.coins?.[rewardIndex] ?? 0 },
        pearls: { increment: rewards.pearls?.[rewardIndex] ?? 0 },
        milkDrops: { increment: rewards.milkDrops?.[rewardIndex] ?? 0 },
      },
    }),
  ]);
}
