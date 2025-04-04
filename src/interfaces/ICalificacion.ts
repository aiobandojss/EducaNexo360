import { Document, Types } from 'mongoose';

export interface ICalificacionLogro {
  logroId: Types.ObjectId;
  calificacion: number;
  observacion?: string;
  fecha_calificacion: Date;
  tipo_logro?: 'COGNITIVO' | 'PROCEDIMENTAL' | 'ACTITUDINAL';
  recuperacion?: {
    fecha: Date;
    calificacion_anterior: number;
    calificacion_nueva: number;
    observacion: string;
  };
}

export interface ICalificacionDocument extends Document {
  estudianteId: Types.ObjectId;
  asignaturaId: Types.ObjectId;
  cursoId: Types.ObjectId;
  escuelaId: Types.ObjectId;
  periodo: number;
  año_academico: string;
  calificaciones_logros: ICalificacionLogro[];
  promedio_periodo: number;
  observaciones: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICalificacion {
  estudianteId: Types.ObjectId;
  asignaturaId: Types.ObjectId;
  cursoId: Types.ObjectId;
  escuelaId: Types.ObjectId;
  periodo: number;
  año_academico: string;
  calificaciones_logros: ICalificacionLogro[];
  promedio_periodo: number;
  observaciones: string;
}
