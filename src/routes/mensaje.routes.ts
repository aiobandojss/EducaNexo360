// src/routes/mensaje.routes.ts

import express, { Request, Response, NextFunction } from 'express';
import mensajeController from '../controllers/mensaje.controller';
import { authenticate } from '../middleware/auth.middleware';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

const router = express.Router();

// Crear directorio para archivos temporales si no existe
const uploadsDir = path.join(__dirname, '../../uploads/temp');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configurar multer para almacenamiento temporal
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas para mensajes
router.post('/', upload.array('adjuntos', 5), (req: any, res: Response, next: NextFunction) => {
  mensajeController.crear(req, res, next);
});

router.get('/', (req: any, res: Response, next: NextFunction) => {
  mensajeController.obtenerTodos(req, res, next);
});

router.get('/:id', (req: any, res: Response, next: NextFunction) => {
  mensajeController.obtenerPorId(req, res, next);
});

router.put('/:id/archivar', (req: any, res: Response, next: NextFunction) => {
  mensajeController.archivar(req, res, next);
});

router.post(
  '/:mensajeId/responder',
  upload.array('adjuntos', 5),
  (req: any, res: Response, next: NextFunction) => {
    mensajeController.responder(req, res, next);
  },
);

// Ruta para descargar archivos adjuntos
router.get('/:mensajeId/adjuntos/:adjuntoId', (req: any, res: Response, next: NextFunction) => {
  mensajeController.descargarAdjunto(req, res, next);
});

export default router;
