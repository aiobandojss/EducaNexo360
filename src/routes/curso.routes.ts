import express from 'express';
import cursoController from '../controllers/curso.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  crearCursoValidation,
  actualizarCursoValidation,
  agregarEstudiantesValidation,
  removerEstudiantesValidation,
} from '../validations/curso.validation';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas que requieren ser ADMIN
router.post('/', authorize('ADMIN'), validate(crearCursoValidation), cursoController.crear);
router.put(
  '/:id',
  authorize('ADMIN'),
  validate(actualizarCursoValidation),
  cursoController.actualizar,
);
router.delete('/:id', authorize('ADMIN'), cursoController.eliminar);

// Rutas para gestionar estudiantes
router.post(
  '/:id/estudiantes',
  authorize('ADMIN'),
  validate(agregarEstudiantesValidation),
  cursoController.agregarEstudiantes,
);

router.delete(
  '/:id/estudiantes',
  authorize('ADMIN'),
  validate(removerEstudiantesValidation),
  cursoController.removerEstudiantes,
);

// Rutas de consulta (accesibles para ADMIN y DOCENTE)
router.get('/', authorize('ADMIN', 'DOCENTE'), cursoController.obtenerTodos);
router.get('/:id', authorize('ADMIN', 'DOCENTE'), cursoController.obtenerPorId);

export default router;
