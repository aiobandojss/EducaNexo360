import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Usuario from '../models/usuario.model';
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

interface JwtPayload {
  sub: string;
  tipo: string;
  escuelaId: string;
}

interface MongooseUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  escuelaId: mongoose.Types.ObjectId;
  email: string;
  tipo: string;
  nombre: string;
  apellidos: string;
  estado: string;
}

export const authenticate = async (req: RequestWithUser, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new ApiError(401, 'No autorizado - Token no proporcionado');
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'tu_jwt_secret_muy_seguro',
    ) as JwtPayload;

    const user = (await Usuario.findById(decoded.sub).select('-password')) as MongooseUser;

    if (!user) {
      throw new ApiError(401, 'No autorizado - Usuario no encontrado');
    }

    if (user.estado !== 'ACTIVO') {
      throw new ApiError(401, 'No autorizado - Usuario inactivo');
    }

    req.user = {
      _id: user._id.toString(),
      escuelaId: user.escuelaId.toString(),
      tipo: user.tipo,
      email: user.email,
      nombre: user.nombre,
      apellidos: user.apellidos,
      estado: user.estado,
    };

    next();
  } catch (error) {
    next(new ApiError(401, 'No autorizado - Token inválido'));
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return (req: RequestWithUser, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ApiError(401, 'No autorizado - Usuario no autenticado');
    }

    if (!allowedRoles.includes(req.user.tipo)) {
      throw new ApiError(403, 'Prohibido - No tiene permisos suficientes');
    }

    next();
  };
};
