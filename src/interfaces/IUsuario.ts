import { Document, Types } from 'mongoose';

export interface IUsuarioBase {
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
  tipo: 'ADMIN' | 'DOCENTE' | 'PADRE' | 'ESTUDIANTE';
  estado: 'ACTIVO' | 'INACTIVO';
  escuelaId: Types.ObjectId;
  permisos: string[];
  perfil: {
    telefono?: string;
    direccion?: string;
    foto?: string;
  };
}

export interface IUsuario extends IUsuarioBase, Document {
  compararPassword(candidatePassword: string): Promise<boolean>;
}

export type IUsuarioLean = IUsuarioBase & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};
