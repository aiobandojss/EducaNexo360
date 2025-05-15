// reset-passwords.js
// Script para resetear contraseñas de usuarios recién creados
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// URL de conexión a MongoDB desde las variables de entorno de tu aplicación
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/educanexo360';

async function resetPasswords() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Conectado a MongoDB');

    // Identificar la colección de usuarios
    const collections = await mongoose.connection.db.collections();
    const usuariosCollectionName = collections
      .map((c) => c.collectionName)
      .find((name) => name.toLowerCase().includes('usuario'));

    if (!usuariosCollectionName) {
      console.error('No se encontró la colección de usuarios');
      return;
    }

    console.log(`Colección de usuarios encontrada: ${usuariosCollectionName}`);

    // Referencia a la colección de usuarios
    const usuariosCollection = mongoose.connection.db.collection(usuariosCollectionName);

    // Buscar los usuarios creados recientemente (últimas 24 horas)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const usuariosRecientes = await usuariosCollection
      .find({
        createdAt: { $gte: oneDayAgo },
      })
      .toArray();

    console.log(`Encontrados ${usuariosRecientes.length} usuarios creados en las últimas 24 horas`);

    if (usuariosRecientes.length === 0) {
      console.log('No hay usuarios recientes para resetear');
      return;
    }

    // Mostrar lista de usuarios para confirmar
    console.log('\nUsuarios encontrados:');
    usuariosRecientes.forEach((usuario, index) => {
      console.log(
        `${index + 1}. ${usuario.nombre} ${usuario.apellidos} (${usuario.email}) - Tipo: ${
          usuario.tipo
        }`,
      );
    });

    console.log('\nRealizando reseteo de contraseñas...');

    // Nueva contraseña para todos (misma para facilitar pruebas)
    const nuevaPassword = 'Educanexo2025';
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(nuevaPassword, saltRounds);

    // Actualizar cada usuario
    const resultados = [];
    for (const usuario of usuariosRecientes) {
      const resultado = await usuariosCollection.updateOne(
        { _id: usuario._id },
        { $set: { password: passwordHash } },
      );

      resultados.push({
        email: usuario.email,
        actualizado: resultado.modifiedCount > 0,
      });

      console.log(`Usuario ${usuario.email} actualizado: ${resultado.modifiedCount > 0}`);
    }

    console.log('\n--------------------------------------------------');
    console.log('RESUMEN');
    console.log('--------------------------------------------------');
    console.log(
      `Total de usuarios actualizados: ${resultados.filter((r) => r.actualizado).length}`,
    );
    console.log(`Nueva contraseña para todos los usuarios: ${nuevaPassword}`);
    console.log(
      '\nPuedes usar estas credenciales para iniciar sesión con cualquiera de los usuarios listados.',
    );
  } catch (error) {
    console.error('Error al resetear contraseñas:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada');
  }
}

// Ejecutar el script
resetPasswords()
  .then(() => console.log('Proceso completado'))
  .catch((err) => console.error('Error en el proceso:', err));
