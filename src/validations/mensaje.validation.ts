// src/validations/mensaje.validation.ts

import { body, query, param } from 'express-validator';
import mongoose from 'mongoose';
import { TipoMensaje, PrioridadMensaje, EstadoMensaje } from '../interfaces/IMensaje';

// Validación para creación de mensajes
export const crearMensajeValidation = [
  body('asunto')
    .notEmpty()
    .withMessage('El asunto es obligatorio')
    .isString()
    .withMessage('El asunto debe ser texto')
    .isLength({ max: 255 })
    .withMessage('El asunto no debe exceder los 255 caracteres'),

  body('contenido')
    .notEmpty()
    .withMessage('El contenido es obligatorio')
    .isString()
    .withMessage('El contenido debe ser texto'),

  body('destinatarios')
    .optional()
    .custom((value, { req }) => {
      // Si no hay destinatarios ni cursoIds, lanzar error
      if (!value && !req.body.cursoIds) {
        throw new Error('Debe especificar al menos un destinatario o curso');
      }

      // Validar formato si hay destinatarios
      if (value) {
        let destinatariosArray: string[];

        if (typeof value === 'string') {
          try {
            destinatariosArray = JSON.parse(value);
          } catch (error) {
            destinatariosArray = [value];
          }
        } else if (Array.isArray(value)) {
          destinatariosArray = value;
        } else {
          throw new Error('Formato de destinatarios inválido');
        }

        // Validar que todos los IDs sean válidos
        destinatariosArray.forEach((id: string) => {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error(`ID de destinatario inválido: ${id}`);
          }
        });
      }

      return true;
    }),

  body('destinatariosCc')
    .optional()
    .custom((value) => {
      if (value) {
        let destinatariosCcArray: string[];

        if (typeof value === 'string') {
          try {
            destinatariosCcArray = JSON.parse(value);
          } catch (error) {
            destinatariosCcArray = [value];
          }
        } else if (Array.isArray(value)) {
          destinatariosCcArray = value;
        } else {
          throw new Error('Formato de destinatarios CC inválido');
        }

        // Validar que todos los IDs sean válidos
        destinatariosCcArray.forEach((id: string) => {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error(`ID de destinatario CC inválido: ${id}`);
          }
        });
      }

      return true;
    }),

  body('cursoIds')
    .optional()
    .custom((value) => {
      if (value) {
        let cursoIdsArray: string[];

        if (typeof value === 'string') {
          try {
            cursoIdsArray = JSON.parse(value);
          } catch (error) {
            cursoIdsArray = [value];
          }
        } else if (Array.isArray(value)) {
          cursoIdsArray = value;
        } else {
          throw new Error('Formato de cursos inválido');
        }

        // Validar que todos los IDs sean válidos
        cursoIdsArray.forEach((id: string) => {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error(`ID de curso inválido: ${id}`);
          }
        });
      }

      return true;
    }),

  body('tipo').optional().isIn(Object.values(TipoMensaje)).withMessage('Tipo de mensaje inválido'),

  body('prioridad')
    .optional()
    .isIn(Object.values(PrioridadMensaje))
    .withMessage('Prioridad de mensaje inválida'),

  body('estado')
    .optional()
    .isIn(Object.values(EstadoMensaje))
    .withMessage('Estado de mensaje inválido'),

  body('etiquetas').optional().isArray().withMessage('Las etiquetas deben ser un array de strings'),

  body('etiquetas.*').optional().isString().withMessage('Cada etiqueta debe ser un string'),

  body('esRespuesta').optional().isBoolean().withMessage('esRespuesta debe ser un valor booleano'),

  body('mensajeOriginalId')
    .optional()
    .custom((value) => {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('ID del mensaje original inválido');
      }
      return true;
    }),
];

// Validación para listar mensajes
export const listarMensajesValidation = [
  query('bandeja')
    .optional()
    .isIn(['recibidos', 'enviados', 'borradores', 'archivados'])
    .withMessage('Bandeja inválida'),

  query('pagina')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero positivo'),

  query('limite')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('El límite debe ser un número entero entre 1 y 100'),

  query('desde').optional().isISO8601().withMessage('La fecha "desde" debe tener formato ISO 8601'),

  query('hasta').optional().isISO8601().withMessage('La fecha "hasta" debe tener formato ISO 8601'),
];

// Validación para obtener un mensaje
export const obtenerMensajeValidation = [
  param('id').isMongoId().withMessage('ID de mensaje inválido'),
];

// Validación para responder mensaje
export const responderMensajeValidation = [
  param('mensajeId').isMongoId().withMessage('ID de mensaje inválido'),

  body('asunto')
    .optional()
    .isString()
    .withMessage('El asunto debe ser texto')
    .isLength({ max: 255 })
    .withMessage('El asunto no debe exceder los 255 caracteres'),

  body('contenido')
    .notEmpty()
    .withMessage('El contenido es obligatorio')
    .isString()
    .withMessage('El contenido debe ser texto'),

  body('destinatariosCc')
    .optional()
    .custom((value) => {
      if (value) {
        let destinatariosCcArray: string[];

        if (typeof value === 'string') {
          try {
            destinatariosCcArray = JSON.parse(value);
          } catch (error) {
            destinatariosCcArray = [value];
          }
        } else if (Array.isArray(value)) {
          destinatariosCcArray = value;
        } else {
          throw new Error('Formato de destinatarios CC inválido');
        }

        // Validar que todos los IDs sean válidos
        destinatariosCcArray.forEach((id: string) => {
          if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new Error(`ID de destinatario CC inválido: ${id}`);
          }
        });
      }

      return true;
    }),
];

// Validación para archivar mensaje
export const archivarMensajeValidation = [
  param('id').isMongoId().withMessage('ID de mensaje inválido'),
];

// Validación para descargar adjunto
export const descargarAdjuntoValidation = [
  param('mensajeId').isMongoId().withMessage('ID de mensaje inválido'),

  param('adjuntoId').isMongoId().withMessage('ID de adjunto inválido'),
];

export default {
  crearMensajeValidation,
  listarMensajesValidation,
  obtenerMensajeValidation,
  responderMensajeValidation,
  archivarMensajeValidation,
  descargarAdjuntoValidation,
};
