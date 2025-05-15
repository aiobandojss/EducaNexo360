/**
 * Genera un código alfanumérico aleatorio de la longitud especificada
 * @param longitud Longitud del código a generar
 * @returns Código alfanumérico
 */
export const generarCodigoAleatorio = (longitud: number): string => {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin caracteres confusos como I, O, 0, 1
  let resultado = '';

  for (let i = 0; i < longitud; i++) {
    resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }

  return resultado;
};

/**
 * Genera un código de estudiante basado en nombre, apellidos y un sufijo aleatorio
 * @param nombre Nombre del estudiante
 * @param apellidos Apellidos del estudiante
 * @returns Código de estudiante formateado
 */
export const generarCodigoEstudiante = (nombre: string, apellidos: string): string => {
  // Tomar las primeras letras del nombre y apellido
  const inicialesNombre = nombre.charAt(0).toUpperCase();
  const inicialesApellido = apellidos.charAt(0).toUpperCase();

  // Generar número aleatorio de 6 dígitos
  const numeroAleatorio = Math.floor(100000 + Math.random() * 900000);

  // Año actual
  const año = new Date().getFullYear().toString().slice(-2);

  return `EST${inicialesNombre}${inicialesApellido}${año}${numeroAleatorio}`;
};

/**
 * Genera un email para estudiante basado en su nombre y apellidos
 * @param nombre Nombre del estudiante
 * @param apellidos Apellidos del estudiante
 * @param escuelaId ID de la escuela para generar un sufijo único
 * @returns Email del estudiante
 */
export const generarEmailEstudiante = (
  nombre: string,
  apellidos: string,
  escuelaId: string,
): string => {
  // Normalizar nombre y apellidos (quitar acentos, espacios, etc.)
  const nombreNormalizado = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');

  const apellidoNormalizado = apellidos
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '');

  // Base del email
  const baseEmail = `${nombreNormalizado}.${apellidoNormalizado}`;

  // Añadir sufijo único (últimos caracteres del escuelaId)
  const sufijo = escuelaId.slice(-4);

  return `${baseEmail}${sufijo}@estudiante.educanexo.com`;
};

/**
 * Normaliza un texto para usarlo en búsquedas o como parte de IDs
 * @param texto Texto a normalizar
 * @returns Texto normalizado (sin acentos, espacios, caracteres especiales)
 */
export const normalizarTexto = (texto: string): string => {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9]/g, '') // Mantener solo alfanuméricos
    .trim();
};
