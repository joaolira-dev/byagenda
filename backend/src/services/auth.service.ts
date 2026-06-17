import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { prisma } from '../database/prisma.js';
import { AppError } from '../errors/app-error.js';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema.js';

const PASSWORD_SALT_ROUNDS = 10;

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'OWNER';
};

export class AuthService {
  async register(input: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });

    if (existingUser) {
      throw new AppError(
        409,
        'EMAIL_ALREADY_EXISTS',
        'Ja existe uma conta com este e-mail',
      );
    }

    const passwordHash = await bcrypt.hash(input.password, PASSWORD_SALT_ROUNDS);
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
      },
      select: userSelect,
    });

    return this.createSession(user);
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: {
        ...userSelect,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user?.isActive) {
      throw new AppError(
        401,
        'INVALID_CREDENTIALS',
        'E-mail ou senha invalidos',
      );
    }

    const passwordMatches = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new AppError(
        401,
        'INVALID_CREDENTIALS',
        'E-mail ou senha invalidos',
      );
    }

    return this.createSession(user);
  }

  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: userSelect,
    });

    if (!user) {
      throw new AppError(404, 'USER_NOT_FOUND', 'Usuario nao encontrado');
    }

    return user;
  }

  private createSession(user: AuthUser) {
    const signOptions: jwt.SignOptions = {
      subject: user.id,
      expiresIn: env.JWT_EXPIRES_IN as NonNullable<
        jwt.SignOptions['expiresIn']
      >,
    };
    const token = jwt.sign({}, env.JWT_SECRET, signOptions);

    return {
      token,
      user,
    };
  }
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const;

export const authService = new AuthService();
