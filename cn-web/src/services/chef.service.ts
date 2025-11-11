import { api } from '../utils/api';

export interface ChefCuisine {
  id: number;
  name: string;
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
  sortBy?: 'avgRating' | 'yearsOfExperience' | 'createdAt';
  sortDir?: 'ASC' | 'DESC';
}

export interface Cuisine {
  id: number;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const chefService = {
  async listChefs(params: ListChefsParams = {}): Promise<PaginatedChefsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.cuisineId) queryParams.append('cuisineId', params.cuisineId.toString());
    if (params.available !== undefined) queryParams.append('available', params.available.toString());
    if (params.minRating !== undefined) queryParams.append('minRating', params.minRating.toString());
    if (params.minExp !== undefined) queryParams.append('minExp', params.minExp.toString());
    if (params.maxExp !== undefined) queryParams.append('maxExp', params.maxExp.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortDir) queryParams.append('sortDir', params.sortDir);

    const queryString = queryParams.toString();
    const endpoint = `/chefs${queryString ? `?${queryString}` : ''}`;
    
    return api.get<PaginatedChefsResponse>(endpoint);
  },

  async listCuisines(page: number = 1, limit: number = 100): Promise<Cuisine[]> {
    return api.get<Cuisine[]>(`/cuisine/list?page=${page}&limit=${limit}`);
  },
};

