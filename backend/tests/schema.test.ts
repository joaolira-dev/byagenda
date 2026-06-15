import { describe, expect, it } from 'vitest';

import { createEstablishmentBodySchema } from '../src/schemas/establishment.schema.js';
import { createServiceBodySchema } from '../src/schemas/service.schema.js';
import { slugify } from '../src/utils/slug.js';

const validEstablishment = {
  name: 'Barbearia Central',
  addressLine: 'Rua Principal',
  city: 'Recife',
  state: 'pe',
  postalCode: '50000-000',
  categoryIds: ['2e1543ef-29a4-4f92-8f76-e3eea5de22ad'],
};

describe('request schemas', () => {
  it('normalizes the state and applies the default timezone', () => {
    const result = createEstablishmentBodySchema.parse(validEstablishment);

    expect(result.state).toBe('PE');
    expect(result.timezone).toBe('America/Sao_Paulo');
  });

  it('requires latitude and longitude together', () => {
    const result = createEstablishmentBodySchema.safeParse({
      ...validEstablishment,
      latitude: -8.05,
    });

    expect(result.success).toBe(false);
  });

  it('rejects services with zero duration', () => {
    const result = createServiceBodySchema.safeParse({
      name: 'Corte',
      price: 50,
      durationMinutes: 0,
    });

    expect(result.success).toBe(false);
  });
});

describe('slugify', () => {
  it('creates a normalized URL slug', () => {
    expect(slugify('  Salão & Estética Premium  ')).toBe(
      'salao-estetica-premium',
    );
  });
});
