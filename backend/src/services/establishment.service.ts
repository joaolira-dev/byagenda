import type { Prisma } from '../generated/prisma/client.js';
import { EstablishmentStatus } from '../generated/prisma/enums.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../errors/app-error.js';
import type {
  CreateEstablishmentInput,
  PublicEstablishmentQuery,
  UpdateEstablishmentInput,
} from '../schemas/establishment.schema.js';
import { getPagination, getPaginationMeta } from '../utils/pagination.js';
import { slugify } from '../utils/slug.js';

const establishmentInclude = {
  categories: {
    select: {
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          icon: true,
        },
      },
    },
  },
} satisfies Prisma.EstablishmentInclude;

type EstablishmentWithCategories = Prisma.EstablishmentGetPayload<{
  include: typeof establishmentInclude;
}>;

export class EstablishmentService {
  async create(ownerId: string, input: CreateEstablishmentInput) {
    const { categoryIds, ...data } = input;
    const uniqueCategoryIds = [...new Set(categoryIds)];

    return prisma.$transaction(async (transaction) => {
      await this.ensureCategoriesExist(transaction, uniqueCategoryIds);
      const slug = await this.createUniqueSlug(transaction, data.name);
      const createData: Prisma.EstablishmentCreateInput = {
        name: data.name,
        slug,
        timezone: data.timezone,
        addressLine: data.addressLine,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        owner: { connect: { id: ownerId } },
        categories: {
          create: uniqueCategoryIds.map((categoryId) => ({
            category: { connect: { id: categoryId } },
          })),
        },
        ...(data.description === undefined
          ? {}
          : { description: data.description }),
        ...(data.phone === undefined ? {} : { phone: data.phone }),
        ...(data.email === undefined ? {} : { email: data.email }),
        ...(data.logoUrl === undefined ? {} : { logoUrl: data.logoUrl }),
        ...(data.coverUrl === undefined ? {} : { coverUrl: data.coverUrl }),
        ...(data.addressNumber === undefined
          ? {}
          : { addressNumber: data.addressNumber }),
        ...(data.addressExtra === undefined
          ? {}
          : { addressExtra: data.addressExtra }),
        ...(data.neighborhood === undefined
          ? {}
          : { neighborhood: data.neighborhood }),
        ...(data.latitude === undefined ? {} : { latitude: data.latitude }),
        ...(data.longitude === undefined ? {} : { longitude: data.longitude }),
      };

      const establishment = await transaction.establishment.create({
        data: createData,
        include: establishmentInclude,
      });

      return this.serialize(establishment);
    });
  }

  async listPublic(query: PublicEstablishmentQuery) {
    const { page, limit, search, categoryId, city, state } = query;
    const where: Prisma.EstablishmentWhereInput = {
      status: EstablishmentStatus.ACTIVE,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
      ...(city ? { city: { equals: city, mode: 'insensitive' } } : {}),
      ...(state ? { state } : {}),
      ...(categoryId
        ? { categories: { some: { categoryId, category: { isActive: true } } } }
        : {}),
    };

    const [items, total] = await prisma.$transaction([
      prisma.establishment.findMany({
        where,
        ...getPagination(page, limit),
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        include: establishmentInclude,
      }),
      prisma.establishment.count({ where }),
    ]);

    return {
      data: items.map((item) => this.serialize(item)),
      meta: getPaginationMeta(page, limit, total),
    };
  }

  async listOwned(ownerId: string, page: number, limit: number) {
    const where = { ownerId };
    const [items, total] = await prisma.$transaction([
      prisma.establishment.findMany({
        where,
        ...getPagination(page, limit),
        orderBy: { createdAt: 'desc' },
        include: establishmentInclude,
      }),
      prisma.establishment.count({ where }),
    ]);

    return {
      data: items.map((item) => this.serialize(item)),
      meta: getPaginationMeta(page, limit, total),
    };
  }

  async getPublicById(id: string) {
    const establishment = await prisma.establishment.findFirst({
      where: { id, status: EstablishmentStatus.ACTIVE },
      include: {
        ...establishmentInclude,
        services: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        businessHours: {
          orderBy: [{ dayOfWeek: 'asc' }, { opensAtMinute: 'asc' }],
        },
      },
    });

    if (!establishment) {
      throw new AppError(
        404,
        'ESTABLISHMENT_NOT_FOUND',
        'Estabelecimento nao encontrado',
      );
    }

    return {
      ...this.serialize(establishment),
      services: establishment.services.map((service) => ({
        ...service,
        price: service.price.toFixed(2),
      })),
      businessHours: establishment.businessHours,
    };
  }

  async update(
    id: string,
    ownerId: string,
    input: UpdateEstablishmentInput,
  ) {
    const { categoryIds, ...data } = input;

    return prisma.$transaction(async (transaction) => {
      await this.ensureOwnership(transaction, id, ownerId);

      if (categoryIds) {
        const uniqueCategoryIds = [...new Set(categoryIds)];
        await this.ensureCategoriesExist(transaction, uniqueCategoryIds);
        await transaction.establishmentCategory.deleteMany({
          where: { establishmentId: id },
        });
        await transaction.establishmentCategory.createMany({
          data: uniqueCategoryIds.map((categoryId) => ({
            establishmentId: id,
            categoryId,
          })),
        });
      }

      const updateData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined),
      ) as Prisma.EstablishmentUpdateInput;

      const establishment = await transaction.establishment.update({
        where: { id },
        data: updateData,
        include: establishmentInclude,
      });

      return this.serialize(establishment);
    });
  }

  async updateStatus(
    id: string,
    ownerId: string,
    status: EstablishmentStatus,
  ) {
    await this.ensureOwnership(prisma, id, ownerId);

    const establishment = await prisma.establishment.update({
      where: { id },
      data: { status },
      include: establishmentInclude,
    });

    return this.serialize(establishment);
  }

  async deactivate(id: string, ownerId: string) {
    await this.ensureOwnership(prisma, id, ownerId);

    await prisma.$transaction([
      prisma.establishment.update({
        where: { id },
        data: { status: EstablishmentStatus.INACTIVE },
      }),
      prisma.service.updateMany({
        where: { establishmentId: id },
        data: { isActive: false },
      }),
    ]);
  }

  private async ensureOwnership(
    client: Prisma.TransactionClient | typeof prisma,
    id: string,
    ownerId: string,
  ) {
    const establishment = await client.establishment.findUnique({
      where: { id },
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

  private async ensureCategoriesExist(
    transaction: Prisma.TransactionClient,
    categoryIds: string[],
  ) {
    const count = await transaction.category.count({
      where: {
        id: { in: categoryIds },
        isActive: true,
      },
    });

    if (count !== categoryIds.length) {
      throw new AppError(
        422,
        'INVALID_CATEGORIES',
        'Uma ou mais categorias sao invalidas ou inativas',
      );
    }
  }

  private async createUniqueSlug(
    transaction: Prisma.TransactionClient,
    name: string,
  ) {
    const baseSlug = slugify(name).slice(0, 170) || 'estabelecimento';
    let candidate = baseSlug;
    let suffix = 1;

    while (
      await transaction.establishment.findUnique({
        where: { slug: candidate },
        select: { id: true },
      })
    ) {
      suffix += 1;
      candidate = `${baseSlug}-${suffix}`;
    }

    return candidate;
  }

  private serialize(establishment: EstablishmentWithCategories) {
    const { ownerId: _ownerId, ...publicFields } = establishment;

    return {
      ...publicFields,
      latitude: establishment.latitude?.toString() ?? null,
      longitude: establishment.longitude?.toString() ?? null,
      categories: establishment.categories.map(({ category }) => category),
    };
  }
}

export const establishmentService = new EstablishmentService();
