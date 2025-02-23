import { Document } from 'mongoose';

export interface IAsignatura extends Document {
  nombre: string;
  descripcion: string;
  cursoId: string;
  docenteId: string;
  escuelaId: string;
  periodos: {
    numero: number;
    logros: Array<{
      descripcion: string;
      porcentaje: number;
      tipo: 'COGNITIVO' | 'PROCEDIMENTAL' | 'ACTITUDINAL';
      criterios_evaluacion: string[];
    }>;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
