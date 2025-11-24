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

    const token = localStorage.getItem("access_token");
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || "https://api.chefnow.cloud";

    const response = await fetch(`${API_BASE_URL}/user/profile/picture`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Erro ao fazer upload da foto",
        statusCode: response.status,
      }));

      let errorMessage = Array.isArray(errorData.message)
        ? errorData.message.join(", ")
        : errorData.message || `Erro: ${response.status}`;

      const errorLower = errorMessage.toLowerCase();

      if (
        errorLower.includes("file too large") ||
        errorLower.includes("file size exceeds")
      ) {
        errorMessage =
          "Arquivo muito grande. O tamanho máximo permitido é 50MB para fotos.";
      } else if (
        errorLower.includes("invalid file type") ||
        errorLower.includes("file type not allowed")
      ) {
        errorMessage =
          "Tipo de arquivo inválido. Use apenas imagens (JPEG, PNG, WebP ou AVIF).";
      } else if (errorLower.includes("upload failed")) {
        errorMessage = "Falha no upload da foto. Tente novamente.";
      }

      throw new Error(errorMessage);
    }

    return response.json();
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

    const token = localStorage.getItem("access_token");
    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || "https://api.chefnow.cloud";

    const response = await fetch(`${API_BASE_URL}/chefs/my-gallery`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        message: "Erro ao fazer upload da foto",
        statusCode: response.status,
      }));

      let errorMessage = Array.isArray(errorData.message)
        ? errorData.message.join(", ")
        : errorData.message || `Erro: ${response.status}`;

      const errorLower = errorMessage.toLowerCase();

      if (
        errorLower.includes("file too large") ||
        errorLower.includes("file size exceeds")
      ) {
        errorMessage =
          "Arquivo muito grande. O tamanho máximo permitido é 50MB para fotos.";
      } else if (
        errorLower.includes("invalid file type") ||
        errorLower.includes("file type not allowed")
      ) {
        errorMessage =
          "Tipo de arquivo inválido. Use apenas imagens (JPEG, PNG, WebP ou AVIF).";
      } else if (errorLower.includes("upload failed")) {
        errorMessage = "Falha no upload da foto. Tente novamente.";
      }

      throw new Error(errorMessage);
    }

    return response.json();
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

    const token = localStorage.getItem("access_token");
    if (!token) {
      throw new Error("Você precisa estar autenticado para fazer upload do cardápio.");
    }

    const API_BASE_URL =
      import.meta.env.VITE_API_BASE_URL || "https://api.chefnow.cloud";

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutos de timeout

    try {
      const response = await fetch(`${API_BASE_URL}/chefs/my-menu`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
        signal: controller.signal,
      }).catch((fetchError) => {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          throw new Error("Tempo de espera excedido. O arquivo pode ser muito grande ou o servidor está lento.");
        }
        if (fetchError instanceof TypeError && fetchError.message.includes('fetch')) {
          throw new Error("Erro de conexão. Verifique se o servidor está acessível e tente novamente.");
        }
        throw fetchError;
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          const textError = await response.text();
          errorData = {
            message: textError || `Erro ${response.status}: ${response.statusText}`,
            statusCode: response.status,
          };
        }

        let errorMessage = Array.isArray(errorData.message)
          ? errorData.message.join(", ")
          : errorData.message || `Erro: ${response.status}`;

        const errorLower = errorMessage.toLowerCase();

        if (response.status === 401 || response.status === 403) {
          errorMessage = "Você não tem permissão para fazer upload do cardápio. Faça login novamente.";
        } else if (response.status === 404) {
          errorMessage = "Perfil de chef não encontrado. Verifique se você está cadastrado como chef.";
        } else if (
          errorLower.includes("file too large") ||
          errorLower.includes("file size exceeds") ||
          response.status === 413
        ) {
          errorMessage =
            "Arquivo muito grande. O tamanho máximo permitido é 20MB para cardápios.";
        } else if (
          errorLower.includes("invalid file type") ||
          errorLower.includes("file type not allowed") ||
          errorLower.includes("only pdf") ||
          errorLower.includes("only doc")
        ) {
          errorMessage = "Tipo de arquivo inválido. Use apenas PDF ou DOCX.";
        } else if (errorLower.includes("file is required")) {
          errorMessage = "Nenhum arquivo foi selecionado.";
        } else if (errorLower.includes("upload failed") || response.status >= 500) {
          errorMessage = "Falha no upload do cardápio. Tente novamente mais tarde.";
        }

        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      
      if (err instanceof Error && err.name === "AbortError") {
        throw new Error("O upload demorou muito tempo. Verifique sua conexão e tente novamente com um arquivo menor.");
      }
      
      if (err instanceof TypeError && (err.message.includes("fetch") || err.message.includes("Failed to fetch"))) {
        throw new Error("Erro de conexão. Verifique sua internet e se o servidor está acessível.");
      }
      
      if (err instanceof Error && (err.message.includes("NetworkError") || err.message.includes("network"))) {
        throw new Error("Erro de rede. Verifique sua conexão com a internet.");
      }
      
      throw err;
    }
  },

  async deleteMenu(): Promise<void> {
    try {
      await api.delete<{ success: boolean }>("/chefs/my-menu");
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("404") || error.message.includes("Não encontrado") || error.message.includes("Menu not found")) {
          throw new Error("Cardápio não encontrado ou já foi removido.");
        }
      }
      throw error;
    }
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
