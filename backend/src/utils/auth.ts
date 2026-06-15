import type { Request } from 'express';

import { AppError } from '../errors/app-error.js';

export function getAuthenticatedUser(request: Request) {
  if (!request.auth) {
    throw new AppError(401, 'UNAUTHORIZED', 'Autenticacao obrigatoria');
  }

  return request.auth;
}
