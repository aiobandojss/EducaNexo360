// src/interfaces/IAsistencia.ts

import { Document, Types } from 'mongoose';

export enum EstadoAsistencia {
  PRESENTE = 'PRESENTE',
  AUSENTE = 'AUSENTE',
  TARDANZA = 'TARDANZA',
  JUSTIFICADO = 'JUSTIFICADO',
  PERMISO = 'PERMISO',
}

export interface IAsistenciaEstudiante {
  estudianteId: Types.ObjectId;
  estado: EstadoAsistencia;
  justificacion?: string;
  observaciones?: string;
  registradoPor?: Types.ObjectId;
  fechaRegistro: Date;
}

export interface IAsistenciaBase {
  fecha: Date;
  cursoId: Types.ObjectId;
  asignaturaId?: Types.ObjectId;
  docenteId: Types.ObjectId;
  escuelaId: Types.ObjectId;
  periodoId?: Types.ObjectId;
  tipoSesion: 'CLASE' | 'ACTIVIDAD' | 'EVENTO' | 'OTRO';
  horaInicio?: string;
  horaFin?: string;
  estudiantes: IAsistenciaEstudiante[];
  observacionesGenerales?: string;
  finalizado: boolean;
}

export interface IAsistencia extends IAsistenciaBase, Document {
  createdAt: Date;
  updatedAt: Date;
}

// Interfaces para estadísticas
export interface IEstadisticasAsistencia {
  presentes: number;
  ausentes: number;
  tardanzas: number;
  justificados: number;
  permisos: number;
  total: number;
  porcentajeAsistencia: number;
}

export interface IEstadisticasEstudiante {
  estudianteId: Types.ObjectId;
  nombreEstudiante: string;
  clasesTotales: number;
  presentes: number;
  ausentes: number;
  tardanzas: number;
  justificados: number;
  permisos: number;
  porcentajeAsistencia: number;
}
