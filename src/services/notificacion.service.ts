// src/services/notificacion.service.ts

import Notificacion from '../models/notificacion.model';
import Usuario from '../models/usuario.model';
import emailService from './email.service';
import { TipoNotificacion, EstadoNotificacion } from '../interfaces/INotificacion';
import config from '../config/config';

class NotificacionService {
  /**
   * Crear una nueva notificación
   */
  async crearNotificacion(data: {
    usuarioId: string;
    titulo: string;
    mensaje: string;
    tipo: TipoNotificacion;
    escuelaId: string;
    entidadId?: string;
    entidadTipo?: string;
    metadata?: Record<string, any>;
    enviarEmail?: boolean;
  }) {
    try {
      // Crear la notificación
      const notificacion = await Notificacion.create({
        usuarioId: data.usuarioId,
        titulo: data.titulo,
        mensaje: data.mensaje,
        tipo: data.tipo,
        estado: EstadoNotificacion.PENDIENTE,
        entidadId: data.entidadId,
        entidadTipo: data.entidadTipo,
        escuelaId: data.escuelaId,
        metadata: data.metadata || {},
      });

      // Si se solicita envío de email, enviar notificación por correo
      if (data.enviarEmail) {
        const usuario = await Usuario.findById(data.usuarioId);
        if (usuario && usuario.email) {
          await this.enviarEmailNotificacion(
            usuario.email,
            data.titulo,
            data.mensaje,
            data.tipo,
            data.metadata,
          );
        }
      }

      return notificacion;
    } catch (error) {
      console.error('Error al crear notificación:', error);
      throw error;
    }
  }

  /**
   * Crear notificaciones para múltiples usuarios
   */
  async crearNotificacionMasiva(data: {
    usuarioIds: string[];
    titulo: string;
    mensaje: string;
    tipo: TipoNotificacion;
    escuelaId: string;
    entidadId?: string;
    entidadTipo?: string;
    metadata?: Record<string, any>;
    enviarEmail?: boolean;
  }) {
    try {
      const notificaciones = [];

      // Crear documentos de notificación para todos los usuarios
      const notificacionesDocs = data.usuarioIds.map((usuarioId) => ({
        usuarioId,
        titulo: data.titulo,
        mensaje: data.mensaje,
        tipo: data.tipo,
        estado: EstadoNotificacion.PENDIENTE,
        entidadId: data.entidadId,
        entidadTipo: data.entidadTipo,
        escuelaId: data.escuelaId,
        metadata: data.metadata || {},
      }));

      // Insertar todas las notificaciones
      if (notificacionesDocs.length > 0) {
        notificaciones.push(...(await Notificacion.insertMany(notificacionesDocs)));
      }

      // Si se solicita envío de email, enviar emails
      if (data.enviarEmail) {
        const usuarios = await Usuario.find({ _id: { $in: data.usuarioIds } });
        for (const usuario of usuarios) {
          if (usuario.email) {
            await this.enviarEmailNotificacion(
              usuario.email,
              data.titulo,
              data.mensaje,
              data.tipo,
              data.metadata,
            );
          }
        }
      }

      return notificaciones;
    } catch (error) {
      console.error('Error al crear notificaciones masivas:', error);
      throw error;
    }
  }

  /**
   * Marcar una notificación como leída
   */
  async marcarComoLeida(notificacionId: string, usuarioId: string) {
    try {
      const notificacion = await Notificacion.findOneAndUpdate(
        { _id: notificacionId, usuarioId },
        {
          estado: EstadoNotificacion.LEIDA,
          fechaLectura: new Date(),
        },
        { new: true },
      );

      return notificacion;
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      throw error;
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async marcarTodasComoLeidas(usuarioId: string) {
    try {
      const resultado = await Notificacion.updateMany(
        { usuarioId, estado: EstadoNotificacion.PENDIENTE },
        {
          estado: EstadoNotificacion.LEIDA,
          fechaLectura: new Date(),
        },
      );

      return resultado.modifiedCount;
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      throw error;
    }
  }

  /**
   * Archivar una notificación
   */
  async archivarNotificacion(notificacionId: string, usuarioId: string) {
    try {
      const notificacion = await Notificacion.findOneAndUpdate(
        { _id: notificacionId, usuarioId },
        { estado: EstadoNotificacion.ARCHIVADA },
        { new: true },
      );

      return notificacion;
    } catch (error) {
      console.error('Error al archivar notificación:', error);
      throw error;
    }
  }

  /**
   * Enviar notificación por email
   */
  private async enviarEmailNotificacion(
    email: string,
    titulo: string,
    mensaje: string,
    tipo: TipoNotificacion,
    metadata?: Record<string, any>,
  ) {
    // Texto simple para clientes que no soportan HTML
    const text = `${titulo}\n\n${mensaje}`;

    // Personalizar según el tipo
    let url = `${config.frontendUrl}/notificaciones`;
    let tipoTexto = 'Notificación del sistema';

    switch (tipo) {
      case TipoNotificacion.MENSAJE:
        url = metadata?.url || `${config.frontendUrl}/mensajes/${metadata?.mensajeId || ''}`;
        tipoTexto = 'Nuevo mensaje';
        break;
      case TipoNotificacion.CALIFICACION:
        url = `${config.frontendUrl}/calificaciones`;
        tipoTexto = 'Nueva calificación';
        break;
      case TipoNotificacion.EVENTO:
        url = `${config.frontendUrl}/eventos`;
        tipoTexto = 'Evento escolar';
        break;
    }

    // HTML para clientes modernos
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3f51b5; color: white; padding: 20px; text-align: center;">
          <h1>${tipoTexto}</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <h2>${titulo}</h2>
          <p>${mensaje}</p>
          <p><a href="${url}" style="display: inline-block; background-color: #3f51b5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">Ver detalles</a></p>
        </div>
        <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>Este es un correo automático, por favor no responda a este mensaje.</p>
          <p>&copy; 2024 EducaNexo360. Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    return emailService.sendEmail({
      to: email,
      subject: titulo,
      text,
      html,
    });
  }
}

export default new NotificacionService();
