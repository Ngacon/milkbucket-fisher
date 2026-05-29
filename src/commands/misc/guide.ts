import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command';
import { getOrCreateUser } from '../../systems/users/userService';
import { colors } from '../../utils/colors';

export const guideCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('guide')
    .setDescription('Show a simple Milkbucket starter guide.'),
  prefixAliases: ['guide', 'huongdan', 'hướngdẫn', 'batdau', 'start'],
  execute: async (interaction) => {
    await getOrCreateUser(interaction.user.id, interaction.user.username);
    await interaction.reply({ embeds: [renderGuide()] });
  },
  executePrefix: async (message) => {
    await getOrCreateUser(message.author.id, message.author.username);
    await message.reply({ embeds: [renderGuide()] });
  },
};

function renderGuide(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(colors.cream)
    .setAuthor({ name: 'Milkbucket Starter Guide' })
    .setTitle('🥛 Bắt đầu chơi Milkbucket')
    .setDescription('Đường đi ngắn nhất để chơi mà không bị ngợp.')
    .addFields(
      {
        name: '1. Xem hồ sơ',
        value: '`m!profile` để tạo tài khoản, xem tiền, cần đang dùng, level và team.',
      },
      {
        name: '2. Câu cá',
        value: '`m!fish` để câu ở map đầu. Thanh câu có `●` là độ căng dây, vùng `▰` là vùng an toàn.',
      },
      {
        name: '3. Bấm nút thế nào?',
        value: '`Kéo` tăng căng dây. `Giữ` tăng nhẹ. `Thả dây` giảm căng dây. Mục tiêu: giữ `●` trong `▰` tới 70%+.',
      },
      {
        name: '4. Kiếm tiền và nâng build',
        value: '`m!bag` xem cá, `m!sell` bán cá, `m!shop` mua cần, `m!rod` enchant/prestige, `m!craft` làm bait.',
      },
      {
        name: '5. Khi lạc đường',
        value: '`m!howtoplay` xem cẩm nang chi tiết. `m!help start` xem mục người mới. `m!info fish` list cá.',
      },
    )
    .setFooter({ text: 'Tip: cứ bắt đầu bằng m!fish, sai vài lượt cũng không sao.' })
    .setTimestamp();
}
