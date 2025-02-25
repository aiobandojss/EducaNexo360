// src/validations/logro.validation.ts

import { body } from 'express-validator';

export const crearLogroValidation = [
  body('nombre').notEmpty().withMessage('El nombre es requerido').trim(),

  body('descripcion').notEmpty().withMessage('La descripción es requerida').trim(),

  body('tipo')
    .notEmpty()
    .withMessage('El tipo es requerido')
    .isIn(['COGNITIVO', 'PROCEDIMENTAL', 'ACTITUDINAL'])
    .withMessage('Tipo de logro inválido'),

  body('porcentaje')
    .notEmpty()
    .withMessage('El porcentaje es requerido')
    .isFloat({ min: 0, max: 100 })
    .withMessage('El porcentaje debe estar entre 0 y 100'),

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
    .withMessage('El periodo debe ser mayor a 0'),

  body('año_academico')
    .notEmpty()
    .withMessage('El año académico es requerido')
    .matches(/^\d{4}$/)
    .withMessage('Formato de año académico inválido'),
];

export const actualizarLogroValidation = [
  body('nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío').trim(),

  body('descripcion')
    .optional()
    .notEmpty()
    .withMessage('La descripción no puede estar vacía')
    .trim(),

  body('tipo')
    .optional()
    .isIn(['COGNITIVO', 'PROCEDIMENTAL', 'ACTITUDINAL'])
    .withMessage('Tipo de logro inválido'),

  body('porcentaje')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('El porcentaje debe estar entre 0 y 100'),

  body('estado').optional().isIn(['ACTIVO', 'INACTIVO']).withMessage('Estado inválido'),
];
