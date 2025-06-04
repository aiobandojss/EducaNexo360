// src/validations/estudiante.validation.ts
import { query, param, body } from 'express-validator';

export const estudianteValidation = {
  buscarEstudiantes: [
    query('escuelaId')
      .notEmpty()
      .withMessage('El ID de la escuela es obligatorio')
      .isMongoId()
      .withMessage('ID de escuela inválido'),

    query('nombre')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('El nombre debe tener entre 2 y 50 caracteres'),

    query('apellidos')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Los apellidos deben tener entre 2 y 50 caracteres'),

    query('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Formato de email inválido')
      .normalizeEmail(),

    query('codigo_estudiante')
      .optional()
      .trim()
      .isLength({ min: 3, max: 20 })
      .withMessage('El código de estudiante debe tener entre 3 y 20 caracteres'),

    query('cursoId').optional().isMongoId().withMessage('ID de curso inválido'),
  ],

  obtenerEstudiantePorId: [
    param('id')
      .notEmpty()
      .withMessage('El ID del estudiante es obligatorio')
      .isMongoId()
      .withMessage('ID de estudiante inválido'),

    query('escuelaId')
      .notEmpty()
      .withMessage('El ID de la escuela es obligatorio')
      .isMongoId()
      .withMessage('ID de escuela inválido'),
  ],

  verificarAsociacion: [
    param('estudianteId')
      .notEmpty()
      .withMessage('El ID del estudiante es obligatorio')
      .isMongoId()
      .withMessage('ID de estudiante inválido'),

    body('acudienteEmail')
      .notEmpty()
      .withMessage('El email del acudiente es obligatorio')
      .isEmail()
      .withMessage('Formato de email inválido')
      .normalizeEmail(),

    body('escuelaId')
      .notEmpty()
      .withMessage('El ID de la escuela es obligatorio')
      .isMongoId()
      .withMessage('ID de escuela inválido'),
  ],
};
