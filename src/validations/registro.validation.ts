import { body } from 'express-validator';

export const registroValidation = {
  crearSolicitud: [
    body('invitacionId').isMongoId().withMessage('ID de invitación no válido'),
    body('nombre').notEmpty().withMessage('El nombre es requerido').trim(),
    body('apellidos').notEmpty().withMessage('Los apellidos son requeridos').trim(),
    body('email').isEmail().withMessage('Email no válido').normalizeEmail(),
    body('estudiantes').isArray({ min: 1 }).withMessage('Debe incluir al menos un estudiante'),
    body('estudiantes.*.nombre')
      .notEmpty()
      .withMessage('El nombre del estudiante es requerido')
      .trim(),
    body('estudiantes.*.apellidos')
      .notEmpty()
      .withMessage('Los apellidos del estudiante son requeridos')
      .trim(),
    body('estudiantes.*.cursoId').isMongoId().withMessage('ID de curso no válido'),
    body('estudiantes.*.email')
      .optional()
      .isEmail()
      .withMessage('Email de estudiante no válido')
      .normalizeEmail(),
    body('estudiantes.*.codigo_estudiante').optional().trim(),
  ],

  rechazarSolicitud: [
    body('motivo').notEmpty().withMessage('El motivo del rechazo es requerido').trim(),
  ],
};
