import { Document } from 'mongoose';

export interface IEscuela extends Document {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  configuracion: {
    periodos_academicos: number;
    escala_calificacion: {
      minima: number;
      maxima: number;
    };
    logros_por_periodo: number;
  };
  periodos_academicos: {
    numero: number;
    nombre: string;
    fecha_inicio: Date;
    fecha_fin: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
