import { api } from "../utils/api";

export interface ChefCuisine {
  id: number;
  name: string;
}

export type ChefSocialType =
  | "INSTAGRAM"
  | "YOUTUBE"
  | "TIKTOK"
  | "FACEBOOK"
  | "WHATSAPP";

export interface ChefSocialLink {
  type: ChefSocialType;
  url: string;
}

export interface Chef {
  id: number;
  userId: number;
  name: string;
  avgRating: number;
  isAvailable: boolean;
  yearsOfExperience: number;
  bio?: string;
  cuisines: ChefCuisine[];
  socialLinks?: ChefSocialLink[];
}

export interface PaginatedChefsResponse {
  items: Chef[];
  page: number;
  limit: number;
  total: number;
}

export interface ListChefsParams {
  page?: number;
  limit?: number;
  cuisineId?: number;
  available?: boolean;
  minRating?: number;
  minExp?: number;
  maxExp?: number;
  sortBy?: "avgRating" | "yearsOfExperience" | "createdAt";
  sortDir?: "ASC" | "DESC";
}

export interface Cuisine {
  id: number;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChefProfile {
  id: number;
  bio?: string;
  yearsOfExperience?: number;
  portfolioDescription?: string;
  avgRating: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
  socialLinks?: ChefSocialLink[];
}

export const chefService = {
  async listChefs(
    params: ListChefsParams = {}
  ): Promise<PaginatedChefsResponse> {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append("page", params.page.toString());
    if (params.limit) queryParams.append("limit", params.limit.toString());
    if (params.cuisineId)
      queryParams.append("cuisineId", params.cuisineId.toString());
    if (params.available !== undefined)
      queryParams.append("available", params.available.toString());
    if (params.minRating !== undefined)
      queryParams.append("minRating", params.minRating.toString());
    if (params.minExp !== undefined)
      queryParams.append("minExp", params.minExp.toString());
    if (params.maxExp !== undefined)
      queryParams.append("maxExp", params.maxExp.toString());
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortDir) queryParams.append("sortDir", params.sortDir);

    const queryString = queryParams.toString();
    const endpoint = `/chefs${queryString ? `?${queryString}` : ""}`;

    return api.get<PaginatedChefsResponse>(endpoint);
  },

  async listCuisines(
    page: number = 1,
    limit: number = 100
  ): Promise<Cuisine[]> {
    return api.get<Cuisine[]>(`/cuisine/list?page=${page}&limit=${limit}`);
  },

  async getMyProfile(): Promise<ChefProfile> {
    return api.get<ChefProfile>("/chefs/my-profile");
  },

  async getMySocialLinks(): Promise<ChefSocialLink[]> {
    return api.get<ChefSocialLink[]>("/chefs/my-socials");
  },

  async getMyCuisines(): Promise<ChefCuisine[]> {
    return api.get<ChefCuisine[]>("/chefs/my-cuisines");
  },

  async updateMyProfile(data: { 
    bio?: string; 
    portfolioDescription?: string;
    yearsOfExperience?: number;
    isAvailable?: boolean;
  }): Promise<ChefProfile> {
    return api.patch<ChefProfile>("/chefs/my-profile", data);
  },

  async toggleAvailability(): Promise<{ isAvailable: boolean }> {
    return api.patch<{ isAvailable: boolean }>("/chefs/my-profile/availability", {});
  },

  async addCuisine(cuisineId: number): Promise<void> {
    return api.post("/chefs/cuisines", { cuisineId });
  },

  async removeCuisine(cuisineId: number): Promise<void> {
    return api.delete(`/chefs/cuisines/${cuisineId}`);
  },

  async uploadProfilePicture(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('access_token');
    const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000';

    const response = await fetch(`${API_BASE_URL}/user/profile/picture`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: 'Erro ao fazer upload da foto',
        statusCode: response.status 
      }));
      
      const errorMessage = Array.isArray(errorData.message) 
        ? errorData.message.join(', ')
        : errorData.message || `Erro: ${response.status}`;
      
      throw new Error(errorMessage);
    }

    return response.json();
  },
};
