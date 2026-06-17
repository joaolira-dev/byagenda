import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { AppError } from '../src/errors/app-error.js';
import { UserRole } from '../src/generated/prisma/enums.js';
import { requireRole } from '../src/middlewares/require-role.js';

process.env.DATABASE_URL =
  'postgresql://postgres:postgres@localhost:5432/byagenda_test';
process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';
process.env.NODE_ENV = 'test';

let app: Awaited<typeof import('../src/app.js')>['app'];

beforeAll(async () => {
  ({ app } = await import('../src/app.js'));
});

describe('JWT authentication middleware', () => {
  it('rejects requests without the Bearer scheme', async () => {
    const response = await request(app)
      .post('/api/v1/establishments')
      .set('Authorization', 'Token abc.def.ghi')
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rejects invalid JWT signatures', async () => {
    const response = await request(app)
      .post('/api/v1/establishments')
      .set('Authorization', 'Bearer invalid-token')
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });

  it('rejects signed tokens without a subject claim', async () => {
    const token = jwt.sign(
      {},
      process.env.JWT_SECRET as string,
      { expiresIn: '5m' },
    );

    const response = await request(app)
      .post('/api/v1/establishments')
      .set('Authorization', `bearer ${token}`)
      .send({});

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_TOKEN');
  });
});

describe('RBAC middleware', () => {
  it('allows users with an accepted role', () => {
    const request = {
      auth: {
        userId: 'user-id',
        role: UserRole.OWNER,
      },
    } as Request;
    const next = vi.fn() as NextFunction;

    requireRole(UserRole.OWNER)(request, {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('blocks users without an accepted role', () => {
    const request = {
      auth: {
        userId: 'user-id',
        role: UserRole.CLIENT,
      },
    } as Request;
    const next = vi.fn() as NextFunction;

    requireRole(UserRole.OWNER)(request, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));
    const error = next.mock.calls[0]?.[0] as AppError;
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });
});
