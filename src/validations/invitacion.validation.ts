import { body } from 'express-validator';
import { TipoInvitacion } from '../models/invitacion.model';

export const invitacionValidation = {
  crearInvitacion: [
    body('tipo').isIn(Object.values(TipoInvitacion)).withMessage('Tipo de invitación no válido'),
    body('cursoId').optional().isMongoId().withMessage('ID de curso no válido'),
    body('estudianteId').optional().isMongoId().withMessage('ID de estudiante no válido'),
    body('cantidadUsos')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('La cantidad de usos debe ser un número entre 1 y 100'),
    body('fechaExpiracion').optional().isISO8601().withMessage('Fecha de expiración no válida'),
  ],

  validarCodigo: [
    body('codigo').notEmpty().withMessage('El código de invitación es requerido').trim(),
  ],
};
