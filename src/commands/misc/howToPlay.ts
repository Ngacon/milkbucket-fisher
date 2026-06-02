import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command';
import { colors } from '../../utils/colors';

export const howToPlayCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('howtoplay')
    .setDescription('Show a detailed Milkbucket gameplay manual.'),
  prefixAliases: ['howtoplay', 'howto', 'cachchoi', 'cáchchơi', 'choithenao'],
  skipBanCheck: true,
  execute: async (interaction) => {
    await interaction.reply({ embeds: renderHowToPlay() });
  },
  executePrefix: async (message) => {
    await message.reply({ embeds: renderHowToPlay() });
  },
};

function renderHowToPlay(): EmbedBuilder[] {
  return [
    new EmbedBuilder()
      .setColor(colors.cream)
      .setAuthor({ name: 'Milkbucket Manual' })
      .setTitle('🥛 Cách Chơi Milkbucket')
      .setDescription(
        [
          'Milkbucket không phải kiểu chỉ gõ câu rồi random ra cá. Game có build, market, map, pet, team, season và mini-game tension.',
          '',
          '**Lộ trình dễ nhất:** `m!profile` -> `m!fish` -> `m!bag` -> `m!sell` -> `m!shop` -> `m!rod` -> `m!map`.',
        ].join('\n'),
      )
      .addFields(
        {
          name: '1. Tạo tài khoản và xem trạng thái',
          value:
            '`m!profile` tạo/xem hồ sơ: level, coins, pearls, milk drops, cần đang dùng, map đã mở, team và hardcore.',
        },
        {
          name: '2. Bắt đầu câu cá',
          value:
            '`m!fish` câu ở map mặc định. `m!fish milk_pond crumb_bait` câu ở map cụ thể với bait cụ thể.',
        },
        {
          name: '3. Mục tiêu mỗi vòng câu',
          value:
            'Thanh câu có `●` là độ căng dây, vùng `▰` là vùng an toàn. Giữ `●` trong `▰` để tăng tiến độ. Đạt khoảng 70%+ là có cơ hội bắt được cá.',
        },
      ),

    new EmbedBuilder()
      .setColor(colors.sky)
      .setTitle('🎣 Mini-game Câu Cá')
      .setDescription('Mỗi lượt bấm một nút. Nếu không bấm, bot tự chọn `Giữ` sau vài giây để ván không bị kẹt.')
      .addFields(
        {
          name: 'Kéo',
          value: 'Tăng căng dây mạnh. Dùng khi `●` đang nằm thấp hơn vùng xanh.',
          inline: true,
        },
        {
          name: 'Giữ',
          value: 'Tăng nhẹ/ổn định dây. Dùng khi `●` đang gần vùng xanh.',
          inline: true,
        },
        {
          name: 'Thả dây',
          value: 'Giảm căng dây. Dùng khi `●` đang vượt lên cao quá.',
          inline: true,
        },
        {
          name: 'Perfect catch',
          value:
            'Nếu giữ tốt gần như toàn bộ ván, cá bán được giá hơn và nhận thêm tiến trình. Đây là chỗ người chơi giỏi hơn người chỉ spam.',
        },
        {
          name: 'Khi fail',
          value:
            'Fail không sao. Bạn học được nhịp của cần và map. Nếu bật `m!hardcore on` thì fail đau hơn, nên người mới chưa cần bật.',
        },
      ),

    new EmbedBuilder()
      .setColor(colors.mint)
      .setTitle('💰 Tiền, Túi Cá, Shop và Build')
      .setDescription('Game có nhiều đường build, không chỉ nâng số thật to.')
      .addFields(
        {
          name: 'Coins, Pearls, Milk Drops',
          value:
            '**Coins** để mua cơ bản. **Pearls** dùng cho enchant/pet/craft hiếm. **Milk Drops** thiên về season/cosmetic/convenience.',
        },
        {
          name: 'Bán cá',
          value:
            '`m!bag` xem cá đang giữ. `m!sell` bán cá chưa đem lên market/auction. Giá có thể chịu ảnh hưởng bởi event và market.',
        },
        {
          name: 'Cần câu',
          value:
            '`m!shop` xem/mua/equip cần. `m!rod` xem cần đang dùng. `m!rod enchant` thêm sức mạnh phụ. `m!rod prestige` reset level để lấy buff lâu dài.',
        },
        {
          name: 'Build phổ biến',
          value:
            '**Luck build:** săn rare/shiny. **Power build:** dễ thắng cá khó. **Speed build:** câu nhiều vòng hơn. **Team build:** hưởng lợi khi chơi cùng team.',
        },
      ),

    new EmbedBuilder()
      .setColor(colors.strawberry)
      .setTitle('🗺️ Map, Bait, Pet, Team và Market')
      .setDescription('Đây là phần khiến game chơi lâu không chán: chọn nơi câu và chọn cách kiếm lời.')
      .addFields(
        {
          name: 'Map',
          value:
            '`m!map` xem map. `m!map unlock <mapId>` mở map mới. Map khác nhau theo biome, weather, cá hiếm và secret spot, không chỉ là map đắt hơn.',
        },
        {
          name: 'Bait và crafting',
          value:
            '`m!craft` xem recipe. `m!craft make crumb_bait 2` tạo bait. Bait giúp kéo nhóm cá phù hợp hoặc mở điều kiện secret.',
        },
        {
          name: 'Pet',
          value:
            '`m!pet` xem pet. `m!pet adopt <petId>`, `m!pet equip <petId>`, `m!pet feed`. Pet hỗ trợ build như cá đêm, secret spot hoặc cá dễ bắt.',
        },
        {
          name: 'Team',
          value:
            '`m!team create <tên>`, `m!team join <tên>`, `m!team info`. Team có điểm tuần, cạnh tranh BXH và về sau có team spot/buff.',
        },
        {
          name: 'Market và auction',
          value:
            '`m!market` mua bán cá với người chơi. `m!auction` đấu giá cá hiếm. Có tax để chống lạm phát, nên đừng spam mua bán vô nghĩa.',
        },
      ),

    new EmbedBuilder()
      .setColor(colors.warning)
      .setTitle('📜 Việc Nên Làm Mỗi Ngày')
      .setDescription('Checklist này giúp bạn không bị lạc khi vào game.')
      .addFields(
        {
          name: 'Daily loop',
          value:
            '1. `m!quests`\n2. `m!fish`\n3. `m!bag`\n4. `m!sell` hoặc `m!market sell ...`\n5. Nâng `m!shop` / `m!rod` / `m!pet`.',
        },
        {
          name: 'Tra cứu dữ liệu',
          value:
            '`m!info` mở thư viện. `m!info fish` list cá. `m!info milk_carp` xem chi tiết. `m!info rod` xem cần. `m!info map` xem map.',
        },
        {
          name: 'Season và hardcore',
          value:
            '`m!season` xem battle pass. `m!hardcore on` reward x2 nhưng fail mất 50% coins/pearls, chỉ bật khi đã hiểu mini-game.',
        },
        {
          name: 'Khi không biết gõ gì',
          value:
            '`m!guide` là hướng dẫn ngắn. `m!help` có menu. `m!help <lệnh>` xem chi tiết lệnh, ví dụ `m!help fish`.',
        },
      )
      .setFooter({ text: 'Milkbucket tip: đừng chỉ farm. Hãy thử build, map, bait, pet và market khác nhau.' })
      .setTimestamp(),
  ];
}
