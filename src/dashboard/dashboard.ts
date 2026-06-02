import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'node:path';
import { env } from '../config/env';
import { prisma } from '../database/prisma';
import { logger } from '../utils/logger';

export function startDashboard(): void {
  const app = express();
  const port = env.PORT ?? env.DASHBOARD_PORT;
  app.set('view engine', 'ejs');
  app.set('views', path.join(process.cwd(), 'src', 'dashboard', 'views'));
  app.use(express.urlencoded({ extended: false }));

  app.get('/', (_req, res) => {
    res
      .status(200)
      .type('html')
      .send(
        [
          '<!doctype html>',
          '<html lang="en">',
          '<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
          '<title>Milkbucket Bot</title></head>',
          '<body style="font-family:system-ui,sans-serif;margin:40px;line-height:1.5">',
          '<h1>Milkbucket is online</h1>',
          '<p>Discord bot and Render web service are running.</p>',
          '<p>Health: <a href="/healthz">/healthz</a></p>',
          '</body></html>',
        ].join(''),
      );
  });

  app.get('/healthz', (_req, res) => {
    res.status(200).json({
      ok: true,
      service: 'milkbucket',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  app.use((req, res, next) => {
    const key = req.header('x-admin-key') ?? req.query.key;
    if (key !== env.DASHBOARD_ADMIN_KEY) {
      res.status(401).send('Missing or invalid dashboard key.');
      return;
    }
    next();
  });

  app.get(
    '/dashboard',
    asyncHandler(async (_req, res) => {
      const [users, catches, activeListings, teams, activeBoss] = await Promise.all([
        prisma.user.count(),
        prisma.catchRecord.count(),
        prisma.marketplaceListing.count({ where: { sold: false } }),
        prisma.team.count(),
        prisma.worldBoss.findFirst({ where: { defeatedAt: null }, orderBy: { spawnedAt: 'desc' } }),
      ]);
      res.render('index', { users, catches, activeListings, teams, activeBoss, key: env.DASHBOARD_ADMIN_KEY });
    }),
  );

  app.get(
    '/dashboard/leaderboard',
    asyncHandler(async (_req, res) => {
      const profiles = await prisma.profile.findMany({
        orderBy: { coins: 'desc' },
        include: { user: true },
        take: 25,
      });
      res.render('leaderboard', { profiles, key: env.DASHBOARD_ADMIN_KEY });
    }),
  );

  app.get(
    '/dashboard/codes',
    asyncHandler(async (_req, res) => {
      const codes = await prisma.giftCode.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
      res.render('codes', { codes, key: env.DASHBOARD_ADMIN_KEY });
    }),
  );

  app.post(
    '/dashboard/codes',
    asyncHandler(async (req, res) => {
      const code = String(req.body.code ?? '').toUpperCase();
      if (!code) {
        res.redirect(`/dashboard/codes?key=${env.DASHBOARD_ADMIN_KEY}`);
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
      res.redirect(`/dashboard/codes?key=${env.DASHBOARD_ADMIN_KEY}`);
    }),
  );

  app.listen(port, () => {
    logger.info({ port }, 'Web server started');
  });
}

function asyncHandler(
  handler: (req: Request, res: Response, next: NextFunction) => Promise<void>,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    void handler(req, res, next).catch(next);
  };
}
