import request from 'supertest';
import app from '../app';

describe('App', () => {
  it('should respond to the GET method', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('EducaNexo360 API');
  });
});