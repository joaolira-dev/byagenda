import { Router } from 'express';

import { categoryController } from '../controllers/category.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

export const categoryRouter = Router();

categoryRouter.get('/', asyncHandler(categoryController.list));
