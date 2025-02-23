import express from 'express';
import authController from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import {
  loginValidation,
  registerValidation,
  refreshTokenValidation,
} from '../validations/auth.validation';

const router = express.Router();

/**
 * @route POST /api/auth/login
 * @desc Iniciar sesión de usuario
 * @access Public
 */
router.post('/login', validate(loginValidation), authController.login);

/**
 * @route POST /api/auth/register
 * @desc Registrar nuevo usuario
 * @access Public
 */
router.post('/register', validate(registerValidation), authController.register);

/**
 * @route POST /api/auth/refresh-token
 * @desc Refrescar token de acceso
 * @access Public
 */
router.post('/refresh-token', validate(refreshTokenValidation), authController.refreshToken);

/**
 * @route POST /api/auth/logout
 * @desc Cerrar sesión
 * @access Private
 */
router.post('/logout', authController.logout);

export default router;
