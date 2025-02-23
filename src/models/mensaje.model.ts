import mongoose, { Schema } from 'mongoose';
import { IMensaje } from '../interfaces/IMensaje';

const AdjuntoSchema = new Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del archivo es requerido'],
  },
  tipo: {
    type: String,
    required: [true, 'El tipo de archivo es requerido'],
  },
  url: {
    type: String,
    required: [true, 'La URL del archivo es requerida'],
  },
  tamaño: {
    type: Number,
    required: [true, 'El tamaño del archivo es requerido'],
  },
});

const ReceptorSchema = new Schema({
  usuarioId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  leido: {
    type: Boolean,
    default: false,
  },
  fechaLectura: {
    type: Date,
  },
});

const MensajeSchema: Schema = new Schema(
  {
    asunto: {
      type: String,
      required: [true, 'El asunto es requerido'],
      trim: true,
    },
    contenido: {
      type: String,
      required: [true, 'El contenido es requerido'],
    },
    emisorId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El emisor es requerido'],
    },
    receptores: [ReceptorSchema],
    escuelaId: {
      type: Schema.Types.ObjectId,
      ref: 'Escuela',
      required: [true, 'La escuela es requerida'],
    },
    tipo: {
      type: String,
      enum: ['CIRCULAR', 'MENSAJE', 'NOTIFICACION'],
      required: [true, 'El tipo de mensaje es requerido'],
    },
    estado: {
      type: String,
      enum: ['BORRADOR', 'ENVIADO', 'ARCHIVADO'],
      default: 'BORRADOR',
    },
    adjuntos: [AdjuntoSchema],
    importancia: {
      type: String,
      enum: ['ALTA', 'NORMAL', 'BAJA'],
      default: 'NORMAL',
    },
    respuestaA: {
      type: Schema.Types.ObjectId,
      ref: 'Mensaje',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Índices para optimizar búsquedas
MensajeSchema.index({ emisorId: 1, createdAt: -1 });
MensajeSchema.index({ 'receptores.usuarioId': 1, createdAt: -1 });
MensajeSchema.index({ escuelaId: 1, tipo: 1 });
MensajeSchema.index({ estado: 1 });

// Virtual para contar receptores que han leído el mensaje
MensajeSchema.virtual('cantidadLeidos').get(function (this: IMensaje) {
  return this.receptores.filter((receptor) => receptor.leido).length;
});

// Virtual para contar total de receptores
MensajeSchema.virtual('totalReceptores').get(function (this: IMensaje) {
  return this.receptores.length;
});

// Middleware para manejar cambios de estado
MensajeSchema.pre('save', function (next) {
  // Si el mensaje pasa de borrador a enviado, establecer la fecha de envío
  if (this.isModified('estado') && this.estado === 'ENVIADO') {
    if (!this.createdAt) {
      this.createdAt = new Date();
    }
  }
  next();
});

export default mongoose.model<IMensaje>('Mensaje', MensajeSchema);
