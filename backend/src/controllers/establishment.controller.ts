import type { RequestHandler } from 'express';

import type { EstablishmentStatus } from '../generated/prisma/enums.js';
import type {
  CreateEstablishmentInput,
  PublicEstablishmentQuery,
  UpdateEstablishmentInput,
} from '../schemas/establishment.schema.js';
import { establishmentService } from '../services/establishment.service.js';
import { getAuthenticatedUser } from '../utils/auth.js';
import { sendData } from '../utils/http-response.js';
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from '../utils/validated-request.js';

export class EstablishmentController {
  create: RequestHandler = async (request, response) => {
    const { userId } = getAuthenticatedUser(request);
    const establishment = await establishmentService.create(
      userId,
      getValidatedBody<CreateEstablishmentInput>(request),
    );

    sendData(response, establishment, 201);
  };

  listPublic: RequestHandler = async (request, response) => {
    const result = await establishmentService.listPublic(
      getValidatedQuery<PublicEstablishmentQuery>(request),
    );

    sendData(response, result.data, 200, result.meta);
  };

  listOwned: RequestHandler = async (request, response) => {
    const { userId } = getAuthenticatedUser(request);
    const { page, limit } = getValidatedQuery<{
      page: number;
      limit: number;
    }>(request);
    const result = await establishmentService.listOwned(userId, page, limit);

    sendData(response, result.data, 200, result.meta);
  };

  getPublicById: RequestHandler = async (request, response) => {
    const { id } = getValidatedParams<{ id: string }>(request);
    const establishment = await establishmentService.getPublicById(id);

    sendData(response, establishment);
  };

  update: RequestHandler = async (request, response) => {
    const { userId } = getAuthenticatedUser(request);
    const { id } = getValidatedParams<{ id: string }>(request);
    const establishment = await establishmentService.update(
      id,
      userId,
      getValidatedBody<UpdateEstablishmentInput>(request),
    );

    sendData(response, establishment);
  };

  updateStatus: RequestHandler = async (request, response) => {
    const { userId } = getAuthenticatedUser(request);
    const { id } = getValidatedParams<{ id: string }>(request);
    const { status } = getValidatedBody<{ status: EstablishmentStatus }>(
      request,
    );
    const establishment = await establishmentService.updateStatus(
      id,
      userId,
      status,
    );

    sendData(response, establishment);
  };

  deactivate: RequestHandler = async (request, response) => {
    const { userId } = getAuthenticatedUser(request);
    const { id } = getValidatedParams<{ id: string }>(request);
    await establishmentService.deactivate(id, userId);

    response.status(204).send();
  };
}

export const establishmentController = new EstablishmentController();
