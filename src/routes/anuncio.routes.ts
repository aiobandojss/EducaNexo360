// src/routes/anuncio.routes.ts

import express from 'express';
import anuncioController from '../controllers/anuncio.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  crearAnuncioValidation,
  actualizarAnuncioValidation,
  publicarAnuncioValidation,
} from '../validations/anuncio.validation';
import gridfsManager from '../config/gridfs';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Configuración para multer: procesar múltiples archivos, incluyendo la imagen de portada
const upload = gridfsManager.getUpload();
const uploadFiles = upload
  ? upload.fields([
      { name: 'imagenPortada', maxCount: 1 },
      { name: 'adjuntos', maxCount: 5 },
    ])
  : [];

// Rutas para gestionar anuncios
router.post(
  '/',
  authorize('ADMIN', 'DOCENTE'),
  uploadFiles,
  validate(crearAnuncioValidation),
  anuncioController.crearAnuncio,
);

router.get(
  '/',
  authorize('ADMIN', 'DOCENTE', 'ESTUDIANTE', 'PADRE'),
  anuncioController.obtenerAnuncios,
);

router.get(
  '/:id',
  authorize('ADMIN', 'DOCENTE', 'ESTUDIANTE', 'PADRE'),
  anuncioController.obtenerAnuncioPorId,
);

router.put(
  '/:id',
  authorize('ADMIN', 'DOCENTE'),
  uploadFiles,
  validate(actualizarAnuncioValidation),
  anuncioController.actualizarAnuncio,
);

router.patch(
  '/:id/publicar',
  authorize('ADMIN', 'DOCENTE'),
  validate(publicarAnuncioValidation),
  anuncioController.publicarAnuncio,
);

router.patch('/:id/archivar', authorize('ADMIN', 'DOCENTE'), anuncioController.archivarAnuncio);

// Rutas para archivos
router.get('/:id/imagen/:imagenId', anuncioController.obtenerImagenPortada);

router.get(
  '/:id/adjunto/:adjuntoId',
  authorize('ADMIN', 'DOCENTE', 'ESTUDIANTE', 'PADRE'),
  anuncioController.descargarAdjunto,
);

export default router;
