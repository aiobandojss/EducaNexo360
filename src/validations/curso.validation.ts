import { body } from 'express-validator';
import mongoose from 'mongoose';

export const crearCursoValidation = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre del curso es requerido')
    .isLength({ max: 50 })
    .withMessage('El nombre no puede exceder los 50 caracteres'),

  body('nivel').trim().notEmpty().withMessage('El nivel es requerido'),

  body('año_academico')
    .trim()
    .notEmpty()
    .withMessage('El año académico es requerido')
    .matches(/^\d{4}$/)
    .withMessage('El año académico debe tener formato YYYY'),

  body('director_grupo')
    .notEmpty()
    .withMessage('El director de grupo es requerido')
    .custom((value) => {
      return (
        mongoose.Types.ObjectId.isValid(value) || new Error('ID de director de grupo inválido')
      );
    }),
];

export const actualizarCursoValidation = [
  body('nombre')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre no puede estar vacío')
    .isLength({ max: 50 })
    .withMessage('El nombre no puede exceder los 50 caracteres'),

  body('nivel').optional().trim().notEmpty().withMessage('El nivel no puede estar vacío'),

  body('año_academico')
    .optional()
    .trim()
    .matches(/^\d{4}$/)
    .withMessage('El año académico debe tener formato YYYY'),

  body('director_grupo')
    .optional()
    .custom((value) => {
      return (
        mongoose.Types.ObjectId.isValid(value) || new Error('ID de director de grupo inválido')
      );
    }),
];

export const agregarEstudiantesValidation = [
  body('estudiantes')
    .isArray()
    .withMessage('Estudiantes debe ser un array')
    .notEmpty()
    .withMessage('Debe proporcionar al menos un estudiante')
    .custom((estudiantes) => {
      const todosValidos = estudiantes.every((id: string) => mongoose.Types.ObjectId.isValid(id));
      if (!todosValidos) {
        throw new Error('Uno o más IDs de estudiantes son inválidos');
      }
      return true;
    }),
];

export const removerEstudiantesValidation = [
  body('estudiantes')
    .isArray()
    .withMessage('Estudiantes debe ser un array')
    .notEmpty()
    .withMessage('Debe proporcionar al menos un estudiante')
    .custom((estudiantes) => {
      const todosValidos = estudiantes.every((id: string) => mongoose.Types.ObjectId.isValid(id));
      if (!todosValidos) {
        throw new Error('Uno o más IDs de estudiantes son inválidos');
      }
      return true;
    }),
];
