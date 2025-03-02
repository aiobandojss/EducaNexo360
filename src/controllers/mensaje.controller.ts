// src/controllers/mensaje.controller.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Mensaje from '../models/mensaje.model';
import Usuario from '../models/usuario.model';
import gridfsManager from '../config/gridfs';
import emailService from '../services/email.service';
import notificacionService from '../services/notificacion.service'; // Nuevo import
import config from '../config/config';
import ApiError from '../utils/ApiError';
import { TipoMensaje, EstadoMensaje, PrioridadMensaje } from '../interfaces/IMensaje';
import { TipoNotificacion } from '../interfaces/INotificacion'; // Nuevo import
import fs from 'fs';
import path from 'path';

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

// Interfaz para las lecturas de mensaje
interface ILectura {
  usuarioId: mongoose.Types.ObjectId;
  fechaLectura: Date;
}

export class MensajeController {
  // Crear un nuevo mensaje
  async crear(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      // Obtener datos del mensaje
      const {
        destinatarios,
        destinatariosCc,
        asunto,
        contenido,
        tipo = TipoMensaje.INDIVIDUAL,
        prioridad,
        etiquetas,
        esRespuesta,
        mensajeOriginalId,
      } = req.body;

      // Comprobar que el mensaje tenga al menos un destinatario
      if (!destinatarios || (Array.isArray(destinatarios) && destinatarios.length === 0)) {
        throw new ApiError(400, 'Debe especificar al menos un destinatario');
      }

      // Crear adjuntos si hay archivos
      const adjuntos = [];
      if (req.files && req.files.length > 0) {
        const bucket = gridfsManager.getBucket();
        if (!bucket) {
          throw new ApiError(500, 'Servicio de archivos no disponible');
        }

        for (const file of req.files) {
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

          adjuntos.push({
            nombre: file.originalname,
            tipo: file.mimetype,
            tamaño: file.size,
            fileId: uploadStream.id,
            fechaSubida: new Date(),
          });

          // Limpiar archivo temporal
          try {
            fs.unlinkSync(file.path);
          } catch (error) {
            console.error('Error deleting temporary file:', error);
          }
        }
      }

      // Verificar si es borrador
      let estado = EstadoMensaje.ENVIADO;
      if (tipo === 'BORRADOR') {
        estado = EstadoMensaje.BORRADOR;
      }

      // Parsear destinatarios
      let destinatariosArray = [];
      if (typeof destinatarios === 'string') {
        // Si es un JSON string
        try {
          destinatariosArray = JSON.parse(destinatarios);
        } catch (error) {
          // Si es un solo ID
          destinatariosArray = [destinatarios];
        }
      } else if (Array.isArray(destinatarios)) {
        destinatariosArray = destinatarios;
      }

      // Parsear destinatariosCc
      let destinatariosCcArray = [];
      if (destinatariosCc) {
        if (typeof destinatariosCc === 'string') {
          try {
            destinatariosCcArray = JSON.parse(destinatariosCc);
          } catch (error) {
            destinatariosCcArray = [destinatariosCc];
          }
        } else if (Array.isArray(destinatariosCc)) {
          destinatariosCcArray = destinatariosCc;
        }
      }

      // Crear mensaje
      const nuevoMensaje = await Mensaje.create({
        remitente: req.user._id,
        destinatarios: destinatariosArray,
        destinatariosCc: destinatariosCcArray,
        asunto,
        contenido,
        tipo,
        prioridad: prioridad || PrioridadMensaje.NORMAL,
        estado,
        etiquetas: etiquetas || [],
        adjuntos,
        escuelaId: req.user.escuelaId,
        esRespuesta: esRespuesta === 'true' || esRespuesta === true,
        mensajeOriginalId: mensajeOriginalId || null,
        lecturas: [],
      });

      // Si no es borrador, enviar notificaciones por email y crear notificaciones
      if (estado !== EstadoMensaje.BORRADOR) {
        // Obtener información de todos los destinatarios
        const usuarios = await Usuario.find({
          _id: { $in: [...destinatariosArray, ...destinatariosCcArray] },
        });

        // Obtener nombre del remitente
        const nombreRemitente = `${req.user.nombre || ''} ${req.user.apellidos || ''}`.trim();

        // Para cada destinatario, enviar notificación por email
        for (const usuario of usuarios) {
          if (usuario.email) {
            await emailService.sendMensajeNotification(usuario.email, {
              remitente: nombreRemitente,
              asunto,
              fecha: new Date(),
              tieneAdjuntos: adjuntos.length > 0,
              url: `${config.frontendUrl}/mensajes/${nuevoMensaje._id}`,
            });
          }
        }

        // Crear notificaciones para los destinatarios
        const mensajeId = (nuevoMensaje as any)._id.toString();
        for (const destinatarioId of [...destinatariosArray, ...destinatariosCcArray]) {
          await notificacionService.crearNotificacion({
            usuarioId: destinatarioId,
            titulo: `Nuevo mensaje: ${asunto}`,
            mensaje: `Has recibido un nuevo mensaje de ${nombreRemitente}`,
            tipo: TipoNotificacion.MENSAJE,
            escuelaId: req.user.escuelaId,
            entidadId: mensajeId,
            entidadTipo: 'Mensaje',
            metadata: {
              remitente: nombreRemitente,
              tieneAdjuntos: adjuntos.length > 0,
              mensajeId: mensajeId,
              url: `${config.frontendUrl}/mensajes/${nuevoMensaje._id}`,
            },
            // No enviamos email aquí porque ya lo hacemos por separado
            enviarEmail: false,
          });
        }
      }

      // Devolver mensaje creado
      await nuevoMensaje.populate([
        { path: 'remitente', select: 'nombre apellidos email tipo' },
        { path: 'destinatarios', select: 'nombre apellidos email tipo' },
        { path: 'destinatariosCc', select: 'nombre apellidos email tipo' },
      ]);

      res.status(201).json({
        success: true,
        data: nuevoMensaje,
      });
    } catch (error) {
      console.error('Error creating message:', error);
      next(error);
    }
  }

  // Obtener todos los mensajes enviados/recibidos
  async obtenerTodos(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const {
        tipo,
        bandeja = 'recibidos',
        pagina = 1,
        limite = 20,
        busqueda,
        desde,
        hasta,
        estado,
      } = req.query;

      const opciones = {
        pagina: parseInt(pagina as string, 10),
        limite: parseInt(limite as string, 10),
      };

      // Construir filtro según la bandeja
      const filtro: any = {
        escuelaId: req.user.escuelaId,
      };

      if (tipo) {
        filtro.tipo = tipo;
      }

      if (estado) {
        filtro.estado = estado;
      }

      // Filtro según bandeja
      if (bandeja === 'recibidos') {
        filtro.destinatarios = req.user._id;
        filtro.estado = { $ne: EstadoMensaje.BORRADOR };
      } else if (bandeja === 'enviados') {
        filtro.remitente = req.user._id;
        filtro.estado = { $ne: EstadoMensaje.BORRADOR };
      } else if (bandeja === 'borradores') {
        filtro.remitente = req.user._id;
        filtro.estado = EstadoMensaje.BORRADOR;
      } else if (bandeja === 'archivados') {
        filtro.$or = [
          { remitente: req.user._id, estado: EstadoMensaje.ARCHIVADO },
          { destinatarios: req.user._id, estado: EstadoMensaje.ARCHIVADO },
        ];
      }

      // Filtro de búsqueda por asunto o contenido
      if (busqueda) {
        const regex = new RegExp(busqueda as string, 'i');
        filtro.$or = [{ asunto: regex }, { contenido: regex }];
      }

      // Filtro por fecha
      if (desde || hasta) {
        filtro.createdAt = {};
        if (desde) {
          filtro.createdAt.$gte = new Date(desde as string);
        }
        if (hasta) {
          filtro.createdAt.$lte = new Date(hasta as string);
        }
      }

      // Ejecutar consulta paginada
      const skip = (opciones.pagina - 1) * opciones.limite;
      const mensajes = await Mensaje.find(filtro)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(opciones.limite)
        .populate([
          { path: 'remitente', select: 'nombre apellidos email tipo' },
          { path: 'destinatarios', select: 'nombre apellidos email tipo' },
        ]);

      // Contar total de mensajes
      const total = await Mensaje.countDocuments(filtro);

      res.json({
        success: true,
        data: mensajes,
        meta: {
          total,
          pagina: opciones.pagina,
          limite: opciones.limite,
          totalPaginas: Math.ceil(total / opciones.limite),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Obtener un mensaje específico por ID
  async obtenerPorId(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { id } = req.params;

      // Buscar mensaje
      const mensaje = await Mensaje.findOne({
        _id: id,
        $or: [
          { remitente: req.user._id },
          { destinatarios: req.user._id },
          { destinatariosCc: req.user._id },
        ],
      }).populate([
        { path: 'remitente', select: 'nombre apellidos email tipo' },
        { path: 'destinatarios', select: 'nombre apellidos email tipo' },
        { path: 'destinatariosCc', select: 'nombre apellidos email tipo' },
        { path: 'mensajeOriginalId' },
      ]);

      if (!mensaje) {
        throw new ApiError(404, 'Mensaje no encontrado');
      }

      // Si el usuario es un destinatario y no ha leído el mensaje, marcarlo como leído
      if (
        mensaje.destinatarios.some((d) => (d as any)._id.toString() === req.user?._id) ||
        (mensaje.destinatariosCc &&
          mensaje.destinatariosCc.some((d) => (d as any)._id.toString() === req.user?._id))
      ) {
        // Verificar si el usuario ya leyó el mensaje
        if (mensaje.lecturas) {
          const yaLeido = mensaje.lecturas.some(
            (l: ILectura) => l.usuarioId.toString() === req.user?._id,
          );

          // Si no lo ha leído, marcar como leído
          if (!yaLeido) {
            await Mensaje.updateOne(
              { _id: id },
              {
                $push: {
                  lecturas: {
                    usuarioId: req.user?._id,
                    fechaLectura: new Date(),
                  },
                },
              },
            );
          }
        } else {
          // Si no hay lecturas, inicializar el array
          await Mensaje.updateOne(
            { _id: id },
            {
              $set: {
                lecturas: [
                  {
                    usuarioId: req.user?._id,
                    fechaLectura: new Date(),
                  },
                ],
              },
            },
          );
        }
      }

      res.json({
        success: true,
        data: mensaje,
      });
    } catch (error) {
      next(error);
    }
  }

  // Marcar mensaje como archivado
  async archivar(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { id } = req.params;

      // Verificar que el mensaje existe y el usuario tiene acceso
      const mensaje = await Mensaje.findOne({
        _id: id,
        $or: [{ remitente: req.user._id }, { destinatarios: req.user._id }],
      });

      if (!mensaje) {
        throw new ApiError(404, 'Mensaje no encontrado');
      }

      // Actualizar estado a ARCHIVADO
      await Mensaje.updateOne({ _id: id }, { estado: EstadoMensaje.ARCHIVADO });

      res.json({
        success: true,
        message: 'Mensaje archivado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  // Descargar un archivo adjunto
  async descargarAdjunto(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { mensajeId, adjuntoId } = req.params;

      // Verificar que el mensaje existe y el usuario tiene acceso
      const mensaje = await Mensaje.findOne({
        _id: mensajeId,
        $or: [
          { remitente: req.user._id },
          { destinatarios: req.user._id },
          { destinatariosCc: req.user._id },
        ],
      });

      if (!mensaje) {
        throw new ApiError(404, 'Mensaje no encontrado');
      }

      // Buscar el adjunto en el mensaje
      if (!mensaje.adjuntos || mensaje.adjuntos.length === 0) {
        throw new ApiError(404, 'El mensaje no tiene adjuntos');
      }

      const adjunto = mensaje.adjuntos.find((a) => a.fileId.toString() === adjuntoId);
      if (!adjunto) {
        throw new ApiError(404, 'Adjunto no encontrado');
      }

      // Obtener el bucket de GridFS
      const bucket = gridfsManager.getBucket();
      if (!bucket) {
        throw new ApiError(500, 'Servicio de archivos no disponible');
      }

      // Buscar el archivo en GridFS
      const documentoCursor = bucket.find({ _id: new mongoose.Types.ObjectId(adjuntoId) });
      const documentoCount = await documentoCursor.count();
      if (documentoCount === 0) {
        throw new ApiError(404, 'Archivo no encontrado en el sistema');
      }

      // Configurar respuesta
      res.set({
        'Content-Type': adjunto.tipo,
        'Content-Disposition': `attachment; filename="${adjunto.nombre}"`,
      });

      // Devolver el stream del archivo
      const downloadStream = bucket.openDownloadStream(new mongoose.Types.ObjectId(adjuntoId));
      downloadStream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  // Responder a un mensaje
  async responder(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      const { mensajeId } = req.params;
      const { asunto, contenido, destinatariosCc } = req.body;

      // Verificar que el mensaje original existe
      const mensajeOriginal = await Mensaje.findOne({
        _id: mensajeId,
        $or: [
          { remitente: req.user._id },
          { destinatarios: req.user._id },
          { destinatariosCc: req.user._id },
        ],
      }).populate('remitente', 'nombre apellidos email tipo');

      if (!mensajeOriginal) {
        throw new ApiError(404, 'Mensaje original no encontrado');
      }

      // Determinar destinatarios
      // Si el usuario es el remitente, responder a los destinatarios originales
      // Si el usuario es un destinatario, responder al remitente original
      let destinatarios = [];
      if ((mensajeOriginal.remitente as any)._id.toString() === req.user._id) {
        destinatarios = mensajeOriginal.destinatarios.map((d) => (d as any).toString());
      } else {
        destinatarios = [(mensajeOriginal.remitente as any)._id.toString()];
      }

      // Crear adjuntos si hay archivos
      const adjuntos = [];
      if (req.files && req.files.length > 0) {
        const bucket = gridfsManager.getBucket();
        if (!bucket) {
          throw new ApiError(500, 'Servicio de archivos no disponible');
        }

        for (const file of req.files) {
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

          adjuntos.push({
            nombre: file.originalname,
            tipo: file.mimetype,
            tamaño: file.size,
            fileId: uploadStream.id,
            fechaSubida: new Date(),
          });

          // Limpiar archivo temporal
          try {
            fs.unlinkSync(file.path);
          } catch (error) {
            console.error('Error deleting temporary file:', error);
          }
        }
      }

      // Parsear destinatariosCc
      let destinatariosCcArray = [];
      if (destinatariosCc) {
        if (typeof destinatariosCc === 'string') {
          try {
            destinatariosCcArray = JSON.parse(destinatariosCc);
          } catch (error) {
            destinatariosCcArray = [destinatariosCc];
          }
        } else if (Array.isArray(destinatariosCc)) {
          destinatariosCcArray = destinatariosCc;
        }
      }

      // Crear mensaje de respuesta
      const respuesta = await Mensaje.create({
        remitente: req.user._id,
        destinatarios,
        destinatariosCc: destinatariosCcArray,
        asunto: asunto || `Re: ${mensajeOriginal.asunto}`,
        contenido,
        tipo: TipoMensaje.INDIVIDUAL,
        prioridad: PrioridadMensaje.NORMAL,
        estado: EstadoMensaje.ENVIADO,
        adjuntos,
        escuelaId: req.user.escuelaId,
        esRespuesta: true,
        mensajeOriginalId: mensajeId,
        lecturas: [],
      });

      // Obtener nombre del remitente
      const nombreRemitente = `${req.user.nombre || ''} ${req.user.apellidos || ''}`.trim();

      // Enviar notificaciones por email
      // Obtener información de todos los destinatarios
      const usuarios = await Usuario.find({
        _id: { $in: [...destinatarios, ...destinatariosCcArray] },
      });

      // Para cada destinatario, enviar notificación por email
      for (const usuario of usuarios) {
        if (usuario.email) {
          await emailService.sendMensajeNotification(usuario.email, {
            remitente: nombreRemitente,
            asunto: respuesta.asunto,
            fecha: new Date(),
            tieneAdjuntos: adjuntos.length > 0,
            url: `${config.frontendUrl}/mensajes/${respuesta._id}`,
          });
        }
      }

      // Crear notificaciones para los destinatarios
      const respuestaId = (respuesta as any)._id.toString();
      for (const destinatarioId of [...destinatarios, ...destinatariosCcArray]) {
        await notificacionService.crearNotificacion({
          usuarioId: destinatarioId,
          titulo: `Respuesta: ${respuesta.asunto}`,
          mensaje: `${nombreRemitente} ha respondido a un mensaje`,
          tipo: TipoNotificacion.MENSAJE,
          escuelaId: req.user.escuelaId,
          entidadId: respuestaId,
          entidadTipo: 'Mensaje',
          metadata: {
            remitente: nombreRemitente,
            tieneAdjuntos: adjuntos.length > 0,
            mensajeId: respuestaId,
            mensajeOriginalId: mensajeId,
            url: `${config.frontendUrl}/mensajes/${respuesta._id}`,
          },
          // No enviamos email aquí porque ya lo hacemos por separado
          enviarEmail: false,
        });
      }

      // Devolver mensaje creado
      await respuesta.populate([
        { path: 'remitente', select: 'nombre apellidos email tipo' },
        { path: 'destinatarios', select: 'nombre apellidos email tipo' },
        { path: 'destinatariosCc', select: 'nombre apellidos email tipo' },
        { path: 'mensajeOriginalId' },
      ]);

      res.status(201).json({
        success: true,
        data: respuesta,
      });
    } catch (error) {
      next(error);
    }
  }
}

// Exportar una instancia de la clase
const mensajeController = new MensajeController();
export default mensajeController;
