import { body } from 'express-validator';

export const crearAsignaturaValidation = [
  body('nombre')
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ min: 3 })
    .withMessage('El nombre debe tener al menos 3 caracteres')
    .isLength({ max: 50 })
    .withMessage('El nombre no puede exceder 50 caracteres'),

  body('descripcion')
    .notEmpty()
    .withMessage('La descripción es requerida')
    .isLength({ min: 10 })
    .withMessage('La descripción debe tener al menos 10 caracteres'),

  body('cursoId')
    .notEmpty()
    .withMessage('El curso es requerido')
    .isMongoId()
    .withMessage('ID de curso inválido'),

  body('docenteId')
    .notEmpty()
    .withMessage('El docente es requerido')
    .isMongoId()
    .withMessage('ID de docente inválido'),

  body('intensidad_horaria')
    .notEmpty()
    .withMessage('La intensidad horaria es requerida')
    .isInt({ min: 1 })
    .withMessage('La intensidad horaria debe ser al menos 1 hora'),

  body('periodos').isArray().withMessage('Los periodos deben ser un array'),

  body('periodos.*.numero')
    .notEmpty()
    .withMessage('El número del periodo es requerido')
    .isInt()
    .withMessage('El número del periodo debe ser un entero'),

  body('periodos.*.nombre').notEmpty().withMessage('El nombre del periodo es requerido'),

  body('periodos.*.porcentaje')
    .notEmpty()
    .withMessage('El porcentaje es requerido')
    .isFloat({ min: 0, max: 100 })
    .withMessage('El porcentaje debe estar entre 0 y 100'),

  body('periodos.*.fecha_inicio')
    .notEmpty()
    .withMessage('La fecha de inicio es requerida')
    .isISO8601()
    .withMessage('Formato de fecha inválido'),

  body('periodos.*.fecha_fin')
    .notEmpty()
    .withMessage('La fecha de fin es requerida')
    .isISO8601()
    .withMessage('Formato de fecha inválido'),

  body('periodos').custom((periodos) => {
    if (!periodos || !Array.isArray(periodos)) return true;
    const sumaPorcentajes = periodos.reduce((sum, periodo) => sum + (periodo.porcentaje || 0), 0);
    if (sumaPorcentajes !== 100) {
      throw new Error('La suma de los porcentajes debe ser 100%');
    }
    return true;
  }),
];

export const actualizarAsignaturaValidation = [
  body('nombre')
    .optional()
    .isLength({ min: 3 })
    .withMessage('El nombre debe tener al menos 3 caracteres')
    .isLength({ max: 50 })
    .withMessage('El nombre no puede exceder 50 caracteres'),

  body('descripcion')
    .optional()
    .isLength({ min: 10 })
    .withMessage('La descripción debe tener al menos 10 caracteres'),

  body('cursoId').optional().isMongoId().withMessage('ID de curso inválido'),

  body('docenteId').optional().isMongoId().withMessage('ID de docente inválido'),

  body('intensidad_horaria')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La intensidad horaria debe ser al menos 1 hora'),

  body('estado').optional().isIn(['ACTIVO', 'INACTIVO']).withMessage('Estado inválido'),
];

export const actualizarPeriodosValidation = [
  body('periodos')
    .isArray()
    .withMessage('Los periodos deben ser un array')
    .notEmpty()
    .withMessage('Los periodos son requeridos'),

  body('periodos.*.numero')
    .notEmpty()
    .withMessage('El número del periodo es requerido')
    .isInt()
    .withMessage('El número del periodo debe ser un entero'),

  body('periodos.*.nombre').notEmpty().withMessage('El nombre del periodo es requerido'),

  body('periodos.*.porcentaje')
    .notEmpty()
    .withMessage('El porcentaje es requerido')
    .isFloat({ min: 0, max: 100 })
    .withMessage('El porcentaje debe estar entre 0 y 100'),

  body('periodos.*.fecha_inicio')
    .notEmpty()
    .withMessage('La fecha de inicio es requerida')
    .isISO8601()
    .withMessage('Formato de fecha inválido'),

  body('periodos.*.fecha_fin')
    .notEmpty()
    .withMessage('La fecha de fin es requerida')
    .isISO8601()
    .withMessage('Formato de fecha inválido'),

  body('periodos').custom((periodos) => {
    if (!periodos || !Array.isArray(periodos)) return true;
    const sumaPorcentajes = periodos.reduce((sum, periodo) => sum + (periodo.porcentaje || 0), 0);
    if (sumaPorcentajes !== 100) {
      throw new Error('La suma de los porcentajes debe ser 100%');
    }
    return true;
  }),
];
