// src/utils/catchAsync.ts

import { Request, Response, NextFunction } from 'express';

/**
 * Envuelve un controlador async/await para manejar errores automáticamente
 * @param fn Función controladora a envolver
 * @returns Función con manejo de errores incorporado
 */
export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};
