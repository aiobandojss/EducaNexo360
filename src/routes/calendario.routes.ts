// src/routes/calendario.routes.ts

import express from 'express';
import calendarioController from '../controllers/calendario.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  crearEventoValidation,
  actualizarEventoValidation,
  confirmarAsistenciaValidation,
} from '../validations/calendario.validation';
import gridfsManager from '../config/gridfs';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas para gestionar eventos
router.post(
  '/',
  authorize('ADMIN', 'DOCENTE', 'ESTUDIANTE', 'PADRE', 'ACUDIENTE'), // 👈 Añadido ACUDIENTE
  gridfsManager.getUpload()?.single('archivo') || [],
  validate(crearEventoValidation),
  calendarioController.crearEvento as unknown as express.RequestHandler,
);

router.get(
  '/',
  authorize('ADMIN', 'DOCENTE', 'ESTUDIANTE', 'PADRE', 'ACUDIENTE'), // 👈 Añadido ACUDIENTE
  calendarioController.obtenerEventos as express.RequestHandler,
);

router.get(
  '/:id',
  authorize('ADMIN', 'DOCENTE', 'ESTUDIANTE', 'PADRE', 'ACUDIENTE'), // 👈 Añadido ACUDIENTE
  calendarioController.obtenerEventoPorId as express.RequestHandler,
);

router.put(
  '/:id',
  authorize('ADMIN', 'DOCENTE'),
  gridfsManager.getUpload()?.single('archivo') || [],
  validate(actualizarEventoValidation),
  calendarioController.actualizarEvento as express.RequestHandler,
);

router.delete(
  '/:id',
  authorize('ADMIN', 'DOCENTE'),
  calendarioController.eliminarEvento as express.RequestHandler,
);

// Rutas específicas
router.post(
  '/:id/confirmar',
  authorize('ADMIN', 'DOCENTE', 'ESTUDIANTE', 'PADRE', 'ACUDIENTE'), // 👈 Añadido ACUDIENTE
  validate(confirmarAsistenciaValidation),
  calendarioController.confirmarAsistencia as express.RequestHandler,
);

router.get(
  '/:id/adjunto',
  authorize('ADMIN', 'DOCENTE', 'ESTUDIANTE', 'PADRE', 'ACUDIENTE'), // 👈 Añadido ACUDIENTE
  calendarioController.descargarAdjunto as express.RequestHandler,
);

router.patch(
  '/:id/estado',
  authorize('ADMIN', 'DOCENTE'),
  calendarioController.cambiarEstadoEvento as express.RequestHandler,
);

export default router;
