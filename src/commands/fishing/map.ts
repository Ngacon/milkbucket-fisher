import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { Command } from '../../types/command';
import { getCatalogMaps } from '../../database/catalogCache';
import { getOrCreateUser } from '../../systems/users/userService';
import { prisma } from '../../database/prisma';
import { colors } from '../../utils/colors';
import { formatCoins } from '../../utils/format';
import { tierWeight } from '../../systems/fishing/fishingService';
import type { FishTier } from '@prisma/client';

// ─── Tier display helpers ─────────────────────────────────────────────────────

const TIER_EMOJI: Record<string, string> = {
  Common: '⚪', Uncommon: '🟢', Rare: '🔵',
  Epic: '🟣', Legendary: '🟠', Mythic: '🔴', Secret: '⬛',
};

const TIER_ORDER: FishTier[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic', 'Secret'];

/** Màu embed theo biome */
const BIOME_COLOR: Record<string, number> = {
  Lake: 0x89CFF0, River: 0x4FC3F7, Swamp: 0x558B2F, Ocean: 0x0277BD,
  Cave: 0x5D4037, Lagoon: 0xF48FB1, Fjord: 0x37474F, Ice: 0xB3E5FC,
  Reef: 0xFF8A65, Ruins: 0x8D6E63, Delta: 0xF9A825, Volcanic: 0xBF360C,
  Kelp: 0x2E7D32, Aurora: 0x4A148C, Harbor: 0x455A64, Orchard: 0xAD1457,
  Abyss: 0x1A237E, Void: 0x212121, Skysea: 0xFF6F00, Jail: 0x757575,
};

/** Power cần câu tối thiểu để câu Rare+/Epic+/Legendary+ ổn định */
function recommendedPower(mapDifficulty: number): { rare: number; epic: number; legendary: number } {
  return {
    rare: Math.round(tierWeight['Rare'] * (1 + mapDifficulty / 200)),
    epic: Math.round(tierWeight['Epic'] * (1 + mapDifficulty / 200)),
    legendary: Math.round(tierWeight['Legendary'] * (1 + mapDifficulty / 200)),
  };
}

// ─── Command definition ───────────────────────────────────────────────────────

export const mapCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('map')
    .setDescription('Xem maps, mở khóa map, xem cá, hoặc đặt map mặc định.')
    .addSubcommand((sub) => sub.setName('list').setDescription('Danh sách tất cả maps.'))
    .addSubcommand((sub) =>
      sub
        .setName('unlock')
        .setDescription('Mở khóa một map.')
        .addStringOption((opt) => opt.setName('id').setDescription('Map id, ví dụ: milk_pond').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('fish')
        .setDescription('Xem cá có ở map đó.')
        .addStringOption((opt) => opt.setName('id').setDescription('Map id, ví dụ: butter_creek').setRequired(true)),
    )
    .addSubcommand((sub) =>
      sub
        .setName('travel')
        .setDescription('Đặt map mặc định để câu (dùng m!fish không cần gõ map nữa).')
        .addStringOption((opt) => opt.setName('id').setDescription('Map id muốn di chuyển tới').setRequired(true)),
    ),

  prefixAliases: ['map', 'maps'],

  execute: async (interaction) => {
    const user = await getOrCreateUser(interaction.user.id, interaction.user.username);
    const sub = interaction.options.getSubcommand();

    if (sub === 'unlock') {
      const id = interaction.options.getString('id', true);
      await unlockMap(user.id, id);
      await interaction.reply(`✅ Đã mở khóa map **${id}** thành công!`);
      return;
    }

    if (sub === 'fish') {
      const id = interaction.options.getString('id', true);
      await interaction.reply({ embeds: [await renderMapFish(id, user.id)] });
      return;
    }

    if (sub === 'travel') {
      const id = interaction.options.getString('id', true);
      await travelMap(user.id, id);
      await interaction.reply(`🗺️ Đã đặt map mặc định: **${id}**. Lần sau dùng \`m!fish\` sẽ tự vào map này!`);
      return;
    }

    // list (default)
    await interaction.reply({ embeds: [await renderMaps(user.id, user.language)] });
  },

  executePrefix: async (message, args) => {
    const user = await getOrCreateUser(message.author.id, message.author.username);
    const sub = args[0];

    if (sub === 'unlock' && args[1]) {
      await unlockMap(user.id, args[1]);
      await message.reply(`✅ Đã mở khóa map **${args[1]}** thành công!`);
      return;
    }

    if (sub === 'fish' && args[1]) {
      await message.reply({ embeds: [await renderMapFish(args[1], user.id)] });
      return;
    }

    if (sub === 'travel' && args[1]) {
      await travelMap(user.id, args[1]);
      await message.reply(`🗺️ Đã đặt map mặc định: **${args[1]}**. Lần sau dùng \`m!fish\` sẽ tự vào map này!`);
      return;
    }

    await message.reply({ embeds: [await renderMaps(user.id, user.language)] });
  },
};

// ─── Map list ─────────────────────────────────────────────────────────────────

async function renderMaps(userId: string, language: string): Promise<EmbedBuilder> {
  const [maps, owned, profile] = await Promise.all([
    getCatalogMaps(),
    prisma.userMap.findMany({ where: { userId } }),
    prisma.profile.findUnique({ where: { userId } }),
  ]);

  const ownedIds = new Set(owned.map((e) => e.mapId));
  const activeMap = profile?.activeMapId ?? 'milk_pond';
  const isVi = language !== 'en';

  const lines = maps.map((map) => {
    const isOwned = ownedIds.has(map.id);
    const isActive = map.id === activeMap;
    const weather = map.weatherState?.currentWeather ?? 'Sunny';
    const power = recommendedPower(map.difficulty);

    const statusIcon = isActive ? '📍' : isOwned ? '✅' : '🔒';
    const costStr = isOwned ? (isActive ? (isVi ? 'Đang câu' : 'Active') : isVi ? 'Đã mở' : 'Owned') : `${formatCoins(map.price)} coins`;

    return [
      `${statusIcon} \`${map.id}\` **${map.name}** — ${map.biome} | diff **${map.difficulty}** | ${weather}`,
      `  ${isVi ? 'Giá' : 'Price'}: ${costStr} | Power gợi ý: Rare ≥${power.rare} · Epic ≥${power.epic} · Leg ≥${power.legendary}`,
    ].join('\n');
  });

  return new EmbedBuilder()
    .setColor(colors.sky)
    .setTitle('🗺️ Milkbucket Maps')
    .setDescription(lines.join('\n').slice(0, 4000))
    .setFooter({ text: isVi ? 'm!map fish <id> → xem cá | m!map travel <id> → đặt map mặc định' : 'm!map fish <id> · m!map travel <id>' });
}

// ─── Map fish preview ─────────────────────────────────────────────────────────

async function renderMapFish(mapId: string, userId: string): Promise<EmbedBuilder> {
  const [map, fish, userMap, equipped] = await Promise.all([
    prisma.map.findUnique({ where: { id: mapId }, include: { weatherState: true } }),
    prisma.fish.findMany({ where: { habitat: { has: mapId } }, orderBy: [{ tier: 'asc' }, { baseValue: 'asc' }] }),
    prisma.userMap.findUnique({ where: { userId_mapId: { userId, mapId } } }),
    prisma.userRod.findFirst({ where: { userId, isEquipped: true }, include: { rod: true } }),
  ]);

  if (!map) {
    return new EmbedBuilder()
      .setColor(colors.danger)
      .setTitle('❌ Map không tồn tại')
      .setDescription(`Không tìm thấy map \`${mapId}\`.`);
  }

  const rodPower = equipped ? equipped.rod.power + equipped.level * 2 + equipped.prestigeCount * 6 : 0;
  const weather = map.weatherState?.currentWeather ?? 'Sunny';
  const isLocked = !userMap;

  // Group fish by tier
  const byTier = new Map<string, typeof fish>();
  for (const f of fish) {
    const arr = byTier.get(f.tier) ?? [];
    arr.push(f);
    byTier.set(f.tier, arr);
  }

  const fishLines: string[] = [];
  for (const tier of TIER_ORDER) {
    const group = byTier.get(tier);
    if (!group || group.length === 0) continue;
    const req = tierWeight[tier];
    const canCatch = rodPower >= req * 0.6;
    const powerHint = !canCatch ? ` ⚠️power<${req}` : '';
    fishLines.push(`**${TIER_EMOJI[tier]} ${tier}**${powerHint}`);
    for (const f of group) {
      fishLines.push(`  • **${f.name}** — ${formatCoins(f.baseValue)} coins | catch ${f.catchRate}%`);
    }
  }

  const colorNum = BIOME_COLOR[map.biome] ?? 0x89cff0;
  const lockedNote = isLocked ? `\n🔒 **Map chưa mở** (${formatCoins(map.price)} coins để unlock)\n` : '';

  return new EmbedBuilder()
    .setColor(colorNum)
    .setTitle(`${TIER_EMOJI[weather] ?? '🌤️'} ${map.name} — Cá tại đây`)
    .setDescription(
      [
        `**Biome:** ${map.biome} | **Difficulty:** ${map.difficulty} | **Weather:** ${weather}`,
        lockedNote,
        equipped ? `🎣 Cần câu hiện tại: **${equipped.rod.name}** (Power ${rodPower})` : '❌ Chưa trang bị cần câu!',
        '',
        fishLines.join('\n'),
      ]
        .join('\n')
        .slice(0, 4000),
    )
    .setFooter({ text: `m!map travel ${mapId} → đặt làm map mặc định | m!fish ${mapId} → câu ngay` });
}

// ─── Unlock map ───────────────────────────────────────────────────────────────

async function unlockMap(userId: string, mapId: string): Promise<void> {
  const map = await prisma.map.findUniqueOrThrow({ where: { id: mapId } });
  const existing = await prisma.userMap.findUnique({ where: { userId_mapId: { userId, mapId } } });
  if (existing) throw new Error('MAP_ALREADY_UNLOCKED');

  const profile = await prisma.profile.findUniqueOrThrow({ where: { userId } });
  if (profile.coins < map.price) throw new Error('INSUFFICIENT_FUNDS');

  await prisma.$transaction([
    prisma.profile.update({ where: { userId }, data: { coins: { decrement: map.price } } }),
    prisma.userMap.upsert({
      where: { userId_mapId: { userId, mapId } },
      update: {},
      create: { userId, mapId },
    }),
  ]);
}

// ─── Travel / set active map ──────────────────────────────────────────────────

async function travelMap(userId: string, mapId: string): Promise<void> {
  // Kiểm tra map tồn tại
  await prisma.map.findUniqueOrThrow({ where: { id: mapId } });
  // Phải sở hữu map mới travel được
  const userMap = await prisma.userMap.findUnique({ where: { userId_mapId: { userId, mapId } } });
  if (!userMap) throw new Error('MAP_LOCKED');

  await prisma.profile.update({
    where: { userId },
    data: { activeMapId: mapId },
  });
}
