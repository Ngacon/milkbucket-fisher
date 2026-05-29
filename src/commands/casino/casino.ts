import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command';
import { getOrCreateUser } from '../../systems/users/userService';
import { prisma } from '../../database/prisma';
import { colors } from '../../utils/colors';

const MAX_BET = 25_000;

export const casinoCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('casino')
    .setDescription('Small capped casino games that cannot dominate the economy.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('dice')
        .setDescription('Tai/xiu style dice.')
        .addStringOption((option) =>
          option
            .setName('choice')
            .setDescription('tai or xiu')
            .setRequired(true)
            .addChoices({ name: 'tai', value: 'tai' }, { name: 'xiu', value: 'xiu' }),
        )
        .addIntegerOption((option) => option.setName('bet').setDescription('Bet').setRequired(true).setMinValue(1).setMaxValue(MAX_BET)),
    ),
  prefixAliases: ['casino', 'taixiu'],
  execute: async (interaction) => {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const choice = interaction.options.getString('choice', true);
    const bet = interaction.options.getInteger('bet', true);
    await interaction.reply({ embeds: [await playDice(user.id, choice, bet)] });
  },
  executePrefix: async (message, args) => {
    const user = await getOrCreateUser(message.author.id, message.author.username);
    await message.reply({ embeds: [await playDice(user.id, args[1] ?? args[0] ?? 'tai', Number(args[0] ?? 1))] });
  },
};

async function playDice(userId: string, choice: string, bet: number): Promise<EmbedBuilder> {
  const cleanBet = Math.min(MAX_BET, Math.max(1, Math.floor(bet)));
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId } });
  if (profile.coins < cleanBet) {
    throw new Error('INSUFFICIENT_FUNDS');
  }
  const dice = [roll(), roll(), roll()];
  const sum = dice.reduce((a, b) => a + b, 0);
  const outcome = sum >= 11 ? 'tai' : 'xiu';
  const won = choice === outcome;
  await prisma.profile.update({
    where: { userId },
    data: { coins: { increment: won ? cleanBet : -cleanBet } },
  });
  return new EmbedBuilder()
    .setColor(won ? colors.mint : colors.danger)
    .setTitle('🎲 Casino Dice')
    .setDescription(`Dice: ${dice.join(', ')} = **${sum}** (${outcome})\n${won ? `Win +${cleanBet}` : `Lose -${cleanBet}`}`);
}

function roll(): number {
  return Math.floor(Math.random() * 6) + 1;
}
