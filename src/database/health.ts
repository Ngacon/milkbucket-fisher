import { prisma } from './prisma';

export async function ensureDatabaseReady(): Promise<void> {
  try {
    const rodCount = await prisma.rod.count();
    const fishCount = await prisma.fish.count();

    if (rodCount === 0 || fishCount === 0) {
      throw new Error('DATABASE_NOT_SEEDED');
    }
  } catch (error) {
    if (isMissingTableError(error)) {
      throw wrapStartupError('DATABASE_NOT_READY', error);
    }
    throw error;
  }
}

function isMissingTableError(error: unknown): boolean {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  const message = error instanceof Error ? error.message : String(error);
  return code === 'P2021' || message.includes('does not exist');
}

function wrapStartupError(message: string, cause: unknown): Error {
  const error = new Error(message);
  Object.assign(error, { cause });
  return error;
}
