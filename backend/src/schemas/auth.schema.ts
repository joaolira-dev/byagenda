import { z } from 'zod';

import { UserRole } from '../generated/prisma/enums.js';

const emailSchema = z
  .string()
  .trim()
  .email('Informe um e-mail valido')
  .max(255)
  .transform((email) => email.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter pelo menos 8 caracteres')
  .max(72, 'A senha deve ter no maximo 72 caracteres');

export const registerBodySchema = z.object({
  name: z.string().trim().min(3).max(120),
  email: emailSchema,
  password: passwordSchema,
  role: z.enum([UserRole.CLIENT, UserRole.OWNER]).default(UserRole.CLIENT),
});

export const loginBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Informe sua senha').max(72),
});

export type RegisterInput = z.infer<typeof registerBodySchema>;
export type LoginInput = z.infer<typeof loginBodySchema>;
