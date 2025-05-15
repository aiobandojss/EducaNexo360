import { Request, Response, NextFunction } from 'express';
import Invitacion, { EstadoInvitacion } from '../models/invitacion.model';
import Curso, { ICurso } from '../models/curso.model';
import ApiError from '../utils/ApiError';
import { catchAsync } from '../utils/catchAsync';

/**
 * Controlador para endpoints públicos relacionados con invitaciones
 * Estos endpoints no requieren autenticación y son utilizados
 * principalmente para el proceso de registro de padres y estudiantes
 */
class PublicController {
  /**
   * Obtiene información básica de un curso por ID
   * Solo funciona cuando se proporciona un código de invitación válido
   */
  obtenerInfoCurso = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { cursoId, codigoInvitacion } = req.params;

    if (!cursoId || !codigoInvitacion) {
      throw new ApiError(400, 'Se requiere ID del curso y código de invitación');
    }

    // Verificar que el código de invitación es válido y corresponde al curso
    const invitacion = await Invitacion.findOne({
      codigo: codigoInvitacion,
      estado: EstadoInvitacion.ACTIVO,
      $or: [
        { cursoId }, // Invitación específica para este curso
        { tipo: 'PERSONAL' }, // O invitación personal (que permite cualquier curso)
      ],
    });

    if (!invitacion) {
      throw new ApiError(404, 'Código de invitación no válido para este curso');
    }

    // Verificar si la invitación ha expirado
    if (invitacion.fechaExpiracion && invitacion.fechaExpiracion < new Date()) {
      throw new ApiError(400, 'Este código de invitación ha expirado');
    }

    // Obtener información básica del curso
    const curso = await Curso.findById(cursoId).select(
      'nombre nivel grado grupo jornada año_academico estado',
    );

    if (!curso) {
      throw new ApiError(404, 'Curso no encontrado');
    }

    if (curso.estado !== 'ACTIVO') {
      throw new ApiError(400, 'Este curso no está activo');
    }

    res.status(200).json({
      success: true,
      data: curso,
    });
  });

  /**
   * Obtiene información de invitación por código
   * Para validar el código de invitación en el formulario de registro
   */
  validarCodigoInvitacion = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { codigo } = req.body;

    if (!codigo) {
      throw new ApiError(400, 'Se requiere código de invitación');
    }

    const invitacion = await Invitacion.findOne({
      codigo,
      estado: EstadoInvitacion.ACTIVO,
    }).populate<{ cursoId: ICurso }>('cursoId', 'nombre nivel grado grupo');

    if (!invitacion) {
      throw new ApiError(404, 'Código de invitación no válido o expirado');
    }

    // Verificar si ha alcanzado el límite de usos
    if (invitacion.usosActuales >= invitacion.cantidadUsos) {
      throw new ApiError(400, 'Este código ha alcanzado el límite máximo de usos');
    }

    // Verificar si ha expirado
    if (invitacion.fechaExpiracion && invitacion.fechaExpiracion < new Date()) {
      // Actualizar estado a expirado
      invitacion.estado = EstadoInvitacion.EXPIRADO;
      await invitacion.save();

      throw new ApiError(400, 'Este código de invitación ha expirado');
    }

    // Devolver información básica sobre la invitación
    const respuesta = {
      invitacionId: invitacion._id,
      tipo: invitacion.tipo,
      escuelaId: invitacion.escuelaId,
      cursoId: invitacion.cursoId,
      estudianteId: invitacion.estudianteId,
      cursoInfo: invitacion.cursoId
        ? {
            nombre: invitacion.cursoId.nombre,
            nivel: invitacion.cursoId.nivel,
            grado: invitacion.cursoId.grado,
            grupo: invitacion.cursoId.grupo,
          }
        : null,
    };

    res.status(200).json({
      success: true,
      data: respuesta,
    });
  });

  /**
   * Obtiene lista de cursos disponibles para una escuela
   * Solo funciona cuando se proporciona un código de invitación válido
   */
  obtenerCursosDisponibles = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { codigoInvitacion } = req.params;

    if (!codigoInvitacion) {
      throw new ApiError(400, 'Se requiere código de invitación');
    }

    // Verificar que el código de invitación es válido
    const invitacion = await Invitacion.findOne({
      codigo: codigoInvitacion,
      estado: EstadoInvitacion.ACTIVO,
    });

    if (!invitacion) {
      throw new ApiError(404, 'Código de invitación no válido o expirado');
    }

    // Verificar si la invitación ha expirado
    if (invitacion.fechaExpiracion && invitacion.fechaExpiracion < new Date()) {
      throw new ApiError(400, 'Este código de invitación ha expirado');
    }

    // Obtener la lista de cursos activos de la escuela
    const cursos = await Curso.find({
      escuelaId: invitacion.escuelaId,
      estado: 'ACTIVO',
    }).select('_id nombre nivel grado grupo jornada año_academico');

    res.status(200).json({
      success: true,
      data: cursos,
    });
  });

  /**
   * Obtiene información básica de un curso sin necesidad de autenticación
   * Usado en el frontend para mostrar información del curso en pantallas públicas
   */
  obtenerInfoCursoPublica = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { cursoId } = req.params;

    if (!cursoId) {
      throw new ApiError(400, 'Se requiere ID del curso');
    }

    // Obtener información básica del curso
    const curso = await Curso.findById(cursoId)
      .select('_id nombre nivel grado seccion grupo jornada año_academico estado')
      .lean();

    if (!curso) {
      throw new ApiError(404, 'Curso no encontrado');
    }

    if (curso.estado !== 'ACTIVO') {
      throw new ApiError(400, 'Este curso no está activo');
    }

    res.status(200).json({
      success: true,
      data: curso,
    });
  });
}

export default new PublicController();
