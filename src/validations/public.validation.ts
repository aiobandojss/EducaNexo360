import { body, param } from 'express-validator';

export const validarCodigoInvitacionValidation = [
  body('codigo')
    .notEmpty()
    .withMessage('El código de invitación es obligatorio')
    .trim()
    .isString()
    .withMessage('Formato de código inválido'),
];

export const obtenerInfoCursoValidation = [
  param('cursoId')
    .notEmpty()
    .withMessage('El ID del curso es obligatorio')
    .isMongoId()
    .withMessage('ID de curso inválido'),
  param('codigoInvitacion')
    .notEmpty()
    .withMessage('El código de invitación es obligatorio')
    .trim()
    .isString()
    .withMessage('Formato de código inválido'),
];

export const obtenerCursosDisponiblesValidation = [
  param('codigoInvitacion')
    .notEmpty()
    .withMessage('El código de invitación es obligatorio')
    .trim()
    .isString()
    .withMessage('Formato de código inválido'),
];

export const crearSolicitudRegistroValidation = [
  // Validación para datos del acudiente
  body('invitacionId')
    .notEmpty()
    .withMessage('El ID de invitación es obligatorio')
    .isMongoId()
    .withMessage('ID de invitación inválido'),
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .trim()
    .isString()
    .withMessage('Formato de nombre inválido'),
  body('apellidos')
    .notEmpty()
    .withMessage('Los apellidos son obligatorios')
    .trim()
    .isString()
    .withMessage('Formato de apellidos inválido'),
  body('email')
    .notEmpty()
    .withMessage('El email es obligatorio')
    .trim()
    .isEmail()
    .withMessage('Formato de email inválido')
    .normalizeEmail(),
  body('telefono').optional().trim().isString().withMessage('Formato de teléfono inválido'),

  // Validación para los estudiantes
  body('estudiantes').isArray({ min: 1 }).withMessage('Debe incluir al menos un estudiante'),
  body('estudiantes.*.nombre')
    .notEmpty()
    .withMessage('El nombre del estudiante es obligatorio')
    .trim()
    .isString()
    .withMessage('Formato de nombre de estudiante inválido'),
  body('estudiantes.*.apellidos')
    .notEmpty()
    .withMessage('Los apellidos del estudiante son obligatorios')
    .trim()
    .isString()
    .withMessage('Formato de apellidos de estudiante inválido'),
  body('estudiantes.*.fechaNacimiento')
    .optional()
    .isISO8601()
    .withMessage('Formato de fecha de nacimiento inválido'),
  body('estudiantes.*.cursoId')
    .notEmpty()
    .withMessage('El ID del curso es obligatorio')
    .isMongoId()
    .withMessage('ID de curso inválido'),
  body('estudiantes.*.email')
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('Formato de email de estudiante inválido')
    .normalizeEmail(),
];
