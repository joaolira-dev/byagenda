import { Platform } from 'react-native';

const runtimeEnv = globalThis as unknown as {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

const fallbackApiUrl =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3333/api/v1'
    : 'http://localhost:3333/api/v1';

export const API_BASE_URL =
  runtimeEnv.process?.env?.EXPO_PUBLIC_API_URL ?? fallbackApiUrl;
