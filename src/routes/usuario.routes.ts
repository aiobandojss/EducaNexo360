import express from 'express';
import usuarioController from '../controllers/usuario.controller';
import * as authMiddleware from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  actualizarUsuarioValidation,
  cambiarPasswordValidation,
} from '../validations/usuario.validation';

const router = express.Router();

// Rutas protegidas - requieren autenticación
router.use(authMiddleware.authenticate);

// Rutas para administradores
router.get('/', authMiddleware.authorize('ADMIN'), usuarioController.obtenerUsuarios);
router.get(
  '/buscar',
  authMiddleware.authorize('ADMIN', 'DOCENTE'),
  usuarioController.buscarUsuarios,
);
router.get('/:id', authMiddleware.authorize('ADMIN'), usuarioController.obtenerUsuario);
router.put(
  '/:id',
  authMiddleware.authorize('ADMIN'),
  validate(actualizarUsuarioValidation),
  usuarioController.actualizarUsuario,
);
router.delete('/:id', authMiddleware.authorize('ADMIN'), usuarioController.eliminarUsuario);

// Ruta para cambiar contraseña (el usuario solo puede cambiar su propia contraseña)
router.post(
  '/:id/cambiar-password',
  validate(cambiarPasswordValidation),
  usuarioController.cambiarPassword,
);

export default router;
