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

export interface ChefReview {
  id: number;
  rating: number;
  comment?: string;
  createdAt: Date;
  client?: {
    id: number;
    name?: string;
    profilePictureUrl?: string;
  };
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
  profilePictureUrl?: string;
  reviews?: ChefReview[];
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

export interface ChefGalleryPhoto {
  id: number;
  chefProfilesId: number;
  objectKey: string;
  url: string;
  caption?: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
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

  async addSocialLink(data: {
    type: ChefSocialType;
    url: string;
  }): Promise<ChefSocialLink> {
    return api.post<ChefSocialLink>("/chefs/socials", data);
  },

  async updateSocialLink(
    type: ChefSocialType,
    data: { url: string }
  ): Promise<ChefSocialLink> {
    return api.patch<ChefSocialLink>(`/chefs/socials/${type}`, data);
  },

  async deleteSocialLink(type: ChefSocialType): Promise<void> {
    return api.delete(`/chefs/socials/${type}`);
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
    const { isAvailable, ...chefProfileData } = data;

    const updateData: any = {
      chefProfile: chefProfileData,
    };

    const response = await api.patch<any>("/user/profile", updateData);

    if (isAvailable !== undefined) {
      const currentProfile = await this.getMyProfile();
      if (currentProfile.isAvailable !== isAvailable) {
        await this.toggleAvailability();
        return await this.getMyProfile();
      }
    }

    return response.chefProfile || response;
  },

  async toggleAvailability(): Promise<{ isAvailable: boolean }> {
    return api.patch<{ isAvailable: boolean }>(
      "/chefs/my-profile/availability",
      {}
    );
  },

  async addCuisine(cuisineId: number): Promise<void> {
    return api.post("/chefs/cuisines", { cuisineId });
  },

  async removeCuisine(cuisineId: number): Promise<void> {
    return api.delete(`/chefs/cuisines/${cuisineId}`);
  },

  async uploadProfilePicture(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);

    return api.patch<{ url: string }>("/user/profile/picture", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  async getMyGallery(): Promise<ChefGalleryPhoto[]> {
    return api.get<ChefGalleryPhoto[]>("/chefs/my-gallery");
  },

  async addGalleryPhoto(
    file: File,
    caption?: string,
    position?: number
  ): Promise<ChefGalleryPhoto> {
    const formData = new FormData();
    formData.append("file", file);
    if (caption) {
      formData.append("caption", caption);
    }
    if (position) {
      formData.append("position", position.toString());
    }

    return api.post<ChefGalleryPhoto>("/chefs/my-gallery", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  async deleteGalleryPhoto(photoId: number): Promise<void> {
    await api.delete<void>(`/chefs/my-gallery/${photoId}`);
  },

  async getMyReviews(
    page: number = 1,
    limit: number = 10
  ): Promise<{
    items: ChefReview[];
    page: number;
    limit: number;
    total: number;
  }> {
    return api.get<{
      items: ChefReview[];
      page: number;
      limit: number;
      total: number;
    }>(`/chefs/my-reviews?page=${page}&limit=${limit}`);
  },

  async getChefReviews(
    chefId: number,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    items: ChefReview[];
    page: number;
    limit: number;
    total: number;
  }> {
    return api.get<{
      items: ChefReview[];
      page: number;
      limit: number;
      total: number;
    }>(`/chefs/${chefId}/reviews?page=${page}&limit=${limit}`);
  },

  async uploadMenu(
    file: File
  ): Promise<{
    url: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
  }> {
    const formData = new FormData();
    formData.append("file", file);

    return api.post<{
      url: string;
      originalName: string;
      mimeType: string;
      sizeBytes: number;
    }>("/chefs/my-menu", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 120000,
    });
  },

  async deleteMenu(): Promise<void> {
    return api.delete<void>("/chefs/my-menu");
  },

  async getMySalesGoal(month?: string): Promise<{
    goal_month: string;
    amount_cents: number;
    sold_amount_cents: number;
    progress_percentage: number;
    goal_set: boolean;
  }> {
    const queryParams = month ? `?month=${month}` : "";
    return api.get<{
      goal_month: string;
      amount_cents: number;
      sold_amount_cents: number;
      progress_percentage: number;
      goal_set: boolean;
    }>(`/chefs/my-sales-goal${queryParams}`);
  },

  async setMySalesGoal(data: {
    amount_cents: number;
    goalMonth?: string;
  }): Promise<{
    goal_month: string;
    amount_cents: number;
    sold_amount_cents: number;
    progress_percentage: number;
    goal_set: boolean;
  }> {
    return api.post<{
      goal_month: string;
      amount_cents: number;
      sold_amount_cents: number;
      progress_percentage: number;
      goal_set: boolean;
    }>("/chefs/my-sales-goal", data);
  },
};
