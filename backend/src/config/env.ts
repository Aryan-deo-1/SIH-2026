import dotenv from 'dotenv';
dotenv.config();

const parsePort = (portVal?: string): number => {
  const parsed = Number(portVal);
  return !isNaN(parsed) && parsed > 0 ? parsed : 5000;
};

export const ENV = {
  PORT: parsePort(process.env.PORT),
  HOST: '0.0.0.0',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://packcheck:packcheck_password@localhost:5432/packcheck_db?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'packcheck_jwt_secret_dev_key_2025_secure',
  EXTERNAL_PRODUCT_API_URL: process.env.EXTERNAL_PRODUCT_API_URL || 'https://world.openfoodfacts.org/api/v2',
  EXTERNAL_PRODUCT_API_KEY: process.env.EXTERNAL_PRODUCT_API_KEY || '',
  CLIENT_URL: process.env.CLIENT_URL || 'https://packchecking.netlify.app',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4o-mini'
};
