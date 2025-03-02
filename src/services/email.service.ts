// src/services/email.service.ts

import nodemailer from 'nodemailer';
import path from 'path';
import config from '../config/config';
import fs from 'fs';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // En producción, usar un servicio real como Sendgrid, Mailgun, etc.
    // Para desarrollo, utilizar servicio fake (ethereal.email)
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
      // Para entornos de desarrollo, opcional
      secure: config.email.secure,
      tls: {
        rejectUnauthorized: config.email.tlsRejectUnauthorized,
      },
    });
  }

  async sendEmail(options: {
    to: string | string[];
    subject: string;
    text?: string;
    html?: string;
    template?: string;
    context?: any;
    attachments?: any[];
  }): Promise<boolean> {
    try {
      // Si se proporciona una plantilla, cargarla
      let html = options.html;
      if (options.template) {
        try {
          const templatePath = path.join(
            __dirname,
            '../templates/emails',
            `${options.template}.html`,
          );
          if (fs.existsSync(templatePath)) {
            html = fs.readFileSync(templatePath, 'utf8');

            // Reemplazar variables en la plantilla
            if (options.context) {
              Object.keys(options.context).forEach((key) => {
                const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
                html = html!.replace(regex, options.context[key]);
              });
            }
          }
        } catch (error) {
          console.error('Error loading email template:', error);
        }
      }

      // Configurar email
      const mailOptions = {
        from: `"${config.email.senderName}" <${config.email.senderEmail}>`,
        to: Array.isArray(options.to) ? options.to.join(',') : options.to,
        subject: options.subject,
        text: options.text || '',
        html: html || '',
        attachments: options.attachments,
      };

      // Enviar email
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email enviado: %s', info.messageId);
      return true;
    } catch (error) {
      console.error('Error al enviar email:', error);
      return false;
    }
  }

  async sendMensajeNotification(
    to: string,
    mensajeInfo: {
      remitente: string;
      asunto: string;
      fecha: Date;
      tieneAdjuntos: boolean;
      url: string;
    },
  ): Promise<boolean> {
    // Texto simple para clientes que no soportan HTML
    const text =
      `Nuevo mensaje de ${mensajeInfo.remitente}: ${mensajeInfo.asunto}.\n\n` +
      `Recibido: ${mensajeInfo.fecha.toLocaleString()}.\n` +
      `${mensajeInfo.tieneAdjuntos ? 'El mensaje contiene archivos adjuntos.' : ''}\n\n` +
      `Ver mensaje: ${mensajeInfo.url}`;

    // HTML para clientes modernos
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3f51b5; color: white; padding: 20px; text-align: center;">
          <h1>Nuevo Mensaje</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p>Hola,</p>
          <p>Has recibido un nuevo mensaje en la plataforma EducaNexo360.</p>
          <h3>Detalles del mensaje:</h3>
          <p><strong>De:</strong> ${mensajeInfo.remitente}</p>
          <p><strong>Asunto:</strong> ${mensajeInfo.asunto}</p>
          <p><strong>Fecha:</strong> ${mensajeInfo.fecha.toLocaleString()}</p>
          ${
            mensajeInfo.tieneAdjuntos
              ? '<p><strong>Este mensaje contiene archivos adjuntos.</strong></p>'
              : ''
          }
          <p><a href="${
            mensajeInfo.url
          }" style="display: inline-block; background-color: #3f51b5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px;">Ver Mensaje</a></p>
        </div>
        <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>Este es un correo automático, por favor no responda a este mensaje.</p>
          <p>&copy; 2024 EducaNexo360. Todos los derechos reservados.</p>
        </div>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `Nuevo mensaje: ${mensajeInfo.asunto}`,
      text,
      html,
    });
  }
}

export default new EmailService();
