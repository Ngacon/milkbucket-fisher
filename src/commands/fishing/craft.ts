import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command';
import { getOrCreateUser } from '../../systems/users/userService';
import { craft, listRecipes } from '../../systems/crafting/craftingService';
import { prisma } from '../../database/prisma';
import { colors } from '../../utils/colors';

export const craftCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('craft')
    .setDescription('Craft bait and consumables.')
    .addSubcommand((subcommand) => subcommand.setName('list').setDescription('List recipes.'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('make')
        .setDescription('Craft a recipe.')
        .addStringOption((option) => option.setName('recipe').setDescription('Recipe id').setRequired(true))
        .addIntegerOption((option) => option.setName('quantity').setDescription('Times').setRequired(false).setMinValue(1).setMaxValue(50)),
    )
    .addSubcommand((subcommand) => subcommand.setName('items').setDescription('View your item inventory.')),
  prefixAliases: ['craft', 'chetao'],
  execute: async (interaction) => {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'make') {
      const recipe = await craft(user.id, interaction.options.getString('recipe', true), interaction.options.getInteger('quantity') ?? 1);
      await interaction.reply(`Đã craft ${recipe.name}.`);
      return;
    }
    if (subcommand === 'items') {
      await interaction.reply({ embeds: [await renderItems(user.id)] });
      return;
    }
    await interaction.reply({ embeds: [renderRecipes()] });
  },
  executePrefix: async (message, args) => {
    const user = await getOrCreateUser(message.author.id, message.author.username);
    if (args[0] === 'make' && args[1]) {
      const recipe = await craft(user.id, args[1], Number(args[2] ?? 1));
      await message.reply(`Đã craft ${recipe.name}.`);
      return;
    }
    if (args[0] === 'items') {
      await message.reply({ embeds: [await renderItems(user.id)] });
      return;
    }
    await message.reply({ embeds: [renderRecipes()] });
  },
};

function renderRecipes(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(colors.mint)
    .setTitle('🧪 Crafting Recipes')
    .setDescription(
      listRecipes()
        .map((recipe) => {
          const ingredients = recipe.ingredients.length
            ? recipe.ingredients.map((ingredient) => `${ingredient.type}:${ingredient.id} x${ingredient.quantity}`).join(', ')
            : 'none';
          return `• \`${recipe.id}\` **${recipe.name}** -> ${recipe.outputItem} x${recipe.outputQuantity} | coins ${recipe.coins} | ${ingredients}`;
        })
        .join('\n'),
    );
}

async function renderItems(userId: string): Promise<EmbedBuilder> {
  const items = await prisma.userItem.findMany({ where: { userId, quantity: { gt: 0 } } });
  return new EmbedBuilder()
    .setColor(colors.cream)
    .setTitle('🎒 Items')
    .setDescription(items.length ? items.map((item) => `• \`${item.itemId}\` x${item.quantity}`).join('\n') : 'No items.');
}
