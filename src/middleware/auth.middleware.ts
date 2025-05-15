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
  escuelaId?: string; // Hecho opcional para evitar errores
  user?: any; // Added to support user data in token
}

interface MongooseUser extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  escuelaId?: mongoose.Types.ObjectId; // Hecho opcional para SUPER_ADMIN
  email: string;
  tipo: string;
  nombre: string;
  apellidos: string;
  estado: string;
}

export const authenticate = async (req: RequestWithUser, _res: Response, next: NextFunction) => {
  try {
    console.log('1. Iniciando autenticación');
    const authHeader = req.headers.authorization;
    console.log('2. Header de autorización:', authHeader?.substring(0, 20) + '...');

    if (!authHeader?.startsWith('Bearer ')) {
      console.log('3. Error: Token no proporcionado o formato incorrecto');
      throw new ApiError(401, 'No autorizado - Token no proporcionado');
    }

    const token = authHeader.substring(7);
    console.log('4. Token extraído:', token.substring(0, 20) + '...');

    try {
      console.log(
        '5. Verificando token con secreto:',
        (process.env.JWT_SECRET || 'tu_jwt_secret_muy_seguro').substring(0, 5) + '...',
      );
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'tu_jwt_secret_muy_seguro',
      ) as JwtPayload;

      console.log('6. Token decodificado:', JSON.stringify(decoded));
    } catch (verifyError) {
      console.log('6b. Error al verificar token:', verifyError);
      throw new ApiError(401, 'No autorizado - Token inválido o expirado');
    }

    // Si llegamos aquí, el token es válido. Volvemos a decodificarlo para usarlo
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'tu_jwt_secret_muy_seguro',
    ) as JwtPayload;

    console.log('7. Buscando usuario con ID:', decoded.sub);
    const user = (await Usuario.findById(decoded.sub).select('-password')) as MongooseUser;

    if (!user) {
      console.log('8. Error: Usuario no encontrado');
      throw new ApiError(401, 'No autorizado - Usuario no encontrado');
    }

    console.log('9. Usuario encontrado:', user.email, 'Tipo:', user.tipo, 'Estado:', user.estado);
    console.log('10. ¿Tiene escuelaId?', !!user.escuelaId);

    if (user.estado !== 'ACTIVO') {
      console.log('11. Error: Usuario inactivo');
      throw new ApiError(401, 'No autorizado - Usuario inactivo');
    }

    // Manejar caso especial para SUPER_ADMIN que puede no tener escuelaId
    if (user.tipo === 'SUPER_ADMIN' && !user.escuelaId) {
      console.log('12a. Asignando user para SUPER_ADMIN sin escuelaId');
      req.user = {
        _id: user._id.toString(),
        escuelaId: '', // String vacío para mantener la compatibilidad con la interfaz
        tipo: user.tipo,
        email: user.email,
        nombre: user.nombre,
        apellidos: user.apellidos,
        estado: user.estado,
      };
    } else {
      console.log('12b. Asignando user para usuario normal con escuelaId');
      req.user = {
        _id: user._id.toString(),
        escuelaId: user.escuelaId ? user.escuelaId.toString() : '', // Protección adicional
        tipo: user.tipo,
        email: user.email,
        nombre: user.nombre,
        apellidos: user.apellidos,
        estado: user.estado,
      };
    }

    console.log('13. Usuario asignado a req.user correctamente');
    next();
  } catch (error) {
    console.error('ERROR FINAL en authenticate:', error);
    next(new ApiError(401, 'No autorizado - Token inválido'));
  }
};

// Roles administrativos que pueden tener acceso a las funcionalidades administrativas
const ROLES_ADMINISTRATIVOS = ['ADMIN', 'RECTOR', 'COORDINADOR', 'ADMINISTRATIVO'];

// Función de autorización mejorada que permite acceso a roles administrativos adicionales
export const authorize = (...allowedRoles: string[]) => {
  return (req: RequestWithUser, _res: Response, next: NextFunction) => {
    console.log('A. Verificando autorización, roles permitidos:', allowedRoles);
    console.log('B. Usuario actual:', req.user?.tipo);

    if (!req.user) {
      console.log('C. Error: Usuario no autenticado');
      throw new ApiError(401, 'No autorizado - Usuario no autenticado');
    }

    // Verificar si el usuario tiene un rol administrativo para ciertos accesos
    if (allowedRoles.includes('ADMIN') && ROLES_ADMINISTRATIVOS.includes(req.user.tipo)) {
      console.log('D. Acceso concedido: rol administrativo reconocido');
      next();
      return;
    }

    // Si no es un caso especial administrativo, verificar las reglas normales
    if (!allowedRoles.includes(req.user.tipo)) {
      console.log('E. Error: Rol no permitido');
      throw new ApiError(403, 'Prohibido - No tiene permisos suficientes');
    }

    console.log('F. Autorización exitosa');
    next();
  };
};

// Helper para verificar si un usuario tiene acceso administrativo
export const hasAdminAccess = (userType: string): boolean => {
  return ROLES_ADMINISTRATIVOS.includes(userType);
};

export const authenticateDownload = async (
  req: RequestWithUser,
  res: Response,
  next: NextFunction,
) => {
  try {
    let token = '';

    // Primero intentar obtener el token del header de Authorization
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    // Si no existe en el header, intentar obtenerlo del query param
    else if (req.query.token) {
      token = req.query.token as string;
    }

    // Si no hay token, retornar error de autenticación
    if (!token) {
      throw new ApiError(401, 'No autorizado: Token no proporcionado');
    }

    // Verificar el token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'tu_jwt_secret_muy_seguro',
    ) as JwtPayload;

    // Obtener el usuario desde la base de datos (igual que en authenticate)
    const user = (await Usuario.findById(decoded.sub).select('-password')) as MongooseUser;

    if (!user) {
      throw new ApiError(401, 'No autorizado - Usuario no encontrado');
    }

    if (user.estado !== 'ACTIVO') {
      throw new ApiError(401, 'No autorizado - Usuario inactivo');
    }

    // Asignar el usuario al request
    // Manejar caso especial para SUPER_ADMIN que puede no tener escuelaId
    if (user.tipo === 'SUPER_ADMIN' && !user.escuelaId) {
      req.user = {
        _id: user._id.toString(),
        escuelaId: '', // String vacío para mantener la compatibilidad con la interfaz
        tipo: user.tipo,
        email: user.email,
        nombre: user.nombre,
        apellidos: user.apellidos,
        estado: user.estado,
      };
    } else {
      req.user = {
        _id: user._id.toString(),
        escuelaId: user.escuelaId ? user.escuelaId.toString() : '', // Protección adicional
        tipo: user.tipo,
        email: user.email,
        nombre: user.nombre,
        apellidos: user.apellidos,
        estado: user.estado,
      };
    }

    next();
  } catch (error) {
    // Si el token es inválido o ha expirado
    next(new ApiError(401, 'No autorizado: Token inválido o expirado'));
  }
};

// Middleware específico para verificar si un usuario puede ver cualquier perfil
export const canViewUserProfiles = (req: RequestWithUser, _res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new ApiError(401, 'No autorizado - Usuario no autenticado');
  }

  // Los roles ADMIN, RECTOR y COORDINADOR pueden ver cualquier perfil
  if (['ADMIN', 'RECTOR', 'COORDINADOR'].includes(req.user.tipo)) {
    next();
    return;
  }

  // Para otros roles, solo pueden ver su propio perfil (esto se maneja en el controlador)
  next();
};
