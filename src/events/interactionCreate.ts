import type { Interaction } from 'discord.js';
import { commandsByName } from '../commands';
import { getBannedUntil } from '../systems/users/userService';
import { logger } from '../utils/logger';

export async function handleInteractionCreate(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) {
    return;
  }
  const command = commandsByName.get(interaction.commandName);
  if (!command) {
    await interaction.reply({ content: 'Unknown command.', ephemeral: true });
    return;
  }

  const bannedUntil = await getBannedUntil(interaction.user.id);
  if (bannedUntil && bannedUntil.getTime() > Date.now()) {
    await interaction.reply({ content: `Bạn đang bị khóa game tới ${bannedUntil.toLocaleString()}.`, ephemeral: true });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error({ err: error, command: interaction.commandName }, 'Slash command failed');
    const message = humanizeError(error);
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: message, ephemeral: true });
    } else {
      await interaction.reply({ content: message, ephemeral: true });
    }
  }
}

export function humanizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const map: Record<string, string> = {
    INSUFFICIENT_FUNDS: 'Không đủ tiền.',
    MAP_LOCKED: 'Bạn chưa mở map này.',
    MAP_NOT_FOUND: 'Không tìm thấy map.',
    MAP_ALREADY_UNLOCKED: 'Bạn đã mở map này rồi.',
    ROD_NOT_FOUND: 'Bạn chưa có cần câu hợp lệ.',
    ROD_LOCKED: 'Bạn chưa sở hữu cần này.',
    ROD_ALREADY_OWNED: 'Bạn đã sở hữu cần này rồi.',
    NO_FISH: 'Map này chưa có fish pool. Hãy chạy seed lại.',
    NOT_ENOUGH_FISH: 'Bạn không đủ cá trong túi.',
    LISTING_UNAVAILABLE: 'Listing không khả dụng.',
    ALREADY_IN_TEAM: 'Bạn đã ở trong team.',
    TEAM_FULL: 'Team đã đủ 20 người.',
    CODE_EXPIRED: 'Code hết hạn hoặc hết lượt.',
    CODE_USED: 'Bạn đã dùng code này.',
    INVALID_AMOUNT: 'Số lượng không hợp lệ.',
    ROD_ENCHANT_FULL: 'Cần này đã đầy enchant.',
    ROD_NOT_MAX: 'Cần phải đạt max level mới prestige được.',
    RECIPE_NOT_FOUND: 'Không tìm thấy công thức craft.',
    NOT_ENOUGH_INGREDIENTS: 'Không đủ nguyên liệu craft.',
    BAIT_MISSING: 'Bạn không có bait này trong inventory.',
    QUEST_NOT_CLAIMABLE: 'Quest chưa hoàn thành hoặc đã claim rồi.',
    PET_ALREADY_OWNED: 'Bạn đã có pet này.',
    PET_LOCKED: 'Bạn chưa sở hữu pet này.',
  };
  return map[message] ?? 'Có lỗi xảy ra. Kiểm tra log để biết chi tiết.';
}
