// src/interfaces/IAnuncio.ts

import { Document, Types } from 'mongoose';

export enum TipoAnuncio {
  GENERAL = 'GENERAL',
  CURSO = 'CURSO',
  DOCENTES = 'DOCENTES',
  PADRES = 'PADRES',
  ESTUDIANTES = 'ESTUDIANTES',
}

export enum EstadoAnuncio {
  BORRADOR = 'BORRADOR',
  PUBLICADO = 'PUBLICADO',
  ARCHIVADO = 'ARCHIVADO',
}

export interface IAdjuntoAnuncio {
  fileId: Types.ObjectId;
  nombre: string;
  tipo: string;
  tamaño: number;
  fechaSubida: Date;
}

// Interfaz base para anuncios
export interface IAnuncioBase {
  titulo: string;
  contenido: string;
  tipo: TipoAnuncio;
  estado: EstadoAnuncio;
  creadorId: Types.ObjectId;
  escuelaId: Types.ObjectId;
  cursoId?: Types.ObjectId; // Opcional, solo si es para un curso específico
  destacado: boolean;
  fechaPublicacion: Date;
  fechaExpiracion?: Date;
  adjuntos?: IAdjuntoAnuncio[];
  destinatarios?: Types.ObjectId[]; // IDs de usuarios específicos
  lecturas?: {
    usuarioId: Types.ObjectId;
    fechaLectura: Date;
  }[];
  imagenPortada?: {
    fileId: Types.ObjectId;
    url: string;
  };
}

// Interfaz para el documento MongoDB
export interface IAnuncio extends IAnuncioBase, Document {
  createdAt: Date;
  updatedAt: Date;
}
