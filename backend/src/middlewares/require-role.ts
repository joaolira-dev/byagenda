import type { RequestHandler } from 'express';

import type { UserRole } from '../generated/prisma/enums.js';
import { AppError } from '../errors/app-error.js';

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth || !roles.includes(request.auth.role)) {
      next(new AppError(403, 'FORBIDDEN', 'Acesso nao permitido'));
      return;
    }

    next();
  };
}
