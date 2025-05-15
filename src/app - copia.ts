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

import invitacionRoutes from './routes/invitacion.routes';
import registroRoutes from './routes/registro.routes';
import publicRoutes from './routes/public.routes';

// Configuración de variables de entorno
dotenv.config();

// Obtiene la ruta base configurada en app.js (archivo raíz)
const basePath = process.env.BASE_PATH || '';
console.log(`Inicializando aplicación con BASE_PATH: "${basePath}"`);

const app: Express = express();

// ===== CONFIGURACIÓN CORS MEJORADA =====
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// ===== MIDDLEWARES PRINCIPALES =====
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
setupCompression(app);
app.use(responseTimeMiddleware);

// ===== MIDDLEWARE PARA MANEJAR BASE_PATH =====
if (basePath) {
  console.log(`Configurando middleware para BASE_PATH: ${basePath}`);
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith(basePath)) {
      req.url = req.originalUrl.substring(basePath.length) || '/';
    }
    next();
  });
}

// ===== ENDPOINT DE DIAGNÓSTICO/SALUD =====
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'UP',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ===== RUTAS DE LA API =====
app.use('/api/auth', rateLimiter(60000, 20), authRoutes);
app.use('/api/mensajes', rateLimiter(60000, 100), mensajeRoutes);
app.use('/api/escuelas', escuelaRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/cursos', cursoRoutes);
app.use('/api/asignaturas', asignaturaRoutes);
app.use('/api/logros', logroRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/calificaciones', calificacionRoutes);
app.use('/api/boletin', boletinRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/calendario', calendarioRoutes);
app.use('/api/anuncios', anuncioRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use('/api/invitaciones', invitacionRoutes);
app.use('/api/registro', registroRoutes);
app.use('/api/public', publicRoutes);

// ===== RUTA BASE =====
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'EducaNexo360 API',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    time: new Date().toISOString(),
  });
});

// ===== MANEJO DE RUTAS NO ENCONTRADAS =====
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, 'Ruta no encontrada'));
});

// ===== MANEJO DE ERRORES GLOBAL CORREGIDO =====
app.use((err: Error | ApiError, req: Request, res: Response, next: NextFunction) => {
  console.error('Error en la aplicación:', err);

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: err.name,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: err.name || 'UnknownError',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
});

// ===== CONEXIÓN A BASE DE DATOS =====
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/educanexo360';
    console.log(
      `Conectando a MongoDB en: ${mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`,
    );

    // Opciones de conexión mejoradas
    const mongooseOptions = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    // Conectar a MongoDB
    const conn = await mongoose.connect(mongoURI, mongooseOptions);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);

    // Inicializar GridFS
    await gridfsManager.initializeStorage(mongoURI);
    console.log('GridFS Storage initialized successfully');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    // En lugar de cerrar inmediatamente, vamos a reintentar
    console.log('Retrying connection in 5 seconds...');
    setTimeout(() => {
      connectDB().catch((err) => {
        console.error('Failed to reconnect to MongoDB:', err);
        process.exit(1);
      });
    }, 5000);
  }
};

// ===== INICIAR SERVIDOR =====
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(
      `✅ Servidor iniciado en puerto ${PORT} en modo ${process.env.NODE_ENV || 'development'}`,
    );
    console.log(`📝 API documentación: http://localhost:${PORT}${basePath}/api/docs`);
    console.log(`🩺 Health check: http://localhost:${PORT}${basePath}/api/health`);
  });

  // Manejo graceful de cierre
  const gracefulShutdown = async (signal: string) => {
    console.log(`Recibida señal ${signal}. Cerrando servidor...`);
    server.close(async () => {
      console.log('Servidor HTTP cerrado.');

      try {
        await mongoose.connection.close();
        console.log('Conexión a MongoDB cerrada correctamente.');
        process.exit(0);
      } catch (err) {
        console.error('Error al cerrar conexión a MongoDB:', err);
        process.exit(1);
      }
    });

    // Si no se cierra en 10 segundos, forzar cierre
    setTimeout(() => {
      console.error('No se pudo cerrar limpiamente, forzando salida.');
      process.exit(1);
    }, 10000);
  };

  // Capturar señales para cierre graceful
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Manejar excepciones no capturadas
  process.on('uncaughtException', (error) => {
    console.error('Excepción no capturada:', error);
    gracefulShutdown('uncaughtException');
  });
};

startServer().catch((err) => {
  console.error('Error fatal al iniciar servidor:', err);
  process.exit(1);
});

export default app;
