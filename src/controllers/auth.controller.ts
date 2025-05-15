import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth/auth.service';
import ApiError from '../utils/ApiError';
import emailService from '../services/email.service';
import crypto from 'crypto';
import Usuario from '../models/usuario.model';
import config from '../config/config';

// Exportar como objeto en lugar de clase para compatibilidad
export const authController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
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
  },

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
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
  },

  async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
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
  },

  async logout(_req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;

      // Buscar usuario por email
      const user = await Usuario.findOne({ email });

      // Por seguridad, no revelar si el email existe
      if (!user) {
        res.json({
          success: true,
          message:
            'Si el correo electrónico existe, recibirás instrucciones para recuperar tu contraseña',
        });
        return;
      }

      // Generar token aleatorio
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Almacenar hash del token en la base de datos
      const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

      // Token válido por 1 hora
      const resetPasswordExpires = new Date(Date.now() + 3600000);

      // Guardar token en el documento de usuario
      user.resetPasswordToken = resetPasswordToken;
      user.resetPasswordExpires = resetPasswordExpires;
      await user.save();

      // Crear URL para restablecer contraseña
      const frontendUrl = config.frontendUrl || 'http://localhost:3000';
      const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

      // Enviar email de recuperación
      await emailService.sendPasswordResetEmail(user.email, {
        nombre: user.nombre,
        resetUrl,
        expirationTime: '1 hora',
      });

      // Responder al cliente
      res.json({
        success: true,
        message:
          'Si el correo electrónico existe, recibirás instrucciones para recuperar tu contraseña',
      });
    } catch (error) {
      console.error('Error en forgotPassword:', error);
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;

      // Convertir token en hash para comparar con el almacenado
      const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

      // Buscar usuario con el token y que no haya expirado
      const user = await Usuario.findOne({
        resetPasswordToken,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        throw new ApiError(400, 'El token es inválido o ha expirado');
      }

      // Actualizar contraseña
      user.password = password;

      // Limpiar campos de recuperación
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;

      await user.save();

      res.json({
        success: true,
        message: 'Contraseña restablecida exitosamente',
      });
    } catch (error) {
      console.error('Error en resetPassword:', error);
      next(error);
    }
  },
};

// Exportación para compatibilidad con código existente
export default authController;
