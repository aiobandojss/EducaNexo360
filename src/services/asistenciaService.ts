// src/services/asistenciaService.ts

import axios from 'axios';

// Configuración de axios para tu proyecto
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token de autenticación
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Tipos
export interface EstudianteAsistencia {
  estudianteId: string;
  estado: 'PRESENTE' | 'AUSENTE' | 'TARDANZA' | 'JUSTIFICADO' | 'PERMISO';
  justificacion?: string;
  observaciones?: string;
}

export interface AsistenciaData {
  fecha: string | Date;
  cursoId: string;
  asignaturaId?: string;
  tipoSesion?: 'CLASE' | 'ACTIVIDAD' | 'EVENTO' | 'OTRO';
  horaInicio?: string;
  horaFin?: string;
  observacionesGenerales?: string;
  estudiantes?: EstudianteAsistencia[];
}

export interface EstadisticasAsistencia {
  presentes: number;
  ausentes: number;
  tardanzas: number;
  justificados: number;
  permisos: number;
  total: number;
  porcentajeAsistencia: number;
}

// Servicio de Asistencia
class AsistenciaService {
  // Crear un nuevo registro de asistencia
  async crearAsistencia(data: AsistenciaData) {
    try {
      const response = await instance.post('/asistencia', data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obtener todos los registros de asistencia con paginación y filtros
  async obtenerAsistencias(params: any = {}) {
    try {
      const response = await instance.get('/asistencia', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obtener un registro de asistencia por ID
  async obtenerAsistenciaPorId(id: string) {
    try {
      const response = await instance.get(`/asistencia/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Actualizar un registro de asistencia
  async actualizarAsistencia(id: string, data: Partial<AsistenciaData>) {
    try {
      const response = await instance.put(`/asistencia/${id}`, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Finalizar un registro de asistencia
  async finalizarAsistencia(id: string) {
    try {
      const response = await instance.patch(`/asistencia/${id}/finalizar`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Eliminar un registro de asistencia
  async eliminarAsistencia(id: string) {
    try {
      const response = await instance.delete(`/asistencia/${id}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obtener asistencia para un día específico
  async obtenerAsistenciaDia(fecha: string, cursoId: string, asignaturaId?: string) {
    try {
      const params = { fecha, cursoId, ...(asignaturaId && { asignaturaId }) };
      const response = await instance.get('/asistencia/dia', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obtener estadísticas de asistencia para un curso
  async obtenerEstadisticasCurso(
    cursoId: string,
    desde?: string,
    hasta?: string,
    asignaturaId?: string,
  ) {
    try {
      const params = {
        ...(desde && { desde }),
        ...(hasta && { hasta }),
        ...(asignaturaId && { asignaturaId }),
      };
      const response = await instance.get(`/asistencia/estadisticas/curso/${cursoId}`, { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obtener estadísticas de asistencia para un estudiante
  async obtenerEstadisticasEstudiante(
    estudianteId: string,
    desde?: string,
    hasta?: string,
    cursoId?: string,
    asignaturaId?: string,
  ) {
    try {
      const params = {
        ...(desde && { desde }),
        ...(hasta && { hasta }),
        ...(cursoId && { cursoId }),
        ...(asignaturaId && { asignaturaId }),
      };
      const response = await instance.get(`/asistencia/estadisticas/estudiante/${estudianteId}`, {
        params,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Obtener resumen de asistencia para un período
  async obtenerResumenPeriodo(periodoId: string, cursoId: string) {
    try {
      const response = await instance.get(`/asistencia/resumen/periodo/${periodoId}`, {
        params: { cursoId },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Manejador de errores
  private handleError(error: any) {
    if (error.response) {
      // Error de respuesta del servidor
      return {
        success: false,
        status: error.response.status,
        message: error.response.data.message || 'Error en la solicitud',
        error: error.response.data,
      };
    } else if (error.request) {
      // Error sin respuesta del servidor
      return {
        success: false,
        message: 'No se recibió respuesta del servidor',
        error: error.request,
      };
    } else {
      // Error en la configuración de la solicitud
      return {
        success: false,
        message: 'Error al realizar la solicitud',
        error: error.message,
      };
    }
  }
}

export default new AsistenciaService();
