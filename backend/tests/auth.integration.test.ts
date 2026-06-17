import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const runIntegration = process.env.RUN_INTEGRATION === 'true';
const integrationDescribe = runIntegration ? describe : describe.skip;

integrationDescribe('auth routes', () => {
  const email = 'auth.integration@byagenda.test';
  let app: Awaited<typeof import('../src/app.js')>['app'];
  let prisma: Awaited<typeof import('../src/database/prisma.js')>['prisma'];
  let token: string;

  beforeAll(async () => {
    ({ app } = await import('../src/app.js'));
    ({ prisma } = await import('../src/database/prisma.js'));
    await prisma.user.deleteMany({ where: { email } });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({ where: { email } });
      await prisma.$disconnect();
    }
  });

  it('registers, logs in and returns the current user', async () => {
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Auth Integration',
        email: email.toUpperCase(),
        password: '12345678',
        role: 'OWNER',
      });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.data.token).toEqual(expect.any(String));
    expect(registerResponse.body.data.user).toMatchObject({
      name: 'Auth Integration',
      email,
      role: 'OWNER',
    });
    expect(registerResponse.body.data.user.passwordHash).toBeUndefined();

    const duplicateResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Auth Integration',
        email,
        password: '12345678',
        role: 'OWNER',
      });

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.error.code).toBe('EMAIL_ALREADY_EXISTS');

    const invalidLoginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email,
        password: 'wrong-password',
      });

    expect(invalidLoginResponse.status).toBe(401);
    expect(invalidLoginResponse.body.error.code).toBe('INVALID_CREDENTIALS');

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email,
        password: '12345678',
      });

    expect(loginResponse.status).toBe(200);
    token = loginResponse.body.data.token;

    const meResponse = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.data).toMatchObject({
      email,
      role: 'OWNER',
    });
  });
});
