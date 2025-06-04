import express from 'express';
import publicController from '../controllers/public.controller';
import * as registroController from '../controllers/registro.controller';
import { validate } from '../middleware/validate.middleware';
import {
  validarCodigoInvitacionValidation,
  crearSolicitudRegistroValidation,
} from '../validations/public.validation';

const router = express.Router();

// Ruta para validar código de invitación
router.post(
  '/invitaciones/validar',
  validate(validarCodigoInvitacionValidation),
  publicController.validarCodigoInvitacion,
);

// Obtener información básica de un curso cuando se proporciona un código de invitación válido
router.get('/cursos/:cursoId/invitacion/:codigoInvitacion', publicController.obtenerInfoCurso);

// Obtener lista de cursos disponibles con un código de invitación válido
router.get('/cursos/invitacion/:codigoInvitacion', publicController.obtenerCursosDisponibles);

// Obtener información básica de un curso (pública)
router.get('/cursos/:cursoId/info', publicController.obtenerInfoCursoPublica);

router.get(
  '/estudiantes/buscar/:codigoInvitacion',
  publicController.buscarEstudiantesConInvitacion,
);

// Obtener información de estudiante específico usando código de invitación
router.get(
  '/estudiantes/:estudianteId/invitacion/:codigoInvitacion',
  publicController.obtenerEstudianteConInvitacion,
);

// Ruta para crear solicitud de registro (pública)
router.post(
  '/registro/solicitudes',
  validate(crearSolicitudRegistroValidation),
  registroController.crearSolicitud,
);

export default router;
