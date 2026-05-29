import { type Language, type Prisma, type User } from '@prisma/client';
import { prisma } from '../../database/prisma';
import { env } from '../../config/env';

const DEFAULT_ROD_ID = 'rod_bamboo';
const DEFAULT_MAP_ID = 'milk_pond';
const USER_CACHE_TTL_MS = 30_000;
const BAN_CACHE_TTL_MS = 10_000;

const userCache = new Map<string, { user: UserWithProfile; expiresAt: number }>();
const banCache = new Map<string, { bannedUntil: Date | null; expiresAt: number }>();

export type UserWithProfile = Prisma.UserGetPayload<{
  include: {
    profile: true;
  };
}>;

export async function getOrCreateUser(discordId: string, username: string): Promise<UserWithProfile> {
  const cached = userCache.get(discordId);
  if (cached && cached.expiresAt > Date.now()) {
    if (cached.user.username !== username) {
      cached.user.username = username;
      void prisma.user.update({ where: { id: cached.user.id }, data: { username } }).catch(() => undefined);
    }
    return cached.user;
  }

  const language = env.DEFAULT_LANGUAGE as Language;
  const existing = await prisma.user.findUnique({
    where: { discordId },
    include: { profile: true },
  });

  if (existing?.profile) {
    const user =
      existing.username === username
        ? existing
        : await prisma.user.update({
            where: { id: existing.id },
            data: { username },
            include: { profile: true },
          });
    rememberUser(discordId, user);
    return user;
  }

  if (existing) {
    await ensureStarterState(existing.id);
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: existing.id },
      include: { profile: true },
    });
    rememberUser(discordId, user);
    return user;
  }

  const user = await prisma.user.create({
    data: {
      discordId,
      username,
      language,
      profile: { create: { currentRodId: DEFAULT_ROD_ID } },
      rods: { create: { rodId: DEFAULT_ROD_ID, isEquipped: true } },
      maps: { create: { mapId: DEFAULT_MAP_ID } },
    },
    include: { profile: true },
  });

  rememberUser(discordId, user);
  return user;
}

export async function ensureStarterState(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.profile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        currentRodId: DEFAULT_ROD_ID,
      },
    }),
    prisma.userRod.upsert({
      where: { userId_rodId: { userId, rodId: DEFAULT_ROD_ID } },
      update: { isEquipped: true },
      create: {
        userId,
        rodId: DEFAULT_ROD_ID,
        isEquipped: true,
      },
    }),
    prisma.userMap.upsert({
      where: { userId_mapId: { userId, mapId: DEFAULT_MAP_ID } },
      update: {},
      create: {
        userId,
        mapId: DEFAULT_MAP_ID,
      },
    }),
  ]);
}

export async function setLanguage(user: User, language: Language): Promise<User> {
  invalidateUserCache(user.discordId);
  return prisma.user.update({
    where: { id: user.id },
    data: { language },
  });
}

export async function getBannedUntil(discordId: string): Promise<Date | null> {
  const cached = banCache.get(discordId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.bannedUntil;
  }

  const user = await prisma.user.findUnique({
    where: { discordId },
    select: { bannedUntil: true },
  });
  const bannedUntil = user?.bannedUntil ?? null;
  banCache.set(discordId, { bannedUntil, expiresAt: Date.now() + BAN_CACHE_TTL_MS });
  return bannedUntil;
}

export function invalidateUserCache(discordId: string): void {
  userCache.delete(discordId);
  banCache.delete(discordId);
}

export async function isAdmin(discordId: string): Promise<boolean> {
  return env.ADMIN_IDS.includes(discordId);
}

function rememberUser(discordId: string, user: UserWithProfile): void {
  userCache.set(discordId, { user, expiresAt: Date.now() + USER_CACHE_TTL_MS });
}
