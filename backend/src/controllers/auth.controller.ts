import type { RequestHandler } from 'express';

import type { LoginInput, RegisterInput } from '../schemas/auth.schema.js';
import { authService } from '../services/auth.service.js';
import { getAuthenticatedUser } from '../utils/auth.js';
import { sendData } from '../utils/http-response.js';
import { getValidatedBody } from '../utils/validated-request.js';

export class AuthController {
  register: RequestHandler = async (request, response) => {
    const session = await authService.register(
      getValidatedBody<RegisterInput>(request),
    );

    sendData(response, session, 201);
  };

  login: RequestHandler = async (request, response) => {
    const session = await authService.login(
      getValidatedBody<LoginInput>(request),
    );

    sendData(response, session);
  };

  me: RequestHandler = async (request, response) => {
    const { userId } = getAuthenticatedUser(request);
    const user = await authService.me(userId);

    sendData(response, user);
  };
}

export const authController = new AuthController();
