import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes';
import escuelaRoutes from './routes/escuela.routes';
import usuarioRoutes from './routes/usuario.routes';
import ApiError from './utils/ApiError';
import cursoRoutes from './routes/curso.routes';
import asignaturaRoutes from './routes/asignatura.routes';
import logroRoutes from './routes/logro.routes';
import academicRoutes from './routes/academic.routes';
import calificacionRoutes from './routes/calificacion.routes';
import boletinRoutes from './routes/boletin.routes';
import mensajeRoutes from './routes/mensaje.routes';
import gridfsManager from './config/gridfs';
import notificacionRoutes from './routes/notificacion.routes';
import {
  setupCompression,
  responseTimeMiddleware,
  rateLimiter,
} from './middleware/performance.middleware';

//import config from './config/config';

// Configuración de variables de entorno
dotenv.config();

const app: Express = express();

// Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
setupCompression(app);
app.use(responseTimeMiddleware);

// Rutas
app.use('/api/auth', rateLimiter(60000, 20), authRoutes);
app.use('/api/mensajes', rateLimiter(60000, 100), mensajeRoutes);
//app.use('/api/auth', authRoutes);
app.use('/api/escuelas', escuelaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/cursos', cursoRoutes);
app.use('/api/asignaturas', asignaturaRoutes);
app.use('/api/logros', logroRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/calificaciones', calificacionRoutes);
app.use('/api/boletin', boletinRoutes);
//app.use('/api/mensajes', mensajeRoutes);
app.use('/api/notificaciones', notificacionRoutes);

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

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/educanexo360',
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Inicializar GridFS después de conectar a MongoDB
    await gridfsManager.initializeStorage(
      process.env.MONGODB_URI || 'mongodb://localhost:27017/educanexo360',
    );
    console.log('GridFS Storage initialized successfully');
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
