import { Document } from 'mongoose';

export interface ICurso extends Document {
  nombre: string;
  nivel: string;
  año_academico: string;
  escuelaId: string;
  director_grupo: string; // ID del docente
  estudiantes: string[]; // Array de IDs de estudiantes
  asignaturas: {
    asignaturaId: string;
    docenteId: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
