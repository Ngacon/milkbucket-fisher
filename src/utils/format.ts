export function formatCoins(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(Math.max(0, Math.floor(value)));
}

export function stars(quality: number): string {
  return '★'.repeat(Math.max(1, Math.min(5, quality)));
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function weightedPick<T>(items: Array<{ item: T; weight: number }>): T {
  const total = items.reduce((sum, entry) => sum + Math.max(0, entry.weight), 0);
  if (total <= 0 || items.length === 0) {
    throw new Error('Cannot pick from an empty weighted list.');
  }
  let roll = Math.random() * total;
  for (const entry of items) {
    roll -= Math.max(0, entry.weight);
    if (roll <= 0) {
      return entry.item;
    }
  }
  return items[items.length - 1]!.item;
}
