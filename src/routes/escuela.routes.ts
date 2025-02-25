import express from 'express';
import escuelaController from '../controllers/escuela.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  crearEscuelaValidation,
  actualizarEscuelaValidation,
  actualizarConfiguracionValidation,
  actualizarPeriodosValidation,
} from '../validations/escuela.validation';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas básicas CRUD
router.post('/', authorize('ADMIN'), validate(crearEscuelaValidation), escuelaController.crear);

router.get('/', authorize('ADMIN'), escuelaController.obtener);

router.get('/:id', authorize('ADMIN'), escuelaController.obtenerPorId);

router.put(
  '/:id',
  authorize('ADMIN'),
  validate(actualizarEscuelaValidation),
  escuelaController.actualizar,
);

router.delete('/:id', authorize('ADMIN'), escuelaController.eliminar);

// Rutas para configuración y períodos
router.put(
  '/:id/configuracion',
  authorize('ADMIN'),
  validate(actualizarConfiguracionValidation),
  escuelaController.actualizarConfiguracion,
);

router.put(
  '/:id/periodos',
  authorize('ADMIN'),
  validate(actualizarPeriodosValidation),
  escuelaController.actualizarPeriodosAcademicos,
);

export default router;
