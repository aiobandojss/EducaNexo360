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
}

export default new EscuelaController();
