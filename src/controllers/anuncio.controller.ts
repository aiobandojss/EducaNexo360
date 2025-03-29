// src/controllers/anuncio.controller.ts

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Anuncio from '../models/anuncio.model';
import Usuario from '../models/usuario.model';
import Curso from '../models/curso.model';
import ApiError from '../utils/ApiError';
import notificacionService from '../services/notificacion.service';
import { TipoNotificacion } from '../interfaces/INotificacion';
import { EstadoAnuncio, TipoAnuncio } from '../interfaces/IAnuncio';
import gridfsManager from '../config/gridfs';
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
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

class AnuncioController {
  // El error es de contexto, así que vinculamos explícitamente los métodos
  constructor() {
    this.crearAnuncio = this.crearAnuncio.bind(this);
    this.obtenerAnuncios = this.obtenerAnuncios.bind(this);
    this.obtenerAnuncioPorId = this.obtenerAnuncioPorId.bind(this);
    this.actualizarAnuncio = this.actualizarAnuncio.bind(this);
    this.publicarAnuncio = this.publicarAnuncio.bind(this);
    this.archivarAnuncio = this.archivarAnuncio.bind(this);
    this.obtenerImagenPortada = this.obtenerImagenPortada.bind(this);
    this.descargarAdjunto = this.descargarAdjunto.bind(this);
    this.enviarNotificacionesAnuncio = this.enviarNotificacionesAnuncio.bind(this);
  }

  async crearAnuncio(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'No autorizado');
      }

      if (!['ADMIN', 'DOCENTE'].includes(req.user.tipo)) {
        throw new ApiError(403, 'No tienes permiso para crear anuncios');
      }

      const anuncioData: any = {
        ...req.body,
        escuelaId: req.user.escuelaId,
        creadorId: req.user._id,
        estado: req.body.estado || EstadoAnuncio.BORRADOR,
      };

      // Eliminar destinatarios específicos si existen
      if (anuncioData.destinatarios) {
        delete anuncioData.destinatarios;
      }

      // Manejar booleanos y fechas
      if (anuncioData.destacado === 'true') anuncioData.destacado = true;
      else if (anuncioData.destacado === 'false') anuncioData.destacado = false;

      if (anuncioData.fechaPublicacion) {
        anuncioData.fechaPublicacion = new Date(anuncioData.fechaPublicacion);
      } else if (anuncioData.estado === EstadoAnuncio.PUBLICADO) {
        anuncioData.fechaPublicacion = new Date();
      }

      if (anuncioData.fechaExpiracion) {
        anuncioData.fechaExpiracion = new Date(anuncioData.fechaExpiracion);
      }

      // Manejar archivos
      const adjuntos = [];
      if (req.files) {
        const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();

        if (files.length > 0) {
          const bucket = gridfsManager.getBucket();
          if (!bucket) throw new ApiError(500, 'Servicio de archivos no disponible');

          for (const file of files) {
            const esImagenPortada = file.fieldname === 'imagenPortada';

            const filename = file.filename || path.basename(file.path);
            const uploadStream = bucket.openUploadStream(filename, {
              metadata: {
                originalName: file.originalname,
                contentType: file.mimetype,
                size: file.size,
                uploadedBy: req.user._id,
                esImagenPortada,
              },
            });

            const fileContent = fs.readFileSync(file.path);
            uploadStream.write(fileContent);
            uploadStream.end();

            if (esImagenPortada) {
              anuncioData.imagenPortada = {
                fileId: uploadStream.id,
                url: `/api/anuncios/temp/imagen/${uploadStream.id}`,
              };
            } else {
              adjuntos.push({
                fileId: uploadStream.id,
                nombre: file.originalname,
                tipo: file.mimetype,
                tamaño: file.size,
                fechaSubida: new Date(),
              });
            }

            try {
              fs.unlinkSync(file.path);
            } catch (error) {
              console.error('Error deleting temporary file:', error);
            }
          }

          if (adjuntos.length > 0) {
            anuncioData.adjuntos = adjuntos;
          }
        }
      }

      const anuncio = await Anuncio.create(anuncioData);

      const anuncioPopulado = await Anuncio.findById(anuncio._id)
        .populate('creadorId', 'nombre apellidos email tipo')
        .populate('cursoId', 'nombre nivel');

      // Actualizar URL de la imagen de portada
      if (anuncio.imagenPortada && anuncio.imagenPortada.fileId) {
        await Anuncio.findByIdAndUpdate(anuncio._id, {
          'imagenPortada.url': `/api/anuncios/${anuncio._id}/imagen/${anuncio.imagenPortada.fileId}`,
        });
      }

      // Enviar notificaciones si el anuncio es publicado
      if (anuncio.estado === EstadoAnuncio.PUBLICADO) {
        await this.enviarNotificacionesAnuncio(anuncio);
      }

      res.status(201).json({
        success: true,
        data: anuncioPopulado,
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerAnuncios(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new ApiError(401, 'No autorizado');

      const { tipo, destacado, estado, curso, pagina = 1, limite = 10, busqueda } = req.query;
      const query: any = { escuelaId: req.user.escuelaId };

      // Aplicar filtros
      if (tipo) query.tipo = tipo;
      if (destacado === 'true') query.destacado = true;

      if (estado) {
        query.estado = estado;
      } else if (req.user.tipo !== 'ADMIN') {
        query.estado = EstadoAnuncio.PUBLICADO;
      }

      if (curso) query.cursoId = curso;

      if (busqueda) {
        const regex = new RegExp(String(busqueda), 'i');
        query.$or = [{ titulo: regex }, { contenido: regex }];
      }

      // Filtros por tipo de usuario
      if (req.user.tipo === 'ESTUDIANTE') {
        const cursos = await Curso.find({ estudiantes: req.user._id }).select('_id');
        const cursoIds = cursos.map((curso) => curso._id);

        const orConditions = [
          { tipo: TipoAnuncio.GENERAL },
          { tipo: TipoAnuncio.ESTUDIANTES },
          { cursoId: { $in: cursoIds } },
        ];

        query.$or = query.$or ? [...query.$or, ...orConditions] : orConditions;
      } else if (req.user.tipo === 'DOCENTE') {
        const orConditions = [
          { tipo: TipoAnuncio.GENERAL },
          { tipo: TipoAnuncio.DOCENTES },
          { creadorId: req.user._id },
        ];

        query.$or = query.$or ? [...query.$or, ...orConditions] : orConditions;
      } else if (req.user.tipo === 'PADRE') {
        const hijos = await Usuario.find({
          'info_academica.estudiantes_asociados': req.user._id,
        }).select('_id');

        const hijosIds = hijos.map((hijo) => hijo._id);
        const cursos = await Curso.find({ estudiantes: { $in: hijosIds } }).select('_id');
        const cursoIds = cursos.map((curso) => curso._id);

        const orConditions = [
          { tipo: TipoAnuncio.GENERAL },
          { tipo: TipoAnuncio.PADRES },
          { cursoId: { $in: cursoIds } },
        ];

        query.$or = query.$or ? [...query.$or, ...orConditions] : orConditions;
      }

      // Ejecutar consulta paginada
      const skip = (Number(pagina) - 1) * Number(limite);
      const anuncios = await Anuncio.find(query)
        .populate('creadorId', 'nombre apellidos email tipo')
        .populate('cursoId', 'nombre nivel')
        .sort({ destacado: -1, fechaPublicacion: -1 })
        .skip(skip)
        .limit(Number(limite));

      const total = await Anuncio.countDocuments(query);

      res.json({
        success: true,
        data: anuncios,
        meta: {
          total,
          pagina: Number(pagina),
          limite: Number(limite),
          totalPaginas: Math.ceil(total / Number(limite)),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerAnuncioPorId(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new ApiError(401, 'No autorizado');

      const anuncio = await Anuncio.findOne({
        _id: req.params.id,
        escuelaId: req.user.escuelaId,
      })
        .populate('creadorId', 'nombre apellidos email tipo')
        .populate('cursoId', 'nombre nivel');

      if (!anuncio) throw new ApiError(404, 'Anuncio no encontrado');

      // Verificar acceso
      if (
        anuncio.estado !== EstadoAnuncio.PUBLICADO &&
        anuncio.creadorId.toString() !== req.user._id &&
        req.user.tipo !== 'ADMIN'
      ) {
        throw new ApiError(403, 'No tienes permiso para ver este anuncio');
      }

      // Registrar lectura
      const yaLeido =
        anuncio.lecturas && anuncio.lecturas.some((l) => l.usuarioId.toString() === req.user?._id);

      if (!yaLeido) {
        await Anuncio.findByIdAndUpdate(req.params.id, {
          $push: { lecturas: { usuarioId: req.user._id, fechaLectura: new Date() } },
        });
      }

      res.json({ success: true, data: anuncio });
    } catch (error) {
      next(error);
    }
  }

  async actualizarAnuncio(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new ApiError(401, 'No autorizado');

      const anuncio = await Anuncio.findOne({
        _id: req.params.id,
        escuelaId: req.user.escuelaId,
      });

      if (!anuncio) throw new ApiError(404, 'Anuncio no encontrado');

      if (anuncio.creadorId.toString() !== req.user._id && req.user.tipo !== 'ADMIN') {
        throw new ApiError(403, 'No tienes permiso para editar este anuncio');
      }

      const datosActualizacion: any = { ...req.body };

      // Eliminar destinatarios específicos si existen
      if (datosActualizacion.destinatarios) {
        delete datosActualizacion.destinatarios;
      }

      // Procesar datos
      if (datosActualizacion.fechaPublicacion) {
        datosActualizacion.fechaPublicacion = new Date(datosActualizacion.fechaPublicacion);
      }

      if (datosActualizacion.fechaExpiracion) {
        datosActualizacion.fechaExpiracion = new Date(datosActualizacion.fechaExpiracion);
      }

      if (datosActualizacion.destacado === 'true') datosActualizacion.destacado = true;
      else if (datosActualizacion.destacado === 'false') datosActualizacion.destacado = false;

      // Manejar archivos
      if (req.files) {
        const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();

        if (files.length > 0) {
          const bucket = gridfsManager.getBucket();
          if (!bucket) throw new ApiError(500, 'Servicio de archivos no disponible');

          for (const file of files) {
            const esImagenPortada = file.fieldname === 'imagenPortada';

            const filename = file.filename || path.basename(file.path);
            const uploadStream = bucket.openUploadStream(filename, {
              metadata: {
                originalName: file.originalname,
                contentType: file.mimetype,
                size: file.size,
                uploadedBy: req.user._id,
                esImagenPortada,
              },
            });

            const fileContent = fs.readFileSync(file.path);
            uploadStream.write(fileContent);
            uploadStream.end();

            if (esImagenPortada) {
              // Eliminar imagen anterior si existe
              if (anuncio.imagenPortada && anuncio.imagenPortada.fileId) {
                try {
                  await bucket.delete(
                    new mongoose.Types.ObjectId(anuncio.imagenPortada.fileId.toString()),
                  );
                } catch (error) {
                  console.error('Error deleting old image:', error);
                }
              }

              datosActualizacion.imagenPortada = {
                fileId: uploadStream.id,
                url: `/api/anuncios/${req.params.id}/imagen/${uploadStream.id}`,
              };
            } else {
              // Añadir nuevo adjunto
              const nuevoAdjunto = {
                fileId: uploadStream.id,
                nombre: file.originalname,
                tipo: file.mimetype,
                tamaño: file.size,
                fechaSubida: new Date(),
              };

              if (!datosActualizacion.adjuntos) {
                if (anuncio.adjuntos && Array.isArray(anuncio.adjuntos)) {
                  datosActualizacion.adjuntos = [...anuncio.adjuntos, nuevoAdjunto];
                } else {
                  datosActualizacion.adjuntos = [nuevoAdjunto];
                }
              } else {
                datosActualizacion.adjuntos.push(nuevoAdjunto);
              }
            }

            try {
              fs.unlinkSync(file.path);
            } catch (error) {
              console.error('Error deleting temporary file:', error);
            }
          }
        }
      }

      // Guardar estado anterior para verificar cambios
      const estadoAnterior = anuncio.estado;

      // Actualizar anuncio
      await Anuncio.findByIdAndUpdate(req.params.id, datosActualizacion, { runValidators: true });

      const anuncioActualizado = await Anuncio.findById(req.params.id)
        .populate('creadorId', 'nombre apellidos email tipo')
        .populate('cursoId', 'nombre nivel');

      if (!anuncioActualizado) throw new ApiError(404, 'Error al actualizar el anuncio');

      // Enviar notificaciones si cambió a publicado
      if (
        anuncioActualizado.estado === EstadoAnuncio.PUBLICADO &&
        estadoAnterior !== EstadoAnuncio.PUBLICADO
      ) {
        await this.enviarNotificacionesAnuncio(anuncioActualizado);
      }

      res.json({ success: true, data: anuncioActualizado });
    } catch (error) {
      next(error);
    }
  }

  async publicarAnuncio(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new ApiError(401, 'No autorizado');

      const anuncio = await Anuncio.findOne({
        _id: req.params.id,
        escuelaId: req.user.escuelaId,
      });

      if (!anuncio) throw new ApiError(404, 'Anuncio no encontrado');

      if (anuncio.creadorId.toString() !== req.user._id && req.user.tipo !== 'ADMIN') {
        throw new ApiError(403, 'No tienes permiso para publicar este anuncio');
      }

      if (anuncio.estado === EstadoAnuncio.PUBLICADO) {
        throw new ApiError(400, 'El anuncio ya está publicado');
      }

      // Establecer fechas
      const fechaPublicacion = req.body.fechaPublicacion
        ? new Date(req.body.fechaPublicacion)
        : new Date();

      let fechaExpiracion = undefined;
      if (req.body.fechaExpiracion) {
        fechaExpiracion = new Date(req.body.fechaExpiracion);
        if (fechaExpiracion < fechaPublicacion) {
          throw new ApiError(
            400,
            'La fecha de expiración no puede ser anterior a la fecha de publicación',
          );
        }
      }

      // Actualizar anuncio
      await Anuncio.findByIdAndUpdate(req.params.id, {
        estado: EstadoAnuncio.PUBLICADO,
        fechaPublicacion,
        ...(fechaExpiracion && { fechaExpiracion }),
      });

      const anuncioActualizado = await Anuncio.findById(req.params.id)
        .populate('creadorId', 'nombre apellidos email tipo')
        .populate('cursoId', 'nombre nivel');

      if (!anuncioActualizado) throw new ApiError(500, 'Error al publicar el anuncio');

      // Enviar notificaciones
      await this.enviarNotificacionesAnuncio(anuncioActualizado);

      res.json({
        success: true,
        message: 'Anuncio publicado exitosamente',
        data: anuncioActualizado,
      });
    } catch (error) {
      next(error);
    }
  }

  async archivarAnuncio(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new ApiError(401, 'No autorizado');

      const anuncio = await Anuncio.findOne({
        _id: req.params.id,
        escuelaId: req.user.escuelaId,
      });

      if (!anuncio) throw new ApiError(404, 'Anuncio no encontrado');

      if (anuncio.creadorId.toString() !== req.user._id && req.user.tipo !== 'ADMIN') {
        throw new ApiError(403, 'No tienes permiso para archivar este anuncio');
      }

      if (anuncio.estado === EstadoAnuncio.ARCHIVADO) {
        throw new ApiError(400, 'El anuncio ya está archivado');
      }

      const anuncioActualizado = await Anuncio.findByIdAndUpdate(
        req.params.id,
        { estado: EstadoAnuncio.ARCHIVADO },
        { new: true },
      )
        .populate('creadorId', 'nombre apellidos email tipo')
        .populate('cursoId', 'nombre nivel');

      res.json({
        success: true,
        message: 'Anuncio archivado exitosamente',
        data: anuncioActualizado,
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerImagenPortada(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new ApiError(401, 'No autorizado');

      const { id, imagenId } = req.params;
      const bucket = gridfsManager.getBucket();
      if (!bucket) throw new ApiError(500, 'Servicio de archivos no disponible');

      // Si es una URL temporal (anuncio aún no creado)
      if (id === 'temp') {
        const fileId = new mongoose.Types.ObjectId(imagenId);
        const file = await bucket.find({ _id: fileId }).toArray();

        if (!file || file.length === 0) throw new ApiError(404, 'Imagen no encontrada');

        res.set('Content-Type', file[0].contentType || 'image/jpeg');
        bucket.openDownloadStream(fileId).pipe(res);
        return;
      }

      // Buscar anuncio
      const anuncio = await Anuncio.findOne({ _id: id, escuelaId: req.user.escuelaId });
      if (!anuncio) throw new ApiError(404, 'Anuncio no encontrado');

      if (!anuncio.imagenPortada || !anuncio.imagenPortada.fileId) {
        throw new ApiError(404, 'Este anuncio no tiene imagen de portada');
      }

      // Verificar que la imagen solicitada coincide con la del anuncio
      if (anuncio.imagenPortada.fileId.toString() !== imagenId) {
        throw new ApiError(404, 'Imagen no encontrada');
      }

      // Buscar el archivo en GridFS
      const fileId = new mongoose.Types.ObjectId(imagenId);
      const file = await bucket.find({ _id: fileId }).toArray();

      if (!file || file.length === 0) throw new ApiError(404, 'Imagen no encontrada en el sistema');

      // Devolver imagen
      res.set('Content-Type', file[0].contentType || 'image/jpeg');
      bucket.openDownloadStream(fileId).pipe(res);
    } catch (error) {
      next(error);
    }
  }

  async descargarAdjunto(req: RequestWithUser, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new ApiError(401, 'No autorizado');

      const { id, adjuntoId } = req.params;

      // Buscar anuncio
      const anuncio = await Anuncio.findOne({ _id: id, escuelaId: req.user.escuelaId });
      if (!anuncio) throw new ApiError(404, 'Anuncio no encontrado');

      // Buscar el adjunto en el anuncio
      if (!anuncio.adjuntos || anuncio.adjuntos.length === 0) {
        throw new ApiError(404, 'Este anuncio no tiene archivos adjuntos');
      }

      const adjunto = anuncio.adjuntos.find((a) => a.fileId.toString() === adjuntoId);
      if (!adjunto) throw new ApiError(404, 'Archivo adjunto no encontrado');

      const bucket = gridfsManager.getBucket();
      if (!bucket) throw new ApiError(500, 'Servicio de archivos no disponible');

      // Buscar el archivo en GridFS
      const fileId = new mongoose.Types.ObjectId(adjuntoId);
      const file = await bucket.find({ _id: fileId }).toArray();

      if (!file || file.length === 0)
        throw new ApiError(404, 'Archivo no encontrado en el sistema');

      // Configurar respuesta
      res.set({
        'Content-Type': adjunto.tipo,
        'Content-Disposition': `attachment; filename="${adjunto.nombre}"`,
      });

      // Devolver el stream del archivo
      bucket.openDownloadStream(fileId).pipe(res);
    } catch (error) {
      next(error);
    }
  }

  // Método privado para enviar notificaciones
  private async enviarNotificacionesAnuncio(anuncio: any) {
    try {
      // Encontrar el creador para obtener su nombre
      const creador = await Usuario.findById(anuncio.creadorId);
      const creadorNombre = creador
        ? `${creador.nombre} ${creador.apellidos}`.trim()
        : 'La institución';

      let destinatarios: string[] = [];

      // Determinar destinatarios según el tipo de anuncio
      switch (anuncio.tipo) {
        case TipoAnuncio.GENERAL: {
          // Todos los usuarios de la escuela
          const todosUsuarios = await Usuario.find<{ _id: mongoose.Types.ObjectId }>({
            escuelaId: anuncio.escuelaId,
            estado: 'ACTIVO',
          }).select('_id');
          destinatarios = todosUsuarios.map((u) => u._id.toString());
          break;
        }

        case TipoAnuncio.CURSO:
          if (anuncio.cursoId) {
            // Todos los estudiantes del curso
            const curso = await Curso.findById(anuncio.cursoId);
            if (curso && curso.estudiantes) {
              destinatarios = curso.estudiantes.map((id) => id.toString());
            }
          }
          break;

        case TipoAnuncio.DOCENTES: {
          // Todos los docentes de la escuela
          const docentes = await Usuario.find<{ _id: mongoose.Types.ObjectId }>({
            escuelaId: anuncio.escuelaId,
            tipo: 'DOCENTE',
            estado: 'ACTIVO',
          }).select('_id');
          destinatarios = docentes.map((d) => d._id.toString());
          break;
        }

        case TipoAnuncio.PADRES:
          {
            // Todos los padres de la escuela
            const padres = await Usuario.find<{ _id: mongoose.Types.ObjectId }>({
              escuelaId: anuncio.escuelaId,
              tipo: 'PADRE',
              estado: 'ACTIVO',
            }).select('_id');
            destinatarios = padres.map((p) => p._id.toString());
          }
          break;

        case TipoAnuncio.ESTUDIANTES: {
          // Todos los estudiantes de la escuela
          const estudiantes = await Usuario.find<{ _id: mongoose.Types.ObjectId }>({
            escuelaId: anuncio.escuelaId,
            tipo: 'ESTUDIANTE',
            estado: 'ACTIVO',
          }).select('_id');
          destinatarios = estudiantes.map((e) => e._id.toString());
          break;
        }
      }

      // Quitar al propio creador de los destinatarios
      destinatarios = destinatarios.filter((d) => d !== anuncio.creadorId.toString());

      // Si no hay destinatarios, terminar
      if (destinatarios.length === 0) return;

      // Enviar notificaciones masivas
      await notificacionService.crearNotificacionMasiva({
        usuarioIds: destinatarios,
        titulo: `Nuevo anuncio: ${anuncio.titulo}`,
        mensaje: `${creadorNombre} ha publicado un nuevo anuncio`,
        tipo: TipoNotificacion.SISTEMA,
        escuelaId: anuncio.escuelaId,
        entidadId: anuncio._id.toString(),
        entidadTipo: 'Anuncio',
        metadata: {
          anuncioId: anuncio._id.toString(),
          titulo: anuncio.titulo,
          creadorNombre,
          fechaPublicacion: anuncio.fechaPublicacion,
          destacado: anuncio.destacado,
          tieneAdjuntos: anuncio.adjuntos && anuncio.adjuntos.length > 0,
          tieneImagen: anuncio.imagenPortada && anuncio.imagenPortada.fileId,
          url: `/anuncios/${anuncio._id}`,
        },
        enviarEmail: false, // Cambiar a false para no enviar correos electrónicos
      });
    } catch (error) {
      console.error('Error al enviar notificaciones de anuncio:', error);
    }
  }
}

export default new AnuncioController();
