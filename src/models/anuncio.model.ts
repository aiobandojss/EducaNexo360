// src/models/anuncio.model.ts

import mongoose, { Schema } from 'mongoose';
import { IAnuncio, TipoAnuncio, EstadoAnuncio } from '../interfaces/IAnuncio';

const AdjuntoSchema = new Schema({
  fileId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
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

const ImagenPortadaSchema = new Schema({
  fileId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
});

const AnuncioSchema = new Schema(
  {
    titulo: {
      type: String,
      required: [true, 'El título del anuncio es requerido'],
      trim: true,
    },
    contenido: {
      type: String,
      required: [true, 'El contenido del anuncio es requerido'],
    },
    tipo: {
      type: String,
      enum: Object.values(TipoAnuncio),
      default: TipoAnuncio.GENERAL,
    },
    estado: {
      type: String,
      enum: Object.values(EstadoAnuncio),
      default: EstadoAnuncio.BORRADOR,
    },
    creadorId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El creador del anuncio es requerido'],
    },
    escuelaId: {
      type: Schema.Types.ObjectId,
      ref: 'Escuela',
      required: [true, 'La escuela es requerida'],
    },
    cursoId: {
      type: Schema.Types.ObjectId,
      ref: 'Curso',
    },
    destacado: {
      type: Boolean,
      default: false,
    },
    fechaPublicacion: {
      type: Date,
      default: Date.now,
    },
    fechaExpiracion: {
      type: Date,
    },
    adjuntos: [AdjuntoSchema],
    destinatarios: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
      },
    ],
    lecturas: [LecturaSchema],
    imagenPortada: ImagenPortadaSchema,
  },
  {
    timestamps: true,
  },
);

// Middleware para validar fechas
AnuncioSchema.pre('save', function (next) {
  if (this.fechaExpiracion && this.fechaExpiracion < this.fechaPublicacion) {
    next(new Error('La fecha de expiración no puede ser anterior a la fecha de publicación'));
  }
  next();
});

// Índices para mejorar las consultas
AnuncioSchema.index({ escuelaId: 1, estado: 1 });
AnuncioSchema.index({ escuelaId: 1, tipo: 1 });
AnuncioSchema.index({ escuelaId: 1, creadorId: 1 });
AnuncioSchema.index({ escuelaId: 1, cursoId: 1 });
AnuncioSchema.index({ destinatarios: 1 });
AnuncioSchema.index({ fechaPublicacion: -1 });
AnuncioSchema.index({ destacado: 1, fechaPublicacion: -1 });

export default mongoose.model<IAnuncio>('Anuncio', AnuncioSchema);
