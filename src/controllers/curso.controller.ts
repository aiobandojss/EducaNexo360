import { Request, Response, NextFunction } from 'express';
import Curso from '../models/curso.model';
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

class CursoController {
  async crear(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const cursoData = {
        ...req.body,
        escuelaId: req.user.escuelaId,
      };

      const curso = await Curso.create(cursoData);
      await curso.populate(['director_grupo', 'estudiantes']);

      res.status(201).json({
        success: true,
        data: curso,
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerTodos(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { año_academico, estado } = req.query;
      const query: any = { escuelaId: req.user.escuelaId };

      if (año_academico) {
        query.año_academico = año_academico;
      }

      if (estado) {
        query.estado = estado;
      }

      const cursos = await Curso.find(query)
        .populate(['director_grupo', 'estudiantes'])
        .sort({ nombre: 1 });

      res.json({
        success: true,
        data: cursos,
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

      const curso = await Curso.findOne({
        _id: req.params.id,
        escuelaId: req.user.escuelaId,
      }).populate(['director_grupo', 'estudiantes']);

      if (!curso) {
        throw new ApiError(404, 'Curso no encontrado');
      }

      res.json({
        success: true,
        data: curso,
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

      const curso = await Curso.findOneAndUpdate(
        {
          _id: req.params.id,
          escuelaId: req.user.escuelaId,
        },
        req.body,
        { new: true, runValidators: true },
      ).populate(['director_grupo', 'estudiantes']);

      if (!curso) {
        throw new ApiError(404, 'Curso no encontrado');
      }

      res.json({
        success: true,
        data: curso,
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

      const curso = await Curso.findOneAndUpdate(
        {
          _id: req.params.id,
          escuelaId: req.user.escuelaId,
        },
        { estado: 'INACTIVO' },
        { new: true },
      );

      if (!curso) {
        throw new ApiError(404, 'Curso no encontrado');
      }

      res.json({
        success: true,
        message: 'Curso desactivado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async agregarEstudiantes(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { estudiantes } = req.body;

      const curso = await Curso.findOneAndUpdate(
        {
          _id: req.params.id,
          escuelaId: req.user.escuelaId,
        },
        { $addToSet: { estudiantes: { $each: estudiantes } } },
        { new: true },
      ).populate(['director_grupo', 'estudiantes']);

      if (!curso) {
        throw new ApiError(404, 'Curso no encontrado');
      }

      res.json({
        success: true,
        data: curso,
      });
    } catch (error) {
      next(error);
    }
  }

  async removerEstudiantes(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { estudiantes } = req.body;

      const curso = await Curso.findOneAndUpdate(
        {
          _id: req.params.id,
          escuelaId: req.user.escuelaId,
        },
        { $pullAll: { estudiantes } },
        { new: true },
      ).populate(['director_grupo', 'estudiantes']);

      if (!curso) {
        throw new ApiError(404, 'Curso no encontrado');
      }

      res.json({
        success: true,
        data: curso,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CursoController();
