import i18next from 'i18next';
import en from './locales/en.json';
import vi from './locales/vi.json';
import { env } from '../config/env';

void i18next.init({
  lng: env.DEFAULT_LANGUAGE,
  fallbackLng: 'vi',
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  interpolation: {
    escapeValue: false,
  },
});

export function t(language: string | null | undefined, key: string, values?: Record<string, unknown>): string {
  return i18next.t(key, { lng: language ?? env.DEFAULT_LANGUAGE, ...values });
}
