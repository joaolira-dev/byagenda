import { API_BASE_URL } from '@/constants/env';

type ApiRequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

type ApiErrorResponse = {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, token }: ApiRequestOptions = {},
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => ({}))) as
    | { data?: T }
    | ApiErrorResponse;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorResponse;

    throw new ApiError(
      response.status,
      errorPayload.error?.code ?? 'REQUEST_ERROR',
      errorPayload.error?.message ?? 'Nao foi possivel concluir a requisicao',
      errorPayload.error?.details,
    );
  }

  return (payload as { data: T }).data;
}
