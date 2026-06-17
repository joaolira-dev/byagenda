import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

process.env.DATABASE_URL =
  'postgresql://postgres:postgres@localhost:5432/byagenda_test';
process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';
process.env.NODE_ENV = 'test';

let app: Awaited<typeof import('../src/app.js')>['app'];

beforeAll(async () => {
  ({ app } = await import('../src/app.js'));
});

describe('HTTP contracts', () => {
  it('returns the health status in the standard data envelope', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.timestamp).toEqual(expect.any(String));
  });

  it('returns a standardized error for unknown routes', async () => {
    const response = await request(app).get('/api/v1/unknown');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Rota GET /api/v1/unknown nao encontrada',
      },
    });
  });

  it('rejects invalid establishment params before accessing the database', async () => {
    const response = await request(app).get(
      '/api/v1/establishments/not-a-uuid',
    );

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.details[0].field).toBe('params.id');
  });

  it('requires authentication for establishment creation', async () => {
    const response = await request(app)
      .post('/api/v1/establishments')
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('validates auth register payloads before accessing the database', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Jo',
        email: 'invalid',
        password: '123',
        role: 'CLIENT',
      });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('requires authentication for the current user route', async () => {
    const response = await request(app).get('/api/v1/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });
});
