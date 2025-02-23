import { body } from 'express-validator';

export const actualizarUsuarioValidation = [
  body('nombre').optional().trim().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('apellidos')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Los apellidos no pueden estar vacíos'),
  body('perfil.telefono')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El teléfono no puede estar vacío'),
  body('perfil.direccion')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('La dirección no puede estar vacía'),
  body('estado').optional().isIn(['ACTIVO', 'INACTIVO']).withMessage('Estado no válido'),
];

export const cambiarPasswordValidation = [
  body('passwordActual')
    .notEmpty()
    .withMessage('La contraseña actual es requerida')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('nuevaPassword')
    .notEmpty()
    .withMessage('La nueva contraseña es requerida')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
    .custom((value, { req }) => {
      if (value === req.body.passwordActual) {
        throw new Error('La nueva contraseña debe ser diferente a la actual');
      }
      return true;
    }),
];
