import { z } from 'zod';

export const uuidParam = z.string().uuid('UUID invalido');

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const optionalText = (maxLength: number) =>
  z.string().trim().max(maxLength).nullable().optional();
