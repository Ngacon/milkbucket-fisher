import cron from 'node-cron';
import { rotateDueWeather } from '../weather/weatherService';
import { getTaxRate, resetMarketMultipliers } from '../economy/marketService';
import { cleanupExpiredEvent, maybeSpawnWorldBoss } from './eventService';
import { resetWeeklyTeamScores } from '../guild/teamService';
import { prisma } from '../../database/prisma';
import { logger } from '../../utils/logger';

export function startSchedulers(): void {
  cron.schedule('*/5 * * * *', () => {
    void runJob('weather-rotation', async () => {
      const count = await rotateDueWeather();
      if (count > 0) logger.info({ count }, 'Rotated map weather');
    });
  });

  cron.schedule('0 */6 * * *', () => {
    void runJob('market-reset', async () => {
      const multipliers = await resetMarketMultipliers();
      logger.info({ count: Object.keys(multipliers).length }, 'Reset market multipliers');
    });
  });

  cron.schedule('*/15 * * * *', () => {
    void runJob('event-cleanup', cleanupExpiredEvent);
  });

  cron.schedule('17 * * * *', () => {
    void runJob('boss-spawn', async () => {
      const spawned = await maybeSpawnWorldBoss();
      if (spawned) logger.info('Spawned a world boss');
    });
  });

  cron.schedule('*/10 * * * *', () => {
    void runJob('auction-settle', settleExpiredAuctions);
  });

  cron.schedule('0 0 * * 1', () => {
    void runJob('team-weekly-reset', resetWeeklyTeamScores);
  });
}

async function runJob(name: string, job: () => Promise<void>): Promise<void> {
  try {
    await job();
  } catch (error) {
    logger.error({ err: error, job: name }, 'Scheduled job failed');
  }
}

async function settleExpiredAuctions(): Promise<void> {
  const auctions = await prisma.auction.findMany({
    where: { status: 'Open', endsAt: { lte: new Date() } },
  });
  const taxRate = await getTaxRate();

  for (const auction of auctions) {
    await prisma.$transaction(async (tx) => {
      if (!auction.highestBidder) {
        if (auction.recordId) {
          await tx.catchRecord.update({ where: { id: auction.recordId }, data: { listed: false } });
          await tx.userFish.update({
            where: { userId_fishId: { userId: auction.sellerId, fishId: auction.fishId } },
            data: { inventoryCount: { increment: 1 } },
          });
        }
        await tx.auction.update({ where: { id: auction.id }, data: { status: 'Cancelled' } });
        return;
      }

      const tax = Math.floor(auction.currentBid * taxRate);
      await tx.profile.update({
        where: { userId: auction.sellerId },
        data: { coins: { increment: auction.currentBid - tax } },
      });
      if (auction.recordId) {
        await tx.catchRecord.update({
          where: { id: auction.recordId },
          data: { userId: auction.highestBidder, listed: false },
        });
        await tx.userFish.upsert({
          where: { userId_fishId: { userId: auction.highestBidder, fishId: auction.fishId } },
          update: { inventoryCount: { increment: 1 } },
          create: {
            userId: auction.highestBidder,
            fishId: auction.fishId,
            inventoryCount: 1,
            count: 0,
            largestSize: 0,
            smallestSize: 0,
          },
        });
      }
      await tx.auction.update({ where: { id: auction.id }, data: { status: 'Settled' } });
    });
  }
}
