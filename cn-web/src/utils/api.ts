import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.chefnow.cloud";

export interface AxiosErrorWithNormalized<T = any, D = any> extends AxiosError<T, D> {
  normalized?: { status?: number; message: string };
}

const apiInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

apiInstance.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers = config.headers ?? {};
      if (!config.headers['Authorization']) {
        (config.headers as any)['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  }
);

let handling401 = false;

apiInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;

    const raw = error.response?.data as { message?: string | string[] } | undefined;
    const rawMsg = Array.isArray(raw?.message) ? raw?.message.join(', ') : raw?.message;
    (error as AxiosErrorWithNormalized).normalized = {
      status,
      message: rawMsg ?? error.message ?? 'Erro inesperado',
    };

    if (status === 401 && !handling401) {
      handling401 = true;
      try {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      } finally {
        setTimeout(() => { handling401 = false; }, 300);
      }
    }

    return Promise.reject(error);
  }
);

export const apiRaw = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

export const api = {
  get baseURL() {
    return API_BASE_URL;
  },
  get<T>(endpoint: string, config?: any): Promise<T> {
    return apiInstance.get<T>(endpoint, config).then(res => res.data);
  },
  post<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    return apiInstance.post<T>(endpoint, data, config).then(res => res.data);
  },
  patch<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    return apiInstance.patch<T>(endpoint, data, config).then(res => res.data);
  },
  put<T>(endpoint: string, data?: any, config?: any): Promise<T> {
    return apiInstance.put<T>(endpoint, data, config).then(res => res.data);
  },
  delete<T>(endpoint: string, config?: any): Promise<T> {
    return apiInstance.delete<T>(endpoint, config).then(res => res.data);
  },
};
