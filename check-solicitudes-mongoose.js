// check-solicitudes-mongoose.js
// Script para verificar el estado de las solicitudes de registro usando Mongoose
import mongoose from 'mongoose';

// Configuración MongoDB - ajusta estas variables según tu entorno
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/educanexo360';

async function checkSolicitudes() {
  try {
    // Conectar a MongoDB usando Mongoose
    await mongoose.connect(uri);
    console.log('Conectado a MongoDB!');

    // Obtener el nombre de la base de datos conectada
    const dbName = mongoose.connection.db.databaseName;
    console.log(`Base de datos conectada: ${dbName}`);

    // Obtener todas las colecciones disponibles
    const collections = await mongoose.connection.db.collections();
    console.log('Colecciones disponibles:');
    collections.forEach((col) => {
      console.log(` - ${col.collectionName}`);
    });

    // Buscar posibles colecciones de solicitudes con diferentes nombres
    const possibleCollections = [
      'solicitudregistros',
      'solicitud-registros',
      'solicitudregistro',
      'solicitud_registros',
      'solicitudesregistro',
      'solicitudes_registro',
      'solicitudes',
      'SOLICITUDREGISTROS',
      'SolicitudRegistros',
    ];

    // Verificar cada posible colección
    let foundAny = false;

    for (const collName of possibleCollections) {
      const exists = collections.some(
        (col) => col.collectionName.toLowerCase() === collName.toLowerCase(),
      );

      if (exists) {
        foundAny = true;
        console.log(`\nRevisando colección "${collName}":`);
        const collection = mongoose.connection.db.collection(collName);

        // Contar documentos
        const count = await collection.countDocuments();
        console.log(`Total de documentos: ${count}`);

        if (count > 0) {
          // Mostrar los últimos 5 documentos
          const docs = await collection.find().sort({ createdAt: -1 }).limit(5).toArray();

          console.log('\nÚltimos 5 documentos:');
          docs.forEach((doc, index) => {
            console.log(`\nDocumento ${index + 1}:`);
            console.log(` - ID: ${doc._id}`);
            console.log(` - Nombre: ${doc.nombre} ${doc.apellidos}`);
            console.log(` - Email: ${doc.email}`);
            console.log(` - Estado: ${doc.estado}`);
            console.log(` - Fecha: ${doc.fechaSolicitud || doc.createdAt}`);
            console.log(` - # Estudiantes: ${doc.estudiantes?.length || 0}`);
            console.log(` - Invitación: ${doc.invitacionId}`);
            console.log(` - Escuela: ${doc.escuelaId}`);
          });

          // Mostrar documento más reciente en detalle
          console.log('\nÚltimo documento en detalle:');
          console.log(JSON.stringify(docs[0], null, 2));
        } else {
          console.log('La colección está vacía');
        }
      }
    }

    if (!foundAny) {
      console.log('\nNo se encontró ninguna colección de solicitudes de registro.');
      console.log('Posibles problemas:');
      console.log('1. El nombre de la colección puede ser diferente');
      console.log('2. Las solicitudes no se están guardando correctamente');
      console.log('3. La base de datos conectada no es la correcta');
    }

    // Buscar en colección de invitaciones
    const invCollNames = ['invitaciones', 'invitacion', 'invitacions'];

    for (const invName of invCollNames) {
      const exists = collections.some(
        (col) => col.collectionName.toLowerCase() === invName.toLowerCase(),
      );

      if (exists) {
        console.log(`\nRevisando colección de invitaciones "${invName}":`);
        const invCollection = mongoose.connection.db.collection(invName);

        // Contar documentos
        const invCount = await invCollection.countDocuments();
        console.log(`Total de invitaciones: ${invCount}`);

        if (invCount > 0) {
          // Mostrar las últimas 3 invitaciones
          const invs = await invCollection.find().sort({ createdAt: -1 }).limit(3).toArray();

          console.log('\nÚltimas 3 invitaciones:');
          invs.forEach((inv, index) => {
            console.log(`\nInvitación ${index + 1}:`);
            console.log(` - ID: ${inv._id}`);
            console.log(` - Código: ${inv.codigo}`);
            console.log(` - Estado: ${inv.estado}`);
            console.log(` - Tipo: ${inv.tipo}`);
            console.log(` - Usos: ${inv.usosActuales || 0}/${inv.cantidadUsos || 1}`);
            if (inv.registros && inv.registros.length > 0) {
              console.log(` - Registros utilizados: ${inv.registros.length}`);
            }
          });

          break; // Solo necesitamos revisar una colección de invitaciones
        } else {
          console.log('No hay invitaciones en la base de datos');
        }
      }
    }

    // Verificar logs o errores recientes si existen
    const logCollections = ['logs', 'errors', 'systemlogs', 'system_logs'];

    for (const logName of logCollections) {
      const exists = collections.some(
        (col) => col.collectionName.toLowerCase() === logName.toLowerCase(),
      );

      if (exists) {
        console.log(`\nRevisando logs en colección "${logName}":`);
        const logsCollection = mongoose.connection.db.collection(logName);

        const recentLogs = await logsCollection
          .find()
          .sort({ timestamp: -1, createdAt: -1 })
          .limit(5)
          .toArray();

        if (recentLogs.length > 0) {
          console.log('\nLogs recientes:');
          recentLogs.forEach((log, index) => {
            console.log(`\nLog ${index + 1}:`);
            console.log(` - Timestamp: ${log.timestamp || log.fecha || log.createdAt || 'N/A'}`);
            console.log(` - Mensaje: ${log.message || log.mensaje || JSON.stringify(log)}`);
            if (log.error) {
              console.log(` - Error: ${log.error}`);
            }
          });
        } else {
          console.log('No se encontraron logs recientes');
        }

        break; // Solo necesitamos revisar una colección de logs
      }
    }
  } catch (error) {
    console.error('Error al verificar las solicitudes:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nConexión a MongoDB cerrada');
  }
}

// Ejecución principal
console.log('Iniciando verificación de solicitudes de registro...');
checkSolicitudes()
  .then(() => console.log('Verificación completada.'))
  .catch((err) => console.error('Error en la verificación:', err));
