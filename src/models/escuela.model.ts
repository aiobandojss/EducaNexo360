import mongoose, { Schema } from 'mongoose';

const EscuelaSchema: Schema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
    },
    direccion: {
      type: String,
      required: [true, 'La dirección es requerida'],
      trim: true,
    },
    telefono: {
      type: String,
      required: [true, 'El teléfono es requerido'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'El email es requerido'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    estado: {
      type: String,
      enum: ['ACTIVO', 'INACTIVO'],
      default: 'ACTIVO',
    },
    configuracion: {
      periodos_academicos: {
        type: Number,
        required: [true, 'El número de períodos académicos es requerido'],
        default: 4,
      },
      escala_calificacion: {
        minima: {
          type: Number,
          required: [true, 'La calificación mínima es requerida'],
          default: 0,
        },
        maxima: {
          type: Number,
          required: [true, 'La calificación máxima es requerida'],
          default: 5,
        },
      },
      logros_por_periodo: {
        type: Number,
        required: [true, 'El número de logros por período es requerido'],
        default: 3,
      },
    },
    periodos_academicos: [
      {
        numero: {
          type: Number,
          required: true,
        },
        nombre: {
          type: String,
          required: true,
        },
        fecha_inicio: {
          type: Date,
          required: true,
        },
        fecha_fin: {
          type: Date,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Índices
EscuelaSchema.index({ email: 1 }, { unique: true });
EscuelaSchema.index({ estado: 1 });

const Escuela = mongoose.model('Escuela', EscuelaSchema);

export default Escuela;
