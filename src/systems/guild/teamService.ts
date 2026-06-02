import { prisma } from '../../database/prisma';

export async function addTeamScore(userId: string, score: number): Promise<void> {
  const membership = await prisma.teamMember.findUnique({ where: { userId } });
  if (!membership) return;
  await prisma.team.update({
    where: { id: membership.teamId },
    data: { weeklyScore: { increment: Math.max(0, Math.floor(score)) } },
  });
}

export async function resetWeeklyTeamScores(): Promise<void> {
  await prisma.team.updateMany({ data: { weeklyScore: 0 } });
}
