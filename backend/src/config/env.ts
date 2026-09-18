import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://packcheck:packcheck_password@localhost:5432/packcheck_db?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'packcheck_jwt_secret_dev_key_2025_secure',
  EXTERNAL_PRODUCT_API_URL: process.env.EXTERNAL_PRODUCT_API_URL || 'https://world.openfoodfacts.org/api/v2',
  EXTERNAL_PRODUCT_API_KEY: process.env.EXTERNAL_PRODUCT_API_KEY || '',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173'
};
