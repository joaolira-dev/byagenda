import { Router } from 'express';

import { authController } from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/authentication.js';
import { validate } from '../middlewares/validate.js';
import { loginBodySchema, registerBodySchema } from '../schemas/auth.schema.js';
import { asyncHandler } from '../utils/async-handler.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  validate({ body: registerBodySchema }),
  asyncHandler(authController.register),
);

authRouter.post(
  '/login',
  validate({ body: loginBodySchema }),
  asyncHandler(authController.login),
);

authRouter.get('/me', authenticate, asyncHandler(authController.me));
