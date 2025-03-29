// src/validations/system.validation.ts
import { body } from 'express-validator';

export const systemInitializeValidation = [
  // Validación de escuela
  body('escuela.nombre').notEmpty().withMessage('El nombre de la escuela es requerido'),
  body('escuela.codigo').notEmpty().withMessage('El código de la escuela es requerido'),
  body('escuela.direccion').notEmpty().withMessage('La dirección es requerida'),
  body('escuela.telefono').notEmpty().withMessage('El teléfono es requerido'),
  body('escuela.email').isEmail().withMessage('Email inválido'),

  // Cambiar la validación del sitio web para permitir valores vacíos o correctamente formateados
  body('escuela.sitioWeb')
    .optional({ checkFalsy: true }) // checkFalsy permite valores vacíos, undefined, null, false
    .custom((value) => {
      // Si no hay valor, es válido
      if (!value) return true;

      // Verificar si la URL ya tiene un protocolo
      if (!/^https?:\/\//i.test(value)) {
        // Si no tiene protocolo, añadimos 'http://'
        value = 'http://' + value;
      }

      // Validar que sea una URL correcta
      try {
        new URL(value);
        return true;
      } catch (e) {
        return false;
      }
    })
    .withMessage('La URL del sitio web debe tener un formato válido (ej: http://ejemplo.com)'),

  body('escuela.configuracion.periodos_academicos')
    .isInt({ min: 1, max: 6 })
    .withMessage('Los periodos académicos deben ser entre 1 y 6'),

  body('escuela.configuracion.escala_calificacion.minima')
    .isNumeric()
    .withMessage('La calificación mínima debe ser numérica'),

  body('escuela.configuracion.escala_calificacion.maxima')
    .isNumeric()
    .withMessage('La calificación máxima debe ser numérica')
    .custom((value, { req }) => {
      const min = req.body.escuela.configuracion.escala_calificacion.minima;
      return value > min;
    })
    .withMessage('La calificación máxima debe ser mayor que la mínima'),

  // Validación de administrador
  body('admin.nombre').notEmpty().withMessage('El nombre es requerido'),
  body('admin.apellidos').notEmpty().withMessage('Los apellidos son requeridos'),
  body('admin.email').isEmail().withMessage('Email inválido'),
  body('admin.password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
];
