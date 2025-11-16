import { api } from '../utils/api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
}

export interface RegisterRequest {
  name: string;
  document: string;
  documentType: 'CPF' | 'CNPJ' | 'ID_ESTRANGEIRO';
  email: string;
  passwordHash: string;
  role: 'CHEF' | 'CLIENT';
  chefProfile?: {
    bio?: string;
    yearsOfExperience?: number;
    portfolioDescription?: string;
  };
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'CHEF' | 'CLIENT' | 'ADMIN';
  status: string;
  profilePictureUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return api.post<LoginResponse>('/auth/login', credentials);
  },

  async register(data: RegisterRequest) {
    return api.post('/user', data);
  },

  async getProfile(): Promise<User> {
    return api.get<User>('/auth/profile');
  },

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  getToken(): string | null {
    return localStorage.getItem('access_token');
  },

  setToken(token: string): void {
    localStorage.setItem('access_token', token);
  },

  getUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  setUser(user: User): void {
    localStorage.setItem('user', JSON.stringify(user));
  },
};

