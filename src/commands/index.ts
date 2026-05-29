import type { Command } from '../types/command';
import { adminCommand } from './admin/admin';
import { casinoCommand } from './casino/casino';
import { auctionCommand } from './economy/auction';
import { codeCommand } from './economy/code';
import { marketCommand } from './economy/market';
import { payCommand } from './economy/pay';
import { bagCommand } from './fishing/bag';
import { craftCommand } from './fishing/craft';
import { fishCommand } from './fishing/fish';
import { mapCommand } from './fishing/map';
import { sellCommand } from './fishing/sell';
import { shopCommand } from './fishing/shop';
import { rodCommand } from './fishing/rod';
import { helpCommand } from './misc/help';
import { guideCommand } from './misc/guide';
import { hardcoreCommand } from './misc/hardcore';
import { howToPlayCommand } from './misc/howToPlay';
import { languageCommand } from './misc/language';
import { questsCommand } from './misc/quests';
import { seasonCommand } from './misc/season';
import { infoCommand } from './misc/info';
import { leaderboardCommand } from './social/leaderboard';
import { petCommand } from './social/pet';
import { profileCommand } from './social/profile';
import { teamCommand } from './social/team';

export const commands: Command[] = [
  adminCommand,
  auctionCommand,
  bagCommand,
  casinoCommand,
  codeCommand,
  craftCommand,
  fishCommand,
  guideCommand,
  hardcoreCommand,
  helpCommand,
  howToPlayCommand,
  infoCommand,
  languageCommand,
  leaderboardCommand,
  mapCommand,
  marketCommand,
  payCommand,
  petCommand,
  profileCommand,
  questsCommand,
  rodCommand,
  sellCommand,
  seasonCommand,
  shopCommand,
  teamCommand,
];

export const commandsByName = new Map(commands.map((command) => [command.data.toJSON().name, command]));

export const commandsByAlias = new Map(
  commands.flatMap((command) => command.prefixAliases.map((alias) => [alias, command] as const)),
);
