import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';
import { config } from '../config/config';

export const errorConverter = (err: any, req: Request, res: Response, next: NextFunction) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error instanceof SyntaxError ? 400 : 500;
    const message = error.message || `${String(error)}`;
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

export const errorHandler = (err: ApiError, req: Request, res: Response, _next: NextFunction) => {
  let { statusCode, message } = err;

  if (config.env === 'production' && !err.isOperational) {
    statusCode = 500;
    message = 'Error Interno del Servidor';
  }

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development') {
    console.error(err);
  }

  res.status(statusCode).send(response);
};
