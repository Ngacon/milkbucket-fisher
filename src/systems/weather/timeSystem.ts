export type GameTime = 'Dawn' | 'Day' | 'Dusk' | 'Night' | 'Midnight';

export function getGameTime(now = new Date()): GameTime {
  const hour = now.getUTCHours();
  if (hour >= 4 && hour < 7) return 'Dawn';
  if (hour >= 7 && hour < 17) return 'Day';
  if (hour >= 17 && hour < 20) return 'Dusk';
  if (hour >= 20 || hour < 1) return 'Night';
  return 'Midnight';
}

export function timeMatches(preferred: string[], current: GameTime): boolean {
  return preferred.includes('Any') || preferred.includes(current);
}
