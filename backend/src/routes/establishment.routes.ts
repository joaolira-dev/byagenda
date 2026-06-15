import { Router } from 'express';

import { establishmentController } from '../controllers/establishment.controller.js';
import { UserRole } from '../generated/prisma/enums.js';
import { authenticate } from '../middlewares/authentication.js';
import { requireRole } from '../middlewares/require-role.js';
import { validate } from '../middlewares/validate.js';
import {
  createEstablishmentBodySchema,
  establishmentIdParamsSchema,
  publicEstablishmentQuerySchema,
  updateEstablishmentBodySchema,
  updateEstablishmentStatusBodySchema,
} from '../schemas/establishment.schema.js';
import { paginationQuerySchema } from '../schemas/common.schema.js';
import { asyncHandler } from '../utils/async-handler.js';

export const establishmentRouter = Router();
export const ownerEstablishmentRouter = Router();

establishmentRouter.get(
  '/',
  validate({ query: publicEstablishmentQuerySchema }),
  asyncHandler(establishmentController.listPublic),
);

establishmentRouter.get(
  '/:id',
  validate({ params: establishmentIdParamsSchema }),
  asyncHandler(establishmentController.getPublicById),
);

establishmentRouter.post(
  '/',
  authenticate,
  requireRole(UserRole.OWNER),
  validate({ body: createEstablishmentBodySchema }),
  asyncHandler(establishmentController.create),
);

establishmentRouter.patch(
  '/:id',
  authenticate,
  requireRole(UserRole.OWNER),
  validate({
    params: establishmentIdParamsSchema,
    body: updateEstablishmentBodySchema,
  }),
  asyncHandler(establishmentController.update),
);

establishmentRouter.patch(
  '/:id/status',
  authenticate,
  requireRole(UserRole.OWNER),
  validate({
    params: establishmentIdParamsSchema,
    body: updateEstablishmentStatusBodySchema,
  }),
  asyncHandler(establishmentController.updateStatus),
);

establishmentRouter.delete(
  '/:id',
  authenticate,
  requireRole(UserRole.OWNER),
  validate({ params: establishmentIdParamsSchema }),
  asyncHandler(establishmentController.deactivate),
);

ownerEstablishmentRouter.get(
  '/',
  authenticate,
  requireRole(UserRole.OWNER),
  validate({ query: paginationQuerySchema }),
  asyncHandler(establishmentController.listOwned),
);
