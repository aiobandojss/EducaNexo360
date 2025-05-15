// src/controllers/system.controller.ts
import { Request, Response, NextFunction } from 'express';
import Escuela from '../models/escuela.model';
import Usuario from '../models/usuario.model';
import mongoose from 'mongoose';
import AuthService from '../services/auth/auth.service';
import ApiError from '../utils/ApiError';

/**
 * Verificar el estado del sistema
 * @route GET /api/system/status
 */
export const checkSystemStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Verificando estado del sistema...');

    // Verificar si hay escuelas
    const schoolCount = await Escuela.countDocuments();
    const hasSchools = schoolCount > 0;
    console.log(`Escuelas encontradas: ${schoolCount}`);

    // Verificar si hay administradores
    const adminCount = await Usuario.countDocuments({ tipo: 'ADMIN' });
    const hasAdmins = adminCount > 0;
    console.log(`Administradores encontrados: ${adminCount}`);

    // Un sistema se considera inicializado si tiene al menos una escuela y un administrador
    const initialized = hasSchools && hasAdmins;
    console.log(`Sistema inicializado: ${initialized}`);

    res.status(200).json({
      success: true,
      data: {
        initialized,
        hasSchools,
        hasAdmins,
      },
    });
  } catch (error) {
    console.error('Error en checkSystemStatus:', error);
    next(error);
  }
};

/**
 * Inicializar el sistema con la primera escuela y administrador
 * @route POST /api/system/initialize
 */
export const initializeSystem = async (req: Request, res: Response, next: NextFunction) => {
  let session = null;

  try {
    console.log('Iniciando inicialización del sistema...');
    console.log('Datos recibidos:', JSON.stringify(req.body, null, 2));

    // Verificar si el sistema ya está inicializado
    const schoolCount = await Escuela.countDocuments();
    const adminCount = await Usuario.countDocuments({ tipo: 'ADMIN' });

    if (schoolCount > 0 || adminCount > 0) {
      console.log('El sistema ya ha sido inicializado');
      throw new ApiError(400, 'El sistema ya ha sido inicializado');
    }

    session = await mongoose.startSession();
    session.startTransaction();
    console.log('Sesión de transacción iniciada');

    const { escuela, admin } = req.body;

    // Validar el código de la escuela
    if (!escuela.codigo) {
      throw new ApiError(400, 'El código de la escuela es requerido');
    }

    // Crear la escuela - ajustado para coincidir con tu modelo real
    console.log('Creando escuela...');
    try {
      const periodos = [];
      const numPeriodos = escuela.configuracion.periodos_academicos || 4;

      // Crear períodos académicos
      for (let i = 0; i < numPeriodos; i++) {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() + i * 3);

        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 3);

        periodos.push({
          numero: i + 1,
          nombre: `Periodo ${i + 1}`,
          fecha_inicio: startDate,
          fecha_fin: endDate,
        });
      }

      // Preparar datos de la escuela según el modelo actual
      const escuelaData = {
        nombre: escuela.nombre,
        codigo: escuela.codigo, // Agregamos este campo aunque no esté en el modelo
        direccion: escuela.direccion,
        telefono: escuela.telefono,
        email: escuela.email,
        estado: 'ACTIVO',
        configuracion: {
          periodos_academicos: escuela.configuracion.periodos_academicos,
          escala_calificacion: {
            minima: escuela.configuracion.escala_calificacion.minima,
            maxima: escuela.configuracion.escala_calificacion.maxima,
          },
          logros_por_periodo: 3, // Valor por defecto
        },
        periodos_academicos: periodos,
      };

      console.log('Datos de escuela preparados:', JSON.stringify(escuelaData, null, 2));

      const newEscuela = new Escuela(escuelaData);
      const savedEscuela = await newEscuela.save({ session });
      console.log('Escuela guardada con ID:', savedEscuela._id);
    } catch (error) {
      console.error('Error al crear la escuela:', error);
      throw error;
    }

    // Buscar la escuela recién creada (para asegurarnos de tener el ID)
    const savedEscuela = await Escuela.findOne({}, null, { session });
    if (!savedEscuela) {
      throw new Error('No se pudo crear la escuela');
    }

    // Crear el usuario administrador
    console.log('Creando administrador...');
    let savedAdmin;
    try {
      const newAdmin = new Usuario({
        ...admin,
        tipo: 'ADMIN',
        estado: 'ACTIVO',
        escuelaId: savedEscuela._id,
      });

      console.log('Datos de administrador preparados:', {
        nombre: newAdmin.nombre,
        apellidos: newAdmin.apellidos,
        email: newAdmin.email,
        tipo: newAdmin.tipo,
        escuelaId: newAdmin.escuelaId,
      });

      savedAdmin = await newAdmin.save({ session });
      console.log('Administrador guardado con ID:', savedAdmin._id);
    } catch (error) {
      console.error('Error al crear el administrador:', error);
      throw error;
    }

    // Finalizar la transacción
    console.log('Confirmando transacción...');
    await session.commitTransaction();
    session.endSession();
    console.log('Transacción confirmada');

    // Responder sin intentar generar tokens (para evitar errores potenciales)
    res.status(201).json({
      success: true,
      message: 'Sistema inicializado correctamente',
      data: {
        escuela: {
          _id: savedEscuela._id,
          nombre: savedEscuela.nombre,
          codigo: escuela.codigo, // Incluimos el código en la respuesta
          email: savedEscuela.email,
        },
        admin: {
          _id: savedAdmin._id,
          nombre: savedAdmin.nombre,
          apellidos: savedAdmin.apellidos,
          email: savedAdmin.email,
          tipo: savedAdmin.tipo,
        },
      },
    });

    console.log('Inicialización completada exitosamente');
  } catch (error) {
    console.error('Error en initializeSystem:', error);

    // Revertir transacción si hay una sesión activa
    if (session) {
      try {
        await session.abortTransaction();
        session.endSession();
        console.log('Transacción abortada debido a error');
      } catch (sessionError) {
        console.error('Error al abortar la transacción:', sessionError);
      }
    }

    // Si es un ApiError, pasarlo al siguiente middleware
    if (error instanceof ApiError) {
      next(error);
    } else {
      // Para otros errores, crear un ApiError genérico
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      next(new ApiError(500, `Error al inicializar el sistema: ${errorMessage}`));
    }
  }
};
