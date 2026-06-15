import { z } from 'zod';

import { EstablishmentStatus } from '../generated/prisma/enums.js';
import {
  optionalText,
  paginationQuerySchema,
  uuidParam,
} from './common.schema.js';

const coordinateSchema = z.number().finite();

const establishmentFields = {
  name: z.string().trim().min(2).max(160),
  description: optionalText(5000),
  phone: optionalText(20),
  email: z.string().trim().email().max(255).nullable().optional(),
  logoUrl: z.string().url().max(2048).nullable().optional(),
  coverUrl: z.string().url().max(2048).nullable().optional(),
  timezone: z.string().trim().min(1).max(64).default('America/Sao_Paulo'),
  addressLine: z.string().trim().min(2).max(255),
  addressNumber: optionalText(20),
  addressExtra: optionalText(120),
  neighborhood: optionalText(120),
  city: z.string().trim().min(2).max(120),
  state: z.string().trim().length(2).transform((value) => value.toUpperCase()),
  postalCode: z.string().trim().min(8).max(10),
  latitude: coordinateSchema.min(-90).max(90).nullable().optional(),
  longitude: coordinateSchema.min(-180).max(180).nullable().optional(),
  categoryIds: z.array(uuidParam).min(1).max(10),
};

function validateCoordinatePair(
  data: {
    latitude?: number | null | undefined;
    longitude?: number | null | undefined;
  },
  context: z.RefinementCtx,
) {
  const hasLatitude = data.latitude !== undefined && data.latitude !== null;
  const hasLongitude = data.longitude !== undefined && data.longitude !== null;

  if (hasLatitude !== hasLongitude) {
    context.addIssue({
      code: 'custom',
      path: ['latitude'],
      message: 'Latitude e longitude devem ser informadas juntas',
    });
  }
}

export const createEstablishmentBodySchema = z
  .object(establishmentFields)
  .superRefine(validateCoordinatePair);

export const updateEstablishmentBodySchema = z
  .object({
    ...establishmentFields,
    timezone: establishmentFields.timezone.optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  })
  .superRefine(validateCoordinatePair);

export const establishmentIdParamsSchema = z.object({
  id: uuidParam,
});

export const establishmentServiceParamsSchema = z.object({
  establishmentId: uuidParam,
});

export const publicEstablishmentQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(160).optional(),
  categoryId: uuidParam.optional(),
  city: z.string().trim().max(120).optional(),
  state: z
    .string()
    .trim()
    .length(2)
    .transform((value) => value.toUpperCase())
    .optional(),
});

export const updateEstablishmentStatusBodySchema = z.object({
  status: z.enum([
    EstablishmentStatus.ACTIVE,
    EstablishmentStatus.INACTIVE,
  ]),
});

export type CreateEstablishmentInput = z.infer<
  typeof createEstablishmentBodySchema
>;
export type UpdateEstablishmentInput = z.infer<
  typeof updateEstablishmentBodySchema
>;
export type PublicEstablishmentQuery = z.infer<
  typeof publicEstablishmentQuerySchema
>;
