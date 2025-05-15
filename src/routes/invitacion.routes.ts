import express from 'express';
import {
  crearInvitacion,
  validarCodigo,
  obtenerInvitacionesPorCurso,
  revocarInvitacion,
  obtenerInvitacionPorId,
  obtenerInvitacionesEscuela,
} from '../controllers/invitacion.controller';

// Importar con los nombres correctos
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { invitacionValidation } from '../validations/invitacion.validation';

const router = express.Router();

// Rutas protegidas (requieren autenticación)
router.post(
  '/',
  authenticate,
  authorize('ADMIN', 'RECTOR', 'COORDINADOR'),
  validate(invitacionValidation.crearInvitacion),
  crearInvitacion,
);

router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'RECTOR', 'COORDINADOR'),
  obtenerInvitacionesEscuela,
);

router.get(
  '/:id',
  authenticate,
  authorize('ADMIN', 'RECTOR', 'COORDINADOR'),
  obtenerInvitacionPorId,
);

router.delete('/:id', authenticate, authorize('ADMIN', 'RECTOR', 'COORDINADOR'), revocarInvitacion);

router.get(
  '/curso/:cursoId',
  authenticate,
  authorize('ADMIN', 'RECTOR', 'COORDINADOR'),
  obtenerInvitacionesPorCurso,
);

// Rutas públicas (no requieren autenticación)
router.post('/validar', validate(invitacionValidation.validarCodigo), validarCodigo);

export default router;
