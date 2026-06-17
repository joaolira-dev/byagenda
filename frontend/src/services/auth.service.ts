import { apiRequest } from './api';
import type {
  AuthSession,
  AuthUser,
  LoginPayload,
  RegisterPayload,
} from '@/types/auth';

export const authService = {
  login(payload: LoginPayload) {
    return apiRequest<AuthSession>('/auth/login', {
      method: 'POST',
      body: payload,
    });
  },

  register(payload: RegisterPayload) {
    return apiRequest<AuthSession>('/auth/register', {
      method: 'POST',
      body: payload,
    });
  },

  me(token: string) {
    return apiRequest<AuthUser>('/auth/me', { token });
  },
};
