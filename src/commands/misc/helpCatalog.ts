import { colors } from '../../utils/colors';

export type HelpCategoryId =
  | 'home'
  | 'start'
  | 'fishing'
  | 'economy'
  | 'social'
  | 'progression'
  | 'admin'
  | 'index';

export type HelpCategory = {
  id: HelpCategoryId;
  label: string;
  emoji: string;
  description: string;
  color: number;
  fields: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
};

export type HelpCommandDetail = {
  name: string;
  aliases: string[];
  category: HelpCategoryId;
  summary: string;
  usage: string[];
  examples: string[];
  notes: string[];
};

export const helpCategories: HelpCategory[] = [
  {
    id: 'home',
    label: 'Tổng quan',
    emoji: '🥛',
    description:
      'Milkbucket là game câu cá chiến thuật: có mini-game tension, economy chống lạm phát, build cần câu, team, market, auction, pet, crafting, season và world boss.',
    color: colors.milk,
    fields: [
      {
        name: 'Lối chơi chính',
        value: '`/fish` hoặc `m!fish` để bắt đầu encounter. Dùng button để điều khiển tension thay vì chỉ roll random.',
      },
      {
        name: 'Đọc nhanh',
        value: '`m!guide` xem hướng dẫn ngắn.\n`m!help fish` xem chi tiết lệnh câu cá.\n`m!help start` xem đường đi cho người mới.',
      },
      {
        name: 'Chọn mục',
        value: 'Dùng menu bên dưới để đổi trang help. Mỗi mục là một embed riêng để đỡ ngợp.',
      },
    ],
  },
  {
    id: 'start',
    label: 'Người mới',
    emoji: '🧭',
    description: 'Một đường đi gọn để bắt đầu mà không bị lạc trong cả xô tính năng.',
    color: colors.cream,
    fields: [
      {
        name: '1. Nhận hồ sơ',
        value: '`m!profile` để tạo tài khoản, nhận cần đầu và map đầu tiên.',
        inline: true,
      },
      {
        name: '2. Câu cá',
        value: '`m!fish milk_pond` rồi bấm `Kéo / Giữ / Thả dây` theo thanh tension.',
        inline: true,
      },
      {
        name: '3. Bán cá',
        value: '`m!bag` xem túi, `m!sell` bán cá chưa listed theo giá market hiện tại.',
        inline: true,
      },
      {
        name: '4. Mở build',
        value: 'Mua cần bằng `m!shop`, craft bait bằng `m!craft`, nuôi pet bằng `m!pet`.',
      },
      {
        name: '5. Chơi lâu dài',
        value: 'Làm quest, vào team, tham gia auction, săn shiny/secret, prestige cần khi max level.',
      },
    ],
  },
  {
    id: 'fishing',
    label: 'Câu cá',
    emoji: '🎣',
    description: 'Nhóm lệnh lõi: câu cá, túi cá, bán cá, map, cần câu, crafting bait.',
    color: colors.sky,
    fields: [
      {
        name: '`fish`',
        value: '`m!fish [map] [bait]` - tạo encounter câu cá có tension mini-game.',
      },
      {
        name: '`bag` / `sell`',
        value: '`m!bag` xem cá chưa bán. `m!sell` bán cá chưa listed/auction.',
        inline: true,
      },
      {
        name: '`map`',
        value: '`m!map` xem map. `m!map unlock <id>` mở map mới.',
        inline: true,
      },
      {
        name: '`shop` / `rod`',
        value: '`m!shop` mua/equip cần. `m!rod` xem level, enchant, prestige.',
      },
      {
        name: '`craft`',
        value: '`m!craft` xem recipe. `m!craft make crumb_bait 2` craft bait.',
      },
    ],
  },
  {
    id: 'economy',
    label: 'Kinh tế',
    emoji: '🛒',
    description: 'Coins, Pearls, Milk Drops, chợ người chơi, đấu giá và tax chống lạm phát.',
    color: colors.mint,
    fields: [
      {
        name: 'Tiền tệ',
        value: '**Coins** dùng cơ bản. **Pearls** dùng enchant/pet/craft đặc biệt. **Milk Drops** cho season/cosmetic/convenience.',
      },
      {
        name: '`market`',
        value: '`m!market` xem chợ. `m!market sell <fishId> <quantity> <price>` đăng bán.',
      },
      {
        name: '`auction`',
        value: '`m!auction create <fishId> <starting> [hours]` mở đấu giá. `m!auction bid <id> <amount>` đặt bid.',
      },
      {
        name: '`pay` / `code`',
        value: '`m!pay @user 1000` chuyển coins có tax burn. `m!code MILK2026` nhận giftcode.',
      },
    ],
  },
  {
    id: 'social',
    label: 'Xã hội',
    emoji: '👥',
    description: 'Team, leaderboard, profile và pet để tạo áp lực xã hội nhẹ mà vui.',
    color: colors.strawberry,
    fields: [
      {
        name: '`profile`',
        value: '`m!profile` xem level, coins, rod, map, collection, team, hardcore.',
      },
      {
        name: '`team`',
        value: '`m!team create <name>`, `m!team join <name>`, `m!team info`.',
      },
      {
        name: '`leaderboard`',
        value: '`m!leaderboard coins`, `m!leaderboard fish`, `m!leaderboard team`.',
      },
      {
        name: '`pet`',
        value: '`m!pet list`, `m!pet adopt <id>`, `m!pet equip <id>`, `m!pet feed`.',
      },
    ],
  },
  {
    id: 'progression',
    label: 'Tiến trình',
    emoji: '📜',
    description: 'Quest, season, hardcore và casino giới hạn để có lý do quay lại mỗi ngày.',
    color: colors.warning,
    fields: [
      {
        name: '`quests`',
        value: '`m!quests` xem quest. `m!quests claim <questId>` nhận thưởng.',
      },
      {
        name: '`info`',
        value: '`m!info` xem thư viện dữ liệu. `m!info fish` list cá. `m!info milk_carp` xem detail.',
      },
      {
        name: '`season`',
        value: '`m!season` xem battle pass. `m!season premium` mở premium track bằng Milk Drops.',
      },
      {
        name: '`hardcore`',
        value: '`m!hardcore on` reward x2 nhưng fail mất 50% coins/pearls. `m!hardcore off` để tắt.',
      },
      {
        name: '`casino`',
        value: '`m!casino <bet> <tai/xiu>` hoặc `/casino dice`. Có max bet để không phá economy.',
      },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    emoji: '🛠️',
    description: 'Lệnh quản trị cho admin trong `ADMIN_IDS`. Có guard ở code, người thường không dùng được.',
    color: colors.danger,
    fields: [
      {
        name: 'Event / code',
        value: '`/admin giovang`, `/admin taocode`, `/admin thongbao`.',
      },
      {
        name: 'Player tools',
        value: '`/admin congtien`, `/admin trutien`, `/admin setlevel`, `/admin setrod`, `/admin ban`, `/admin unban`, `/admin reset`.',
      },
      {
        name: 'Data tools',
        value: '`/admin backup` xem stats. `/admin restore` trả hướng dẫn restore DB. `/admin wipe` cần confirm string.',
      },
    ],
  },
  {
    id: 'index',
    label: 'Tất cả lệnh',
    emoji: '📚',
    description: 'Danh sách nhanh. Gõ `m!help <lệnh>` để xem chi tiết từng lệnh.',
    color: colors.milk,
    fields: [
      {
        name: 'Fishing',
        value: '`fish`, `bag`, `sell`, `map`, `shop`, `rod`, `craft`',
      },
      {
        name: 'Economy',
        value: '`market`, `auction`, `pay`, `code`',
      },
      {
        name: 'Social',
        value: '`profile`, `leaderboard`, `team`, `pet`',
      },
      {
        name: 'Progression',
        value: '`guide`, `howtoplay`, `quests`, `info`, `season`, `hardcore`, `language`, `casino`, `help`',
      },
      {
        name: 'Admin',
        value: '`admin`',
      },
    ],
  },
];

export const helpCommandDetails: HelpCommandDetail[] = [
  {
    name: 'guide',
    aliases: ['huongdan', 'hướngdẫn', 'batdau', 'start'],
    category: 'start',
    summary: 'Hướng dẫn ngắn cho người mới: câu cá, bấm nút, bán cá, nâng build.',
    usage: ['m!guide', 'm!start', '/guide'],
    examples: ['m!guide', 'm!start'],
    notes: ['Dùng khi thấy game hơi rối.', 'Ngắn hơn `m!help`, tập trung vào việc chơi ngay.'],
  },
  {
    name: 'howtoplay',
    aliases: ['howto', 'cachchoi', 'cáchchơi', 'choithenao'],
    category: 'start',
    summary: 'Cẩm nang cực chi tiết giải thích toàn bộ vòng chơi Milkbucket.',
    usage: ['m!howtoplay', 'm!howto', 'm!cachchoi', '/howtoplay'],
    examples: ['m!howtoplay', 'm!cachchoi'],
    notes: ['Dài hơn `m!guide`.', 'Giải thích mini-game, economy, build, map, bait, pet, team, market và daily loop.'],
  },
  {
    name: 'fish',
    aliases: ['cau', 'câu'],
    category: 'fishing',
    summary: 'Bắt đầu một encounter câu cá có mini-game tension.',
    usage: ['m!fish', 'm!fish <mapId>', 'm!fish <mapId> <baitId>', '/fish map:<mapId> bait:<baitId>'],
    examples: ['m!fish milk_pond', 'm!fish milk_pond crumb_bait'],
    notes: ['Map phải được mở khóa.', 'Bait phải có trong inventory.', 'Perfect catch tăng giá trị và exp.'],
  },
  {
    name: 'bag',
    aliases: ['tui', 'túi'],
    category: 'fishing',
    summary: 'Xem cá chưa bán trong túi.',
    usage: ['m!bag', '/bag'],
    examples: ['m!bag'],
    notes: ['Chỉ hiện các catch chưa sold/listed.', 'Dùng `m!sell` để bán toàn bộ cá khả dụng.'],
  },
  {
    name: 'sell',
    aliases: ['ban', 'bán', 'banca'],
    category: 'fishing',
    summary: 'Bán toàn bộ cá chưa bán và chưa đem lên market/auction.',
    usage: ['m!sell', '/sell'],
    examples: ['m!sell'],
    notes: ['Giá chịu ảnh hưởng bởi market multiplier và Golden Hour nếu đang bật.'],
  },
  {
    name: 'map',
    aliases: ['maps'],
    category: 'fishing',
    summary: 'Xem danh sách map và mở khóa map mới.',
    usage: ['m!map', 'm!map unlock <mapId>', '/map list', '/map unlock id:<mapId>'],
    examples: ['m!map', 'm!map unlock butter_creek'],
    notes: ['Map khác nhau về biome/weather/fish pool, không chỉ đắt hơn.'],
  },
  {
    name: 'shop',
    aliases: ['cuahang'],
    category: 'fishing',
    summary: 'Xem, mua và trang bị cần câu.',
    usage: ['m!shop', 'm!shop buy <rodId>', 'm!shop equip <rodId>', '/shop rods', '/shop buyrod id:<rodId>', '/shop equip id:<rodId>'],
    examples: ['m!shop', 'm!shop buy rod_oak', 'm!shop equip rod_oak'],
    notes: ['Cần có Power/Luck/Speed/passive riêng.', 'Không mua lại cần đã sở hữu.'],
  },
  {
    name: 'rod',
    aliases: ['rodlevel', 'can', 'cần'],
    category: 'fishing',
    summary: 'Quản lý level, enchant và prestige cần đang equip.',
    usage: ['m!rod', 'm!rod enchant', 'm!rod prestige', '/rod status', '/rod enchant', '/rod prestige'],
    examples: ['m!rod', 'm!rod enchant'],
    notes: ['Enchant tốn Pearls.', 'Prestige yêu cầu cần max level và giữ lại một phần sức mạnh lâu dài.'],
  },
  {
    name: 'craft',
    aliases: ['chetao'],
    category: 'fishing',
    summary: 'Craft bait và consumable từ coins/cá/item.',
    usage: ['m!craft', 'm!craft items', 'm!craft make <recipeId> [quantity]', '/craft list', '/craft make recipe:<recipeId> quantity:<n>'],
    examples: ['m!craft', 'm!craft make crumb_bait 2'],
    notes: ['Recipe nằm trong JSON seed-data.', 'Bait ảnh hưởng fish spawn và secret spot.'],
  },
  {
    name: 'market',
    aliases: ['cho', 'chợ'],
    category: 'economy',
    summary: 'Chợ mua bán cá giữa người chơi.',
    usage: ['m!market', 'm!market sell <fishId> <quantity> <price>', 'm!market buy <listingId>', '/market list', '/market sell', '/market buy'],
    examples: ['m!market', 'm!market sell milk_carp 2 500', 'm!market buy clx123'],
    notes: ['Có tax burn để chống inflation.', 'Fish đem bán được reserve để tránh double-spend.'],
  },
  {
    name: 'auction',
    aliases: ['daugia'],
    category: 'economy',
    summary: 'Đấu giá cá hiếm giữa người chơi.',
    usage: ['m!auction', 'm!auction create <fishId> <startingPrice> [hours]', 'm!auction bid <auctionId> <amount>'],
    examples: ['m!auction create star_milkfish 2000 12', 'm!auction bid clx123 3000'],
    notes: ['Bid trừ coins ngay, outbid sẽ hoàn tiền bidder cũ.', 'Scheduler tự settle auction hết hạn.'],
  },
  {
    name: 'pay',
    aliases: ['chuyentien'],
    category: 'economy',
    summary: 'Chuyển coins cho người khác, có tax burn.',
    usage: ['m!pay @user <amount>', '/pay user:<user> amount:<amount>'],
    examples: ['m!pay @MilkFriend 1000'],
    notes: ['Tax giúp giảm lượng coins lưu thông.'],
  },
  {
    name: 'code',
    aliases: ['giftcode'],
    category: 'economy',
    summary: 'Nhập gift code để nhận coins/pearls/milk drops.',
    usage: ['m!code <code>', '/code code:<code>'],
    examples: ['m!code MILK2026'],
    notes: ['Mỗi user chỉ nhận một code một lần.', 'Code có giới hạn lượt claim.'],
  },
  {
    name: 'profile',
    aliases: ['me', 'menu'],
    category: 'social',
    summary: 'Xem hồ sơ người chơi.',
    usage: ['m!profile', '/profile'],
    examples: ['m!profile'],
    notes: ['Hiện level, coins, rod, maps, collection, team và hardcore status.'],
  },
  {
    name: 'leaderboard',
    aliases: ['top', 'bxh'],
    category: 'social',
    summary: 'Xem bảng xếp hạng coins, fish hoặc team.',
    usage: ['m!leaderboard [coins|fish|team]', '/leaderboard type:<type>'],
    examples: ['m!leaderboard coins', 'm!leaderboard team'],
    notes: ['Team score reset hàng tuần.'],
  },
  {
    name: 'team',
    aliases: ['guild'],
    category: 'social',
    summary: 'Tạo, join và xem Fishing Team.',
    usage: ['m!team', 'm!team create <name>', 'm!team join <name>', '/team create name:<name>'],
    examples: ['m!team create Sua Chua Club', 'm!team join Sua Chua Club'],
    notes: ['Tối đa 20 người/team.', 'Catch value cộng vào weekly score.'],
  },
  {
    name: 'pet',
    aliases: ['thu'],
    category: 'social',
    summary: 'Adopt, equip và feed pet companion.',
    usage: ['m!pet', 'm!pet adopt <petId>', 'm!pet equip <petId>', 'm!pet feed'],
    examples: ['m!pet adopt pet_cat', 'm!pet equip pet_cat'],
    notes: ['Pet dùng Pearls để adopt/feed.', 'Pet level ảnh hưởng build câu cá.'],
  },
  {
    name: 'quests',
    aliases: ['quest', 'nhiemvu'],
    category: 'progression',
    summary: 'Xem và claim quest.',
    usage: ['m!quests', 'm!quests claim <questId>', '/quests claim:<questId>'],
    examples: ['m!quests', 'm!quests claim daily_first_cast'],
    notes: ['Catch progress tự cập nhật sau mỗi lần câu thành công.'],
  },
  {
    name: 'season',
    aliases: ['battlepass'],
    category: 'progression',
    summary: 'Xem season/battle pass và mở premium track.',
    usage: ['m!season', 'm!season premium', '/season view', '/season premium'],
    examples: ['m!season', 'm!season premium'],
    notes: ['Premium dùng Milk Drops.', 'Catch thành công tự cộng season exp.'],
  },
  {
    name: 'hardcore',
    aliases: [],
    category: 'progression',
    summary: 'Bật/tắt chế độ rủi ro cao.',
    usage: ['m!hardcore on', 'm!hardcore off', '/hardcore enabled:true'],
    examples: ['m!hardcore on'],
    notes: ['Reward x2.', 'Fail encounter mất 50% coins/pearls.'],
  },
  {
    name: 'language',
    aliases: ['lang', 'ngonngu'],
    category: 'progression',
    summary: 'Đổi ngôn ngữ bot.',
    usage: ['m!language vi', 'm!language en', '/language language:English'],
    examples: ['m!language en'],
    notes: ['Mặc định là tiếng Việt.'],
  },
  {
    name: 'casino',
    aliases: ['taixiu'],
    category: 'progression',
    summary: 'Casino dice có max bet để không phá economy.',
    usage: ['m!casino <bet> <tai|xiu>', 'm!taixiu <bet> <tai|xiu>', '/casino dice choice:<tai|xiu> bet:<amount>'],
    examples: ['m!casino 500 tai', 'm!taixiu 500 xiu'],
    notes: ['Đây là mini-game phụ, không phải nguồn tiền chính.'],
  },
  {
    name: 'admin',
    aliases: [],
    category: 'admin',
    summary: 'Nhóm lệnh quản trị dành cho admin.',
    usage: ['m!admin backup', 'm!admin giovang 30 2', '/admin backup', '/admin giovang minutes:30 multiplier:2'],
    examples: ['m!admin backup', 'm!admin taocode MILK2026 1000 5 1 20'],
    notes: ['Chỉ user trong `ADMIN_IDS` dùng được.', '`wipe` cần confirm string để tránh nhầm.'],
  },
  {
    name: 'info',
    aliases: ['information', 'thongtin'],
    category: 'progression',
    summary: 'Tra cứu dữ liệu game theo kiểu list trước, xem chi tiết bằng ID sau.',
    usage: ['m!info', 'm!info <type>', 'm!info <type> <id>', 'm!info <id>', '/info type:<type> id:<id> page:<page>'],
    examples: ['m!info fish', 'm!info fish milk_carp', 'm!info rod_oak', 'm!info map 2'],
    notes: ['Hỗ trợ fish, rod, map, pet, recipe, quest, achievement, season.', 'List chỉ hiện ngắn để không spam channel.'],
  },
  {
    name: 'help',
    aliases: ['trogiup'],
    category: 'progression',
    summary: 'Mở help center hoặc xem chi tiết một lệnh.',
    usage: ['m!help', 'm!help <command>', '/help', '/help command:<command>'],
    examples: ['m!help', 'm!help fish', 'm!help auction'],
    notes: ['Menu đầu đổi category.', 'Menu thứ hai chọn lệnh trong category để xem chi tiết ngay.'],
  },
];

export function findHelpCategory(id: string): HelpCategory {
  return helpCategories.find((category) => category.id === id) ?? helpCategories[0]!;
}

export function findCategoryByQuery(input: string): HelpCategory | undefined {
  const normalized = normalizeHelpQuery(input);
  return helpCategories.find((category) => {
    const keys = [category.id, category.label].map(normalizeHelpQuery);
    return keys.includes(normalized);
  });
}

export function findCommandDetail(input: string): HelpCommandDetail | undefined {
  const normalized = normalizeHelpQuery(input);
  return helpCommandDetails.find((command) => {
    const keys = [command.name, ...command.aliases].map(normalizeHelpQuery);
    return keys.includes(normalized);
  });
}

export function getCommandsForCategory(categoryId: HelpCategoryId): HelpCommandDetail[] {
  if (categoryId === 'home') {
    return ['guide', 'howtoplay', 'fish', 'profile', 'bag', 'sell', 'market', 'team', 'info', 'help']
      .map((name) => findCommandDetail(name))
      .filter((command): command is HelpCommandDetail => Boolean(command));
  }

  if (categoryId === 'start') {
    return ['guide', 'howtoplay', 'profile', 'fish', 'bag', 'sell', 'shop', 'map', 'info', 'help']
      .map((name) => findCommandDetail(name))
      .filter((command): command is HelpCommandDetail => Boolean(command));
  }

  if (categoryId === 'index') {
    return helpCommandDetails;
  }

  return helpCommandDetails.filter((command) => command.category === categoryId);
}

export function normalizeHelpQuery(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^\/+/, '')
    .replace(/^m[!?]/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
