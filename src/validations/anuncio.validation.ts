import { body, param, query } from 'express-validator';

export const anuncioValidation = {
  // Validación para crear un anuncio
  crear: [
    body('titulo')
      .notEmpty()
      .withMessage('El título es obligatorio')
      .isString()
      .withMessage('El título debe ser texto')
      .isLength({ min: 3, max: 150 })
      .withMessage('El título debe tener entre 3 y 150 caracteres'),

    body('contenido')
      .notEmpty()
      .withMessage('El contenido es obligatorio')
      .isString()
      .withMessage('El contenido debe ser texto'),

    body('paraEstudiantes')
      .optional()
      .isBoolean()
      .withMessage('El campo paraEstudiantes debe ser un valor booleano'),

    body('paraDocentes')
      .optional()
      .isBoolean()
      .withMessage('El campo paraDocentes debe ser un valor booleano'),

    body('paraPadres')
      .optional()
      .isBoolean()
      .withMessage('El campo paraPadres debe ser un valor booleano'),

    body('destacado')
      .optional()
      .isBoolean()
      .withMessage('El campo destacado debe ser un valor booleano'),

    body('estaPublicado')
      .optional()
      .isBoolean()
      .withMessage('El campo estaPublicado debe ser un valor booleano'),
  ],

  // Validación para actualizar un anuncio
  actualizar: [
    param('id').isMongoId().withMessage('ID de anuncio inválido'),

    body('titulo')
      .optional()
      .isString()
      .withMessage('El título debe ser texto')
      .isLength({ min: 3, max: 150 })
      .withMessage('El título debe tener entre 3 y 150 caracteres'),

    body('contenido').optional().isString().withMessage('El contenido debe ser texto'),

    body('paraEstudiantes')
      .optional()
      .isBoolean()
      .withMessage('El campo paraEstudiantes debe ser un valor booleano'),

    body('paraDocentes')
      .optional()
      .isBoolean()
      .withMessage('El campo paraDocentes debe ser un valor booleano'),

    body('paraPadres')
      .optional()
      .isBoolean()
      .withMessage('El campo paraPadres debe ser un valor booleano'),

    body('destacado')
      .optional()
      .isBoolean()
      .withMessage('El campo destacado debe ser un valor booleano'),

    body('estaPublicado')
      .optional()
      .isBoolean()
      .withMessage('El campo estaPublicado debe ser un valor booleano'),
  ],

  // Validación para obtener un anuncio
  obtener: [param('id').isMongoId().withMessage('ID de anuncio inválido')],

  // Validación para obtener adjunto
  adjunto: [
    param('id').isMongoId().withMessage('ID de anuncio inválido'),
    param('archivoId').isMongoId().withMessage('ID de archivo inválido'),
  ],

  // Validaciones para listar
  listar: [
    query('pagina')
      .optional()
      .isInt({ min: 1 })
      .withMessage('La página debe ser un número mayor a 0')
      .toInt(),

    query('limite')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('El límite debe ser un número entre 1 y 100')
      .toInt(),

    query('soloDestacados')
      .optional()
      .isBoolean()
      .withMessage('soloDestacados debe ser un valor booleano')
      .toBoolean(),

    query('soloPublicados')
      .optional()
      .isBoolean()
      .withMessage('soloPublicados debe ser un valor booleano')
      .toBoolean(),

    query('paraRol')
      .optional()
      .isIn(['ESTUDIANTE', 'DOCENTE', 'PADRE'])
      .withMessage('Rol inválido'),
  ],

  // Validación para publicar un anuncio
  publicar: [param('id').isMongoId().withMessage('ID de anuncio inválido')],

  // Validación para eliminar un anuncio
  eliminar: [param('id').isMongoId().withMessage('ID de anuncio inválido')],
};

export default anuncioValidation;
