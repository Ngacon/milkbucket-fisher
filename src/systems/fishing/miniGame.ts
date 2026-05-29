import { clamp } from '../../utils/format';

export type FishingAction = 'pull' | 'hold' | 'slack';

export type MiniGameState = {
  tension: number;
  progress: number;
  round: number;
  maxRounds: number;
  mistakes: number;
  perfect: boolean;
  difficulty: number;
  control: number;
  seed: number;
  zoneCenter: number;
  zoneWidth: number;
};

export type MiniGameResult = {
  caught: boolean;
  perfect: boolean;
  score: number;
  mistakes: number;
};

export function createMiniGameState(input: {
  difficulty: number;
  control: number;
  speed: number;
  seed?: number;
}): MiniGameState {
  const seed = input.seed ?? Math.random();
  const zoneWidth = clamp(30 + input.control * 0.12 - input.difficulty * 0.05, 12, 40);
  return {
    tension: 50,
    progress: 0,
    round: 0,
    maxRounds: clamp(6 + Math.floor(input.speed / 22), 6, 10),
    mistakes: 0,
    perfect: true,
    difficulty: input.difficulty,
    control: input.control,
    seed,
    zoneCenter: 50,
    zoneWidth,
  };
}

export function renderTensionBar(state: MiniGameState): string {
  const cells = 14;
  const tensionCell = Math.round((state.tension / 100) * (cells - 1));
  const start = Math.floor(((state.zoneCenter - state.zoneWidth / 2) / 100) * cells);
  const end = Math.ceil(((state.zoneCenter + state.zoneWidth / 2) / 100) * cells);
  let out = '';
  for (let i = 0; i < cells; i += 1) {
    if (i === tensionCell) out += '●';
    else if (i >= start && i <= end) out += '▰';
    else out += '▱';
  }
  return out;
}

export function applyFishingAction(state: MiniGameState, action: FishingAction): MiniGameState {
  const nextRound = state.round + 1;
  const wave =
    Math.sin((state.seed * 997 + nextRound * 1.87) % Math.PI) * 14 +
    Math.cos((state.seed * 313 + nextRound * 1.33) % Math.PI) * 9;
  const drift = (state.difficulty - state.control) * 0.09 + wave * (state.difficulty / 260);
  const actionForce = action === 'pull' ? 14 : action === 'slack' ? -13 : 2;
  const tension = clamp(state.tension + actionForce + drift, 0, 100);
  const zoneCenter = clamp(50 + wave, 20, 80);
  const zoneWidth = clamp(state.zoneWidth - state.difficulty * 0.004 + state.control * 0.002, 10, 42);
  const inZone = Math.abs(tension - zoneCenter) <= zoneWidth / 2;
  const progress = clamp(state.progress + (inZone ? 100 / state.maxRounds : -10), 0, 100);
  const mistakes = state.mistakes + (inZone ? 0 : 1);

  return {
    ...state,
    tension,
    zoneCenter,
    zoneWidth,
    progress,
    mistakes,
    perfect: state.perfect && inZone,
    round: nextRound,
  };
}

export function finishMiniGame(state: MiniGameState): MiniGameResult {
  return {
    caught: state.progress >= 70 && state.mistakes < 4,
    perfect: state.perfect && state.progress >= 95,
    score: Math.round(state.progress),
    mistakes: state.mistakes,
  };
}
