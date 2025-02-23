import dotenv from 'dotenv';

dotenv.config();

interface JWTConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

export const jwtConfig: JWTConfig = {
  secret: process.env.JWT_SECRET || 'tu_jwt_secret_muy_seguro',
  expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  refreshSecret: process.env.REFRESH_TOKEN_SECRET || 'tu_refresh_token_secret_muy_seguro',
  refreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
} as const;

export const tokenTypes = {
  ACCESS: 'ACCESS',
  REFRESH: 'REFRESH',
} as const;
