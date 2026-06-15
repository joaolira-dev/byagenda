import type { RequestHandler } from 'express';

import type {
  CreateServiceInput,
  UpdateServiceInput,
} from '../schemas/service.schema.js';
import { serviceService } from '../services/service.service.js';
import { getAuthenticatedUser } from '../utils/auth.js';
import { sendData } from '../utils/http-response.js';
import {
  getValidatedBody,
  getValidatedParams,
  getValidatedQuery,
} from '../utils/validated-request.js';

export class ServiceController {
  create: RequestHandler = async (request, response) => {
    const { userId } = getAuthenticatedUser(request);
    const { establishmentId } = getValidatedParams<{
      establishmentId: string;
    }>(request);
    const service = await serviceService.create(
      establishmentId,
      userId,
      getValidatedBody<CreateServiceInput>(request),
    );

    sendData(response, service, 201);
  };

  listPublic: RequestHandler = async (request, response) => {
    const { page, limit } = getValidatedQuery<{
      page: number;
      limit: number;
    }>(request);
    const { establishmentId } = getValidatedParams<{
      establishmentId: string;
    }>(request);
    const result = await serviceService.listPublic(
      establishmentId,
      page,
      limit,
    );

    sendData(response, result.data, 200, result.meta);
  };

  getPublicById: RequestHandler = async (request, response) => {
    const { establishmentId, serviceId } = getValidatedParams<{
      establishmentId: string;
      serviceId: string;
    }>(request);
    const service = await serviceService.getPublicById(
      establishmentId,
      serviceId,
    );

    sendData(response, service);
  };

  update: RequestHandler = async (request, response) => {
    const { userId } = getAuthenticatedUser(request);
    const { establishmentId, serviceId } = getValidatedParams<{
      establishmentId: string;
      serviceId: string;
    }>(request);
    const service = await serviceService.update(
      establishmentId,
      serviceId,
      userId,
      getValidatedBody<UpdateServiceInput>(request),
    );

    sendData(response, service);
  };

  deactivate: RequestHandler = async (request, response) => {
    const { userId } = getAuthenticatedUser(request);
    const { establishmentId, serviceId } = getValidatedParams<{
      establishmentId: string;
      serviceId: string;
    }>(request);
    await serviceService.deactivate(
      establishmentId,
      serviceId,
      userId,
    );

    response.status(204).send();
  };
}

export const serviceController = new ServiceController();
