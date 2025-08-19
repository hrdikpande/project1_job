const request = require('supertest');
const app = require('../server');

describe('Basic API Tests', () => {
  test('GET /api/health should return 200', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
  });

  test('GET / should serve frontend', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  test('GET /api/nonexistent should return 404', async () => {
    const response = await request(app).get('/api/nonexistent');
    expect(response.status).toBe(404);
  });
});
