import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 3000,
  mongoose: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/educanexo360',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'tu_jwt_secret_muy_seguro',
    accessExpirationMinutes: process.env.JWT_ACCESS_EXPIRATION_MINUTES || '30m',
    refreshExpirationDays: process.env.JWT_REFRESH_EXPIRATION_DAYS || '7d',
    resetPasswordExpirationMinutes: 10,
  },
} as const;

export type Config = typeof config;
