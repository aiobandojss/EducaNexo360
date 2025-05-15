import express from 'express';
import {
  crearSolicitud,
  aprobarSolicitud,
  rechazarSolicitud,
  obtenerSolicitudesPendientes,
  obtenerSolicitudPorId,
  obtenerHistorialSolicitudes,
} from '../controllers/registro.controller';

// Importar con los nombres correctos
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { registroValidation } from '../validations/registro.validation';

const router = express.Router();

// Rutas públicas (no requieren autenticación)
router.post('/solicitud', validate(registroValidation.crearSolicitud), crearSolicitud);

// Rutas protegidas (requieren autenticación)
router.get(
  '/solicitudes',
  authenticate,
  authorize('ADMIN', 'RECTOR', 'COORDINADOR'),
  obtenerSolicitudesPendientes,
);

router.get(
  '/solicitudes/historial',
  authenticate,
  authorize('ADMIN', 'RECTOR', 'COORDINADOR'),
  obtenerHistorialSolicitudes,
);

router.get(
  '/solicitudes/:id',
  authenticate,
  authorize('ADMIN', 'RECTOR', 'COORDINADOR'),
  obtenerSolicitudPorId,
);

router.put(
  '/solicitudes/:id/aprobar',
  authenticate,
  authorize('ADMIN', 'RECTOR', 'COORDINADOR'),
  aprobarSolicitud,
);

router.put(
  '/solicitudes/:id/rechazar',
  authenticate,
  authorize('ADMIN', 'RECTOR', 'COORDINADOR'),
  validate(registroValidation.rechazarSolicitud),
  rechazarSolicitud,
);

export default router;
