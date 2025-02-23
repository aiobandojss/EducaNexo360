import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth/auth.service';
import ApiError from '../utils/ApiError';

class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw new ApiError(400, 'Email y contraseña son requeridos');
      }

      const result = await authService.login(email, password);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, nombre, apellidos, tipo, escuelaId } = req.body;

      // Validaciones básicas
      if (!email || !password || !nombre || !apellidos || !tipo || !escuelaId) {
        throw new ApiError(400, 'Todos los campos son requeridos');
      }

      const result = await authService.register({
        email,
        password,
        nombre,
        apellidos,
        tipo,
        escuelaId,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new ApiError(400, 'Token de refresco es requerido');
      }

      const tokens = await authService.refreshAuth(refreshToken);

      res.json({
        success: true,
        data: tokens,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response) {
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });
  }
}

export default new AuthController(); // Exportamos una instancia del controlador
