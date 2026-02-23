import 'dotenv/config';

export const config = {
  PORT: Number(process.env.PORT ?? 3333),
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
  LOG_LEVEL: process.env.LOG_LEVEL ?? 'info',
  INTEGRATION_USER: process.env.INTEGRATION_USER ?? 'Assist',
  INTEGRATION_PASSWORD: process.env.INTEGRATION_PASSWORD ?? 'Assist2013'
};
