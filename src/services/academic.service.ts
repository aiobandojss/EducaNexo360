// src/services/academic.service.ts

import Calificacion from '../models/calificacion.model';
import Logro from '../models/logro.model';
import ApiError from '../utils/ApiError';
import mongoose from 'mongoose';

class AcademicService {
  async calcularPromedioPeriodo(
    estudianteId: string,
    asignaturaId: string,
    periodo: number,
    año_academico: string,
  ) {
    const calificaciones = await Calificacion.findOne({
      estudianteId,
      asignaturaId,
      periodo,
      año_academico,
    }).populate('calificaciones_logros.logroId');

    if (!calificaciones) {
      return null;
    }

    type TipoLogro = 'cognitivo' | 'procedimental' | 'actitudinal';
    const promedios = {
      cognitivo: { suma: 0, porcentajeTotal: 0 },
      procedimental: { suma: 0, porcentajeTotal: 0 },
      actitudinal: { suma: 0, porcentajeTotal: 0 },
      general: 0,
    };

    // Calcular promedios por tipo de logro
    for (const cal of calificaciones.calificaciones_logros) {
      const logro = await Logro.findById(cal.logroId);
      if (!logro) continue;

      const tipoLogro = logro.tipo.toLowerCase() as TipoLogro;
      promedios[tipoLogro].suma += cal.calificacion * (logro.porcentaje / 100);
      promedios[tipoLogro].porcentajeTotal += logro.porcentaje;
    }

    // Calcular promedio final para cada tipo
    const resultados = {
      cognitivo:
        promedios.cognitivo.porcentajeTotal > 0
          ? Number(
              ((promedios.cognitivo.suma * 100) / promedios.cognitivo.porcentajeTotal).toFixed(2),
            )
          : null,
      procedimental:
        promedios.procedimental.porcentajeTotal > 0
          ? Number(
              (
                (promedios.procedimental.suma * 100) /
                promedios.procedimental.porcentajeTotal
              ).toFixed(2),
            )
          : null,
      actitudinal:
        promedios.actitudinal.porcentajeTotal > 0
          ? Number(
              ((promedios.actitudinal.suma * 100) / promedios.actitudinal.porcentajeTotal).toFixed(
                2,
              ),
            )
          : null,
      promedio_final: 0,
      logros_evaluados: calificaciones.calificaciones_logros.length,
      porcentaje_completado: 0,
    };

    // Calcular promedio final ponderado
    let sumaPonderada = 0;
    let porcentajeTotal = 0;

    for (const cal of calificaciones.calificaciones_logros) {
      const logro = await Logro.findById(cal.logroId);
      if (!logro) continue;

      sumaPonderada += cal.calificacion * (logro.porcentaje / 100);
      porcentajeTotal += logro.porcentaje;
    }

    resultados.promedio_final =
      porcentajeTotal > 0 ? Number(((sumaPonderada * 100) / porcentajeTotal).toFixed(2)) : 0;

    resultados.porcentaje_completado = Number(porcentajeTotal.toFixed(2));

    return resultados;
  }

  async calcularPromedioAsignatura(
    estudianteId: string,
    asignaturaId: string,
    año_academico: string,
  ) {
    const periodos = [1, 2, 3, 4]; // Ajustar según la configuración de la escuela
    const promediosPeriodos = [];
    let promedioFinal = 0;

    for (const periodo of periodos) {
      const promedioPeriodo = await this.calcularPromedioPeriodo(
        estudianteId,
        asignaturaId,
        periodo,
        año_academico,
      );

      if (promedioPeriodo) {
        promediosPeriodos.push({
          periodo,
          ...promedioPeriodo,
        });
        promedioFinal += promedioPeriodo.promedio_final;
      }
    }

    return {
      promedios_periodos: promediosPeriodos,
      promedio_final:
        promediosPeriodos.length > 0
          ? Number((promedioFinal / promediosPeriodos.length).toFixed(2))
          : 0,
      periodos_evaluados: promediosPeriodos.length,
    };
  }

  async obtenerEstadisticasGrupo(
    cursoId: string,
    asignaturaId: string,
    periodo: number,
    año_academico: string,
  ) {
    // Obtener todos los estudiantes del curso
    const Curso = mongoose.model('Curso');
    const curso = await Curso.findById(cursoId);
    if (!curso) {
      throw new ApiError(404, 'Curso no encontrado');
    }

    const estadisticas = {
      total_estudiantes: curso.estudiantes.length,
      promedio_grupo: 0,
      desviacion_estandar: 0,
      maximo: 0,
      minimo: 5,
      distribucion: {
        excelente: 0, // >= 4.5
        bueno: 0, // >= 4.0 y < 4.5
        aceptable: 0, // >= 3.0 y < 4.0
        insuficiente: 0, // < 3.0
      },
    };

    const promedios = [];

    // Calcular promedios para cada estudiante
    for (const estudianteId of curso.estudiantes) {
      const promedio = await this.calcularPromedioPeriodo(
        estudianteId.toString(),
        asignaturaId,
        periodo,
        año_academico,
      );

      if (promedio) {
        promedios.push(promedio.promedio_final);

        // Actualizar máximo y mínimo
        estadisticas.maximo = Math.max(estadisticas.maximo, promedio.promedio_final);
        estadisticas.minimo = Math.min(estadisticas.minimo, promedio.promedio_final);

        // Actualizar distribución
        if (promedio.promedio_final >= 4.5) estadisticas.distribucion.excelente++;
        else if (promedio.promedio_final >= 4.0) estadisticas.distribucion.bueno++;
        else if (promedio.promedio_final >= 3.0) estadisticas.distribucion.aceptable++;
        else estadisticas.distribucion.insuficiente++;
      }
    }

    // Calcular promedio del grupo
    if (promedios.length > 0) {
      estadisticas.promedio_grupo = Number(
        (promedios.reduce((a, b) => a + b, 0) / promedios.length).toFixed(2),
      );

      // Calcular desviación estándar
      const varianza =
        promedios.reduce((a, b) => a + Math.pow(b - estadisticas.promedio_grupo, 2), 0) /
        promedios.length;
      estadisticas.desviacion_estandar = Number(Math.sqrt(varianza).toFixed(2));
    }

    return estadisticas;
  }
}

export default new AcademicService();
