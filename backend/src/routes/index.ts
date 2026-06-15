import { Router } from 'express';

import { categoryRouter } from './category.routes.js';
import {
  establishmentRouter,
  ownerEstablishmentRouter,
} from './establishment.routes.js';
import { serviceRouter } from './service.routes.js';

export const apiRouter = Router();

apiRouter.use('/categories', categoryRouter);
apiRouter.use('/owner/establishments', ownerEstablishmentRouter);
apiRouter.use('/establishments/:establishmentId/services', serviceRouter);
apiRouter.use('/establishments', establishmentRouter);
