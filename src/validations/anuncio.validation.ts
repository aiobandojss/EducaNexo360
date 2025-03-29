// src/validations/anuncio.validation.ts

import { body } from 'express-validator';
import { TipoAnuncio, EstadoAnuncio } from '../interfaces/IAnuncio';

export const crearAnuncioValidation = [
  body('titulo')
    .notEmpty()
    .withMessage('El título es requerido')
    .isLength({ max: 100 })
    .withMessage('El título no puede exceder los 100 caracteres')
    .trim(),

  body('contenido').notEmpty().withMessage('El contenido es requerido'),

  body('tipo').optional().isIn(Object.values(TipoAnuncio)).withMessage('Tipo de anuncio no válido'),

  body('estado')
    .optional()
    .isIn(Object.values(EstadoAnuncio))
    .withMessage('Estado de anuncio no válido'),

  body('cursoId').optional().isMongoId().withMessage('ID de curso inválido'),

  body('destacado').optional().isBoolean().withMessage('Destacado debe ser un valor booleano'),

  body('fechaPublicacion')
    .optional()
    .isISO8601()
    .withMessage('La fecha de publicación debe ser válida'),

  body('fechaExpiracion')
    .optional()
    .isISO8601()
    .withMessage('La fecha de expiración debe ser válida')
    .custom((value, { req }) => {
      if (req.body.fechaPublicacion) {
        const fechaPublicacion = new Date(req.body.fechaPublicacion);
        const fechaExpiracion = new Date(value);
        if (fechaExpiracion < fechaPublicacion) {
          throw new Error('La fecha de expiración no puede ser anterior a la fecha de publicación');
        }
      }
      return true;
    }),

  body('destinatarios')
    .optional()
    .custom(() => {
      // Ignoramos los destinatarios específicos - solo se permiten anuncios por grupos o generales
      console.warn(
        'La propiedad destinatarios está deshabilitada. Los anuncios ahora son solo por grupos o generales.',
      );
      return true;
    }),
];

export const actualizarAnuncioValidation = [
  body('titulo')
    .optional()
    .notEmpty()
    .withMessage('El título no puede estar vacío')
    .isLength({ max: 100 })
    .withMessage('El título no puede exceder los 100 caracteres')
    .trim(),

  body('contenido').optional().notEmpty().withMessage('El contenido no puede estar vacío'),

  body('tipo').optional().isIn(Object.values(TipoAnuncio)).withMessage('Tipo de anuncio no válido'),

  body('estado')
    .optional()
    .isIn(Object.values(EstadoAnuncio))
    .withMessage('Estado de anuncio no válido'),

  body('cursoId').optional().isMongoId().withMessage('ID de curso inválido'),

  body('destacado').optional().isBoolean().withMessage('Destacado debe ser un valor booleano'),

  body('fechaPublicacion')
    .optional()
    .isISO8601()
    .withMessage('La fecha de publicación debe ser válida'),

  body('fechaExpiracion')
    .optional()
    .isISO8601()
    .withMessage('La fecha de expiración debe ser válida')
    .custom((value, { req }) => {
      const fechaExpiracion = new Date(value);
      let fechaPublicacion;

      if (req.body.fechaPublicacion) {
        fechaPublicacion = new Date(req.body.fechaPublicacion);
      } else if (req.anuncio && req.anuncio.fechaPublicacion) {
        fechaPublicacion = new Date(req.anuncio.fechaPublicacion);
      } else {
        return true; // No hay fecha de publicación para comparar
      }

      if (fechaExpiracion < fechaPublicacion) {
        throw new Error('La fecha de expiración no puede ser anterior a la fecha de publicación');
      }
      return true;
    }),

  body('destinatarios')
    .optional()
    .custom(() => {
      // Ignoramos los destinatarios específicos - solo se permiten anuncios por grupos o generales
      console.warn(
        'La propiedad destinatarios está deshabilitada. Los anuncios ahora son solo por grupos o generales.',
      );
      return true;
    }),
];

export const publicarAnuncioValidation = [
  body('fechaPublicacion')
    .optional()
    .isISO8601()
    .withMessage('La fecha de publicación debe ser válida'),

  body('fechaExpiracion')
    .optional()
    .isISO8601()
    .withMessage('La fecha de expiración debe ser válida')
    .custom((value, { req }) => {
      if (req.body.fechaPublicacion) {
        const fechaPublicacion = new Date(req.body.fechaPublicacion);
        const fechaExpiracion = new Date(value);
        if (fechaExpiracion < fechaPublicacion) {
          throw new Error('La fecha de expiración no puede ser anterior a la fecha de publicación');
        }
      }
      return true;
    }),
];
