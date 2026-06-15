import { Router } from 'express';

import { serviceController } from '../controllers/service.controller.js';
import { UserRole } from '../generated/prisma/enums.js';
import { authenticate } from '../middlewares/authentication.js';
import { requireRole } from '../middlewares/require-role.js';
import { validate } from '../middlewares/validate.js';
import { establishmentServiceParamsSchema } from '../schemas/establishment.schema.js';
import {
  createServiceBodySchema,
  publicServiceQuerySchema,
  serviceParamsSchema,
  updateServiceBodySchema,
} from '../schemas/service.schema.js';
import { asyncHandler } from '../utils/async-handler.js';

export const serviceRouter = Router({ mergeParams: true });

serviceRouter.get(
  '/',
  validate({
    params: establishmentServiceParamsSchema,
    query: publicServiceQuerySchema,
  }),
  asyncHandler(serviceController.listPublic),
);

serviceRouter.get(
  '/:serviceId',
  validate({ params: serviceParamsSchema }),
  asyncHandler(serviceController.getPublicById),
);

serviceRouter.post(
  '/',
  authenticate,
  requireRole(UserRole.OWNER),
  validate({
    params: establishmentServiceParamsSchema,
    body: createServiceBodySchema,
  }),
  asyncHandler(serviceController.create),
);

serviceRouter.patch(
  '/:serviceId',
  authenticate,
  requireRole(UserRole.OWNER),
  validate({
    params: serviceParamsSchema,
    body: updateServiceBodySchema,
  }),
  asyncHandler(serviceController.update),
);

serviceRouter.delete(
  '/:serviceId',
  authenticate,
  requireRole(UserRole.OWNER),
  validate({ params: serviceParamsSchema }),
  asyncHandler(serviceController.deactivate),
);
