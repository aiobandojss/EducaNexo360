// src/validations/calificacion.validation.ts

import { body } from 'express-validator';

export const crearCalificacionValidation = [
  body('estudianteId')
    .notEmpty()
    .withMessage('El estudiante es requerido')
    .isMongoId()
    .withMessage('ID de estudiante inválido'),

  body('asignaturaId')
    .notEmpty()
    .withMessage('La asignatura es requerida')
    .isMongoId()
    .withMessage('ID de asignatura inválido'),

  body('cursoId')
    .notEmpty()
    .withMessage('El curso es requerido')
    .isMongoId()
    .withMessage('ID de curso inválido'),

  body('periodo')
    .notEmpty()
    .withMessage('El periodo es requerido')
    .isInt({ min: 1 })
    .withMessage('El periodo debe ser un número positivo'),

  body('año_academico')
    .notEmpty()
    .withMessage('El año académico es requerido')
    .matches(/^\d{4}$/)
    .withMessage('Formato de año académico inválido'),

  body('calificaciones_logros')
    .optional()
    .isArray()
    .withMessage('Las calificaciones deben ser un array'),

  body('calificaciones_logros.*.logroId')
    .optional()
    .isMongoId()
    .withMessage('ID de logro inválido'),

  body('calificaciones_logros.*.calificacion')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('La calificación debe estar entre 0 y 5'),

  body('observaciones').optional().isString().withMessage('Las observaciones deben ser texto'),
];

export const actualizarCalificacionValidation = [
  body('calificaciones_logros')
    .optional()
    .isArray()
    .withMessage('Las calificaciones deben ser un array'),

  body('calificaciones_logros.*.logroId')
    .optional()
    .isMongoId()
    .withMessage('ID de logro inválido'),

  body('calificaciones_logros.*.calificacion')
    .optional()
    .isFloat({ min: 0, max: 5 })
    .withMessage('La calificación debe estar entre 0 y 5'),

  body('observaciones').optional().isString().withMessage('Las observaciones deben ser texto'),
];

export const agregarCalificacionLogroValidation = [
  body('logroId')
    .notEmpty()
    .withMessage('El logro es requerido')
    .isMongoId()
    .withMessage('ID de logro inválido'),

  body('calificacion')
    .notEmpty()
    .withMessage('La calificación es requerida')
    .isFloat({ min: 0, max: 5 })
    .withMessage('La calificación debe estar entre 0 y 5'),

  body('observacion').optional().isString().withMessage('La observación debe ser texto'),
];

export const actualizarCalificacionLogroValidation = [
  body('logroId')
    .notEmpty()
    .withMessage('El logro es requerido')
    .isMongoId()
    .withMessage('ID de logro inválido'),

  body('calificacion')
    .notEmpty()
    .withMessage('La calificación es requerida')
    .isFloat({ min: 0, max: 5 })
    .withMessage('La calificación debe estar entre 0 y 5'),

  body('observacion').optional().isString().withMessage('La observación debe ser texto'),
];
