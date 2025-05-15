// src/controllers/calendario.controller.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import EventoCalendario from '../models/calendario.model';
import Usuario from '../models/usuario.model';
import Curso from '../models/curso.model';
import ApiError from '../utils/ApiError';
import gridfsManager from '../config/gridfs';
import fs from 'fs';
import path from 'path';
import { EstadoEvento } from '../interfaces/ICalendario';

interface RequestWithUser extends Request {
  user?: {
    _id: string;
    escuelaId: string;
    tipo: string;
    email: string;
    nombre: string;
    apellidos: string;
    estado: string;
  };
  files?: Express.Multer.File[];
}

class CalendarioController {
  // Crear un nuevo evento
  async crearEvento(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const eventoData: any = {
        ...req.body,
        escuelaId: req.user.escuelaId,
        creadorId: req.user._id,
      };

      // Verificar si hay un archivo adjunto
      if (req.files && req.files.length > 0) {
        const file = req.files[0];
        const bucket = gridfsManager.getBucket();

        if (!bucket) {
          throw new ApiError(500, 'Servicio de archivos no disponible');
        }

        // Subir archivo a GridFS
        const filename = file.filename || path.basename(file.path);
        const uploadStream = bucket.openUploadStream(filename, {
          metadata: {
            originalName: file.originalname,
            contentType: file.mimetype,
            size: file.size,
            uploadedBy: req.user._id,
          },
        });

        const fileContent = fs.readFileSync(file.path);
        uploadStream.write(fileContent);
        uploadStream.end();

        eventoData.archivoAdjunto = {
          fileId: uploadStream.id,
          nombre: file.originalname,
          tipo: file.mimetype,
          tamaño: file.size,
        };

        // Limpiar archivo temporal
        try {
          fs.unlinkSync(file.path);
        } catch (error) {
          console.error('Error deleting temporary file:', error);
        }
      }

      // Procesar fechas - MODIFICADO para mejor manejo de zonas horarias
      if (eventoData.fechaInicio) {
        // Preservar la fecha tal como viene, sin manipularla
        eventoData.fechaInicio = new Date(eventoData.fechaInicio);

        // Log para depuración
        console.log(`Fecha inicio recibida: ${eventoData.fechaInicio}`);
        console.log(`Fecha inicio procesada: ${new Date(eventoData.fechaInicio).toISOString()}`);
        console.log(
          `Fecha inicio día/mes: ${new Date(eventoData.fechaInicio).getDate()}/${
            new Date(eventoData.fechaInicio).getMonth() + 1
          }`,
        );
      }

      if (eventoData.fechaFin) {
        // Preservar la fecha tal como viene, sin manipularla
        eventoData.fechaFin = new Date(eventoData.fechaFin);

        // Log para depuración
        console.log(`Fecha fin recibida: ${eventoData.fechaFin}`);
        console.log(`Fecha fin procesada: ${new Date(eventoData.fechaFin).toISOString()}`);
        console.log(
          `Fecha fin día/mes: ${new Date(eventoData.fechaFin).getDate()}/${
            new Date(eventoData.fechaFin).getMonth() + 1
          }`,
        );
      }

      // Procesar invitados - se mantiene por compatibilidad, pero no se usará para enviar notificaciones
      if (eventoData.invitados && typeof eventoData.invitados === 'string') {
        try {
          eventoData.invitados = JSON.parse(eventoData.invitados);
        } catch (error) {
          throw new ApiError(400, 'Formato de invitados inválido');
        }
      }

      // Procesar recordatorios
      if (eventoData.recordatorios && typeof eventoData.recordatorios === 'string') {
        try {
          eventoData.recordatorios = JSON.parse(eventoData.recordatorios);
        } catch (error) {
          throw new ApiError(400, 'Formato de recordatorios inválido');
        }
      }

      const evento = (await EventoCalendario.create(eventoData)) as any;

      const eventoPopulado = await EventoCalendario.findById(evento._id)
        .populate('creadorId', 'nombre apellidos email tipo')
        .populate('cursoId', 'nombre nivel');

      // Ya no se envían notificaciones automáticas a los invitados ni a los estudiantes del curso

      res.status(201).json({
        success: true,
        data: eventoPopulado,
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener todos los eventos
  // REEMPLAZAR COMPLETAMENTE el método obtenerEventos en calendario.controller.ts
  async obtenerEventos(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { inicio, fin, cursoId, tipo, estado } = req.query;

      // DEBUGGING - Mostrar parámetros de consulta
      console.log('DEPURACIÓN - Parámetros de consulta:', {
        inicio,
        fin,
        cursoId,
        tipo,
        estado,
        userType: req.user.tipo,
        userId: req.user._id,
        escuelaId: req.user.escuelaId,
      });

      // Construir la consulta base - solo incluir escuelaId inicialmente
      const pipeline: mongoose.PipelineStage[] = [
        { $match: { escuelaId: new mongoose.Types.ObjectId(req.user.escuelaId.toString()) } },
      ];

      // Aplicar filtros básicos
      if (cursoId) {
        pipeline.push({ $match: { cursoId: new mongoose.Types.ObjectId(cursoId.toString()) } });
      }

      if (tipo) {
        pipeline.push({ $match: { tipo: tipo } });
      }

      if (estado) {
        pipeline.push({ $match: { estado: estado } });
      }

      // Aplicar filtro de fechas - COMPLETAMENTE REESCRITO para mejor manejo de zonas horarias
      if (inicio || fin) {
        const fechaMatch: any = {};

        // Si tenemos fecha de inicio, eventos que terminan después o durante la fecha
        if (inicio) {
          const fechaInicio = new Date(inicio as string);
          fechaMatch.fechaFin = { $gte: fechaInicio };

          console.log(`Filtro inicio: ${fechaInicio.toISOString()}`);
        }

        // Si tenemos fecha de fin, eventos que comienzan antes o durante la fecha
        if (fin) {
          const fechaFin = new Date(fin as string);
          if (!fechaMatch.fechaInicio) fechaMatch.fechaInicio = {};
          fechaMatch.fechaInicio.$lte = fechaFin;

          console.log(`Filtro fin: ${fechaFin.toISOString()}`);
        }

        pipeline.push({ $match: fechaMatch });

        console.log('Filtro de fechas aplicado:', JSON.stringify(fechaMatch));
      }

      // Aplicar filtros específicos según el rol SOLO después de los otros filtros
      if (req.user.tipo === 'ESTUDIANTE') {
        const cursos = await Curso.find({ estudiantes: req.user._id }).select<{
          _id: mongoose.Types.ObjectId;
        }>('_id');
        const cursoIds = cursos.map(
          (c) => new mongoose.Types.ObjectId((c._id as mongoose.Types.ObjectId).toString()),
        );

        pipeline.push({
          $match: {
            $or: [
              { cursoId: { $in: cursoIds } },
              { cursoId: { $exists: false } },
              { 'invitados.usuarioId': req.user._id },
            ],
          },
        });
      } else if (req.user.tipo === 'DOCENTE') {
        const cursos = await Curso.find({
          $or: [{ director_grupo: req.user._id }],
        }).select<{ _id: mongoose.Types.ObjectId }>('_id');
        const cursoIds = cursos.map((c) => new mongoose.Types.ObjectId(c._id.toString()));

        pipeline.push({
          $match: {
            $or: [
              { cursoId: { $in: cursoIds } },
              { cursoId: { $exists: false } },
              { creadorId: new mongoose.Types.ObjectId(req.user._id.toString()) },
              { 'invitados.usuarioId': req.user._id },
            ],
          },
        });
      } else if (req.user.tipo === 'PADRE') {
        // Lógica para padres (similar a la anterior)
        // ...
      }
      // Los ADMIN ven todos los eventos sin restricciones adicionales

      // Añadir ordenamiento y población
      pipeline.push({ $sort: { fechaInicio: 1 } });

      // DEBUGGING - Mostrar pipeline completo
      console.log('DEPURACIÓN - Pipeline completo:', JSON.stringify(pipeline, null, 2));

      // Ejecutar la agregación
      const eventos = await EventoCalendario.aggregate(pipeline);

      // Poblar los IDs relacionados
      await EventoCalendario.populate(eventos, {
        path: 'creadorId',
        select: 'nombre apellidos email tipo',
      });

      await EventoCalendario.populate(eventos, {
        path: 'cursoId',
        select: 'nombre nivel',
      });

      // DEBUGGING - Mostrar resultados
      console.log(`DEPURACIÓN - Eventos encontrados: ${eventos.length}`);
      if (eventos.length > 0) {
        console.log('DEPURACIÓN - Primer evento:', {
          id: eventos[0]._id,
          titulo: eventos[0].titulo,
          inicio: eventos[0].fechaInicio,
          fin: eventos[0].fechaFin,
          estado: eventos[0].estado,
        });
      }

      // Retornar resultados
      res.json({
        success: true,
        data: eventos,
      });
    } catch (error) {
      console.error('ERROR en obtenerEventos:', error);
      next(error);
    }
  }

  // Obtener un evento por su ID
  async obtenerEventoPorId(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const evento = await EventoCalendario.findOne({
        _id: req.params.id,
        escuelaId: req.user.escuelaId,
      })
        .populate('creadorId', 'nombre apellidos email tipo')
        .populate('cursoId', 'nombre nivel')
        .populate('invitados.usuarioId', 'nombre apellidos email tipo');

      if (!evento) {
        throw new ApiError(404, 'Evento no encontrado');
      }

      // Información de depuración
      console.log('DEPURACIÓN - obtenerEventoPorId:');
      console.log(`Evento ID: ${evento._id}`);
      console.log(`fechaInicio (ISO): ${evento.fechaInicio}`);
      console.log(`fechaInicio (objeto): ${new Date(evento.fechaInicio)}`);
      console.log(`fechaFin (ISO): ${evento.fechaFin}`);
      console.log(`todoElDia: ${evento.todoElDia}`);

      res.json({
        success: true,
        data: evento,
      });
    } catch (error) {
      next(error);
    }
  }

  // Actualizar un evento existente
  async actualizarEvento(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      // Verificar si el usuario puede editar el evento
      const evento = await EventoCalendario.findOne({
        _id: req.params.id,
        escuelaId: req.user.escuelaId,
      });

      if (!evento) {
        throw new ApiError(404, 'Evento no encontrado');
      }

      // Solo el creador o un administrador puede editar el evento
      if (evento.creadorId.toString() !== req.user._id && req.user.tipo !== 'ADMIN') {
        throw new ApiError(403, 'No tienes permiso para editar este evento');
      }

      const datosActualizacion: any = { ...req.body };

      // Procesar fechas - MODIFICADO para mejor manejo de zonas horarias
      if (datosActualizacion.fechaInicio) {
        // Preservar la fecha tal como viene, sin manipularla
        datosActualizacion.fechaInicio = new Date(datosActualizacion.fechaInicio);

        // Log para depuración
        console.log(`Fecha inicio actualizada (recibida): ${datosActualizacion.fechaInicio}`);
        console.log(
          `Fecha inicio actualizada (procesada): ${new Date(
            datosActualizacion.fechaInicio,
          ).toISOString()}`,
        );
      }

      if (datosActualizacion.fechaFin) {
        // Preservar la fecha tal como viene, sin manipularla
        datosActualizacion.fechaFin = new Date(datosActualizacion.fechaFin);

        // Log para depuración
        console.log(`Fecha fin actualizada (recibida): ${datosActualizacion.fechaFin}`);
        console.log(
          `Fecha fin actualizada (procesada): ${new Date(
            datosActualizacion.fechaFin,
          ).toISOString()}`,
        );
      }

      // Procesar invitados
      if (datosActualizacion.invitados && typeof datosActualizacion.invitados === 'string') {
        try {
          datosActualizacion.invitados = JSON.parse(datosActualizacion.invitados);
        } catch (error) {
          throw new ApiError(400, 'Formato de invitados inválido');
        }
      }

      // Verificar si hay un archivo adjunto
      if (req.files && req.files.length > 0) {
        const file = req.files[0];
        const bucket = gridfsManager.getBucket();

        if (!bucket) {
          throw new ApiError(500, 'Servicio de archivos no disponible');
        }

        // Si ya hay un archivo adjunto, eliminarlo
        if (evento.archivoAdjunto && evento.archivoAdjunto.fileId) {
          try {
            await bucket.delete(
              new mongoose.Types.ObjectId(evento.archivoAdjunto.fileId.toString()),
            );
          } catch (error) {
            console.error('Error deleting old file:', error);
          }
        }

        // Subir nuevo archivo a GridFS
        const filename = file.filename || path.basename(file.path);
        const uploadStream = bucket.openUploadStream(filename, {
          metadata: {
            originalName: file.originalname,
            contentType: file.mimetype,
            size: file.size,
            uploadedBy: req.user._id,
          },
        });

        const fileContent = fs.readFileSync(file.path);
        uploadStream.write(fileContent);
        uploadStream.end();

        datosActualizacion.archivoAdjunto = {
          fileId: uploadStream.id,
          nombre: file.originalname,
          tipo: file.mimetype,
          tamaño: file.size,
        };

        // Limpiar archivo temporal
        try {
          fs.unlinkSync(file.path);
        } catch (error) {
          console.error('Error deleting temporary file:', error);
        }
      }

      // Actualizar el evento y obtener la versión actualizada con los campos populados
      await EventoCalendario.findByIdAndUpdate(req.params.id, datosActualizacion, {
        new: true,
        runValidators: true,
      });

      // Obtener evento actualizado con campos populados
      const eventoActualizado = await EventoCalendario.findById(req.params.id)
        .populate('creadorId', 'nombre apellidos email tipo')
        .populate('cursoId', 'nombre nivel')
        .populate('invitados.usuarioId', 'nombre apellidos email tipo')
        .lean();

      if (!eventoActualizado) {
        throw new ApiError(404, 'Evento no encontrado');
      }

      // Ya no se envían notificaciones de actualización

      res.json({
        success: true,
        data: eventoActualizado,
      });
    } catch (error) {
      next(error);
    }
  }

  // Eliminar (cancelar) un evento
  async eliminarEvento(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      // Verificar si el usuario puede eliminar el evento
      const evento = await EventoCalendario.findOne({
        _id: req.params.id,
        escuelaId: req.user.escuelaId,
      });

      if (!evento) {
        throw new ApiError(404, 'Evento no encontrado');
      }

      // Solo el creador o un administrador puede eliminar el evento
      if (evento.creadorId.toString() !== req.user._id && req.user.tipo !== 'ADMIN') {
        throw new ApiError(403, 'No tienes permiso para eliminar este evento');
      }

      // Verificar si hay un archivo adjunto para eliminarlo
      if (evento.archivoAdjunto && evento.archivoAdjunto.fileId) {
        const bucket = gridfsManager.getBucket();
        if (bucket) {
          try {
            await bucket.delete(
              new mongoose.Types.ObjectId(evento.archivoAdjunto.fileId.toString()),
            );
          } catch (error) {
            console.error('Error deleting file:', error);
          }
        }
      }

      // Cambiar estado a cancelado en lugar de eliminar
      const eventoActualizado = await EventoCalendario.findByIdAndUpdate(
        req.params.id,
        { estado: EstadoEvento.CANCELADO },
        { new: true },
      );

      // Ya no se envían notificaciones de cancelación

      res.json({
        success: true,
        message: 'Evento cancelado exitosamente',
        data: eventoActualizado,
      });
    } catch (error) {
      next(error);
    }
  }

  // Confirmar asistencia a un evento
  async confirmarAsistencia(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { confirmado } = req.body;

      // Buscar el evento
      const evento = await EventoCalendario.findOne({
        _id: req.params.id,
        escuelaId: req.user.escuelaId,
        'invitados.usuarioId': req.user._id,
      });

      if (!evento) {
        throw new ApiError(404, 'Evento no encontrado o no estás invitado');
      }

      // Actualizar la confirmación del usuario
      await EventoCalendario.findOneAndUpdate(
        {
          _id: req.params.id,
          'invitados.usuarioId': req.user._id,
        },
        {
          $set: {
            'invitados.$.confirmado': confirmado,
            'invitados.$.fechaConfirmacion': new Date(),
          },
        },
        { new: true },
      );

      // Obtener el evento actualizado con datos populados
      const eventoActualizado = await EventoCalendario.findById(req.params.id)
        .populate('creadorId', 'nombre apellidos email tipo')
        .populate('cursoId', 'nombre nivel');

      if (!eventoActualizado) {
        throw new ApiError(500, 'Error al actualizar la confirmación');
      }

      // Ya no se envían notificaciones de confirmación

      res.json({
        success: true,
        message: `Has confirmado tu asistencia al evento`,
        data: eventoActualizado,
      });
    } catch (error) {
      next(error);
    }
  }

  async cambiarEstadoEvento(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { id } = req.params;
      const { estado } = req.body;

      // Verificar que el estado es válido
      if (!['PENDIENTE', 'ACTIVO', 'FINALIZADO', 'CANCELADO'].includes(estado)) {
        throw new ApiError(400, 'Estado no válido');
      }

      // Verificar si el usuario puede modificar el evento
      const evento = await EventoCalendario.findOne({
        _id: id,
        escuelaId: req.user.escuelaId,
      });

      if (!evento) {
        throw new ApiError(404, 'Evento no encontrado');
      }

      // Solo admins pueden cambiar el estado
      if (req.user.tipo !== 'ADMIN' && req.user.tipo !== 'DOCENTE') {
        throw new ApiError(403, 'No tienes permiso para cambiar el estado de este evento');
      }

      // Actualizar el estado
      const eventoActualizado = await EventoCalendario.findByIdAndUpdate(
        id,
        { estado },
        { new: true },
      )
        .populate('creadorId', 'nombre apellidos email tipo')
        .populate('cursoId', 'nombre nivel');

      res.json({
        success: true,
        data: eventoActualizado,
        message: `Estado del evento cambiado a ${estado} exitosamente`,
      });
    } catch (error) {
      next(error);
    }
  }

  // Descargar un archivo adjunto de un evento
  async descargarAdjunto(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const evento = await EventoCalendario.findOne({
        _id: req.params.id,
        escuelaId: req.user.escuelaId,
      });

      if (!evento) {
        throw new ApiError(404, 'Evento no encontrado');
      }

      if (!evento.archivoAdjunto || !evento.archivoAdjunto.fileId) {
        throw new ApiError(404, 'Este evento no tiene archivo adjunto');
      }

      const bucket = gridfsManager.getBucket();
      if (!bucket) {
        throw new ApiError(500, 'Servicio de archivos no disponible');
      }

      // Buscar el archivo en GridFS
      const fileId = new mongoose.Types.ObjectId(evento.archivoAdjunto.fileId.toString());
      const documentoCursor = bucket.find({ _id: fileId });
      const documentoCount = await documentoCursor.count();
      if (documentoCount === 0) {
        throw new ApiError(404, 'Archivo no encontrado en el sistema');
      }

      // Configurar respuesta
      res.set({
        'Content-Type': evento.archivoAdjunto.tipo,
        'Content-Disposition': `attachment; filename="${evento.archivoAdjunto.nombre}"`,
      });

      // Devolver el stream del archivo
      const downloadStream = bucket.openDownloadStream(fileId);
      downloadStream.pipe(res);
    } catch (error) {
      next(error);
    }
  }
}

export default new CalendarioController();
