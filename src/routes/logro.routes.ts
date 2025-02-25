// src/routes/logro.routes.ts

import express from 'express';
import logroController from '../controllers/logro.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { crearLogroValidation, actualizarLogroValidation } from '../validations/logro.validation';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas para docentes y administradores
router.post(
  '/',
  authorize('ADMIN', 'DOCENTE'),
  validate(crearLogroValidation),
  logroController.crear,
);

router.get('/', authorize('ADMIN', 'DOCENTE'), logroController.obtenerTodos);

router.get('/:id', authorize('ADMIN', 'DOCENTE'), logroController.obtenerPorId);

router.put(
  '/:id',
  authorize('ADMIN', 'DOCENTE'),
  validate(actualizarLogroValidation),
  logroController.actualizar,
);

router.delete('/:id', authorize('ADMIN', 'DOCENTE'), logroController.eliminar);

// Ruta específica para obtener logros de una asignatura
router.get(
  '/asignatura/:asignaturaId',
  authorize('ADMIN', 'DOCENTE', 'ESTUDIANTE', 'PADRE'),
  logroController.obtenerLogrosAsignatura,
);

// Exportamos el router
export default router;
