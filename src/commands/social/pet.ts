import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { PetRarity } from '@prisma/client';
import type { Command } from '../../types/command';
import { getCatalogPets } from '../../database/catalogCache';
import { getOrCreateUser } from '../../systems/users/userService';
import { prisma } from '../../database/prisma';
import { colors } from '../../utils/colors';

const petCosts: Record<PetRarity, number> = {
  Common: 5,
  Uncommon: 12,
  Rare: 28,
  Epic: 65,
  Legendary: 150,
};

export const petCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('pet')
    .setDescription('Manage companion pets.')
    .addSubcommand((subcommand) => subcommand.setName('list').setDescription('List pets.'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('adopt')
        .setDescription('Adopt a pet with Pearls.')
        .addStringOption((option) => option.setName('id').setDescription('Pet id').setRequired(true)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('equip')
        .setDescription('Equip a pet.')
        .addStringOption((option) => option.setName('id').setDescription('Pet id').setRequired(true)),
    )
    .addSubcommand((subcommand) => subcommand.setName('feed').setDescription('Feed equipped pet for 3 Pearls.')),
  prefixAliases: ['pet', 'thu'],
  execute: async (interaction) => {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'adopt') {
      await adoptPet(user.id, interaction.options.getString('id', true));
      await interaction.reply('Adopt pet thành công.');
      return;
    }
    if (subcommand === 'equip') {
      await equipPet(user.id, interaction.options.getString('id', true));
      await interaction.reply('Đã equip pet.');
      return;
    }
    if (subcommand === 'feed') {
      await feedPet(user.id);
      await interaction.reply('Pet đã được feed.');
      return;
    }
    await interaction.reply({ embeds: [await renderPets(user.id)] });
  },
  executePrefix: async (message, args) => {
    const user = await getOrCreateUser(message.author.id, message.author.username);
    if (args[0] === 'adopt' && args[1]) {
      await adoptPet(user.id, args[1]);
      await message.reply('Adopt pet thành công.');
      return;
    }
    if (args[0] === 'equip' && args[1]) {
      await equipPet(user.id, args[1]);
      await message.reply('Đã equip pet.');
      return;
    }
    if (args[0] === 'feed') {
      await feedPet(user.id);
      await message.reply('Pet đã được feed.');
      return;
    }
    await message.reply({ embeds: [await renderPets(user.id)] });
  },
};

async function renderPets(userId: string): Promise<EmbedBuilder> {
  const [pets, owned] = await Promise.all([
    getCatalogPets(),
    prisma.userPet.findMany({ where: { userId } }),
  ]);
  const ownedById = new Map(owned.map((entry) => [entry.petId, entry]));
  return new EmbedBuilder()
    .setColor(colors.mint)
    .setTitle('🐾 Pets')
    .setDescription(
      pets
        .map((pet) => {
          const state = ownedById.get(pet.id);
          const label = state ? `owned lv${state.level}${state.equipped ? ' equipped' : ''}` : `${petCosts[pet.rarity]} pearls`;
          return `• \`${pet.id}\` **${pet.name}** [${pet.rarity}] | ${label}`;
        })
        .join('\n'),
    );
}

async function adoptPet(userId: string, petId: string): Promise<void> {
  const pet = await prisma.pet.findUniqueOrThrow({ where: { id: petId } });
  const existing = await prisma.userPet.findUnique({ where: { userId_petId: { userId, petId } } });
  if (existing) throw new Error('PET_ALREADY_OWNED');
  const cost = petCosts[pet.rarity];
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId } });
  if (profile.pearls < cost) throw new Error('INSUFFICIENT_FUNDS');
  await prisma.$transaction([
    prisma.profile.update({ where: { userId }, data: { pearls: { decrement: cost } } }),
    prisma.userPet.create({ data: { userId, petId } }),
  ]);
}

async function equipPet(userId: string, petId: string): Promise<void> {
  const owned = await prisma.userPet.findUnique({ where: { userId_petId: { userId, petId } } });
  if (!owned) throw new Error('PET_LOCKED');
  await prisma.$transaction([
    prisma.userPet.updateMany({ where: { userId }, data: { equipped: false } }),
    prisma.userPet.update({ where: { userId_petId: { userId, petId } }, data: { equipped: true } }),
  ]);
}

async function feedPet(userId: string): Promise<void> {
  const pet = await prisma.userPet.findFirstOrThrow({ where: { userId, equipped: true } });
  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId } });
  if (profile.pearls < 3) throw new Error('INSUFFICIENT_FUNDS');
  const nextExp = pet.exp + 25;
  const shouldLevel = nextExp >= 100 + pet.level * 25;
  await prisma.$transaction([
    prisma.profile.update({ where: { userId }, data: { pearls: { decrement: 3 } } }),
    prisma.userPet.update({
      where: { userId_petId: { userId, petId: pet.petId } },
      data: {
        exp: shouldLevel ? 0 : nextExp,
        level: { increment: shouldLevel ? 1 : 0 },
      },
    }),
  ]);
}
