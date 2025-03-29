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
import calendarioRoutes from './routes/calendario.routes';
import anuncioRoutes from './routes/anuncio.routes';
import asistenciaRoutes from './routes/asistencia.routes';
import systemRoutes from './routes/system.routes';
import superadminRoutes from './routes/superadmin.routes';

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
app.use('/api/calendario', calendarioRoutes);
app.use('/api/anuncios', anuncioRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/superadmin', superadminRoutes);

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
    // Se usa la variable de entorno MONGODB_URI si está definida,
    // de lo contrario se usa una conexión local (solo para desarrollo)
    // En producción, MONGODB_URI debe apuntar a MongoDB Atlas
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/educanexo360';

    // Conectar a MongoDB (Atlas o local)
    const conn = await mongoose.connect(mongoURI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);

    // Inicializar GridFS con la misma conexión
    await gridfsManager.initializeStorage(mongoURI);
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
