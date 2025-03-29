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
import { RequestHandler } from 'express-serve-static-core';

const router = express.Router();

// Crear un middleware personalizado que permita a todos los roles
const obtenerEscuelaPorId: RequestHandler = (req, res, next) => {
  escuelaController.obtenerPorId(req, res, next);
};

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas básicas CRUD
router.post('/', authorize('ADMIN'), validate(crearEscuelaValidation), escuelaController.crear);

// Permitir acceso a roles administrativos para obtener lista de escuelas
router.get(
  '/',
  authorize('ADMIN', 'RECTOR', 'COORDINADOR', 'ADMINISTRATIVO'),
  escuelaController.obtener,
);

// Permitir acceso a todos los roles para obtener una escuela específica
router.get(
  '/:id',
  authorize(
    'ADMIN',
    'DOCENTE',
    'ESTUDIANTE',
    'PADRE',
    'ACUDIENTE',
    'RECTOR',
    'COORDINADOR',
    'ADMINISTRATIVO',
  ),
  obtenerEscuelaPorId,
);

router.put(
  '/:id',
  authorize('ADMIN', 'RECTOR'),
  validate(actualizarEscuelaValidation),
  escuelaController.actualizar,
);

router.delete('/:id', authorize('ADMIN'), escuelaController.eliminar);

// Rutas para configuración y períodos
router.put(
  '/:id/configuracion',
  authorize('ADMIN', 'RECTOR'),
  validate(actualizarConfiguracionValidation),
  escuelaController.actualizarConfiguracion,
);

router.put(
  '/:id/periodos',
  authorize('ADMIN', 'RECTOR', 'COORDINADOR'),
  validate(actualizarPeriodosValidation),
  escuelaController.actualizarPeriodosAcademicos,
);

export default router;
