import { Document, Types } from 'mongoose';

// Tipos de invitación
export enum TipoInvitacion {
  CURSO = 'CURSO',
  ESTUDIANTE_ESPECIFICO = 'ESTUDIANTE_ESPECIFICO',
  PERSONAL = 'PERSONAL',
}

// Estados de invitación
export enum EstadoInvitacion {
  ACTIVO = 'ACTIVO',
  UTILIZADO = 'UTILIZADO',
  REVOCADO = 'REVOCADO',
  EXPIRADO = 'EXPIRADO',
}

// Interfaz base para invitación
export interface IInvitacionBase {
  codigo: string;
  tipo: TipoInvitacion;
  escuelaId: Types.ObjectId;
  cursoId?: Types.ObjectId;
  estudianteId?: Types.ObjectId;

  estado: EstadoInvitacion;
  fechaCreacion: Date;
  fechaExpiracion?: Date;
  fechaUtilizacion?: Date;

  creadorId: Types.ObjectId;
  datosAdicionales?: any;

  cantidadUsos: number;
  usosActuales: number;

  registros: Array<{
    usuarioId: Types.ObjectId;
    fechaRegistro: Date;
    tipoCuenta: string;
  }>;
}

export interface IInvitacion extends IInvitacionBase, Document {}

export type IInvitacionLean = IInvitacionBase & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
