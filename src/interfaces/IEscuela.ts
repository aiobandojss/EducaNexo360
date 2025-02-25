// src/interfaces/escuela.interface.ts

import { Document } from 'mongoose';
import { IConfiguracionAcademica, IReglasAprobacion } from './academic.interfaces';

export interface IEscuela extends Document {
  nombre: string;
  direccion: string;
  telefono: string;
  email: string;
  estado: 'ACTIVO' | 'INACTIVO';
  configuracion: {
    periodos_academicos: number;
    escala_calificacion: {
      minima: number;
      maxima: number;
    };
    logros_por_periodo: number;
    configuracion_academica: IConfiguracionAcademica;
    reglas_aprobacion: IReglasAprobacion;
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
