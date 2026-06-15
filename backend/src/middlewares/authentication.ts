import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../errors/app-error.js';

type AccessTokenPayload = {
  sub?: string;
};

export const authenticate: RequestHandler = async (request, _response, next) => {
  try {
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Token de acesso ausente');
    }

    const token = authorization.slice('Bearer '.length);
    const payload = jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;

    if (!payload.sub) {
      throw new AppError(401, 'INVALID_TOKEN', 'Token de acesso invalido');
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, isActive: true },
    });

    if (!user?.isActive) {
      throw new AppError(401, 'INVALID_TOKEN', 'Usuario inativo ou inexistente');
    }

    request.auth = {
      userId: user.id,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }

    next(new AppError(401, 'INVALID_TOKEN', 'Token de acesso invalido'));
  }
};
