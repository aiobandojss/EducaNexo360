import { body } from 'express-validator';

// Validación para login
export const loginValidation = [
  body('email').isEmail().withMessage('Debe proporcionar un email válido'),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
];

// Validación para registro
export const registerValidation = [
  body('email').isEmail().withMessage('Debe proporcionar un email válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('apellidos').notEmpty().withMessage('Los apellidos son requeridos'),
  body('tipo').notEmpty().withMessage('El tipo de usuario es requerido'),
  body('escuelaId').notEmpty().withMessage('La escuela es requerida'),
];

// Validación para refresh token
export const refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('El token de refresco es requerido'),
];

// Validación para solicitar recuperación de contraseña
export const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .withMessage('Debe proporcionar un correo electrónico válido')
    .normalizeEmail()
    .trim()
    .escape(),
];

// Validación para restablecer contraseña
export const resetPasswordValidation = [
  body('token')
    .isString()
    .withMessage('Token es requerido')
    .trim()
    .isLength({ min: 32, max: 64 })
    .withMessage('El token no tiene el formato correcto'),
  body('password')
    .isString()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .matches(/\d/)
    .withMessage('La contraseña debe contener al menos un número')
    .trim(),
];
