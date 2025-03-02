// src/models/mensaje.model.ts

import mongoose, { Schema } from 'mongoose';
import { IMensaje, TipoMensaje, EstadoMensaje, PrioridadMensaje } from '../interfaces/IMensaje';

const AdjuntoSchema = new Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del archivo es requerido'],
  },
  tipo: {
    type: String,
    required: [true, 'El tipo del archivo es requerido'],
  },
  tamaño: {
    type: Number,
    required: [true, 'El tamaño del archivo es requerido'],
  },
  fileId: {
    type: Schema.Types.ObjectId,
    required: [true, 'El ID del archivo es requerido'],
  },
  fechaSubida: {
    type: Date,
    default: Date.now,
  },
});

const LecturaSchema = new Schema({
  usuarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  fechaLectura: {
    type: Date,
    default: Date.now,
  },
});

const MensajeSchema = new Schema(
  {
    remitente: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El remitente es requerido'],
    },
    destinatarios: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'Al menos un destinatario es requerido'],
      },
    ],
    destinatariosCc: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
      },
    ],
    asunto: {
      type: String,
      required: [true, 'El asunto es requerido'],
      trim: true,
    },
    contenido: {
      type: String,
      required: [true, 'El contenido es requerido'],
    },
    tipo: {
      type: String,
      enum: Object.values(TipoMensaje),
      default: TipoMensaje.INDIVIDUAL,
    },
    prioridad: {
      type: String,
      enum: Object.values(PrioridadMensaje),
      default: PrioridadMensaje.NORMAL,
    },
    estado: {
      type: String,
      enum: Object.values(EstadoMensaje),
      default: EstadoMensaje.ENVIADO,
    },
    etiquetas: [
      {
        type: String,
        trim: true,
      },
    ],
    adjuntos: [AdjuntoSchema],
    escuelaId: {
      type: Schema.Types.ObjectId,
      ref: 'Escuela',
      required: [true, 'La escuela es requerida'],
    },
    esRespuesta: {
      type: Boolean,
      default: false,
    },
    mensajeOriginalId: {
      type: Schema.Types.ObjectId,
      ref: 'Mensaje',
    },
    lecturas: [LecturaSchema],
  },
  {
    timestamps: true,
  },
);

// Índices para mejorar las consultas
MensajeSchema.index({ remitente: 1, createdAt: -1 });
MensajeSchema.index({ destinatarios: 1, createdAt: -1 });
MensajeSchema.index({ escuelaId: 1, createdAt: -1 });
MensajeSchema.index({ estado: 1 });
MensajeSchema.index({ tipo: 1 });

export default mongoose.model<IMensaje>('Mensaje', MensajeSchema);
