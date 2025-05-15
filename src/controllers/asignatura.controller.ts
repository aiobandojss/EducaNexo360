import { Request, Response, NextFunction } from 'express';
import Asignatura from '../models/asignatura.model';
import ApiError from '../utils/ApiError';

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

class AsignaturaController {
  async crear(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const asignaturaData = {
        ...req.body,
        escuelaId: req.user.escuelaId,
      };

      const asignatura = await Asignatura.create(asignaturaData);
      await asignatura.populate(['cursoId', 'docenteId']);

      res.status(201).json({
        success: true,
        data: asignatura,
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerTodas(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { cursoId, docenteId, estado } = req.query;
      const query: any = { escuelaId: req.user.escuelaId };

      if (cursoId) {
        query.cursoId = cursoId;
      }

      if (docenteId) {
        query.docenteId = docenteId;
      }

      if (estado) {
        query.estado = estado;
      }

      const asignaturas = await Asignatura.find(query)
        .populate(['cursoId', 'docenteId'])
        .sort({ nombre: 1 });

      res.json({
        success: true,
        data: asignaturas,
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerPorId(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const asignatura = await Asignatura.findOne({
        _id: req.params.id,
        escuelaId: req.user.escuelaId,
      }).populate(['cursoId', 'docenteId']);

      if (!asignatura) {
        throw new ApiError(404, 'Asignatura no encontrada');
      }

      res.json({
        success: true,
        data: asignatura,
      });
    } catch (error) {
      next(error);
    }
  }

  async actualizar(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const asignatura = await Asignatura.findOneAndUpdate(
        {
          _id: req.params.id,
          escuelaId: req.user.escuelaId,
        },
        req.body,
        { new: true, runValidators: true },
      ).populate(['cursoId', 'docenteId']);

      if (!asignatura) {
        throw new ApiError(404, 'Asignatura no encontrada');
      }

      res.json({
        success: true,
        data: asignatura,
      });
    } catch (error) {
      next(error);
    }
  }

  async eliminar(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const asignatura = await Asignatura.findOneAndUpdate(
        {
          _id: req.params.id,
          escuelaId: req.user.escuelaId,
        },
        { estado: 'INACTIVO' },
        { new: true },
      );

      if (!asignatura) {
        throw new ApiError(404, 'Asignatura no encontrada');
      }

      res.json({
        success: true,
        message: 'Asignatura desactivada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async actualizarPeriodos(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { periodos } = req.body;

      const asignatura = await Asignatura.findOneAndUpdate(
        {
          _id: req.params.id,
          escuelaId: req.user.escuelaId,
        },
        { periodos },
        { new: true, runValidators: true },
      ).populate(['cursoId', 'docenteId']);

      if (!asignatura) {
        throw new ApiError(404, 'Asignatura no encontrada');
      }

      res.json({
        success: true,
        data: asignatura,
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerPorCurso(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { cursoId } = req.params;

      const asignaturas = await Asignatura.find({
        cursoId,
        escuelaId: req.user.escuelaId,
        estado: 'ACTIVO',
      }).populate('docenteId', 'nombre apellidos');

      res.json({
        success: true,
        data: asignaturas,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new AsignaturaController();
