// src/services/mensaje.service.ts - VERSIÓN REVISADA

import mongoose from 'mongoose';
import Usuario from '../models/usuario.model';
import Mensaje from '../models/mensaje.model';
import Curso from '../models/curso.model';
import Asignatura from '../models/asignatura.model';
import ApiError from '../utils/ApiError';
import { TipoMensaje, EstadoMensaje, PrioridadMensaje } from '../interfaces/IMensaje';
import { TipoNotificacion } from '../interfaces/INotificacion';
import emailService from './email.service';
import notificacionService from './notificacion.service';
import config from '../config/config';

class MensajeService {
  /**
   * Convierte de forma segura una cadena a ObjectId
   * @param id ID a convertir
   * @returns ObjectId o null si la conversión falla
   */
  private safeObjectId(id: string | any): mongoose.Types.ObjectId | null {
    try {
      if (!id) return null;

      // Si ya es un ObjectId, retornarlo
      if (id instanceof mongoose.Types.ObjectId) return id;

      // Verificar si es un string válido y convertirlo
      if (typeof id === 'string' && mongoose.isValidObjectId(id)) {
        return new mongoose.Types.ObjectId(id);
      }

      return null;
    } catch (error) {
      console.error('Error al convertir a ObjectId:', error);
      return null;
    }
  }

  /**
   * Obtiene los posibles destinatarios según el rol del usuario - VERSIÓN SIMPLIFICADA
   * para solucionar errores iniciales
   */
  async getPosiblesDestinatarios(userId: string, escuelaId: string, query: string = '') {
    try {
      console.log(
        `[getPosiblesDestinatarios] Iniciando con userId=${userId}, escuelaId=${escuelaId}, query='${query}'`,
      );

      // Intentamos una implementación simplificada para evitar errores iniciales
      // Validar IDs
      if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, 'ID de usuario inválido');
      }

      if (!mongoose.isValidObjectId(escuelaId)) {
        throw new ApiError(400, 'ID de escuela inválido');
      }

      // Buscar el usuario que está consultando
      const usuario = await Usuario.findById(userId);
      if (!usuario) {
        throw new ApiError(404, 'Usuario no encontrado');
      }

      console.log(
        `[getPosiblesDestinatarios] Usuario encontrado: ${usuario._id}, tipo: ${usuario.tipo}`,
      );

      // Filtro básico - versión simplificada para depuración
      const filter: any = {
        escuelaId: new mongoose.Types.ObjectId(escuelaId),
        _id: { $ne: new mongoose.Types.ObjectId(userId) }, // Excluir al usuario actual
      };

      // Si hay texto de búsqueda, aplicar
      if (query && query.trim() !== '') {
        const searchRegex = new RegExp(query, 'i');
        filter.$or = [{ nombre: searchRegex }, { apellidos: searchRegex }, { email: searchRegex }];
      }

      // Si es estudiante, solo puede ver a personal administrativo y docentes
      if (usuario.tipo === 'ESTUDIANTE') {
        filter.tipo = { $in: ['DOCENTE', 'COORDINADOR', 'RECTOR', 'ADMINISTRATIVO'] };
      }

      // Ejecutar la consulta simplificada
      const destinatarios = await Usuario.find(filter)
        .select('_id nombre apellidos email tipo perfil')
        .limit(50)
        .sort({ nombre: 1, apellidos: 1 });

      console.log(
        `[DEBUG] getPosiblesDestinatarios: Total destinatarios encontrados: ${destinatarios.length}`,
      );

      return destinatarios;
    } catch (error) {
      console.error('[ERROR] getPosiblesDestinatarios:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Obtiene los cursos disponibles para mensajes masivos
   */
  async getCursosPosiblesDestinatarios(userId: string, escuelaId: string) {
    try {
      // Validar IDs de entrada
      if (!mongoose.isValidObjectId(userId)) {
        throw new ApiError(400, 'ID de usuario inválido');
      }

      if (!mongoose.isValidObjectId(escuelaId)) {
        throw new ApiError(400, 'ID de escuela inválido');
      }

      const usuario = await Usuario.findById(userId);
      if (!usuario) {
        throw new ApiError(404, 'Usuario no encontrado');
      }

      // Solo estos roles pueden enviar mensajes masivos
      const rolesMasivos = [
        'ADMIN',
        'SUPER_ADMIN',
        'RECTOR',
        'COORDINADOR',
        'ADMINISTRATIVO',
        'DOCENTE',
      ];

      if (!rolesMasivos.includes(usuario.tipo)) {
        throw new ApiError(403, 'No tiene permisos para enviar mensajes masivos');
      }

      // Para implementación inicial, simplificamos a mostrar todos los cursos
      // y evitar errores de referencias
      const cursos = await Curso.find({ escuelaId: new mongoose.Types.ObjectId(escuelaId) })
        .select('_id nombre grado seccion nivel')
        .sort({ nivel: 1, grado: 1, seccion: 1 });

      console.log(`[DEBUG] getCursosPosiblesDestinatarios: Cursos encontrados: ${cursos.length}`);

      return cursos;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Crea un nuevo mensaje
   */
  async crearMensaje(datos: any, user: any) {
    try {
      const {
        destinatarios,
        destinatariosCc,
        cursoIds,
        asunto,
        contenido,
        adjuntos = [],
        tipo = TipoMensaje.INDIVIDUAL,
        prioridad = PrioridadMensaje.NORMAL,
        estado = EstadoMensaje.ENVIADO,
        etiquetas = [],
        esRespuesta = false,
        mensajeOriginalId = null,
      } = datos;

      // Verificar si el usuario es un estudiante
      if (user.tipo === 'ESTUDIANTE') {
        throw new ApiError(403, 'Los estudiantes no pueden enviar mensajes');
      }

      // Obtener destinatarios finales (incluyendo cursos si es aplicable)
      let destinatariosFinales = Array.isArray(destinatarios) ? [...destinatarios] : [];
      let destinatariosCcFinales = Array.isArray(destinatariosCc) ? [...destinatariosCc] : [];

      // Procesar cursos si se especificaron
      if (cursoIds && cursoIds.length > 0) {
        // Verificar permisos para mensajes masivos
        const rolesMasivos = [
          'ADMIN',
          'SUPER_ADMIN',
          'RECTOR',
          'COORDINADOR',
          'ADMINISTRATIVO',
          'DOCENTE',
        ];

        if (!rolesMasivos.includes(user.tipo)) {
          throw new ApiError(403, 'No tiene permisos para enviar mensajes masivos');
        }

        // CAMBIO IMPORTANTE: Obtener estudiantes directamente de los documentos de curso
        for (const cursoId of cursoIds) {
          if (!mongoose.isValidObjectId(cursoId)) {
            console.log(`[WARNING] ID de curso inválido: ${cursoId}`);
            continue;
          }

          const curso = await Curso.findById(cursoId);
          if (curso && curso.estudiantes && Array.isArray(curso.estudiantes)) {
            // Añadir IDs de estudiantes como destinatarios
            const estudiantesIds = curso.estudiantes.map((id: any) => id.toString());
            destinatariosFinales.push(...estudiantesIds);

            // Buscar acudientes de estos estudiantes
            const acudientes = await Usuario.find({
              tipo: 'ACUDIENTE',
              'info_academica.estudiantes_asociados': {
                $in: curso.estudiantes,
              },
            }).select('_id');

            if (acudientes.length > 0) {
              const acudientesIds = acudientes.map((a: any) => a._id.toString());
              destinatariosFinales.push(...acudientesIds);
            }
          }
        }
      }

      // Eliminar duplicados
      destinatariosFinales = [...new Set(destinatariosFinales)];
      destinatariosCcFinales = [...new Set(destinatariosCcFinales)];

      // Verificar que haya destinatarios
      if (destinatariosFinales.length === 0) {
        throw new ApiError(400, 'Debe especificar al menos un destinatario');
      }

      // Convertir a ObjectId y filtrar IDs inválidos
      const destinatariosObjectIds = destinatariosFinales
        .map((id) => (mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null))
        .filter((id) => id !== null);

      const destinatariosCcObjectIds = destinatariosCcFinales
        .map((id) => (mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null))
        .filter((id) => id !== null);

      // Crear el mensaje
      const nuevoMensaje = await Mensaje.create({
        remitente: user._id,
        destinatarios: destinatariosObjectIds,
        destinatariosCc: destinatariosCcObjectIds,
        asunto,
        contenido,
        adjuntos,
        escuelaId: user.escuelaId,
        tipo,
        prioridad,
        estado,
        etiquetas,
        esRespuesta,
        mensajeOriginalId,
        lecturas: [],
      });

      // Si no es borrador, enviar notificaciones
      if (estado !== EstadoMensaje.BORRADOR) {
        // Obtener información del remitente para notificaciones
        const nombreRemitente = `${user.nombre} ${user.apellidos}`.trim();

        // Enviar notificaciones y correos a todos los destinatarios
        const todosDestinatarios = [...destinatariosFinales, ...destinatariosCcFinales];
        const validDestinatariosIds = todosDestinatarios
          .map((id) => {
            return mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null;
          })
          .filter((id) => id !== null);

        const usuarios = await Usuario.find({
          _id: { $in: validDestinatariosIds },
        });

        // Guardar el ID del mensaje como string para usarlo en las notificaciones
        const mensajeId = nuevoMensaje._id ? nuevoMensaje._id.toString() : '';

        // Enviar notificaciones y correos en paralelo
        const promesas = usuarios.map(async (destinatario: any) => {
          const destId = destinatario._id ? destinatario._id.toString() : '';

          // Notificación interna
          await notificacionService.crearNotificacion({
            usuarioId: destId,
            titulo: `Nuevo mensaje: ${asunto}`,
            mensaje: `Has recibido un nuevo mensaje de ${nombreRemitente}`,
            tipo: TipoNotificacion.MENSAJE,
            escuelaId: user.escuelaId,
            entidadId: mensajeId,
            entidadTipo: 'Mensaje',
            metadata: {
              remitente: nombreRemitente,
              tieneAdjuntos: adjuntos.length > 0,
              mensajeId: mensajeId,
              url: `${config.frontendUrl}/mensajes/${mensajeId}`,
            },
            enviarEmail: false,
          });

          // Correo electrónico
          if (destinatario.email) {
            await emailService.sendMensajeNotification(destinatario.email, {
              remitente: nombreRemitente,
              asunto,
              fecha: new Date(),
              tieneAdjuntos: adjuntos.length > 0,
              url: `${config.frontendUrl}/mensajes/${mensajeId}`,
            });
          }
        });

        await Promise.all(promesas);
      }

      // Poblamos información adicional para devolver
      await nuevoMensaje.populate([
        { path: 'remitente', select: 'nombre apellidos email tipo' },
        { path: 'destinatarios', select: 'nombre apellidos email tipo' },
        { path: 'destinatariosCc', select: 'nombre apellidos email tipo' },
      ]);

      return nuevoMensaje;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Envia copia del mensaje a los acudientes del estudiante
   */
  async enviarCopiaAcudientes(estudianteId: string, datos: any, usuarioOrigen: any) {
    try {
      // Validar ID de estudiante
      if (!mongoose.isValidObjectId(estudianteId)) {
        console.log(`[WARNING] ID de estudiante inválido: ${estudianteId}`);
        return null;
      }

      // Verificar si el estudiante existe
      const estudiante = await Usuario.findOne({
        _id: new mongoose.Types.ObjectId(estudianteId),
        tipo: 'ESTUDIANTE',
      });

      if (!estudiante) {
        return null;
      }

      // Buscar acudientes del estudiante
      const acudientes = await Usuario.find({
        tipo: 'ACUDIENTE',
        'info_academica.estudiantes_asociados': estudiante._id,
      });

      if (acudientes.length === 0) {
        return null;
      }

      // Crear datos para el mensaje a los acudientes
      const mensajeAcudientes = {
        destinatarios: acudientes
          .map((a: any) => {
            // Garantizar que el ID sea una cadena
            return a && a._id ? a._id.toString() : '';
          })
          .filter((id) => id !== ''), // Eliminar IDs vacíos
        asunto: `[COPIA] ${datos.asunto}`,
        contenido: `Este mensaje ha sido enviado automáticamente como copia del mensaje enviado a su acudido.\n\n${datos.contenido}`,
        adjuntos: datos.adjuntos || [],
        tipo: datos.tipo || TipoMensaje.INDIVIDUAL,
        prioridad: datos.prioridad || PrioridadMensaje.NORMAL,
        estado: EstadoMensaje.ENVIADO,
        etiquetas: datos.etiquetas || [],
        esRespuesta: false,
      };

      // Crear el mensaje
      return this.crearMensaje(mensajeAcudientes, usuarioOrigen);
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Manejador de errores
   */
  private handleError(error: any) {
    console.error('[Error en MensajeService]', error);

    if (error instanceof ApiError) {
      return error;
    }

    if (error.name === 'CastError') {
      return new ApiError(400, 'Formato de ID inválido: ' + (error.message || ''));
    }

    if (error.response) {
      // Error de respuesta del servidor
      return new ApiError(
        error.response.status || 500,
        error.response.data.message || 'Error en la solicitud',
      );
    } else if (error.request) {
      // Error sin respuesta del servidor
      return new ApiError(500, 'No se recibió respuesta del servidor');
    } else {
      // Error en la configuración de la solicitud
      return new ApiError(500, error.message || 'Error desconocido');
    }
  }
}

export default new MensajeService();
