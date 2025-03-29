import { body } from 'express-validator';

export const loginValidation = [
  body('email').isEmail().withMessage('Debe proporcionar un email válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
];

export const registerValidation = [
  body('email').isEmail().withMessage('Debe proporcionar un email válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('nombre').trim().notEmpty().withMessage('El nombre es requerido'),
  body('apellidos').trim().notEmpty().withMessage('Los apellidos son requeridos'),
  body('tipo')
    .isIn([
      'ADMIN',
      'SUPER_ADMIN',
      'DOCENTE',
      'ACUDIENTE', // Cambiado de PADRE a ACUDIENTE
      'ESTUDIANTE',
      'COORDINADOR', // Nuevo rol
      'RECTOR', // Nuevo rol
      'ADMINISTRATIVO', // Nuevo rol
    ])
    .withMessage('Tipo de usuario no válido'),
  body('escuelaId').isMongoId().withMessage('ID de escuela no válido'),
];

export const refreshTokenValidation = [
  body('refreshToken').notEmpty().withMessage('Token de refresco es requerido'),
];
