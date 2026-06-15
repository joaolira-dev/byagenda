import { prisma } from '../database/prisma.js';

export class CategoryService {
  async listActive() {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
      },
    });
  }
}

export const categoryService = new CategoryService();
