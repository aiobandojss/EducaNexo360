// src/validations/calendario.validation.ts

import { body } from 'express-validator';
import { TipoEvento, EstadoEvento } from '../interfaces/ICalendario';

export const crearEventoValidation = [
  body('titulo')
    .notEmpty()
    .withMessage('El título es requerido')
    .isLength({ max: 100 })
    .withMessage('El título no puede exceder los 100 caracteres')
    .trim(),

  body('descripcion').notEmpty().withMessage('La descripción es requerida').trim(),

  body('fechaInicio')
    .notEmpty()
    .withMessage('La fecha de inicio es requerida')
    .isISO8601()
    .withMessage('La fecha de inicio debe ser válida'),

  body('fechaFin')
    .notEmpty()
    .withMessage('La fecha de fin es requerida')
    .isISO8601()
    .withMessage('La fecha de fin debe ser válida')
    .custom((value, { req }) => {
      const fechaInicio = new Date(req.body.fechaInicio);
      const fechaFin = new Date(value);
      if (fechaFin < fechaInicio) {
        throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio');
      }
      return true;
    }),

  body('todoElDia').optional().isBoolean().withMessage('Debe ser un valor booleano'),

  body('lugar').optional().trim(),

  body('tipo').optional().isIn(Object.values(TipoEvento)).withMessage('Tipo de evento no válido'),

  body('estado')
    .optional()
    .isIn(Object.values(EstadoEvento))
    .withMessage('Estado de evento no válido'),

  body('cursoId').optional().isMongoId().withMessage('ID de curso inválido'),

  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('El color debe estar en formato hexadecimal (#RRGGBB)'),

  body('invitados').optional().isArray().withMessage('Invitados debe ser un array'),

  body('invitados.*.usuarioId')
    .optional()
    .isMongoId()
    .withMessage('ID de usuario invitado inválido'),

  body('recordatorios').optional().isArray().withMessage('Recordatorios debe ser un array'),

  body('recordatorios.*.tiempo')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El tiempo debe ser un número positivo'),

  body('recordatorios.*.tipo')
    .optional()
    .isIn(['EMAIL', 'NOTIFICACION', 'AMBOS'])
    .withMessage('Tipo de recordatorio no válido'),
];

export const actualizarEventoValidation = [
  body('titulo')
    .optional()
    .notEmpty()
    .withMessage('El título no puede estar vacío')
    .isLength({ max: 100 })
    .withMessage('El título no puede exceder los 100 caracteres')
    .trim(),

  body('descripcion')
    .optional()
    .notEmpty()
    .withMessage('La descripción no puede estar vacía')
    .trim(),

  body('fechaInicio').optional().isISO8601().withMessage('La fecha de inicio debe ser válida'),

  body('fechaFin')
    .optional()
    .isISO8601()
    .withMessage('La fecha de fin debe ser válida')
    .custom((value, { req }) => {
      if (req.body.fechaInicio) {
        const fechaInicio = new Date(req.body.fechaInicio);
        const fechaFin = new Date(value);
        if (fechaFin < fechaInicio) {
          throw new Error('La fecha de fin no puede ser anterior a la fecha de inicio');
        }
      }
      return true;
    }),

  body('todoElDia').optional().isBoolean().withMessage('Debe ser un valor booleano'),

  body('lugar').optional().trim(),

  body('tipo').optional().isIn(Object.values(TipoEvento)).withMessage('Tipo de evento no válido'),

  body('estado')
    .optional()
    .isIn(Object.values(EstadoEvento))
    .withMessage('Estado de evento no válido'),

  body('cursoId').optional().isMongoId().withMessage('ID de curso inválido'),

  body('color')
    .optional()
    .matches(/^#[0-9A-F]{6}$/i)
    .withMessage('El color debe estar en formato hexadecimal (#RRGGBB)'),
];

export const confirmarAsistenciaValidation = [
  body('confirmado').isBoolean().withMessage('El estado de confirmación debe ser un booleano'),
];
