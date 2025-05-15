import { Request, Response, NextFunction } from 'express';
import registroService from '../services/registro.service';
import { EstadoSolicitud } from '../models/solicitud-registro.model';
import { catchAsync } from '../utils/catchAsync';

interface CustomRequest extends Request {
  usuario?: {
    _id: string;
    escuelaId: string;
  };
}

export const crearSolicitud = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { invitacionId, nombre, apellidos, email, telefono, estudiantes } = req.body;

    const solicitud = await registroService.crearSolicitud({
      invitacionId,
      nombre,
      apellidos,
      email,
      telefono,
      estudiantes,
    });

    res.status(201).json({
      success: true,
      data: solicitud,
      message:
        'Solicitud de registro creada exitosamente. Un administrador revisará su solicitud en breve.',
    });
  },
);

export const aprobarSolicitud = catchAsync(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const usuarioAdminId = req.usuario?._id as string;

    const resultado = await registroService.aprobarSolicitud(id, usuarioAdminId);

    res.status(200).json({
      success: true,
      data: resultado,
      message: 'Solicitud aprobada exitosamente',
    });
  },
);

export const rechazarSolicitud = catchAsync(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { motivo } = req.body;
    const usuarioAdminId = req.usuario?._id as string;

    const resultado = await registroService.rechazarSolicitud(id, usuarioAdminId, motivo);

    res.status(200).json({
      success: true,
      message: 'Solicitud rechazada exitosamente',
    });
  },
);

export const obtenerSolicitudesPendientes = catchAsync(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const escuelaId = req.params.escuelaId || (req.usuario?.escuelaId as string);
    const pagina = parseInt(req.query.pagina as string) || 1;
    const limite = parseInt(req.query.limite as string) || 10;

    const resultado = await registroService.obtenerSolicitudesPendientes(escuelaId, pagina, limite);

    res.status(200).json({
      success: true,
      data: resultado,
      message: 'Solicitudes pendientes obtenidas exitosamente',
    });
  },
);

export const obtenerSolicitudPorId = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const solicitud = await registroService.obtenerSolicitudPorId(id);

    res.status(200).json({
      success: true,
      data: solicitud,
      message: 'Solicitud obtenida exitosamente',
    });
  },
);

export const obtenerHistorialSolicitudes = catchAsync(
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const escuelaId = req.params.escuelaId || (req.usuario?.escuelaId as string);
    const { estado } = req.query;
    const pagina = parseInt(req.query.pagina as string) || 1;
    const limite = parseInt(req.query.limite as string) || 10;

    const resultado = await registroService.obtenerHistorialSolicitudes(
      escuelaId,
      estado as EstadoSolicitud,
      pagina,
      limite,
    );

    res.status(200).json({
      success: true,
      data: resultado,
      message: 'Historial de solicitudes obtenido exitosamente',
    });
  },
);
