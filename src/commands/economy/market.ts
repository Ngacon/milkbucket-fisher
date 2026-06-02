import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command';
import { getOrCreateUser } from '../../systems/users/userService';
import { prisma } from '../../database/prisma';
import { getTaxRate } from '../../systems/economy/marketService';
import { colors } from '../../utils/colors';
import { formatCoins } from '../../utils/format';

export const marketCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('market')
    .setDescription('Marketplace for player fish trading.')
    .addSubcommand((subcommand) => subcommand.setName('list').setDescription('Show active listings.'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('sell')
        .setDescription('List unsold fish by fish id.')
        .addStringOption((option) => option.setName('fish').setDescription('Fish id').setRequired(true))
        .addIntegerOption((option) => option.setName('quantity').setDescription('Quantity').setRequired(true).setMinValue(1))
        .addIntegerOption((option) => option.setName('price').setDescription('Total price').setRequired(true).setMinValue(1)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('buy')
        .setDescription('Buy a listing.')
        .addStringOption((option) => option.setName('id').setDescription('Listing id').setRequired(true)),
    ),
  prefixAliases: ['market', 'cho', 'chợ'],
  execute: async (interaction) => {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'sell') {
      const listing = await createListing(
        user.id,
        interaction.options.getString('fish', true),
        interaction.options.getInteger('quantity', true),
        interaction.options.getInteger('price', true),
      );
      await interaction.reply(`Đã đăng bán listing \`${listing.id}\`.`);
      return;
    }
    if (subcommand === 'buy') {
      await buyListing(user.id, interaction.options.getString('id', true));
      await interaction.reply('Mua thành công.');
      return;
    }
    await interaction.reply({ embeds: [await renderMarket()] });
  },
  executePrefix: async (message, args) => {
    const user = await getOrCreateUser(message.author.id, message.author.username);
    if (args[0] === 'sell' && args[1] && args[2] && args[3]) {
      const listing = await createListing(user.id, args[1], Number(args[2]), Number(args[3]));
      await message.reply(`Đã đăng bán listing \`${listing.id}\`.`);
      return;
    }
    if (args[0] === 'buy' && args[1]) {
      await buyListing(user.id, args[1]);
      await message.reply('Mua thành công.');
      return;
    }
    await message.reply({ embeds: [await renderMarket()] });
  },
};

async function renderMarket(): Promise<EmbedBuilder> {
  const [listings, taxRate] = await Promise.all([
    prisma.marketplaceListing.findMany({
      where: { sold: false },
      include: { fish: true, seller: true },
      orderBy: { listedAt: 'desc' },
      take: 10,
    }),
    getTaxRate(),
  ]);
  return new EmbedBuilder()
    .setColor(colors.mint)
    .setTitle('🛒 Marketplace')
    .setDescription(
      listings.length === 0
        ? 'Chưa có listing nào.'
        : listings
            .map(
              (listing) =>
                `• \`${listing.id}\` **${listing.fish.name}** x${listing.quantity} - ${formatCoins(
                  listing.price,
                )} | seller ${listing.seller.username}`,
            )
            .join('\n'),
    )
    .setFooter({ text: `Tax ${(taxRate * 100).toFixed(1)}% burned on sale` });
}

async function createListing(userId: string, fishId: string, quantity: number, price: number) {
  if (!Number.isInteger(quantity) || quantity <= 0 || !Number.isInteger(price) || price <= 0) {
    throw new Error('INVALID_AMOUNT');
  }
  const availableRecords = await prisma.catchRecord.findMany({
    where: { userId, fishId, sold: false, listed: false },
    select: { id: true },
    orderBy: { caughtAt: 'asc' },
    take: quantity,
  });
  if (availableRecords.length < quantity) {
    throw new Error('NOT_ENOUGH_FISH');
  }
  return prisma.$transaction(async (tx) => {
    await tx.userFish.update({
      where: { userId_fishId: { userId, fishId } },
      data: { inventoryCount: { decrement: quantity } },
    });
    await tx.catchRecord.updateMany({
      where: { id: { in: availableRecords.map((record) => record.id) } },
      data: { listed: true },
    });
    return tx.marketplaceListing.create({
      data: { sellerId: userId, fishId, quantity, price, recordIds: availableRecords.map((record) => record.id) },
    });
  });
}

async function buyListing(buyerId: string, listingId: string): Promise<void> {
  const taxRate = await getTaxRate();
  await prisma.$transaction(async (tx) => {
    const listing = await tx.marketplaceListing.findUniqueOrThrow({
      where: { id: listingId },
    });
    if (listing.sold || listing.sellerId === buyerId) {
      throw new Error('LISTING_UNAVAILABLE');
    }
    const buyer = await tx.profile.findUniqueOrThrow({ where: { userId: buyerId } });
    if (buyer.coins < listing.price) {
      throw new Error('INSUFFICIENT_FUNDS');
    }
    const tax = Math.floor(listing.price * taxRate);
    await tx.profile.update({ where: { userId: buyerId }, data: { coins: { decrement: listing.price } } });
    await tx.profile.update({
      where: { userId: listing.sellerId },
      data: { coins: { increment: listing.price - tax } },
    });
    await tx.userFish.upsert({
      where: { userId_fishId: { userId: buyerId, fishId: listing.fishId } },
      update: { inventoryCount: { increment: listing.quantity } },
      create: {
        userId: buyerId,
        fishId: listing.fishId,
        count: 0,
        inventoryCount: listing.quantity,
        largestSize: 0,
        smallestSize: 0,
      },
    });
    await tx.catchRecord.updateMany({
      where: { id: { in: listing.recordIds } },
      data: { userId: buyerId, listed: false },
    });
    await tx.marketplaceListing.update({ where: { id: listingId }, data: { sold: true } });
  });
}
