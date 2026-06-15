import { Prisma } from '../generated/prisma/client.js';
import { EstablishmentStatus } from '../generated/prisma/enums.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../errors/app-error.js';
import type {
  CreateServiceInput,
  UpdateServiceInput,
} from '../schemas/service.schema.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';

export class ServiceService {
  async create(
    establishmentId: string,
    ownerId: string,
    input: CreateServiceInput,
  ) {
    await this.ensureOwnership(establishmentId, ownerId);
    const createData: Prisma.ServiceUncheckedCreateInput = {
      establishmentId,
      name: input.name,
      price: new Prisma.Decimal(input.price),
      durationMinutes: input.durationMinutes,
      ...(input.description === undefined
        ? {}
        : { description: input.description }),
      ...(input.isActive === undefined ? {} : { isActive: input.isActive }),
    };

    const service = await prisma.service.create({
      data: createData,
    });

    return this.serialize(service);
  }

  async listPublic(establishmentId: string, page: number, limit: number) {
    const establishment = await prisma.establishment.findFirst({
      where: {
        id: establishmentId,
        status: EstablishmentStatus.ACTIVE,
      },
      select: { id: true },
    });

    if (!establishment) {
      throw new AppError(
        404,
        'ESTABLISHMENT_NOT_FOUND',
        'Estabelecimento nao encontrado',
      );
    }

    const where = { establishmentId, isActive: true };
    const [items, total] = await prisma.$transaction([
      prisma.service.findMany({
        where,
        ...getPagination(page, limit),
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      }),
      prisma.service.count({ where }),
    ]);

    return {
      data: items.map((item) => this.serialize(item)),
      meta: getPaginationMeta(page, limit, total),
    };
  }

  async getPublicById(establishmentId: string, serviceId: string) {
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        establishmentId,
        isActive: true,
        establishment: { status: EstablishmentStatus.ACTIVE },
      },
    });

    if (!service) {
      throw new AppError(404, 'SERVICE_NOT_FOUND', 'Servico nao encontrado');
    }

    return this.serialize(service);
  }

  async update(
    establishmentId: string,
    serviceId: string,
    ownerId: string,
    input: UpdateServiceInput,
  ) {
    await this.ensureOwnership(establishmentId, ownerId);
    await this.ensureServiceExists(establishmentId, serviceId);
    const updateData = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    ) as Prisma.ServiceUpdateInput;

    if (input.price !== undefined) {
      updateData.price = new Prisma.Decimal(input.price);
    }

    const service = await prisma.service.update({
      where: { id: serviceId },
      data: updateData,
    });

    return this.serialize(service);
  }

  async deactivate(
    establishmentId: string,
    serviceId: string,
    ownerId: string,
  ) {
    await this.ensureOwnership(establishmentId, ownerId);
    await this.ensureServiceExists(establishmentId, serviceId);

    await prisma.service.update({
      where: { id: serviceId },
      data: { isActive: false },
    });
  }

  private async ensureOwnership(establishmentId: string, ownerId: string) {
    const establishment = await prisma.establishment.findUnique({
      where: { id: establishmentId },
      select: { ownerId: true },
    });

    if (!establishment) {
      throw new AppError(
        404,
        'ESTABLISHMENT_NOT_FOUND',
        'Estabelecimento nao encontrado',
      );
    }

    if (establishment.ownerId !== ownerId) {
      throw new AppError(
        403,
        'ESTABLISHMENT_FORBIDDEN',
        'Voce nao pode gerenciar este estabelecimento',
      );
    }
  }

  private async ensureServiceExists(
    establishmentId: string,
    serviceId: string,
  ) {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, establishmentId },
      select: { id: true },
    });

    if (!service) {
      throw new AppError(404, 'SERVICE_NOT_FOUND', 'Servico nao encontrado');
    }
  }

  private serialize<T extends { price: Prisma.Decimal }>(service: T) {
    return {
      ...service,
      price: service.price.toFixed(2),
    };
  }
}

export const serviceService = new ServiceService();
