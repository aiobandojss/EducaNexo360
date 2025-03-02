// tests/auth.test.js
/*
const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app'); // Ajusta según la estructura de tu proyecto
const Usuario = require('../models/usuario.model');

describe('Auth Endpoints', () => {
  let testUser;

  beforeAll(async () => {
    // Conectar a la base de datos de prueba
    await mongoose.connect(
      process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/educanexo360_test',
    );

    // Crear usuario de prueba
    testUser = await Usuario.create({
      nombre: 'Test',
      apellidos: 'User',
      email: 'test@example.com',
      password: 'password123',
      tipo: 'DOCENTE',
      estado: 'ACTIVO',
      escuelaId: mongoose.Types.ObjectId(),
      permisos: [],
    });
  });

  afterAll(async () => {
    // Eliminar usuario de prueba
    await Usuario.deleteMany({ email: 'test@example.com' });
    // Desconectar de la base de datos
    await mongoose.disconnect();
  });

  it('should login with valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data.tokens.access');
  });

  it('should not login with invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'wrongpassword',
    });

    expect(res.statusCode).toEqual(401);
    expect(res.body).toHaveProperty('success', false);
  });

  it('should refresh token with valid refresh token', async () => {
    // Primero obtener tokens
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'password123',
    });

    const refreshToken = loginRes.body.data.tokens.refresh.token;

    const res = await request(app).post('/api/auth/refresh').send({
      refreshToken: refreshToken,
    });

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('success', true);
    expect(res.body).toHaveProperty('data.access');
  });
});

*/
