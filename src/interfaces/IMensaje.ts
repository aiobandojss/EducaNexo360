// src/interfaces/IMensaje.ts

import { Document, Types } from 'mongoose';

export enum TipoMensaje {
  CIRCULAR = 'CIRCULAR', // Para toda la institución o cursos
  INDIVIDUAL = 'INDIVIDUAL', // De persona a persona
  NOTIFICACION = 'NOTIFICACION', // Sistema -> Usuario
  BORRADOR = 'BORRADOR', // Mensaje guardado como borrador
}

export enum EstadoMensaje {
  ENVIADO = 'ENVIADO',
  LEIDO = 'LEIDO',
  ARCHIVADO = 'ARCHIVADO',
  BORRADOR = 'BORRADOR',
}

export enum PrioridadMensaje {
  ALTA = 'ALTA',
  NORMAL = 'NORMAL',
  BAJA = 'BAJA',
}

export interface IAdjunto {
  nombre: string;
  tipo: string;
  tamaño: number;
  fileId: Types.ObjectId; // Referencia a GridFS
  fechaSubida: Date;
}

export interface ILecturaMensaje {
  usuarioId: Types.ObjectId;
  fechaLectura: Date;
}

export interface IMensajeBase {
  remitente: Types.ObjectId; // ID del usuario que envía
  destinatarios: Types.ObjectId[]; // IDs de usuarios o grupos
  destinatariosCc?: Types.ObjectId[]; // Copia
  asunto: string;
  contenido: string;
  tipo: TipoMensaje;
  prioridad: PrioridadMensaje;
  estado: EstadoMensaje;
  etiquetas?: string[];
  adjuntos?: IAdjunto[];
  escuelaId: Types.ObjectId;
  esRespuesta?: boolean;
  mensajeOriginalId?: Types.ObjectId;
  lecturas?: ILecturaMensaje[]; // Registro de lecturas
}

export interface IMensaje extends IMensajeBase, Document {
  createdAt: Date;
  updatedAt: Date;
}
