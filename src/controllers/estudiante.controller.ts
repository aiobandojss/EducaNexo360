// src/controllers/estudiante.controller.ts
import { Request, Response } from 'express';
import { estudianteService } from '../services/estudiante.service'; // IMPORT CORREGIDO
import ApiError from '../utils/ApiError';

/**
 * Busca estudiantes existentes para asociación con acudientes
 */
export const buscarEstudiantesParaAsociacion = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { escuelaId, nombre, apellidos, email, codigo_estudiante, cursoId } = req.query;

    if (!escuelaId) {
      res.status(400).json({
        success: false,
        message: 'El ID de la escuela es requerido',
      });
      return;
    }

    const estudiantes = await estudianteService.buscarEstudiantesExistentes({
      escuelaId: escuelaId as string,
      nombre: nombre as string,
      apellidos: apellidos as string,
      email: email as string,
      codigo_estudiante: codigo_estudiante as string,
      cursoId: cursoId as string,
    });

    res.status(200).json({
      success: true,
      data: estudiantes,
      message: `Se encontraron ${estudiantes.length} estudiantes`,
    });
  } catch (error) {
    console.error('Error al buscar estudiantes:', error);

    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al buscar estudiantes',
    });
  }
};

/**
 * Obtiene información detallada de un estudiante específico
 */
export const obtenerEstudiantePorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { escuelaId } = req.query;

    if (!escuelaId) {
      res.status(400).json({
        success: false,
        message: 'El ID de la escuela es requerido',
      });
      return;
    }

    const estudiante = await estudianteService.obtenerEstudiantePorId(id, escuelaId as string);

    if (!estudiante) {
      res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: estudiante,
    });
  } catch (error) {
    console.error('Error al obtener estudiante:', error);

    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al obtener estudiante',
    });
  }
};

/**
 * Verifica si un estudiante puede ser asociado a un acudiente
 */
export const verificarAsociacionEstudiante = async (req: Request, res: Response): Promise<void> => {
  try {
    const { estudianteId } = req.params;
    const { acudienteEmail, escuelaId } = req.body;

    if (!acudienteEmail || !escuelaId) {
      res.status(400).json({
        success: false,
        message: 'Email del acudiente y ID de escuela son requeridos',
      });
      return;
    }

    const verificacion = await estudianteService.puedeAsociarAcudiente(
      estudianteId,
      acudienteEmail,
      escuelaId,
    );

    res.status(200).json({
      success: true,
      data: verificacion,
    });
  } catch (error) {
    console.error('Error al verificar asociación:', error);

    if (error instanceof ApiError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al verificar asociación',
    });
  }
};
