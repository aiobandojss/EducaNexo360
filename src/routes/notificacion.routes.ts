// src/routes/notificacion.routes.ts

import express, { Request, Response, NextFunction } from 'express';
import notificacionController from '../controllers/notificacion.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas para usuarios normales
router.get('/', (req: any, res: Response, next: NextFunction) => {
  notificacionController.obtenerNotificaciones(req, res, next);
});

router.put('/:id/leer', (req: any, res: Response, next: NextFunction) => {
  notificacionController.marcarComoLeida(req, res, next);
});

router.put('/leer-todas', (req: any, res: Response, next: NextFunction) => {
  notificacionController.marcarTodasComoLeidas(req, res, next);
});

router.put('/:id/archivar', (req: any, res: Response, next: NextFunction) => {
  notificacionController.archivarNotificacion(req, res, next);
});

// Rutas para administradores
router.post('/', authorize('ADMIN'), (req: any, res: Response, next: NextFunction) => {
  notificacionController.crearNotificacion(req, res, next);
});

router.post('/masiva', authorize('ADMIN'), (req: any, res: Response, next: NextFunction) => {
  notificacionController.crearNotificacionMasiva(req, res, next);
});

export default router;
