import express from 'express';
import asignaturaController from '../controllers/asignatura.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  crearAsignaturaValidation,
  actualizarAsignaturaValidation,
  actualizarPeriodosValidation,
} from '../validations/asignatura.validation';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Nueva ruta para obtener asignaturas por curso
// Importante: Debe ir ANTES de la ruta /:id para evitar conflictos
router.get(
  '/curso/:cursoId',
  authorize('ADMIN', 'DOCENTE', 'RECTOR', 'COORDINADOR', 'ADMINISTRATIVO'),
  asignaturaController.obtenerPorCurso,
);

// Rutas para administradores
router.post(
  '/',
  authorize('ADMIN'),
  validate(crearAsignaturaValidation),
  asignaturaController.crear,
);

router.put(
  '/:id',
  authorize('ADMIN'),
  validate(actualizarAsignaturaValidation),
  asignaturaController.actualizar,
);

router.delete('/:id', authorize('ADMIN'), asignaturaController.eliminar);

// Ruta específica para gestionar periodos
router.put(
  '/:id/periodos',
  authorize('ADMIN'),
  validate(actualizarPeriodosValidation),
  asignaturaController.actualizarPeriodos,
);

// Rutas de consulta (accesibles para ADMIN y DOCENTE)
router.get('/', authorize('ADMIN', 'DOCENTE'), asignaturaController.obtenerTodas);
router.get('/:id', authorize('ADMIN', 'DOCENTE'), asignaturaController.obtenerPorId);

export default router;
