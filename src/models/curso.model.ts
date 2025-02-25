import mongoose, { Schema, Document } from 'mongoose';

export interface ICurso extends Document {
  nombre: string;
  nivel: string;
  año_academico: string;
  escuelaId: mongoose.Types.ObjectId;
  director_grupo: mongoose.Types.ObjectId;
  estudiantes: mongoose.Types.ObjectId[];
  estado: 'ACTIVO' | 'INACTIVO';
  createdAt: Date;
  updatedAt: Date;
}

const CursoSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del curso es requerido'],
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
    estado: {
      type: String,
      enum: ['ACTIVO', 'INACTIVO'],
      default: 'ACTIVO',
    },
  },
  {
    timestamps: true,
  },
);

// Índices
CursoSchema.index({ escuelaId: 1, año_academico: 1 });
CursoSchema.index({ director_grupo: 1 });
CursoSchema.index({ nombre: 1, escuelaId: 1 }, { unique: true });

const Curso = mongoose.model<ICurso>('Curso', CursoSchema);

export default Curso;
