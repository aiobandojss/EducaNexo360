import mongoose, { Schema, Document } from 'mongoose';
import { Types } from 'mongoose';

// Estados de solicitud
export enum EstadoSolicitud {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
}

// Interfaz para estudiante en solicitud
export interface IEstudianteSolicitud {
  nombre: string;
  apellidos: string;
  fechaNacimiento?: Date;
  cursoId: Types.ObjectId;
  codigo_estudiante?: string;
  email?: string; // Nuevo campo opcional
}

// Interfaz base para solicitud
export interface ISolicitudRegistroBase {
  invitacionId: Types.ObjectId;
  escuelaId: Types.ObjectId;

  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string;

  estudiantes: IEstudianteSolicitud[];

  estado: EstadoSolicitud;
  fechaSolicitud: Date;
  fechaRevision?: Date;
  revisadoPor?: Types.ObjectId;
  comentarios?: string;

  usuariosCreados?: Types.ObjectId[];
}

// Interfaz del documento para Mongoose
export interface ISolicitudRegistro extends ISolicitudRegistroBase, Document {}

const SolicitudRegistroSchema = new Schema<ISolicitudRegistro>(
  {
    invitacionId: {
      type: Schema.Types.ObjectId,
      ref: 'Invitacion',
      required: true,
    },
    escuelaId: {
      type: Schema.Types.ObjectId,
      ref: 'Escuela',
      required: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    apellidos: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    telefono: {
      type: String,
    },
    estudiantes: [
      {
        nombre: {
          type: String,
          required: true,
          trim: true,
        },
        apellidos: {
          type: String,
          required: true,
          trim: true,
        },
        fechaNacimiento: {
          type: Date,
        },
        cursoId: {
          type: Schema.Types.ObjectId,
          ref: 'Curso',
          required: true,
        },
        codigo_estudiante: {
          type: String,
        },
        email: {
          type: String,
          trim: true,
          lowercase: true,
        },
      },
    ],
    estado: {
      type: String,
      enum: Object.values(EstadoSolicitud),
      default: EstadoSolicitud.PENDIENTE,
    },
    fechaSolicitud: {
      type: Date,
      default: Date.now,
    },
    fechaRevision: {
      type: Date,
    },
    revisadoPor: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
    },
    comentarios: {
      type: String,
    },
    usuariosCreados: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
      },
    ],
  },
  {
    timestamps: true,
    collection: 'solicitudregistros', // Especificamos explícitamente el nombre de la colección
  },
);

// Índices
SolicitudRegistroSchema.index({ escuelaId: 1, estado: 1 });
SolicitudRegistroSchema.index({ email: 1, escuelaId: 1 });

// Exportar el modelo
const SolicitudRegistro = mongoose.model<ISolicitudRegistro>(
  'SolicitudRegistro',
  SolicitudRegistroSchema,
);
export default SolicitudRegistro;
