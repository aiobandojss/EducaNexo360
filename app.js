try {
  // Configurar variables de entorno esenciales
  process.env.BASE_PATH = '/educanexo360';

  // Log de inicio
  console.log('Iniciando EducaNexo360 Backend...');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('BASE_PATH:', process.env.BASE_PATH);

  // Verificar si existe dist/app.js
  const fs = require('fs');
  if (!fs.existsSync('./dist/app.js')) {
    throw new Error('Archivo dist/app.js no encontrado. Ejecuta "npm run build".');
  }

  // Cargar la aplicación principal
  require('./dist/app.js');
} catch (error) {
  console.error('Error al iniciar EducaNexo360:', error.message);
  console.error(error.stack);
}
