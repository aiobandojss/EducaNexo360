import express from 'express';
import {
  buscarEstudiantesParaAsociacion,
  obtenerEstudiantePorId,
  verificarAsociacionEstudiante,
} from '../controllers/estudiante.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

router.get(
  '/buscar',
  authenticate,
  authorize('ADMIN', 'RECTOR', 'COORDINADOR'),
  (req, res, next) => {
    buscarEstudiantesParaAsociacion(req, res).catch(next);
  },
);

router.get('/:id', authenticate, authorize('ADMIN', 'RECTOR', 'COORDINADOR'), (req, res, next) => {
  obtenerEstudiantePorId(req, res).catch(next);
});

router.post(
  '/:estudianteId/verificar-asociacion',
  authenticate,
  authorize('ADMIN', 'RECTOR', 'COORDINADOR'),
  (req, res, next) => {
    verificarAsociacionEstudiante(req, res).catch(next);
  },
);

export default router;
