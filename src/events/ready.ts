import type { Client } from 'discord.js';
import { warmCatalogCaches } from '../database/catalogCache';
import { preloadActiveBans, preloadUserCache } from '../systems/users/userService';
import { logger } from '../utils/logger';

export async function handleReady(client: Client): Promise<void> {
  logger.info({ user: client.user?.tag }, 'Milkbucket is ready');
  await client.user?.setPresence({
    activities: [{ name: '/fish | m!help' }],
    status: 'online',
  });

  await Promise.all([warmCatalogCaches(), preloadActiveBans(), preloadUserCache()]);
  logger.info('Hot caches warmed');
}
