import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { env } from './config/env';
import { ensureDatabaseReady } from './database/health';
import { prisma } from './database/prisma';
import { registerEvents } from './events';
import { startSchedulers } from './systems/event/scheduler';
import { startDashboard } from './dashboard/dashboard';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  await prisma.$connect();
  await ensureDatabaseReady();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildModeration,
    ],
    partials: [Partials.Channel],
  });

  registerEvents(client);

  await client.login(env.DISCORD_TOKEN);
  startSchedulers();
  startDashboard();

  const shutdown = async (): Promise<void> => {
    logger.info('Shutting down Milkbucket');
    await client.destroy();
    await prisma.$disconnect();
    process.exit(0);
  };

  process.once('SIGINT', () => {
    void shutdown();
  });
  process.once('SIGTERM', () => {
    void shutdown();
  });
}

void main().catch(async (error) => {
  logger.error({ err: error, hint: startupHint(error) }, 'Fatal startup error');
  await prisma.$disconnect();
  process.exit(1);
});

function startupHint(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  const text = `${code} ${message}`.toLowerCase();

  if (text.includes('token') || text.includes('disallowed intents')) {
    if (text.includes('disallowed intents')) {
      return 'Discord rejected one or more Gateway intents. In Discord Developer Portal, enable Message Content Intent for prefix commands, or remove MessageContent from src/index.ts.';
    }
    return 'DISCORD_TOKEN is missing, revoked, or invalid. Rotate/copy a fresh bot token into .env.';
  }

  if (text.includes('database_not_ready') || text.includes('p2021')) {
    return 'Database schema is missing. Run `npm run setup:db`, then `npm start`.';
  }

  if (text.includes('database_not_seeded')) {
    return 'Database schema exists but seed data is missing. Run `npm run seed`, then `npm start`.';
  }

  if (text.includes('p1001') || text.includes('database') || text.includes('getaddrinfo')) {
    return 'Database connection failed. Check DATABASE_URL, then run `npm run setup:db` before starting.';
  }

  if (text.includes('eaddrinuse')) {
    return 'Dashboard port is already in use. Change DASHBOARD_PORT in .env or stop the old process.';
  }

  return 'Read err.message and err.stack above for the exact startup failure.';
}
