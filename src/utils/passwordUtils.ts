/**
 * Genera una contraseña aleatoria segura
 * @returns Contraseña aleatoria
 */
export const generarPasswordAleatoria = (): string => {
  const longitud = 10;
  const mayusculas = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const minusculas = 'abcdefghijkmnopqrstuvwxyz';
  const numeros = '23456789';

  // Eliminamos caracteres especiales para evitar problemas de compatibilidad
  const caracteresDisponibles = mayusculas + minusculas + numeros;

  // Asegurar al menos un carácter de cada tipo
  let password = '';
  password += mayusculas.charAt(Math.floor(Math.random() * mayusculas.length));
  password += minusculas.charAt(Math.floor(Math.random() * minusculas.length));
  password += numeros.charAt(Math.floor(Math.random() * numeros.length));

  // Completar el resto de la contraseña
  for (let i = 3; i < longitud; i++) {
    password += caracteresDisponibles.charAt(
      Math.floor(Math.random() * caracteresDisponibles.length),
    );
  }

  // Mezclar los caracteres para que no sigan un patrón predecible
  return password
    .split('')
    .sort(() => 0.5 - Math.random())
    .join('');
};
