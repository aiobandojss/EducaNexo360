import { Request, Response, NextFunction } from 'express';
import Escuela from '../models/escuela.model';
import ApiError from '../utils/ApiError';

class EscuelaController {
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const escuela = await Escuela.create(req.body);
      res.status(201).json({
        success: true,
        data: escuela,
      });
    } catch (error) {
      next(error);
    }
  }

  async obtener(req: Request, res: Response, next: NextFunction) {
    try {
      const escuelas = await Escuela.find();
      res.json({
        success: true,
        data: escuelas,
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const escuela = await Escuela.findById(req.params.id);

      if (!escuela) {
        throw new ApiError(404, 'Escuela no encontrada');
      }

      res.json({
        success: true,
        data: escuela,
      });
    } catch (error) {
      next(error);
    }
  }

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const escuela = await Escuela.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!escuela) {
        throw new ApiError(404, 'Escuela no encontrada');
      }

      res.json({
        success: true,
        data: escuela,
      });
    } catch (error) {
      next(error);
    }
  }

  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const escuela = await Escuela.findByIdAndUpdate(
        req.params.id,
        { estado: 'INACTIVO' },
        { new: true },
      );

      if (!escuela) {
        throw new ApiError(404, 'Escuela no encontrada');
      }

      res.json({
        success: true,
        message: 'Escuela desactivada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async actualizarConfiguracion(req: Request, res: Response, next: NextFunction) {
    try {
      const escuela = await Escuela.findByIdAndUpdate(
        req.params.id,
        { configuracion: req.body },
        { new: true, runValidators: true },
      );

      if (!escuela) {
        throw new ApiError(404, 'Escuela no encontrada');
      }

      res.json({
        success: true,
        data: escuela,
      });
    } catch (error) {
      next(error);
    }
  }

  async actualizarPeriodosAcademicos(req: Request, res: Response, next: NextFunction) {
    try {
      const escuela = await Escuela.findByIdAndUpdate(
        req.params.id,
        { periodos_academicos: req.body.periodos_academicos },
        { new: true, runValidators: true },
      );

      if (!escuela) {
        throw new ApiError(404, 'Escuela no encontrada');
      }

      res.json({
        success: true,
        data: escuela,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new EscuelaController(); // Exportamos una instancia por defecto
