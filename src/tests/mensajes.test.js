// tests/mensajes.test.js
/*
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Ajusta según la estructura de tu proyecto
const Usuario = require('../models/usuario.model');
const Mensaje = require('../models/mensaje.model');

describe('Mensajes Endpoints', () => {
  let testSender;
  let testReceiver;
  let testMensaje;
  let accessToken;

  beforeAll(async () => {
    // Conectar a la base de datos de prueba
    await mongoose.connect(
      process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/educanexo360_test',
    );

    // Crear usuarios de prueba
    const escuelaId = mongoose.Types.ObjectId();

    testSender = await Usuario.create({
      nombre: 'Sender',
      apellidos: 'Test',
      email: 'sender@example.com',
      password: 'password123',
      tipo: 'DOCENTE',
      estado: 'ACTIVO',
      escuelaId,
      permisos: [],
    });

    testReceiver = await Usuario.create({
      nombre: 'Receiver',
      apellidos: 'Test',
      email: 'receiver@example.com',
      password: 'password123',
      tipo: 'ESTUDIANTE',
      estado: 'ACTIVO',
      escuelaId,
      permisos: [],
    });

    // Obtener token de acceso
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'sender@example.com',
      password: 'password123',
    });

    accessToken = loginRes.body.data.tokens.access.token;

    // Crear mensaje de prueba
    testMensaje = await Mensaje.create({
      remitente: testSender._id,
      destinatarios: [testReceiver._id],
      asunto: 'Mensaje de prueba',
      contenido: 'Este es un mensaje de prueba para los tests',
      tipo: 'INDIVIDUAL',
      estado: 'ENVIADO',
      escuelaId,
      lecturas: [],
    });
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await Usuario.deleteMany({
      email: { $in: ['sender@example.com', 'receiver@example.com'] },
    });
    await Mensaje.deleteMany({
      remitente: testSender._id,
    });

    // Desconectar de la base de datos
    await mongoose.disconnect();
  });

  it('should get all messages', async () => {
    const res = await request(app)
      .get('/api/mensajes')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBeTruthy();
  });

  it('should get a specific message by ID', async () => {
    const res = await request(app)
      .get(`/api/mensajes/${testMensaje._id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('_id', testMensaje._id.toString());
    expect(res.body.data).toHaveProperty('asunto', 'Mensaje de prueba');
  });

  it('should create a new message', async () => {
    const res = await request(app)
      .post('/api/mensajes')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        destinatarios: [testReceiver._id],
        asunto: 'Nuevo mensaje de prueba',
        contenido: 'Este es un nuevo mensaje creado en los tests',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('asunto', 'Nuevo mensaje de prueba');

    // Limpiar el mensaje creado
    if (res.body.data._id) {
      await Mensaje.findByIdAndDelete(res.body.data._id);
    }
  });

  it('should archive a message', async () => {
    const res = await request(app)
      .put(`/api/mensajes/${testMensaje._id}/archivar`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);

    // Verificar que se archivó
    const mensaje = await Mensaje.findById(testMensaje._id);
    expect(mensaje.estado).toEqual('ARCHIVADO');
  });
});
*/
