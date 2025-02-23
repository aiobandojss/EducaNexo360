import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import escuelaRoutes from './routes/escuela.routes';
import usuarioRoutes from './routes/usuario.routes';
import ApiError from './utils/ApiError';

// Configuración de variables de entorno
dotenv.config();

const app: Express = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/escuelas', escuelaRoutes);
app.use('/api/usuarios', usuarioRoutes);

// Ruta base
app.get('/', (_req: Request, res: Response) => {
  res.send('EducaNexo360 API');
});

// Manejo de rutas no encontradas
app.use((_req: Request, _res: Response, next: NextFunction) => {
  next(new ApiError(404, 'Ruta no encontrada'));
});

// Manejo de errores global
app.use((err: Error | ApiError, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
});

// Conexión a MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/educanexo360',
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(
      `Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`,
    );
  });
};

startServer().catch((err) => console.error('Error starting server:', err));

export default app;
