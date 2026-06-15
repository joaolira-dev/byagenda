import type { Response } from 'express';

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function sendData<T>(
  response: Response,
  data: T,
  statusCode = 200,
  meta?: PaginationMeta,
) {
  return response.status(statusCode).json(meta ? { data, meta } : { data });
}
