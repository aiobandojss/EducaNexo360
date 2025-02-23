import { Request, Response, NextFunction } from 'express';
import Curso from '../models/curso.model';
import ApiError from '../utils/ApiError';

class CursoController {
  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { escuelaId } = req.user;
      const cursoData = {
        ...req.body,
        escuelaId,
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

  async obtenerTodos(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { escuelaId } = req.user;
      const { año_academico, estado } = req.query;

      const query: any = { escuelaId };

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

  async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { id } = req.params;
      const { escuelaId } = req.user;

      const curso = await Curso.findOne({ _id: id, escuelaId }).populate([
        'director_grupo',
        'estudiantes',
        'asignaturas.docenteId',
      ]);

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

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { id } = req.params;
      const { escuelaId } = req.user;
      const actualizacion = req.body;

      const curso = await Curso.findOneAndUpdate({ _id: id, escuelaId }, actualizacion, {
        new: true,
        runValidators: true,
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

  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { id } = req.params;
      const { escuelaId } = req.user;

      const curso = await Curso.findOneAndUpdate(
        { _id: id, escuelaId },
        { estado: 'INACTIVO' },
        { new: true },
      );

      if (!curso) {
        throw new ApiError(404, 'Curso no encontrado');
      }

      res.json({
        success: true,
        message: 'Curso eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async agregarEstudiantes(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { id } = req.params;
      const { escuelaId } = req.user;
      const { estudiantes } = req.body;

      const curso = await Curso.findOneAndUpdate(
        { _id: id, escuelaId },
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

  async removerEstudiantes(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { id } = req.params;
      const { escuelaId } = req.user;
      const { estudiantes } = req.body;

      const curso = await Curso.findOneAndUpdate(
        { _id: id, escuelaId },
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
