import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command';
import { getOrCreateUser } from '../../systems/users/userService';
import { prisma } from '../../database/prisma';
import { colors } from '../../utils/colors';
import { formatCoins } from '../../utils/format';

export const auctionCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('auction')
    .setDescription('Auction rare fish.')
    .addSubcommand((subcommand) => subcommand.setName('list').setDescription('List open auctions.'))
    .addSubcommand((subcommand) =>
      subcommand
        .setName('create')
        .setDescription('Auction one fish from your bag.')
        .addStringOption((option) => option.setName('fish').setDescription('Fish id').setRequired(true))
        .addIntegerOption((option) => option.setName('starting').setDescription('Starting price').setRequired(true).setMinValue(1))
        .addIntegerOption((option) => option.setName('hours').setDescription('Duration hours').setRequired(false).setMinValue(1).setMaxValue(48)),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('bid')
        .setDescription('Bid on an auction.')
        .addStringOption((option) => option.setName('id').setDescription('Auction id').setRequired(true))
        .addIntegerOption((option) => option.setName('amount').setDescription('Bid amount').setRequired(true).setMinValue(1)),
    ),
  prefixAliases: ['auction', 'daugia'],
  execute: async (interaction) => {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'create') {
      const auction = await createAuction(
        user.id,
        interaction.options.getString('fish', true),
        interaction.options.getInteger('starting', true),
        interaction.options.getInteger('hours') ?? 12,
      );
      await interaction.reply(`Auction \`${auction.id}\` đã mở.`);
      return;
    }
    if (subcommand === 'bid') {
      await bidAuction(user.id, interaction.options.getString('id', true), interaction.options.getInteger('amount', true));
      await interaction.reply('Bid thành công.');
      return;
    }
    await interaction.reply({ embeds: [await renderAuctions()] });
  },
  executePrefix: async (message, args) => {
    const user = await getOrCreateUser(message.author.id, message.author.username);
    if (args[0] === 'create' && args[1] && args[2]) {
      const auction = await createAuction(user.id, args[1], Number(args[2]), Number(args[3] ?? 12));
      await message.reply(`Auction \`${auction.id}\` đã mở.`);
      return;
    }
    if (args[0] === 'bid' && args[1] && args[2]) {
      await bidAuction(user.id, args[1], Number(args[2]));
      await message.reply('Bid thành công.');
      return;
    }
    await message.reply({ embeds: [await renderAuctions()] });
  },
};

async function renderAuctions(): Promise<EmbedBuilder> {
  const auctions = await prisma.auction.findMany({
    where: { status: 'Open' },
    include: { fish: true, seller: true, bidder: true },
    orderBy: { endsAt: 'asc' },
    take: 10,
  });
  return new EmbedBuilder()
    .setColor(colors.strawberry)
    .setTitle('🔨 Auctions')
    .setDescription(
      auctions.length === 0
        ? 'Không có auction đang mở.'
        : auctions
            .map(
              (auction) =>
                `• \`${auction.id}\` **${auction.fish.name}** | bid ${formatCoins(auction.currentBid)} | bidder ${
                  auction.bidder?.username ?? 'none'
                } | ends <t:${Math.floor(auction.endsAt.getTime() / 1000)}:R>`,
            )
            .join('\n'),
    );
}

async function createAuction(userId: string, fishId: string, startingPrice: number, hours: number) {
  if (!Number.isInteger(startingPrice) || startingPrice <= 0) throw new Error('INVALID_AMOUNT');
  const record = await prisma.catchRecord.findFirst({
    where: { userId, fishId, sold: false, listed: false },
    orderBy: [{ shiny: 'desc' }, { quality: 'desc' }, { caughtAt: 'asc' }],
  });
  if (!record) throw new Error('NOT_ENOUGH_FISH');
  return prisma.$transaction(async (tx) => {
    await tx.catchRecord.update({ where: { id: record.id }, data: { listed: true } });
    await tx.userFish.update({
      where: { userId_fishId: { userId, fishId } },
      data: { inventoryCount: { decrement: 1 } },
    });
    return tx.auction.create({
      data: {
        sellerId: userId,
        fishId,
        recordId: record.id,
        startingPrice,
        currentBid: startingPrice,
        endsAt: new Date(Date.now() + Math.max(1, hours) * 60 * 60 * 1000),
      },
    });
  });
}

async function bidAuction(bidderId: string, auctionId: string, amount: number): Promise<void> {
  if (!Number.isInteger(amount) || amount <= 0) throw new Error('INVALID_AMOUNT');
  await prisma.$transaction(async (tx) => {
    const auction = await tx.auction.findUniqueOrThrow({ where: { id: auctionId } });
    if (auction.status !== 'Open' || auction.endsAt.getTime() <= Date.now() || auction.sellerId === bidderId || amount <= auction.currentBid) {
      throw new Error('LISTING_UNAVAILABLE');
    }
    const bidder = await tx.profile.findUniqueOrThrow({ where: { userId: bidderId } });
    if (bidder.coins < amount) throw new Error('INSUFFICIENT_FUNDS');
    if (auction.highestBidder) {
      await tx.profile.update({
        where: { userId: auction.highestBidder },
        data: { coins: { increment: auction.currentBid } },
      });
    }
    await tx.profile.update({ where: { userId: bidderId }, data: { coins: { decrement: amount } } });
    await tx.auction.update({
      where: { id: auctionId },
      data: {
        currentBid: amount,
        highestBidder: bidderId,
      },
    });
  });
}
