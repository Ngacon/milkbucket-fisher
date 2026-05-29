# Milkbucket

Milkbucket là bot game câu cá cho Discord, viết lại từ bản Python cũ sang TypeScript.
Mục tiêu của bản này không phải là nhồi thật nhiều số lớn, mà là tạo một game có chiều sâu: câu cá có mini-game, economy có kiểm soát, nhiều build để thử, có team, market, auction, pet, crafting, season và world boss.

## Trạng Thái Hiện Tại

Đã dựng nền project:

- TypeScript strict mode
- `discord.js` v14, Slash Commands là chính
- Prefix legacy: `m!` và `m?`
- Prisma ORM + PostgreSQL
- Seed data từ JSON, không hard-code cá/cần/map trong file logic TS
- 30 cần câu có identity riêng
- 20 map có biome, weather pattern, secret condition riêng
- 200 cá chia theo habitat/tier/lore
- i18n tiếng Việt/English
- Economy 3 tiền tệ: Coins, Pearls, Milk Drops
- Fishing mini-game dạng tension + button interaction
- Marketplace, auction, team, pet, crafting, season, hardcore mode, admin commands
- Express + EJS dashboard
- Docker + Docker Compose PostgreSQL
- Jest test cơ bản cho logic thuần

## Cài Đặt

Yêu cầu:

- Node.js 20+
- PostgreSQL 16+
- Discord bot token
- Bật **Message Content Intent** trong Discord Developer Portal nếu muốn dùng prefix `m!`/`m?`

Chạy local:

```bash
cp .env.example .env
npm install
npm run setup:db
npm run commands:deploy
npm start
```

Chạy bằng Docker:

```bash
docker compose up --build
```

Dashboard:

```text
http://localhost:3000/?key=YOUR_DASHBOARD_ADMIN_KEY
```

## Environment

Tạo file `.env` từ `.env.example`.

Các biến quan trọng:

- `DISCORD_TOKEN`: token bot Discord
- `DISCORD_CLIENT_ID`: application/client id của bot
- `DISCORD_GUILD_ID`: server test, để trống nếu muốn deploy slash commands global
- `DATABASE_URL`: PostgreSQL connection string
- `ADMIN_IDS`: danh sách Discord user id admin, phân tách bằng dấu phẩy
- `PREFIXES`: mặc định `m!,m?`
- `DEFAULT_LANGUAGE`: `vi` hoặc `en`
- `DASHBOARD_ADMIN_KEY`: key truy cập dashboard
- `MARKET_TAX_RATE`: tax giao dịch, mặc định `0.05`

## Scripts

```bash
npm run dev              # chạy bot bằng tsx watch
npm run build            # generate Prisma Client + build TypeScript strict
npm start                # chạy bot nhanh từ dist, không build/seed lại
npm run start:build      # build rồi chạy bot
npm run start:fresh      # build + db push + seed + chạy bot
npm run start:prod       # chỉ chạy dist, dùng khi DB đã sẵn sàng
npm run commands:deploy  # deploy slash commands
npm run prisma:push      # tạo schema DB nhanh cho local/dev
npm run prisma:migrate   # tạo/chạy migration dev
npm run prisma:deploy    # chạy migration production
npm run seed             # seed rods/maps/fish/pets/quests/configs
npm run setup:db         # prisma db push + seed
npm run lint             # ESLint
npm run format           # Prettier
npm test                 # Jest
```

## Cấu Trúc Project

```text
src/
├── commands/
│   ├── admin/       # admin tools: code, money, ban, reset, backup stats
│   ├── casino/      # casino nhỏ, có giới hạn để không phá economy
│   ├── economy/     # pay, marketplace, auction, giftcode
│   ├── fishing/     # fish, bag, sell, map, shop, rod, craft
│   ├── misc/        # help, language, quests, season, hardcore
│   └── social/      # profile, leaderboard, team, pet
├── dashboard/       # Express + EJS admin dashboard
├── database/        # Prisma client singleton + seed JSON
├── events/          # Discord event handlers
├── i18n/            # translation files
├── systems/         # game/business logic
│   ├── crafting/
│   ├── economy/
│   ├── event/
│   ├── fishing/
│   ├── guild/
│   ├── quest/
│   ├── users/
│   └── weather/
├── types/           # shared TypeScript types
└── utils/           # logger, embeds, formatting, colors

prisma/
└── schema.prisma    # database schema

scripts/
└── registerCommands.ts

tests/
└── *.test.ts
```

## Luồng Chạy Chính

1. `src/index.ts` đọc env, connect Prisma, tạo Discord client, đăng ký events, bật scheduler và dashboard.
2. Slash command được deploy bằng `scripts/registerCommands.ts`.
3. Prefix command đi qua `messageCreate`, dùng chung command registry với slash commands.
4. User mới được tạo qua `getOrCreateUser`, tự nhận cần tre và map đầu tiên.
5. `/fish` tạo encounter theo map/weather/time/bait/rod/pet.
6. Người chơi tương tác button để điều khiển tension.
7. Catch thành công ghi vào `CatchRecord`, cập nhật collection, exp, rod exp, quest, season exp, team score.
8. `/sell` bán cá chưa sold/listed theo market multiplier hiện tại.
9. Scheduler chạy weather rotation, market reset, event cleanup, auction settle, boss spawn, team weekly reset.

## Tư Duy Thiết Kế

### 1. Không Lạm Phát Vô Nghĩa

Bản Python cũ tăng giá bằng `10^26`, `10^100`, làm tiền mất ý nghĩa. Bản mới giữ coin trong khoảng gameplay có thể hiểu được, tối đa meaningful khoảng 1 tỷ.

Chống inflation bằng:

- Tax khi player trade
- Market multiplier theo supply/demand
- Casino có giới hạn cược
- Premium currency không dùng để mua sức mạnh thô
- Cá có giá trị theo quality/size/shiny, không chỉ theo map đắt hơn

### 2. Không Chỉ "Câu -> Bán -> Nâng Cấp"

Mỗi lần câu là một encounter:

- Có thanh tension
- Có nút `Kéo`, `Giữ`, `Thả dây`
- Weather/time/bait thay đổi fish pool
- Rod build ảnh hưởng difficulty/control/speed
- Perfect catch có bonus
- Hardcore mode đổi reward x2 lấy rủi ro mất 50%

### 3. Build Có Ý Nghĩa

Rod không chỉ là số rate lớn hơn. Mỗi cần có:

- Power
- Luck
- Speed
- Passive ability
- Level
- Enchantments
- Prestige count

Các hướng build:

- Power build: dễ kéo cá khó/boss
- Luck build: săn Rare/Legendary/Shiny/Secret
- Speed build: giảm áp lực encounter, hợp farm daily
- Team build: tăng weekly score và buff nhóm
- Pet build: khuếch đại theo companion

### 4. Data-Driven

Cá, cần, map, pet, quest, achievement, season, config được seed từ JSON trong:

```text
src/database/seed-data/
```

Muốn update nội dung game thì sửa JSON rồi chạy:

```bash
npm run seed
```

Không sửa file TS chỉ để thêm cá/map/cần mới.

## Quy Ước Update Nội Dung Game

Khi thêm hoặc sửa data:

1. Không vượt quá 30 rods nếu chưa có lý do thiết kế rõ.
2. Không vượt quá 20 maps nếu map mới chỉ là "đắt hơn".
3. Fish mới phải có habitat, tier, base value, catch rate và lore.
4. Secret fish phải có hint trong lore hoặc secret condition.
5. Giá không dùng exponential vô nghĩa.
6. Nếu thay đổi economy, ghi vào mục "MD Update Log" bên dưới.

## MD Update Log

Ghi lại các thay đổi lớn trong README để dễ theo dõi tư duy phát triển.

Mẫu:

```md
### YYYY-MM-DD - Tên update

- Thêm:
- Sửa:
- Lý do:
- Rủi ro cần test:
```

### 2026-05-29 - TypeScript Rebuild Foundation

- Thêm project TypeScript strict, Discord.js v14, Prisma/PostgreSQL.
- Thêm seed JSON cho 30 rods, 20 maps, 200 fish.
- Thêm fishing mini-game tension, market, auction, team, pet, crafting, season, hardcore, admin, dashboard.
- Lý do: thay bản Python hard-code/JSON-file bằng kiến trúc data-driven, dễ mở rộng và chống lạm phát.
- Rủi ro cần test: migration Prisma, slash command deploy, button interaction timing, auction settle, market multiplier, dashboard auth.

### 2026-05-29 - Help Center + Info Library

- Thêm `m!help` dạng embed có 2 menu: chọn mục và chọn lệnh trong mục; `m!help <lệnh>` vẫn mở đúng detail.
- Thêm `m!info` để list dữ liệu game trước, rồi xem chi tiết bằng ID như `m!info fish milk_carp`.
- Lý do: tách help command khỏi info game data, giúp người chơi đọc lệnh và tra nội dung game không bị rối.
- Rủi ro cần test: select menu hết hạn, slash option `/info`, list page cho fish 200 entries.

## Gameplay Commands

Slash commands chính:

- `/fish`
- `/guide`
- `/howtoplay`
- `/bag`
- `/sell`
- `/map`
- `/shop`
- `/rod`
- `/craft`
- `/profile`
- `/leaderboard`
- `/team`
- `/pet`
- `/market`
- `/auction`
- `/quests`
- `/season`
- `/hardcore`
- `/language`
- `/info`
- `/casino`
- `/code`
- `/admin`

Prefix legacy tương ứng dùng `m!` hoặc `m?`, ví dụ:

```text
m!fish milk_pond crumb_bait
m!howtoplay
m!bag
m!sell
m!team create Sua Chua Club
m!market
m!info fish
m!info milk_carp
```

## Database

Schema chính nằm ở:

```text
prisma/schema.prisma
```

Các nhóm dữ liệu chính:

- User/Profile
- Rod/UserRod
- Map/UserMap/WeatherState
- Fish/UserFish/CatchRecord
- Quest/UserQuest
- Achievement/UserAchievement
- Team/TeamMember
- MarketplaceListing/Auction
- Pet/UserPet
- Season/SeasonProgress
- WorldBoss/BossParticipation
- GiftCode/UserGiftCode
- UserItem
- Config

## Dashboard

Dashboard dùng Express + EJS, dành cho admin xem nhanh:

- Tổng user
- Tổng catches
- Active listings
- Team count
- World boss đang active
- Leaderboard
- Gift code management

Truy cập bằng:

```text
http://localhost:3000/?key=YOUR_DASHBOARD_ADMIN_KEY
```

## Test Plan

Sau khi có Node.js 20+:

```bash
npm install
npm run prisma:generate
npm run build
npm test
npm run lint
```

Test thủ công Discord:

1. Deploy commands bằng `npm run commands:deploy`.
2. Chạy bot bằng `npm run dev`.
3. Test `/help`, `/profile`, `/fish`.
4. Test bait: craft bait rồi `/fish milk_pond crumb_bait`.
5. Test sell: `/bag`, `/sell`.
6. Test market: list fish, mua listing bằng user khác.
7. Test auction: create, bid, đợi scheduler settle.
8. Test admin: `/admin backup`, `/admin giovang`.
9. Test dashboard bằng browser.

## Ghi Chú Triển Khai

Không dùng Flask keep-alive. Deploy bằng một trong các hướng:

- Docker Compose trên VPS
- Railway/Render với PostgreSQL managed database
- PM2/systemd nếu chạy trực tiếp Node trên server

Production nên bật backup PostgreSQL thật bằng managed backup hoặc `pg_dump`, không backup database qua Discord attachment.
