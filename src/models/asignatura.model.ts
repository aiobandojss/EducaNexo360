import mongoose, { Schema, Document } from 'mongoose';

export interface IAsignatura extends Document {
  nombre: string;
  descripcion: string;
  cursoId: mongoose.Types.ObjectId;
  docenteId: mongoose.Types.ObjectId;
  escuelaId: mongoose.Types.ObjectId;
  intensidad_horaria: number;
  estado: 'ACTIVO' | 'INACTIVO';
  periodos: Array<{
    numero: number;
    nombre: string;
    porcentaje: number;
    fecha_inicio: Date;
    fecha_fin: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const PeriodoSchema = new Schema({
  numero: {
    type: Number,
    required: [true, 'El número del periodo es requerido'],
  },
  nombre: {
    type: String,
    required: [true, 'El nombre del periodo es requerido'],
  },
  porcentaje: {
    type: Number,
    required: [true, 'El porcentaje del periodo es requerido'],
    min: [0, 'El porcentaje no puede ser menor a 0'],
    max: [100, 'El porcentaje no puede ser mayor a 100'],
  },
  fecha_inicio: {
    type: Date,
    required: [true, 'La fecha de inicio es requerida'],
  },
  fecha_fin: {
    type: Date,
    required: [true, 'La fecha de fin es requerida'],
  },
});

const AsignaturaSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre de la asignatura es requerido'],
      trim: true,
    },
    descripcion: {
      type: String,
      required: [true, 'La descripción es requerida'],
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
    intensidad_horaria: {
      type: Number,
      required: [true, 'La intensidad horaria es requerida'],
      min: [1, 'La intensidad horaria debe ser al menos 1 hora'],
    },
    estado: {
      type: String,
      enum: ['ACTIVO', 'INACTIVO'],
      default: 'ACTIVO',
    },
    periodos: [PeriodoSchema],
  },
  {
    timestamps: true,
  },
);

// Validación para asegurar que los porcentajes de los períodos sumen 100%
AsignaturaSchema.pre('save', function (next) {
  if (this.periodos && this.periodos.length > 0) {
    const sumaPorcentajes = this.periodos.reduce((sum, periodo) => sum + periodo.porcentaje, 0);
    if (sumaPorcentajes !== 100) {
      next(new Error('La suma de los porcentajes de los períodos debe ser 100%'));
    }
  }
  next();
});

// Índices
AsignaturaSchema.index({ cursoId: 1, nombre: 1 }, { unique: true });
AsignaturaSchema.index({ docenteId: 1 });
AsignaturaSchema.index({ escuelaId: 1 });

const Asignatura = mongoose.model<IAsignatura>('Asignatura', AsignaturaSchema);

export default Asignatura;
