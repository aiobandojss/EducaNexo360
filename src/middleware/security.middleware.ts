import helmet from 'helmet';
import cors from 'cors';
import { Express } from 'express';

export const configureSecurityMiddleware = (app: Express) => {
  // Configuración básica de Helmet
  app.use(helmet());

  // Configuración de CORS
  const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 horas
  };

  app.use(cors(corsOptions));

  // Headers de seguridad adicionales
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
  });
};
