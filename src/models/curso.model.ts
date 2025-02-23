import mongoose, { Schema } from 'mongoose';
import { ICurso } from '../interfaces/ICurso';

const CursoSchema: Schema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
    },
    nivel: {
      type: String,
      required: [true, 'El nivel es requerido'],
      trim: true,
    },
    año_academico: {
      type: String,
      required: [true, 'El año académico es requerido'],
    },
    escuelaId: {
      type: Schema.Types.ObjectId,
      ref: 'Escuela',
      required: [true, 'La escuela es requerida'],
    },
    director_grupo: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El director de grupo es requerido'],
    },
    estudiantes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
      },
    ],
    asignaturas: [
      {
        asignaturaId: {
          type: Schema.Types.ObjectId,
          ref: 'Asignatura',
          required: true,
        },
        docenteId: {
          type: Schema.Types.ObjectId,
          ref: 'Usuario',
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

// Índices para optimizar búsquedas
CursoSchema.index({ escuelaId: 1, año_academico: 1 });
CursoSchema.index({ director_grupo: 1 });

export default mongoose.model<ICurso>('Curso', CursoSchema);
