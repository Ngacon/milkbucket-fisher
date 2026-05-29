import type { Client } from 'discord.js';
import { Events } from 'discord.js';
import { handleInteractionCreate } from './interactionCreate';
import { handleMessageCreate } from './messageCreate';
import { handleReady } from './ready';
import { logger } from '../utils/logger';

export function registerEvents(client: Client): void {
  client.once(Events.ClientReady, () => {
    void handleReady(client).catch((error) => {
      logger.error({ err: error }, 'Ready handler failed');
    });
  });
  client.on(Events.InteractionCreate, (interaction) => {
    void handleInteractionCreate(interaction).catch((error) => {
      logger.error({ err: error }, 'Interaction handler failed');
    });
  });
  client.on(Events.MessageCreate, (message) => {
    void handleMessageCreate(message).catch((error) => {
      logger.error({ err: error }, 'Message handler failed');
    });
  });
}
