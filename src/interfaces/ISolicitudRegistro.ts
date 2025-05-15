import { Document, Types } from 'mongoose';

// Estados de solicitud
export enum EstadoSolicitud {
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  RECHAZADA = 'RECHAZADA',
}

// Interfaz para estudiante en solicitud
export interface IEstudianteSolicitud {
  nombre: string;
  apellidos: string;
  fechaNacimiento?: Date;
  cursoId: Types.ObjectId;
  codigo_estudiante?: string;
}

// Interfaz base para solicitud
export interface ISolicitudRegistroBase {
  invitacionId: Types.ObjectId;
  escuelaId: Types.ObjectId;

  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string;

  estudiantes: IEstudianteSolicitud[];

  estado: EstadoSolicitud;
  fechaSolicitud: Date;
  fechaRevision?: Date;
  revisadoPor?: Types.ObjectId;
  comentarios?: string;

  usuariosCreados?: Types.ObjectId[];
}

export interface ISolicitudRegistro extends ISolicitudRegistroBase, Document {}

export type ISolicitudRegistroLean = ISolicitudRegistroBase & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
