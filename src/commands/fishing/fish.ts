import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
  SlashCommandBuilder,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type Message,
} from 'discord.js';
import type { Command } from '../../types/command';
import { getOrCreateUser } from '../../systems/users/userService';
import { applyHardcoreFailure, createEncounter, recordCatch } from '../../systems/fishing/fishingService';
import {
  applyFishingAction,
  createMiniGameState,
  finishMiniGame,
  renderTensionBar,
  type FishingAction,
  type MiniGameState,
} from '../../systems/fishing/miniGame';
import { sendCommandReply, disabledButtons } from '../../utils/discord';
import { colors } from '../../utils/colors';
import { stars } from '../../utils/format';
import { t } from '../../i18n';
import { damageActiveBoss } from '../../systems/event/eventService';
import { consumeBait } from '../../systems/crafting/craftingService';

const actionIds: Record<FishingAction, string> = {
  pull: 'fish_pull',
  hold: 'fish_hold',
  slack: 'fish_slack',
};

const TURN_TIMEOUT_MS = 12_000;
const GAME_TIMEOUT_MS = 120_000;

export const fishCommand: Command = {
  data: new SlashCommandBuilder()
    .setName('fish')
    .setDescription('Start a tactical fishing encounter.')
    .addStringOption((option) =>
      option.setName('map').setDescription('Map id, e.g. milk_pond').setRequired(false),
    )
    .addStringOption((option) =>
      option.setName('bait').setDescription('Optional bait id').setRequired(false),
    ),
  prefixAliases: ['fish', 'cau', 'câu'],
  execute: async (interaction) => {
    const mapId = interaction.options.getString('map') ?? 'milk_pond';
    const bait = interaction.options.getString('bait') ?? undefined;
    await interaction.reply('Đang thả cần...');
    await runFishing(interaction, mapId, bait);
  },
  executePrefix: async (message, args) => {
    await runFishing(message, args[0] ?? 'milk_pond', args[1]);
  },
};

async function runFishing(
  target: ChatInputCommandInteraction | Message,
  mapId: string,
  bait?: string,
): Promise<void> {
  const actor = 'user' in target ? target.user : target.author;
  const user = await getOrCreateUser(actor.id, actor.username);
  const encounter = await createEncounter({ user, mapId, bait });
  await consumeBait(user.id, bait);
  let state = createMiniGameState({
    difficulty: encounter.difficulty,
    control: encounter.control,
    speed: encounter.speed,
  });

  const message = await sendCommandReply(target, {
    embeds: [renderEncounterEmbed(user.language, encounter.map.name, encounter.weather, state)],
    components: [actionRow(user.language)],
  });

  state = await playMiniGame(message, actor.id, user.language, encounter.map.name, encounter.weather, state);

  const result = finishMiniGame(state);
  await message.edit({
    embeds: [renderEncounterEmbed(user.language, encounter.map.name, encounter.weather, state)],
    components: [disabledButtons()],
  });

  if (!result.caught) {
    const hardcorePenalty = await applyHardcoreFailure(user.id);
    await message.edit({
      embeds: [
        new EmbedBuilder()
          .setColor(colors.danger)
          .setTitle('Milkbucket')
          .setDescription(`${t(user.language, 'fishing.failed')}${hardcorePenalty ? '\nHardcore penalty: mất 50% coins/pearls.' : ''}`),
      ],
      components: [disabledButtons()],
    });
    return;
  }

  const catchResult = await recordCatch(user.id, encounter.fish, result.perfect, result.score);
  await damageActiveBoss(user.id, Math.round(catchResult.value / 60 + result.score * 4));
  await message.edit({
    embeds: [
      new EmbedBuilder()
        .setColor(catchResult.shiny ? colors.strawberry : colors.mint)
        .setTitle(result.perfect ? `🥛${t(user.language, 'fishing.perfect')}` : '🥛 Milkbucket Catch')
        .setDescription(
          t(user.language, 'fishing.caught', {
            fish: catchResult.fish.name,
            stars: stars(catchResult.quality),
            size: catchResult.size,
            value: catchResult.value,
            shiny: catchResult.shiny ? t(user.language, 'fishing.shiny') : '',
          }),
        )
        .addFields(
          { name: 'Weather', value: encounter.weather, inline: true },
          { name: 'Time', value: encounter.time, inline: true },
          { name: 'Pearls', value: String(catchResult.pearls), inline: true },
        ),
    ],
    components: [disabledButtons()],
  });
}

function actionRow(language: string): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(actionIds.pull)
      .setLabel(t(language, 'fishing.buttons.pull'))
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(actionIds.hold)
      .setLabel(t(language, 'fishing.buttons.hold'))
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(actionIds.slack)
      .setLabel(t(language, 'fishing.buttons.slack'))
      .setStyle(ButtonStyle.Success),
  );
}

async function playMiniGame(
  message: Message,
  userId: string,
  language: string,
  mapName: string,
  weather: string,
  initialState: MiniGameState,
): Promise<MiniGameState> {
  return new Promise((resolve) => {
    let state = initialState;
    let finished = false;
    let busy = false;
    let idleTimer: NodeJS.Timeout | undefined;

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: GAME_TIMEOUT_MS,
      filter: (component) => Object.values(actionIds).includes(component.customId),
    });

    const clearIdle = (): void => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = undefined;
    };

    const isDone = (): boolean => state.round >= state.maxRounds || state.progress >= 100 || state.mistakes >= 4;

    const finish = (stopCollector = true): void => {
      if (finished) return;
      finished = true;
      clearIdle();
      if (stopCollector) collector.stop('finished');
      resolve(state);
    };

    const scheduleIdle = (): void => {
      clearIdle();
      idleTimer = setTimeout(() => {
        void step('hold');
      }, TURN_TIMEOUT_MS);
    };

    const step = async (action: FishingAction): Promise<void> => {
      if (finished || busy) return;
      busy = true;
      clearIdle();
      state = applyFishingAction(state, action);
      await message
        .edit({
          embeds: [renderEncounterEmbed(language, mapName, weather, state)],
          components: [actionRow(language)],
        })
        .catch(() => undefined);
      busy = false;

      if (isDone()) {
        finish();
        return;
      }

      scheduleIdle();
    };

    const handleClick = async (interaction: ButtonInteraction): Promise<void> => {
      if (interaction.user.id !== userId) {
        await interaction
          .reply({
            content: 'Cần này không phải của bạn. Gõ `m!fish` để tự thả cần nhé.',
            ephemeral: true,
          })
          .catch(() => undefined);
        return;
      }

      await interaction.deferUpdate().catch(() => undefined);
      const action = actionFromCustomId(interaction.customId);
      await step(action);
    };

    collector.on('collect', (interaction) => {
      void handleClick(interaction);
    });

    collector.on('end', () => {
      if (!finished) {
        finish(false);
      }
    });

    scheduleIdle();
  });
}

function actionFromCustomId(customId: string): FishingAction {
  const match = Object.entries(actionIds).find(([, id]) => id === customId);
  return (match?.[0] as FishingAction | undefined) ?? 'hold';
}

function renderEncounterEmbed(
  language: string,
  mapName: string,
  weather: string,
  state: MiniGameState,
): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(colors.cream)
    .setTitle('🥛 Fishing Encounter')
    .setDescription(
      [
        t(language, 'fishing.start', { map: mapName }),
        '',
        renderTensionBar(state),
        '',
        guideText(language),
      ].join('\n'),
    )
    .addFields(
      { name: label(language, 'Weather', 'Thời tiết'), value: weather, inline: true },
      { name: label(language, 'Progress', 'Tiến độ'), value: `${Math.round(state.progress)}%`, inline: true },
      { name: label(language, 'Mistakes', 'Lỗi'), value: `${state.mistakes}/4`, inline: true },
      {
        name: label(language, 'Buttons', 'Nút bấm'),
        value: buttonGuide(language),
      },
      {
        name: label(language, 'Round', 'Lượt'),
        value: `${state.round}/${state.maxRounds} | Auto ${t(language, 'fishing.buttons.hold')} sau ${TURN_TIMEOUT_MS / 1000}s nếu không bấm.`,
        inline: false,
      },
    )
    .setFooter({ text: 'Tip: m!help fish | m!help start' });
}

function guideText(language: string): string {
  if (language === 'en') {
    return '`●` is your line tension. Keep it inside the green `▰` zone until progress reaches 70%+.';
  }
  return '`●` là độ căng dây. Giữ nó nằm trong vùng xanh `▰` tới khi tiến độ đạt 70% trở lên.';
}

function buttonGuide(language: string): string {
  if (language === 'en') {
    return '`Pull` raises tension | `Hold` nudges it | `Slack` lowers tension';
  }
  return '`Kéo` tăng căng dây | `Giữ` tăng nhẹ | `Thả dây` giảm căng dây';
}

function label(language: string, en: string, vi: string): string {
  return language === 'en' ? en : vi;
}
