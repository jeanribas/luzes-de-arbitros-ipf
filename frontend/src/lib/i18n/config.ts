export const APP_LOCALES = ['pt-BR', 'en-US', 'es-ES'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = 'pt-BR';
