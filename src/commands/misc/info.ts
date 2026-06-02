import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../types/command';
import {
  getCatalogAchievements,
  getCatalogFish,
  getCatalogMaps,
  getCatalogPets,
  getCatalogQuests,
  getCatalogRods,
  getCatalogSeasons,
} from '../../database/catalogCache';
import { listRecipes, type Recipe } from '../../systems/crafting/craftingService';
import { colors } from '../../utils/colors';
import { formatCoins } from '../../utils/format';

type InfoTopic =
  | 'fish'
  | 'rod'
  | 'map'
  | 'pet'
  | 'recipe'
  | 'quest'
  | 'achievement'
  | 'season';

type InfoTopicMeta = {
  id: InfoTopic;
  label: string;
  emoji: string;
  aliases: string[];
  color: number;
  listHint: string;
};

const PAGE_SIZE = 12;

const topics: InfoTopicMeta[] = [
  {
    id: 'fish',
    label: 'Cá',
    emoji: '🐟',
    aliases: ['fish', 'ca', 'cá'],
    color: colors.sky,
    listHint: 'm!info fish 2',
  },
  {
    id: 'rod',
    label: 'Cần câu',
    emoji: '🎣',
    aliases: ['rod', 'can', 'cần'],
    color: colors.cream,
    listHint: 'm!info rod',
  },
  {
    id: 'map',
    label: 'Map',
    emoji: '🗺️',
    aliases: ['map', 'maps'],
    color: colors.mint,
    listHint: 'm!info map',
  },
  {
    id: 'pet',
    label: 'Pet',
    emoji: '🐾',
    aliases: ['pet', 'thu', 'thú'],
    color: colors.strawberry,
    listHint: 'm!info pet',
  },
  {
    id: 'recipe',
    label: 'Recipe',
    emoji: '🧪',
    aliases: ['recipe', 'recipes', 'craft', 'bait'],
    color: colors.mint,
    listHint: 'm!info recipe',
  },
  {
    id: 'quest',
    label: 'Quest',
    emoji: '📜',
    aliases: ['quest', 'quests', 'nhiemvu'],
    color: colors.warning,
    listHint: 'm!info quest',
  },
  {
    id: 'achievement',
    label: 'Achievement',
    emoji: '🏆',
    aliases: ['achievement', 'achievements', 'ach', 'thanhtuu'],
    color: colors.warning,
    listHint: 'm!info achievement',
  },
  {
    id: 'season',
    label: 'Season',
    emoji: '🎟️',
    aliases: ['season', 'battlepass'],
    color: colors.strawberry,
    listHint: 'm!info season',
  },
];

export const infoCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Browse Milkbucket game data by list first, then inspect details.')
    .addStringOption((option) =>
      option
        .setName('type')
        .setDescription('Data type')
        .setRequired(false)
        .addChoices(
          { name: 'fish', value: 'fish' },
          { name: 'rod', value: 'rod' },
          { name: 'map', value: 'map' },
          { name: 'pet', value: 'pet' },
          { name: 'recipe', value: 'recipe' },
          { name: 'quest', value: 'quest' },
          { name: 'achievement', value: 'achievement' },
          { name: 'season', value: 'season' },
        ),
    )
    .addStringOption((option) =>
      option.setName('id').setDescription('Item id, e.g. milk_carp, rod_oak, milk_pond').setRequired(false),
    )
    .addIntegerOption((option) =>
      option.setName('page').setDescription('List page').setRequired(false).setMinValue(1),
  ),
  prefixAliases: ['info', 'information', 'infomation', 'thongtin'],
  skipBanCheck: true,
  execute: async (interaction) => {
    const topic = parseTopic(interaction.options.getString('type') ?? undefined);
    const id = interaction.options.getString('id') ?? undefined;
    const page = interaction.options.getInteger('page') ?? 1;
    await interaction.reply({ embeds: [await renderInfo(topic, id, page)] });
  },
  executePrefix: async (message, args) => {
    const parsed = parsePrefixArgs(args);
    await message.reply({ embeds: [await renderInfo(parsed.topic, parsed.id, parsed.page)] });
  },
};

async function renderInfo(
  topic: InfoTopic | undefined,
  id: string | undefined,
  page: number,
): Promise<EmbedBuilder> {
  if (!topic && !id) {
    return renderOverview();
  }

  if (topic && !id) {
    return renderList(topic, page);
  }

  if (topic && id) {
    return renderDetail(topic, id);
  }

  const auto = await renderAutoDetail(id!);
  return auto ?? renderNotFound(id!);
}

function parsePrefixArgs(args: string[]): { topic?: InfoTopic; id?: string; page: number } {
  const [first, second, third] = args;
  if (!first) return { page: 1 };

  const topic = parseTopic(first);
  if (!topic) {
    return { id: first, page: Number(second) || 1 };
  }

  if (!second) return { topic, page: 1 };
  if (/^\d+$/.test(second)) return { topic, page: Number(second) };

  return { topic, id: second, page: Number(third) || 1 };
}

function parseTopic(input: string | undefined): InfoTopic | undefined {
  if (!input) return undefined;
  const normalized = normalize(input);
  return topics.find((topic) => topic.aliases.map(normalize).includes(normalized))?.id;
}

function renderOverview(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(colors.milk)
    .setAuthor({ name: 'Milkbucket Info Library' })
    .setTitle('🥛 Info Library')
    .setDescription(
      [
        'Lệnh này chỉ list trước cho gọn. Muốn xem chi tiết thì gọi bằng ID.',
        '',
        '`m!info fish` -> list cá',
        '`m!info milk_carp` -> chi tiết cá',
        '`m!info rod rod_oak` -> chi tiết cần',
      ].join('\n'),
    )
    .addFields(
      topics.map((topic) => ({
        name: `${topic.emoji} ${topic.label}`,
        value: `List: \`${topic.listHint}\``,
        inline: true,
      })),
    )
    .setFooter({ text: 'Tip: dùng ID trong list để xem detail, ví dụ m!info fish milk_carp' })
    .setTimestamp();
}

async function renderList(topic: InfoTopic, page: number): Promise<EmbedBuilder> {
  switch (topic) {
    case 'fish':
      return renderFishList(page);
    case 'rod':
      return renderRodList(page);
    case 'map':
      return renderMapList(page);
    case 'pet':
      return renderPetList(page);
    case 'recipe':
      return renderRecipeList(page);
    case 'quest':
      return renderQuestList(page);
    case 'achievement':
      return renderAchievementList(page);
    case 'season':
      return renderSeasonList(page);
  }
}

async function renderDetail(topic: InfoTopic, id: string): Promise<EmbedBuilder> {
  switch (topic) {
    case 'fish':
      return (await renderFishDetail(id)) ?? renderNotFound(id);
    case 'rod':
      return (await renderRodDetail(id)) ?? renderNotFound(id);
    case 'map':
      return (await renderMapDetail(id)) ?? renderNotFound(id);
    case 'pet':
      return (await renderPetDetail(id)) ?? renderNotFound(id);
    case 'recipe':
      return renderRecipeDetail(id) ?? renderNotFound(id);
    case 'quest':
      return (await renderQuestDetail(id)) ?? renderNotFound(id);
    case 'achievement':
      return (await renderAchievementDetail(id)) ?? renderNotFound(id);
    case 'season':
      return (await renderSeasonDetail(id)) ?? renderNotFound(id);
  }
}

async function renderAutoDetail(id: string): Promise<EmbedBuilder | null> {
  const recipe = renderRecipeDetail(id);
  if (recipe) return recipe;

  const [fish, rod, map, pet, quest, achievement, season] = await Promise.all([
    renderFishDetail(id),
    renderRodDetail(id),
    renderMapDetail(id),
    renderPetDetail(id),
    renderQuestDetail(id),
    renderAchievementDetail(id),
    renderSeasonDetail(id),
  ]);

  return fish ?? rod ?? map ?? pet ?? quest ?? achievement ?? season;
}

async function renderFishList(page: number): Promise<EmbedBuilder> {
  const allFish = await getCatalogFish();
  const total = allFish.length;
  const safePage = clampPage(page, total);
  const fish = allFish.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return listEmbed('fish', safePage, total)
    .setDescription(fish.map((entry) => `\`${entry.id}\` **${entry.name}** | ${entry.tier} | ${formatCoins(entry.baseValue)} coins`).join('\n'))
    .setFooter({ text: 'Chi tiết: m!info fish <id> hoặc m!info <id>' });
}

async function renderRodList(page: number): Promise<EmbedBuilder> {
  const allRods = await getCatalogRods();
  const total = allRods.length;
  const safePage = clampPage(page, total);
  const rods = allRods.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return listEmbed('rod', safePage, total)
    .setDescription(
      rods
        .map((rod) => `\`${rod.id}\` **${rod.name}** | P${rod.power}/L${rod.luck}/S${rod.speed} | ${formatCoins(rod.price)}`)
        .join('\n'),
    )
    .setFooter({ text: 'Chi tiết: m!info rod <id> hoặc m!info <id>' });
}

async function renderMapList(page: number): Promise<EmbedBuilder> {
  const allMaps = await getCatalogMaps();
  const total = allMaps.length;
  const safePage = clampPage(page, total);
  const maps = allMaps.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return listEmbed('map', safePage, total)
    .setDescription(
      maps
        .map((map) => `\`${map.id}\` **${map.name}** | ${map.biome} | diff ${map.difficulty} | ${formatCoins(map.price)}`)
        .join('\n'),
    )
    .setFooter({ text: 'Chi tiết: m!info map <id> hoặc m!info <id>' });
}

async function renderPetList(page: number): Promise<EmbedBuilder> {
  const allPets = await getCatalogPets();
  const total = allPets.length;
  const safePage = clampPage(page, total);
  const pets = allPets.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return listEmbed('pet', safePage, total)
    .setDescription(pets.map((pet) => `\`${pet.id}\` **${pet.name}** | ${pet.type} | ${pet.rarity}`).join('\n'))
    .setFooter({ text: 'Chi tiết: m!info pet <id> hoặc m!info <id>' });
}

function renderRecipeList(page: number): EmbedBuilder {
  const recipes = listRecipes();
  const total = recipes.length;
  const safePage = clampPage(page, total);
  const items = recipes.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return listEmbed('recipe', safePage, total)
    .setDescription(
      items
        .map((recipe) => `\`${recipe.id}\` **${recipe.name}** -> ${recipe.outputItem} x${recipe.outputQuantity} | ${formatCoins(recipe.coins)} coins`)
        .join('\n'),
    )
    .setFooter({ text: 'Chi tiết: m!info recipe <id> hoặc m!info <id>' });
}

async function renderQuestList(page: number): Promise<EmbedBuilder> {
  const allQuests = await getCatalogQuests();
  const total = allQuests.length;
  const safePage = clampPage(page, total);
  const quests = allQuests.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return listEmbed('quest', safePage, total)
    .setDescription(quests.map((quest) => `\`${quest.id}\` **${quest.type}**`).join('\n'))
    .setFooter({ text: 'Chi tiết: m!info quest <id> hoặc m!info <id>' });
}

async function renderAchievementList(page: number): Promise<EmbedBuilder> {
  const allAchievements = await getCatalogAchievements();
  const total = allAchievements.length;
  const safePage = clampPage(page, total);
  const achievements = allAchievements.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return listEmbed('achievement', safePage, total)
    .setDescription(achievements.map((achievement) => `\`${achievement.id}\` **${achievement.name}**`).join('\n'))
    .setFooter({ text: 'Chi tiết: m!info achievement <id> hoặc m!info <id>' });
}

async function renderSeasonList(page: number): Promise<EmbedBuilder> {
  const allSeasons = await getCatalogSeasons();
  const total = allSeasons.length;
  const safePage = clampPage(page, total);
  const seasons = allSeasons.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return listEmbed('season', safePage, total)
    .setDescription(
      seasons
        .map((season) => `\`${season.id}\` **${season.name}** | ${season.active ? 'active' : 'inactive'} | ${season.theme}`)
        .join('\n'),
    )
    .setFooter({ text: 'Chi tiết: m!info season <id> hoặc m!info <id>' });
}

async function renderFishDetail(id: string): Promise<EmbedBuilder | null> {
  const fish = (await getCatalogFish()).find((entry) => entry.id === id);
  if (!fish) return null;
  const topic = topicMeta('fish');
  return detailEmbed(topic, fish.name, fish.id)
    .setDescription(fish.lore)
    .addFields(
      { name: 'Tier', value: fish.tier, inline: true },
      { name: 'Base value', value: `${formatCoins(fish.baseValue)} coins`, inline: true },
      { name: 'Catch rate', value: String(fish.catchRate), inline: true },
      { name: 'Habitat', value: formatArray(fish.habitat), inline: false },
      { name: 'Weather', value: formatArray(fish.preferredWeather), inline: true },
      { name: 'Time', value: formatArray(fish.preferredTime), inline: true },
      { name: 'Bait', value: formatArray(fish.preferredBait), inline: true },
    );
}

async function renderRodDetail(id: string): Promise<EmbedBuilder | null> {
  const rod = (await getCatalogRods()).find((entry) => entry.id === id);
  if (!rod) return null;
  const topic = topicMeta('rod');
  return detailEmbed(topic, rod.name, rod.id).addFields(
    { name: 'Stats', value: `Power **${rod.power}** | Luck **${rod.luck}** | Speed **${rod.speed}**`, inline: false },
    { name: 'Max level', value: String(rod.maxLevel), inline: true },
    { name: 'Price', value: `${formatCoins(rod.price)} coins`, inline: true },
    { name: 'Ability', value: formatJson(rod.ability), inline: false },
  );
}

async function renderMapDetail(id: string): Promise<EmbedBuilder | null> {
  const map = (await getCatalogMaps()).find((entry) => entry.id === id);
  if (!map) return null;
  const topic = topicMeta('map');
  return detailEmbed(topic, map.name, map.id).addFields(
    { name: 'Biome', value: map.biome, inline: true },
    { name: 'Difficulty', value: String(map.difficulty), inline: true },
    { name: 'Price', value: `${formatCoins(map.price)} coins`, inline: true },
    { name: 'Current weather', value: map.weatherState?.currentWeather ?? 'unknown', inline: true },
    { name: 'Next weather change', value: map.weatherState ? `<t:${Math.floor(map.weatherState.nextChangeAt.getTime() / 1000)}:R>` : 'unknown', inline: true },
    { name: 'Weather pattern', value: formatJson(map.weatherPattern), inline: false },
    { name: 'Secret spot condition', value: formatJson(map.secretSpotCondition), inline: false },
  );
}

async function renderPetDetail(id: string): Promise<EmbedBuilder | null> {
  const pet = (await getCatalogPets()).find((entry) => entry.id === id);
  if (!pet) return null;
  const topic = topicMeta('pet');
  return detailEmbed(topic, pet.name, pet.id).addFields(
    { name: 'Type', value: pet.type, inline: true },
    { name: 'Rarity', value: pet.rarity, inline: true },
    { name: 'Ability', value: formatJson(pet.ability), inline: false },
  );
}

function renderRecipeDetail(id: string): EmbedBuilder | null {
  const recipe = listRecipes().find((entry) => entry.id === id);
  if (!recipe) return null;
  const topic = topicMeta('recipe');
  return detailEmbed(topic, recipe.name, recipe.id).addFields(
    { name: 'Output', value: `\`${recipe.outputItem}\` x${recipe.outputQuantity}`, inline: true },
    { name: 'Coin cost', value: `${formatCoins(recipe.coins)} coins`, inline: true },
    { name: 'Ingredients', value: formatIngredients(recipe), inline: false },
  );
}

async function renderQuestDetail(id: string): Promise<EmbedBuilder | null> {
  const quest = (await getCatalogQuests()).find((entry) => entry.id === id);
  if (!quest) return null;
  const topic = topicMeta('quest');
  return detailEmbed(topic, quest.id, quest.id).addFields(
    { name: 'Type', value: quest.type, inline: true },
    { name: 'Requirement', value: formatJson(quest.requirement), inline: false },
    { name: 'Reward', value: formatJson(quest.reward), inline: false },
  );
}

async function renderAchievementDetail(id: string): Promise<EmbedBuilder | null> {
  const achievement = (await getCatalogAchievements()).find((entry) => entry.id === id);
  if (!achievement) return null;
  const topic = topicMeta('achievement');
  return detailEmbed(topic, achievement.name, achievement.id)
    .setDescription(achievement.description)
    .addFields(
      { name: 'Tiers', value: formatJson(achievement.tiers), inline: false },
      { name: 'Rewards', value: formatJson(achievement.rewards), inline: false },
    );
}

async function renderSeasonDetail(id: string): Promise<EmbedBuilder | null> {
  const season = (await getCatalogSeasons()).find((entry) => entry.id === id);
  if (!season) return null;
  const topic = topicMeta('season');
  return detailEmbed(topic, season.name, season.id)
    .setDescription(season.theme)
    .addFields(
      { name: 'Active', value: season.active ? 'yes' : 'no', inline: true },
      { name: 'Start', value: `<t:${Math.floor(season.startDate.getTime() / 1000)}:D>`, inline: true },
      { name: 'End', value: `<t:${Math.floor(season.endDate.getTime() / 1000)}:D>`, inline: true },
    );
}

function listEmbed(topic: InfoTopic, page: number, total: number): EmbedBuilder {
  const meta = topicMeta(topic);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return new EmbedBuilder()
    .setColor(meta.color)
    .setAuthor({ name: 'Milkbucket Info Library' })
    .setTitle(`${meta.emoji} ${meta.label} - List`)
    .setFooter({ text: `Trang ${page}/${totalPages} | Chỉ list ngắn. Dùng m!info <id> để xem chi tiết.` })
    .setTimestamp();
}

function detailEmbed(topic: InfoTopicMeta, title: string, id: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(topic.color)
    .setAuthor({ name: `Milkbucket Info - ${topic.label}` })
    .setTitle(`${topic.emoji} ${title}`)
    .addFields({ name: 'ID', value: `\`${id}\``, inline: false })
    .setFooter({ text: `List cùng loại: m!info ${topic.id}` })
    .setTimestamp();
}

function renderNotFound(id: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(colors.warning)
    .setTitle('Không tìm thấy info')
    .setDescription(`Không có dữ liệu với ID hoặc mục \`${id}\`.`)
    .addFields(
      { name: 'Cách dùng', value: '`m!info` để xem nhóm.\n`m!info fish` để list cá.\n`m!info fish milk_carp` để xem chi tiết.' },
      { name: 'Nhóm có sẵn', value: topics.map((topic) => `\`${topic.id}\``).join(' ') },
    );
}

function topicMeta(topic: InfoTopic): InfoTopicMeta {
  return topics.find((entry) => entry.id === topic)!;
}

function clampPage(page: number, total: number): number {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return Math.min(Math.max(1, Math.floor(page || 1)), totalPages);
}

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatArray(values: string[]): string {
  return values.length ? values.map((value) => `\`${value}\``).join(' ') : '`none`';
}

function formatJson(value: unknown): string {
  if (!value) return '`none`';
  if (typeof value === 'object') {
    const text = JSON.stringify(value, null, 2);
    return `\`\`\`json\n${text.slice(0, 900)}\n\`\`\``;
  }
  return `\`${String(value)}\``;
}

function formatIngredients(recipe: Recipe): string {
  if (recipe.ingredients.length === 0) return '`none`';
  return recipe.ingredients
    .map((ingredient) => `• ${ingredient.type} \`${ingredient.id}\` x${ingredient.quantity}`)
    .join('\n');
}
