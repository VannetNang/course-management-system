import dotenv from 'dotenv';

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  database_url: string;
  jwt_secret: string;
  jwt_expire: string;
  cloudinary_name: string;
  cloudinary_key: string;
  cloudinary_secret: string;
  r2_account_id: string;
  r2_access_key_id: string;
  r2_secret_access_key: string;
  r2_public_url: string;
  r2_bucket_name: string;
  bakong_token: string;
  bakong_account_id: string;
  bakong_merchant_name: string;
  bakong_merchant_city: string;
  bakong_store_label: string;
  bakong_terminal_label: string;
  redis_expiration: number;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  database_url: process.env.DATABASE_URL || '',
  jwt_secret: process.env.JWT_SECRET || '',
  jwt_expire: process.env.JWT_EXPIRES_IN || '3d',
  cloudinary_name: process.env.CLOUDINARY_NAME || '',
  cloudinary_key: process.env.CLOUDINARY_API_KEY || '',
  cloudinary_secret: process.env.CLOUDINARY_API_SECRET || '',
  r2_account_id: process.env.R2_ACCOUNT_ID || '',
  r2_access_key_id: process.env.R2_ACCESS_KEY_ID || '',
  r2_secret_access_key: process.env.R2_SECRET_ACCESS_KEY || '',
  r2_public_url: process.env.R2_PUBLIC_URL || '',
  r2_bucket_name: process.env.R2_BUCKET_NAME || '',
  bakong_token: process.env.BAKONG_TOKEN || '',
  bakong_account_id: process.env.BAKONG_ACCOUNT_ID || '',
  bakong_merchant_name: process.env.BAKONG_MERCHANT_NAME || '',
  bakong_merchant_city: process.env.BAKONG_MERCHANT_CITY || '',
  bakong_store_label: process.env.BAKONG_STORE_LABEL || '',
  bakong_terminal_label: process.env.BAKONG_TERMINAL_LABEL || '',
  redis_expiration: Number(process.env.REDIS_EXPIRATION) || 6000,
};

export default config;
