import mongoose, { Schema } from 'mongoose';
import { ICalificacionDocument, ICalificacionLogro } from '../interfaces/ICalificacion';

interface IPeriodo {
  numero: number;
  logros: {
    _id: mongoose.Types.ObjectId;
    porcentaje: number;
  }[];
}

interface IAsignaturaDocument extends mongoose.Document {
  periodos: IPeriodo[];
}

const CalificacionLogroSchema = new Schema({
  logroId: {
    type: Schema.Types.ObjectId,
    required: [true, 'El logro es requerido'],
  },
  calificacion: {
    type: Number,
    required: [true, 'La calificación es requerida'],
    min: [0, 'La calificación no puede ser menor a 0'],
    max: [5, 'La calificación no puede ser mayor a 5'],
  },
  observacion: {
    type: String,
  },
  fecha_calificacion: {
    type: Date,
    default: Date.now,
  },
});

const CalificacionSchema = new Schema(
  {
    estudianteId: {
      type: Schema.Types.ObjectId,
      ref: 'Usuario',
      required: [true, 'El estudiante es requerido'],
    },
    asignaturaId: {
      type: Schema.Types.ObjectId,
      ref: 'Asignatura',
      required: [true, 'La asignatura es requerida'],
    },
    cursoId: {
      type: Schema.Types.ObjectId,
      ref: 'Curso',
      required: [true, 'El curso es requerido'],
    },
    escuelaId: {
      type: Schema.Types.ObjectId,
      ref: 'Escuela',
      required: [true, 'La escuela es requerida'],
    },
    periodo: {
      type: Number,
      required: [true, 'El periodo es requerido'],
    },
    año_academico: {
      type: String,
      required: [true, 'El año académico es requerido'],
    },
    calificaciones_logros: [CalificacionLogroSchema],
    promedio_periodo: {
      type: Number,
      default: 0,
    },
    observaciones: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

// Middleware para calcular el promedio antes de guardar
CalificacionSchema.pre('save', async function (next) {
  try {
    const calificacion = this as unknown as ICalificacionDocument;

    if (
      Array.isArray(calificacion.calificaciones_logros) &&
      calificacion.calificaciones_logros.length > 0
    ) {
      const asignatura = await mongoose
        .model<IAsignaturaDocument>('Asignatura')
        .findById(calificacion.asignaturaId);

      if (!asignatura) {
        throw new Error('Asignatura no encontrada');
      }

      const periodoActual = asignatura.periodos.find(
        (p: IPeriodo) => p.numero === calificacion.periodo,
      );

      if (!periodoActual) {
        throw new Error('Periodo no encontrado');
      }

      let sumaPonderada = 0;
      let pesoTotal = 0;

      calificacion.calificaciones_logros.forEach((calificacionLogro: ICalificacionLogro) => {
        const logro = periodoActual.logros.find(
          (l) => l._id.toString() === calificacionLogro.logroId.toString(),
        );

        if (logro) {
          sumaPonderada += calificacionLogro.calificacion * logro.porcentaje;
          pesoTotal += logro.porcentaje;
        }
      });

      if (pesoTotal > 0) {
        calificacion.promedio_periodo = Number((sumaPonderada / pesoTotal).toFixed(2));
      }
    }
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Índices
CalificacionSchema.index(
  { estudianteId: 1, asignaturaId: 1, periodo: 1, año_academico: 1 },
  { unique: true },
);
CalificacionSchema.index({ cursoId: 1, periodo: 1 });
CalificacionSchema.index({ escuelaId: 1 });

export default mongoose.model<ICalificacionDocument>('Calificacion', CalificacionSchema);
