import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DISCORD_TOKEN: z.string().min(1),
  DISCORD_CLIENT_ID: z.string().min(1),
  DISCORD_GUILD_ID: z.string().optional().default(''),
  DATABASE_URL: z.string().min(1),
  ADMIN_IDS: z
    .string()
    .optional()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  PREFIXES: z
    .string()
    .optional()
    .default('m!,m?')
    .transform((value) =>
      value
        .split(',')
        .map((prefix) => prefix.trim())
        .filter(Boolean),
    ),
  DEFAULT_LANGUAGE: z.enum(['vi', 'en']).optional().default('vi'),
  LOG_LEVEL: z.string().optional().default('info'),
  DASHBOARD_PORT: z.coerce.number().optional().default(3000),
  DASHBOARD_ADMIN_KEY: z.string().optional().default('change_me'),
  MARKET_TAX_RATE: z.coerce.number().min(0).max(0.25).optional().default(0.05),
  NODE_ENV: z.string().optional().default('development'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const missing = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  console.error(
    [
      'Milkbucket cannot start because required environment variables are missing or invalid.',
      '',
      missing,
      '',
      'Create a .env file from .env.example and fill these values:',
      '  cp .env.example .env',
      '  DISCORD_TOKEN=...',
      '  DISCORD_CLIENT_ID=...',
      '  DATABASE_URL=...',
    ].join('\n'),
  );
  process.exit(1);
}

export const env = parsedEnv.data;
export type AppEnv = typeof env;
