// src/models/asistencia.model.ts

import mongoose, { Schema } from 'mongoose';
import { IAsistencia, EstadoAsistencia } from '../interfaces/IAsistencia';

const AsistenciaEstudianteSchema = new Schema({
  estudianteId: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
    required: [true, 'El estudiante es requerido'],
  },
  estado: {
    type: String,
    enum: Object.values(EstadoAsistencia),
    default: EstadoAsistencia.PRESENTE,
  },
  justificacion: {
    type: String,
    trim: true,
  },
  observaciones: {
    type: String,
    trim: true,
  },
  registradoPor: {
    type: Schema.Types.ObjectId,
    ref: 'Usuario',
  },
  fechaRegistro: {
    type: Date,
    default: Date.now,
  },
});

const AsistenciaSchema = new Schema(
  {
    fecha: {
      type: Date,
      required: [true, 'La fecha es requerida'],
      index: true,
    },
    cursoId: {
      type: Schema.Types.ObjectId,
      ref: 'Curso',
      required: [true, 'El curso es requerido'],
      index: true,
    },
    asignaturaId: {
      type: Schema.Types.ObjectId,
      ref: 'Asignatura',
      index: true,
    },
    docenteId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El docente es requerido'],
    },
    escuelaId: {
      type: Schema.Types.ObjectId,
      ref: 'Escuela',
      required: [true, 'La escuela es requerida'],
      index: true,
    },
    periodoId: {
      type: Schema.Types.ObjectId,
      ref: 'Periodo',
    },
    tipoSesion: {
      type: String,
      enum: ['CLASE', 'ACTIVIDAD', 'EVENTO', 'OTRO'],
      default: 'CLASE',
    },
    horaInicio: {
      type: String,
    },
    horaFin: {
      type: String,
    },
    estudiantes: [AsistenciaEstudianteSchema],
    observacionesGenerales: {
      type: String,
      trim: true,
    },
    finalizado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

// Índices compuestos para mejorar consultas frecuentes
AsistenciaSchema.index({ cursoId: 1, fecha: 1 });
AsistenciaSchema.index({ escuelaId: 1, fecha: 1 });
AsistenciaSchema.index({ asignaturaId: 1, fecha: 1 });
AsistenciaSchema.index({ 'estudiantes.estudianteId': 1, fecha: 1 });

export default mongoose.model<IAsistencia>('Asistencia', AsistenciaSchema);
