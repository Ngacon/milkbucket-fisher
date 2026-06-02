import {
  applyFishingAction,
  createMiniGameState,
  finishMiniGame,
  renderTensionBar,
} from '../src/systems/fishing/miniGame';

describe('fishing mini-game', () => {
  it('keeps state inside valid bounds', () => {
    let state = createMiniGameState({ difficulty: 80, control: 60, speed: 20, seed: 0.42 });
    for (let i = 0; i < 20; i += 1) {
      state = applyFishingAction(state, i % 2 === 0 ? 'pull' : 'slack');
      expect(state.tension).toBeGreaterThanOrEqual(0);
      expect(state.tension).toBeLessThanOrEqual(100);
      expect(state.progress).toBeGreaterThanOrEqual(0);
      expect(state.progress).toBeLessThanOrEqual(100);
    }
  });

  it('renders a stable tension bar', () => {
    const state = createMiniGameState({ difficulty: 10, control: 100, speed: 20, seed: 0.1 });
    expect(renderTensionBar(state)).toContain('●');
  });

  it('marks high progress as caught', () => {
    const state = createMiniGameState({ difficulty: 10, control: 100, speed: 20, seed: 0.2 });
    const result = finishMiniGame({ ...state, progress: 100, mistakes: 0, perfect: true });
    expect(result.caught).toBe(true);
    expect(result.perfect).toBe(true);
  });
});
