import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

import { AppError } from '../errors/app-error.js';

type RequestSchemas = {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
};

export function validate(schemas: RequestSchemas): RequestHandler {
  return (request, _response, next) => {
    const errors: unknown[] = [];

    for (const key of ['body', 'params', 'query'] as const) {
      const schema = schemas[key];

      if (!schema) {
        continue;
      }

      const result = schema.safeParse(request[key]);

      if (!result.success) {
        errors.push(
          ...result.error.issues.map((issue) => ({
            field: [key, ...issue.path].join('.'),
            message: issue.message,
          })),
        );
        continue;
      }

      request.validated = {
        ...request.validated,
        [key]: result.data,
      };
    }

    if (errors.length > 0) {
      next(new AppError(422, 'VALIDATION_ERROR', 'Dados invalidos', errors));
      return;
    }

    next();
  };
}
