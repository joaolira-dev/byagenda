import type { RequestHandler } from 'express';

import { categoryService } from '../services/category.service.js';
import { sendData } from '../utils/http-response.js';

export class CategoryController {
  list: RequestHandler = async (_request, response) => {
    const categories = await categoryService.listActive();
    sendData(response, categories);
  };
}

export const categoryController = new CategoryController();
