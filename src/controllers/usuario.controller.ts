import { Request, Response, NextFunction } from 'express';
import Usuario from '../models/usuario.model';
import ApiError from '../utils/ApiError';

// Extender el tipo Request para incluir el usuario
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

class UsuarioController {
  async obtenerUsuarios(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const usuarios = await Usuario.find({ escuelaId: req.user.escuelaId }).select('-password');

      res.json({
        success: true,
        data: usuarios,
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerUsuario(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const usuario = await Usuario.findOne({
        _id: req.params.id,
        escuelaId: req.user.escuelaId,
      }).select('-password');

      if (!usuario) {
        throw new ApiError(404, 'Usuario no encontrado');
      }

      res.json({
        success: true,
        data: usuario,
      });
    } catch (error) {
      next(error);
    }
  }

  async actualizarUsuario(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const usuario = await Usuario.findOneAndUpdate(
        {
          _id: req.params.id,
          escuelaId: req.user.escuelaId,
        },
        req.body,
        { new: true, runValidators: true },
      ).select('-password');

      if (!usuario) {
        throw new ApiError(404, 'Usuario no encontrado');
      }

      res.json({
        success: true,
        data: usuario,
      });
    } catch (error) {
      next(error);
    }
  }

  async buscarUsuarios(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const searchTerm = req.query.q as string;
      const filter = {
        escuelaId: req.user.escuelaId,
        $or: [
          { nombre: new RegExp(searchTerm, 'i') },
          { apellidos: new RegExp(searchTerm, 'i') },
          { email: new RegExp(searchTerm, 'i') },
        ],
      };

      const usuarios = await Usuario.find(filter).select('-password').limit(10);

      res.json({
        success: true,
        data: usuarios,
      });
    } catch (error) {
      next(error);
    }
  }

  async cambiarPassword(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { passwordActual, nuevaPassword } = req.body;
      const usuario = await Usuario.findOne({
        _id: req.params.id,
        escuelaId: req.user.escuelaId,
      });

      if (!usuario) {
        throw new ApiError(404, 'Usuario no encontrado');
      }

      const isPasswordMatch = await usuario.compararPassword(passwordActual);
      if (!isPasswordMatch) {
        throw new ApiError(400, 'La contraseña actual es incorrecta');
      }

      usuario.password = nuevaPassword;
      await usuario.save();

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async eliminarUsuario(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const usuario = await Usuario.findOneAndUpdate(
        {
          _id: req.params.id,
          escuelaId: req.user.escuelaId,
        },
        { estado: 'INACTIVO' },
        { new: true },
      );

      if (!usuario) {
        throw new ApiError(404, 'Usuario no encontrado');
      }

      res.json({
        success: true,
        message: 'Usuario desactivado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new UsuarioController();
