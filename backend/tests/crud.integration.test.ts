import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const runIntegration = process.env.RUN_INTEGRATION === 'true';
const integrationDescribe = runIntegration ? describe : describe.skip;

integrationDescribe('establishment and service CRUD', () => {
  const ownerId = '10000000-0000-0000-0000-000000000001';
  const clientId = '10000000-0000-0000-0000-000000000002';
  let app: Awaited<typeof import('../src/app.js')>['app'];
  let prisma: Awaited<typeof import('../src/database/prisma.js')>['prisma'];
  let ownerToken: string;
  let clientToken: string;
  let categoryId: string;
  let establishmentId: string;
  let serviceId: string;

  beforeAll(async () => {
    ({ app } = await import('../src/app.js'));
    ({ prisma } = await import('../src/database/prisma.js'));

    await prisma.user.createMany({
      data: [
        {
          id: ownerId,
          name: 'Owner Test',
          email: 'owner.crud@byagenda.test',
          passwordHash: 'not-used-in-this-test',
          role: 'OWNER',
        },
        {
          id: clientId,
          name: 'Client Test',
          email: 'client.crud@byagenda.test',
          passwordHash: 'not-used-in-this-test',
          role: 'CLIENT',
        },
      ],
      skipDuplicates: true,
    });

    const category = await prisma.category.findFirstOrThrow({
      where: { isActive: true },
      select: { id: true },
    });
    categoryId = category.id;

    ownerToken = jwt.sign({}, process.env.JWT_SECRET as string, {
      subject: ownerId,
    });
    clientToken = jwt.sign({}, process.env.JWT_SECRET as string, {
      subject: clientId,
    });
  });

  afterAll(async () => {
    if (prisma) {
      if (establishmentId) {
        await prisma.establishment.deleteMany({
          where: { id: establishmentId },
        });
      }
      await prisma.user.deleteMany({
        where: { id: { in: [ownerId, clientId] } },
      });
      await prisma.$disconnect();
    }
  });

  it('runs the owner CRUD and enforces public visibility', async () => {
    const forbiddenResponse = await request(app)
      .post('/api/v1/establishments')
      .set('Authorization', `Bearer ${clientToken}`)
      .send({});

    expect(forbiddenResponse.status).toBe(403);

    const createResponse = await request(app)
      .post('/api/v1/establishments')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Studio CRUD Test',
        addressLine: 'Rua dos Testes',
        city: 'Recife',
        state: 'PE',
        postalCode: '50000-000',
        categoryIds: [categoryId],
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.status).toBe('PENDING');
    expect(createResponse.body.data.ownerId).toBeUndefined();
    establishmentId = createResponse.body.data.id;
    const originalSlug = createResponse.body.data.slug;

    const updateResponse = await request(app)
      .patch(`/api/v1/establishments/${establishmentId}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Studio CRUD Atualizado' });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.name).toBe('Studio CRUD Atualizado');
    expect(updateResponse.body.data.slug).toBe(originalSlug);

    const activateResponse = await request(app)
      .patch(`/api/v1/establishments/${establishmentId}/status`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ status: 'ACTIVE' });

    expect(activateResponse.status).toBe(200);

    const serviceResponse = await request(app)
      .post(`/api/v1/establishments/${establishmentId}/services`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Corte premium',
        price: 59.9,
        durationMinutes: 45,
      });

    expect(serviceResponse.status).toBe(201);
    expect(serviceResponse.body.data.price).toBe('59.90');
    serviceId = serviceResponse.body.data.id;

    const updateServiceResponse = await request(app)
      .patch(
        `/api/v1/establishments/${establishmentId}/services/${serviceId}`,
      )
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        price: 65,
        durationMinutes: 50,
      });

    expect(updateServiceResponse.status).toBe(200);
    expect(updateServiceResponse.body.data.price).toBe('65.00');
    expect(updateServiceResponse.body.data.durationMinutes).toBe(50);

    const publicResponse = await request(app).get(
      `/api/v1/establishments/${establishmentId}`,
    );

    expect(publicResponse.status).toBe(200);
    expect(publicResponse.body.data.services).toHaveLength(1);

    const deleteServiceResponse = await request(app)
      .delete(
        `/api/v1/establishments/${establishmentId}/services/${serviceId}`,
      )
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(deleteServiceResponse.status).toBe(204);

    const publicServicesResponse = await request(app).get(
      `/api/v1/establishments/${establishmentId}/services`,
    );

    expect(publicServicesResponse.status).toBe(200);
    expect(publicServicesResponse.body.data).toEqual([]);

    const deleteEstablishmentResponse = await request(app)
      .delete(`/api/v1/establishments/${establishmentId}`)
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(deleteEstablishmentResponse.status).toBe(204);

    const hiddenResponse = await request(app).get(
      `/api/v1/establishments/${establishmentId}`,
    );

    expect(hiddenResponse.status).toBe(404);
  });
});
