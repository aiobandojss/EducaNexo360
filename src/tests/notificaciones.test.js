// tests/notificaciones.test.js
/*
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Ajusta según la estructura de tu proyecto
const Usuario = require('../models/usuario.model');
const Notificacion = require('../models/notificacion.model');

describe('Notificaciones Endpoints', () => {
  let testUser;
  let testNotificacion;
  let accessToken;
  let adminToken;

  beforeAll(async () => {
    // Conectar a la base de datos de prueba
    await mongoose.connect(
      process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/educanexo360_test',
    );

    // Crear usuario de prueba
    const escuelaId = mongoose.Types.ObjectId();

    testUser = await Usuario.create({
      nombre: 'Notif',
      apellidos: 'Test',
      email: 'notif@example.com',
      password: 'password123',
      tipo: 'ESTUDIANTE',
      estado: 'ACTIVO',
      escuelaId,
      permisos: [],
    });

    const adminUser = await Usuario.create({
      nombre: 'Admin',
      apellidos: 'Test',
      email: 'admin@example.com',
      password: 'password123',
      tipo: 'ADMIN',
      estado: 'ACTIVO',
      escuelaId,
      permisos: [],
    });

    // Obtener tokens de acceso
    const userLogin = await request(app).post('/api/auth/login').send({
      email: 'notif@example.com',
      password: 'password123',
    });

    accessToken = userLogin.body.data.tokens.access.token;

    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@example.com',
      password: 'password123',
    });

    adminToken = adminLogin.body.data.tokens.access.token;

    // Crear notificación de prueba
    testNotificacion = await Notificacion.create({
      usuarioId: testUser._id,
      titulo: 'Notificación de prueba',
      mensaje: 'Esta es una notificación de prueba para los tests',
      tipo: 'SISTEMA',
      estado: 'PENDIENTE',
      escuelaId,
    });
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await Usuario.deleteMany({
      email: { $in: ['notif@example.com', 'admin@example.com'] },
    });
    await Notificacion.deleteMany({
      usuarioId: testUser._id,
    });

    // Desconectar de la base de datos
    await mongoose.disconnect();
  });

  it('should get user notifications', async () => {
    const res = await request(app)
      .get('/api/notificaciones')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBeTruthy();
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should mark notification as read', async () => {
    const res = await request(app)
      .put(`/api/notificaciones/${testNotificacion._id}/leer`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);

    // Verificar que se marcó como leída
    const notificacion = await Notificacion.findById(testNotificacion._id);
    expect(notificacion.estado).toEqual('LEIDA');
    expect(notificacion.fechaLectura).toBeDefined();
  });

  it('should mark all notifications as read', async () => {
    // Crear otra notificación pendiente
    await Notificacion.create({
      usuarioId: testUser._id,
      titulo: 'Otra notificación',
      mensaje: 'Esta es otra notificación para probar marcar todas como leídas',
      tipo: 'SISTEMA',
      estado: 'PENDIENTE',
      escuelaId: testUser.escuelaId,
    });

    const res = await request(app)
      .put('/api/notificaciones/leer-todas')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);

    // Verificar que todas se marcaron como leídas
    const pendientes = await Notificacion.countDocuments({
      usuarioId: testUser._id,
      estado: 'PENDIENTE',
    });

    expect(pendientes).toEqual(0);
  });

  it('should allow admin to create notification', async () => {
    const res = await request(app)
      .post('/api/notificaciones')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        usuarioId: testUser._id,
        titulo: 'Notificación administrativa',
        mensaje: 'Esta es una notificación creada por un administrador',
        tipo: 'SISTEMA',
        enviarEmail: false,
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('titulo', 'Notificación administrativa');
  });
});
*/
