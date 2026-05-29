import express from 'express';
import path from 'node:path';
import { env } from '../config/env';
import { prisma } from '../database/prisma';
import { logger } from '../utils/logger';

export function startDashboard(): void {
  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.join(process.cwd(), 'src', 'dashboard', 'views'));
  app.use(express.urlencoded({ extended: false }));
  app.use((req, res, next) => {
    const key = req.header('x-admin-key') ?? req.query.key;
    if (key !== env.DASHBOARD_ADMIN_KEY) {
      res.status(401).send('Missing or invalid dashboard key.');
      return;
    }
    next();
  });

  app.get('/', async (_req, res, next) => {
    try {
      const [users, catches, activeListings, teams, activeBoss] = await Promise.all([
        prisma.user.count(),
        prisma.catchRecord.count(),
        prisma.marketplaceListing.count({ where: { sold: false } }),
        prisma.team.count(),
        prisma.worldBoss.findFirst({ where: { defeatedAt: null }, orderBy: { spawnedAt: 'desc' } }),
      ]);
      res.render('index', { users, catches, activeListings, teams, activeBoss, key: env.DASHBOARD_ADMIN_KEY });
    } catch (error) {
      next(error);
    }
  });

  app.get('/leaderboard', async (_req, res, next) => {
    try {
      const profiles = await prisma.profile.findMany({
        orderBy: { coins: 'desc' },
        include: { user: true },
        take: 25,
      });
      res.render('leaderboard', { profiles, key: env.DASHBOARD_ADMIN_KEY });
    } catch (error) {
      next(error);
    }
  });

  app.get('/codes', async (_req, res, next) => {
    try {
      const codes = await prisma.giftCode.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
      res.render('codes', { codes, key: env.DASHBOARD_ADMIN_KEY });
    } catch (error) {
      next(error);
    }
  });

  app.post('/codes', async (req, res, next) => {
    try {
      const code = String(req.body.code ?? '').toUpperCase();
      if (!code) {
        res.redirect(`/codes?key=${env.DASHBOARD_ADMIN_KEY}`);
        return;
      }
      await prisma.giftCode.upsert({
        where: { code },
        update: {
          coins: Number(req.body.coins ?? 0),
          pearls: Number(req.body.pearls ?? 0),
          milkDrops: Number(req.body.milkDrops ?? 0),
          maxClaims: Number(req.body.maxClaims ?? 1),
          active: true,
        },
        create: {
          code,
          coins: Number(req.body.coins ?? 0),
          pearls: Number(req.body.pearls ?? 0),
          milkDrops: Number(req.body.milkDrops ?? 0),
          maxClaims: Number(req.body.maxClaims ?? 1),
        },
      });
      res.redirect(`/codes?key=${env.DASHBOARD_ADMIN_KEY}`);
    } catch (error) {
      next(error);
    }
  });

  app.listen(env.DASHBOARD_PORT, () => {
    logger.info({ port: env.DASHBOARD_PORT }, 'Dashboard started');
  });
}
