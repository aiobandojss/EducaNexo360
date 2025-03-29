import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import ApiError from '../utils/ApiError';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Ejecutar todas las validaciones
      await Promise.all(validations.map((validation) => validation.run(req)));

      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }

      const extractedErrors: string[] = [];
      errors.array().map((err) => extractedErrors.push(err.msg));

      // En lugar de lanzar un error, pasarlo al siguiente middleware
      // que debería ser un manejador de errores
      const error = new ApiError(400, extractedErrors.join(', '));
      return next(error);
    } catch (error) {
      // Manejar cualquier error inesperado durante la validación
      console.error('Error en middleware de validación:', error);
      return next(new ApiError(500, 'Error interno del servidor durante la validación'));
    }
  };
};
