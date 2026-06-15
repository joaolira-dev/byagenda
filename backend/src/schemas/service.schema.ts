import { z } from 'zod';

import { optionalText, paginationQuerySchema, uuidParam } from './common.schema.js';

const serviceFields = {
  name: z.string().trim().min(2).max(120),
  description: optionalText(5000),
  price: z.coerce.number().finite().min(0).max(99_999_999.99),
  durationMinutes: z.coerce.number().int().min(1).max(1440),
  isActive: z.boolean().optional(),
};

export const createServiceBodySchema = z.object(serviceFields);

export const updateServiceBodySchema = z
  .object(serviceFields)
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

export const serviceParamsSchema = z.object({
  establishmentId: uuidParam,
  serviceId: uuidParam,
});

export const publicServiceQuerySchema = paginationQuerySchema;

export type CreateServiceInput = z.infer<typeof createServiceBodySchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceBodySchema>;
