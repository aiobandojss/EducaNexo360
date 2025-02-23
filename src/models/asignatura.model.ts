import mongoose, { Schema } from 'mongoose';
import { IAsignatura } from '../interfaces/IAsignatura';

const AsignaturaSchema: Schema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true,
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción es requerida'],
      trim: true,
    },
    cursoId: {
      type: Schema.Types.ObjectId,
      ref: 'Curso',
      required: [true, 'El curso es requerido'],
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
    },
    periodos: [
      {
        numero: {
          type: Number,
          required: true,
        },
        logros: [
          {
            descripcion: {
              type: String,
              required: true,
            },
            porcentaje: {
              type: Number,
              required: true,
              min: 0,
              max: 100,
            },
            tipo: {
              type: String,
              enum: ['COGNITIVO', 'PROCEDIMENTAL', 'ACTITUDINAL'],
              required: true,
            },
            criterios_evaluacion: [
              {
                type: String,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Índices para optimizar búsquedas
AsignaturaSchema.index({ cursoId: 1 });
AsignaturaSchema.index({ docenteId: 1 });
AsignaturaSchema.index({ escuelaId: 1 });

export default mongoose.model<IAsignatura>('Asignatura', AsignaturaSchema);
