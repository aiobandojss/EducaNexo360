// src/interfaces/academic.interfaces.ts

import { Document } from 'mongoose';

// Interfaces para los tipos de logros
export enum TipoLogro {
  COGNITIVO = 'COGNITIVO',
  PROCEDIMENTAL = 'PROCEDIMENTAL',
  ACTITUDINAL = 'ACTITUDINAL',
}

export enum EstadoLogro {
  ACTIVO = 'ACTIVO',
  INACTIVO = 'INACTIVO',
}

// Interface para el documento de Logro
export interface ILogro extends Document {
  nombre: string;
  descripcion: string;
  tipo: TipoLogro;
  porcentaje: number;
  asignaturaId: string;
  periodoNumero: number;
  escuelaId: string;
  estado: EstadoLogro;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para crear un logro
export interface ICreateLogro {
  nombre: string;
  descripcion: string;
  tipo: TipoLogro;
  porcentaje: number;
  asignaturaId: string;
  periodoNumero: number;
  escuelaId: string;
}

// Interface para actualizar un logro
export interface IUpdateLogro {
  nombre?: string;
  descripcion?: string;
  tipo?: TipoLogro;
  porcentaje?: number;
  estado?: EstadoLogro;
}

// Enums para Calificaciones
export enum EstadoCalificacion {
  ACTIVO = 'ACTIVO',
  ANULADA = 'ANULADA',
}

// Interface para el documento de Calificación
export interface ICalificacion extends Document {
  estudianteId: string;
  asignaturaId: string;
  logroId: string;
  periodoNumero: number;
  valor: number;
  observaciones?: string;
  escuelaId: string;
  estado: EstadoCalificacion;
  createdAt: Date;
  updatedAt: Date;
}

// Interface para crear una calificación
export interface ICreateCalificacion {
  estudianteId: string;
  asignaturaId: string;
  logroId: string;
  periodoNumero: number;
  valor: number;
  observaciones?: string;
  escuelaId: string;
}

// Interface para actualizar una calificación
export interface IUpdateCalificacion {
  valor?: number;
  observaciones?: string;
  estado?: EstadoCalificacion;
}

// Interface para el cálculo de promedios
export interface IPromedioPeriodo {
  periodoNumero: number;
  promedio: number;
  logrosCompletados: number;
  logrosTotal: number;
  detalle: {
    logroId: string;
    nombre: string;
    valor: number;
    porcentaje: number;
  }[];
}

// Interface para el boletín
export interface IBoletinPeriodo {
  periodoNumero: number;
  asignaturas: {
    asignaturaId: string;
    nombre: string;
    promedio: number;
    logros: {
      logroId: string;
      nombre: string;
      tipo: TipoLogro;
      valor: number;
      porcentaje: number;
      observaciones?: string;
    }[];
  }[];
}

// Interface para la configuración académica
export interface IConfiguracionAcademica {
  periodos_academicos: number;
  escala_calificacion: {
    minima: number;
    maxima: number;
  };
  logros_por_periodo: number;
  tipos_logro: {
    cognitivo: number; // porcentaje que debe sumar
    procedimental: number;
    actitudinal: number;
  };
}

// Interface para las reglas de aprobación
export interface IReglasAprobacion {
  nota_minima_aprobacion: number;
  porcentaje_minimo_logros: number;
  recuperacion_permitida: boolean;
  nota_maxima_recuperacion: number;
}
