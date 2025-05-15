// src/services/file.service.ts

import { Request } from 'express';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError';
import gridfsManager from '../config/gridfs';

interface FileInfo {
  fileId: mongoose.Types.ObjectId;
  nombre: string;
  tipo: string;
  tamaño: number;
  fechaSubida: Date;
}

interface ImagenPortada {
  fileId: mongoose.Types.ObjectId;
  url: string;
}

class FileService {
  /**
   * Procesa los archivos adjuntos de una solicitud
   * @param req Solicitud Express con archivos
   * @param userId ID del usuario que sube los archivos
   * @param entityId ID opcional de la entidad relacionada (para construir URLs)
   * @param entityType Tipo de entidad ('anuncio', 'mensaje', etc)
   * @returns Objeto con los adjuntos y la imagen de portada (si existe)
   */
  async processFiles(
    req: Request,
    userId: string,
    entityId?: string,
    entityType: 'anuncio' | 'mensaje' = 'anuncio',
  ): Promise<{
    adjuntos: FileInfo[];
    imagenPortada?: ImagenPortada;
    errors: string[];
  }> {
    const adjuntos: FileInfo[] = [];
    let imagenPortada: ImagenPortada | undefined;
    const errors: string[] = [];

    if (
      !req.files ||
      (Array.isArray(req.files) && req.files.length === 0) ||
      (!Array.isArray(req.files) && Object.keys(req.files).length === 0)
    ) {
      return { adjuntos, imagenPortada, errors };
    }

    try {
      const bucket = gridfsManager.getBucket();
      if (!bucket) {
        throw new ApiError(500, 'Servicio de archivos no disponible');
      }

      // Normalizar files a un array plano
      const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();

      // Verificar tamaño total
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const MAX_TOTAL_SIZE = 15 * 1024 * 1024; // 15MB

      if (totalSize > MAX_TOTAL_SIZE) {
        throw new ApiError(
          400,
          `El tamaño total de los archivos no puede superar los 15MB (tamaño actual: ${(
            totalSize /
            (1024 * 1024)
          ).toFixed(2)}MB)`,
        );
      }

      for (const file of files) {
        const esImagenPortada = file.fieldname === 'imagenPortada';

        try {
          const filename = file.filename || path.basename(file.path);
          const uploadStream = bucket.openUploadStream(filename, {
            metadata: {
              originalName: file.originalname,
              contentType: file.mimetype,
              size: file.size,
              uploadedBy: userId,
              esImagenPortada,
            },
          });

          const fileContent = fs.readFileSync(file.path);
          uploadStream.write(fileContent);
          uploadStream.end();

          if (esImagenPortada) {
            const url = entityId
              ? `/api/${entityType}s/${entityId}/imagen/${uploadStream.id}`
              : `/api/${entityType}s/temp/imagen/${uploadStream.id}`;

            imagenPortada = {
              fileId: uploadStream.id,
              url,
            };
          } else {
            adjuntos.push({
              fileId: uploadStream.id,
              nombre: file.originalname,
              tipo: file.mimetype,
              tamaño: file.size,
              fechaSubida: new Date(),
            });
          }

          // Limpiar archivo temporal
          try {
            fs.unlinkSync(file.path);
          } catch (error) {
            console.error('Error eliminando archivo temporal:', error);
          }
        } catch (error) {
          errors.push(`Error procesando archivo ${file.originalname}: ${error}`);
          console.error(`Error procesando archivo ${file.originalname}:`, error);
        }
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Error procesando archivos: ${error}`);
    }

    return { adjuntos, imagenPortada, errors };
  }

  /**
   * Elimina un archivo de GridFS
   * @param fileId ID del archivo a eliminar
   */
  async deleteFile(fileId: mongoose.Types.ObjectId | string): Promise<boolean> {
    try {
      const bucket = gridfsManager.getBucket();
      if (!bucket) {
        throw new ApiError(500, 'Servicio de archivos no disponible');
      }

      const id = typeof fileId === 'string' ? new mongoose.Types.ObjectId(fileId) : fileId;
      await bucket.delete(id);
      return true;
    } catch (error) {
      console.error(`Error eliminando archivo ${fileId}:`, error);
      return false;
    }
  }
}

export default new FileService();
