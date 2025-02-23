import { Document } from 'mongoose';

export interface IMensaje extends Document {
  tipo: 'CIRCULAR' | 'NOTIFICACION' | 'MENSAJE_DIRECTO';
  asunto: string;
  contenido: string;
  emisorId: string;
  receptores: Array<{
    usuarioId: string;
    leido: boolean;
    fechaLectura?: Date;
  }>;
  adjuntos?: Array<{
    nombre: string;
    url: string;
    tipo: string;
    tamaño: number;
  }>;
  estado: 'BORRADOR' | 'ENVIADO' | 'ARCHIVADO';
  escuelaId: string;
  createdAt: Date;
  updatedAt: Date;
}
