// src/scripts/create-indexes.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import '../models/usuario.model.js';
import '../models/escuela.model.js';
import '../models/curso.model.js';
import '../models/asignatura.model.js';
import '../models/calificacion.model.js';
import '../models/logro.model.js';
import '../models/mensaje.model.js';
import '../models/notificacion.model.js';

dotenv.config();

// Función para crear índices
async function createIndexes() {
  try {
    console.log('Conectando a MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/educaNexo360');
    console.log('Conexión establecida');

    console.log('Creando índices...');

    // Índices para usuarios
    await mongoose.model('Usuario').createIndexes();
    console.log('✅ Índices de Usuario creados');

    // Índices para escuelas
    await mongoose.model('Escuela').createIndexes();
    console.log('✅ Índices de Escuela creados');

    // Índices para cursos
    await mongoose.model('Curso').createIndexes();
    console.log('✅ Índices de Curso creados');

    // Índices para asignaturas
    await mongoose.model('Asignatura').createIndexes();
    console.log('✅ Índices de Asignatura creados');

    // Índices para calificaciones
    await mongoose.model('Calificacion').createIndexes();
    console.log('✅ Índices de Calificacion creados');

    // Índices para logros
    await mongoose.model('Logro').createIndexes();
    console.log('✅ Índices de Logro creados');

    // Índices para mensajes
    await mongoose.model('Mensaje').createIndexes();
    console.log('✅ Índices de Mensaje creados');

    // Índices para notificaciones
    await mongoose.model('Notificacion').createIndexes();
    console.log('✅ Índices de Notificacion creados');

    console.log('Todos los índices han sido creados correctamente');

    await mongoose.disconnect();
    console.log('Desconexión completa');
  } catch (error) {
    console.error('Error al crear índices:', error);
    process.exit(1);
  }
}

// Ejecutar la función
createIndexes();
