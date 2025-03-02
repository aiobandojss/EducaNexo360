// src/controllers/notificacion.controller.ts

import { Request, Response, NextFunction } from 'express';
import Notificacion from '../models/notificacion.model';
import notificacionService from '../services/notificacion.service';
import ApiError from '../utils/ApiError';
import { EstadoNotificacion } from '../interfaces/INotificacion';

interface RequestWithUser extends Request {
  user?: {
    _id: string;
    escuelaId: string;
    tipo: string;
    email: string;
    nombre: string;
    apellidos: string;
    estado: string;
  };
}

export class NotificacionController {
  // Obtener notificaciones del usuario actual
  async obtenerNotificaciones(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { estado = 'todas', pagina = 1, limite = 20, tipo } = req.query;

      const opciones = {
        pagina: parseInt(pagina as string, 10),
        limite: parseInt(limite as string, 10),
      };

      // Construir filtro
      const filtro: any = {
        usuarioId: req.user._id,
        escuelaId: req.user.escuelaId,
      };

      // Filtrar por estado
      if (estado !== 'todas') {
        filtro.estado = estado;
      }

      // Filtrar por tipo
      if (tipo) {
        filtro.tipo = tipo;
      }

      // Ejecutar consulta paginada
      const skip = (opciones.pagina - 1) * opciones.limite;
      const notificaciones = await Notificacion.find(filtro)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(opciones.limite)
        .populate('entidadId');

      // Contar total de notificaciones
      const total = await Notificacion.countDocuments(filtro);

      // Contar no leídas
      const pendientes = await Notificacion.countDocuments({
        usuarioId: req.user._id,
        estado: EstadoNotificacion.PENDIENTE,
      });

      res.json({
        success: true,
        data: notificaciones,
        meta: {
          total,
          pendientes,
          pagina: opciones.pagina,
          limite: opciones.limite,
          totalPaginas: Math.ceil(total / opciones.limite),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Marcar una notificación como leída
  async marcarComoLeida(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { id } = req.params;

      const notificacion = await notificacionService.marcarComoLeida(id, req.user._id);

      if (!notificacion) {
        throw new ApiError(404, 'Notificación no encontrada');
      }

      res.json({
        success: true,
        data: notificacion,
      });
    } catch (error) {
      next(error);
    }
  }

  // Marcar todas las notificaciones como leídas
  async marcarTodasComoLeidas(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const cantidadActualizada = await notificacionService.marcarTodasComoLeidas(req.user._id);

      res.json({
        success: true,
        message: `${cantidadActualizada} notificaciones marcadas como leídas`,
        data: { cantidadActualizada },
      });
    } catch (error) {
      next(error);
    }
  }

  // Archivar una notificación
  async archivarNotificacion(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { id } = req.params;

      const notificacion = await notificacionService.archivarNotificacion(id, req.user._id);

      if (!notificacion) {
        throw new ApiError(404, 'Notificación no encontrada');
      }

      res.json({
        success: true,
        data: notificacion,
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear una notificación (solo para administración)
  async crearNotificacion(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      if (req.user.tipo !== 'ADMIN') {
        throw new ApiError(403, 'No tiene permisos para crear notificaciones');
      }

      const {
        usuarioId,
        titulo,
        mensaje,
        tipo,
        entidadId,
        entidadTipo,
        metadata,
        enviarEmail = false,
      } = req.body;

      const notificacion = await notificacionService.crearNotificacion({
        usuarioId,
        titulo,
        mensaje,
        tipo,
        escuelaId: req.user.escuelaId,
        entidadId,
        entidadTipo,
        metadata,
        enviarEmail,
      });

      res.status(201).json({
        success: true,
        data: notificacion,
      });
    } catch (error) {
      next(error);
    }
  }

  // Crear notificaciones masivas (solo para administración)
  async crearNotificacionMasiva(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      if (req.user.tipo !== 'ADMIN') {
        throw new ApiError(403, 'No tiene permisos para crear notificaciones masivas');
      }

      const {
        usuarioIds,
        titulo,
        mensaje,
        tipo,
        entidadId,
        entidadTipo,
        metadata,
        enviarEmail = false,
      } = req.body;

      if (!usuarioIds || !Array.isArray(usuarioIds) || usuarioIds.length === 0) {
        throw new ApiError(400, 'Debe especificar al menos un usuario destinatario');
      }

      const notificaciones = await notificacionService.crearNotificacionMasiva({
        usuarioIds,
        titulo,
        mensaje,
        tipo,
        escuelaId: req.user.escuelaId,
        entidadId,
        entidadTipo,
        metadata,
        enviarEmail,
      });

      res.status(201).json({
        success: true,
        message: `${notificaciones.length} notificaciones creadas exitosamente`,
        data: { count: notificaciones.length },
      });
    } catch (error) {
      next(error);
    }
  }
}

const notificacionController = new NotificacionController();
export default notificacionController;
