// src/interfaces/ILogro.ts

import { Document, Types } from 'mongoose';

export interface ILogroBase {
  nombre: string;
  descripcion: string;
  tipo: 'COGNITIVO' | 'PROCEDIMENTAL' | 'ACTITUDINAL';
  porcentaje: number;
  asignaturaId: Types.ObjectId;
  cursoId: Types.ObjectId;
  escuelaId: Types.ObjectId;
  periodo: number;
  año_academico: string;
  estado: 'ACTIVO' | 'INACTIVO';
}

export interface ILogro extends ILogroBase, Document {
  createdAt: Date;
  updatedAt: Date;
}

export type ILogroLean = ILogroBase & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
