// src/scripts/addSuperAdmin.ts
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// URL de conexión a MongoDB
const mongoUri =
  process.env.MONGODB_URI ||
  'mongodb+srv://educanexo_admin:kFYY2Xi1QpArXMRi@cluster0.fvqnr.mongodb.net/educanexo360?retryWrites=true&w=majority&appName=Cluster0';

async function addSuperAdmin() {
  try {
    console.log('Intentando conectar a MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ Conexión a MongoDB establecida exitosamente');

    // Datos del super admin
    const email = 'superadmin@educanexo360.com';
    const password = 'Superadmin123';
    const nombre = 'Super';
    const apellidos = 'Admin';

    // Obtener la colección de usuarios directamente
    const db = mongoose.connection.db;
    const usuariosCollection = db.collection('usuarios');

    // Verificar si ya existe
    const existingUser = await usuariosCollection.findOne({ email });
    if (existingUser) {
      console.log(`⚠️ Ya existe un usuario con el email ${email}`);
      console.log('Detalles del usuario existente:');
      console.log(`- Nombre: ${existingUser.nombre} ${existingUser.apellidos}`);
      console.log(`- Tipo: ${existingUser.tipo}`);

      if (existingUser.tipo !== 'SUPER_ADMIN') {
        console.log(`\n⚠️ El usuario existente NO es SUPER_ADMIN, es ${existingUser.tipo}`);
        console.log('\nPara actualizar, ejecuta el siguiente comando en MongoDB:');
        console.log(`db.usuarios.updateOne({email: "${email}"}, {$set: {tipo: "SUPER_ADMIN"}})`);
      }

      await mongoose.disconnect();
      return;
    }

    // Crear el hash de la contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insertar el super admin
    const result = await usuariosCollection.insertOne({
      email,
      password: hashedPassword,
      nombre,
      apellidos,
      tipo: 'SUPER_ADMIN',
      estado: 'ACTIVO',
      permisos: [],
      perfil: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    console.log('\n✅ Super Admin creado exitosamente');
    console.log('Detalles del Super Admin:');
    console.log(`- ID: ${result.insertedId}`);
    console.log(`- Email: ${email}`);
    console.log(`- Nombre: ${nombre} ${apellidos}`);
    console.log(`- Tipo: SUPER_ADMIN`);

    console.log('\nCredenciales para iniciar sesión:');
    console.log(`- Email: ${email}`);
    console.log(`- Contraseña: ${password}`);
  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error instanceof Error && error.name === 'MongoServerError') {
      console.error('Error de conexión a MongoDB. Verifica la cadena de conexión y credenciales.');
    }
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('\nConexión a MongoDB cerrada');
    }
  }
}

// Ejecutar la función
addSuperAdmin()
  .then(() => {
    console.log('Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error en el script:', error);
    process.exit(1);
  });
