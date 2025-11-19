const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://api.chefnow.cloud";

export const api = {
  baseURL: API_BASE_URL,

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem("access_token");

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: "Erro na requisição",
          statusCode: response.status,
        }));

        let errorMessage = Array.isArray(errorData.message)
          ? errorData.message.join(", ")
          : errorData.message || `Erro: ${response.status}`;

        const errorLower = errorMessage.toLowerCase();
        
        if (errorLower.includes("name is required")) errorMessage = "O nome é obrigatório";
        else if (errorLower.includes("name can only have 100 characters")) errorMessage = "O nome pode ter no máximo 100 caracteres";
        else if (errorLower.includes("name must have at least 3 characters")) errorMessage = "O nome deve ter pelo menos 3 caracteres";
        else if (errorLower.includes("document is required")) errorMessage = "O documento é obrigatório";
        else if (errorLower.includes("document can have at most 40 characters")) errorMessage = "O documento pode ter no máximo 40 caracteres";
        else if (errorLower.includes("document must have at least 5 characters")) errorMessage = "O documento deve ter pelo menos 5 caracteres";
        else if (errorLower.includes("document must be a valid")) errorMessage = "O documento deve ser um CPF, CNPJ ou ID estrangeiro válido";
        else if (errorLower.includes("documenttype must be")) errorMessage = "O tipo de documento deve ser CPF, CNPJ ou ID_ESTRANGEIRO";
        else if (errorLower.includes("invalid email format")) errorMessage = "Formato de e-mail inválido";
        else if (errorLower.includes("email is required")) errorMessage = "O e-mail é obrigatório";
        else if (errorLower.includes("email can only have 150")) errorMessage = "O e-mail pode ter no máximo 150 caracteres";
        else if (errorLower.includes("email must be at least 3")) errorMessage = "O e-mail deve ter pelo menos 3 caracteres";
        else if (errorLower.includes("role must be")) errorMessage = "O tipo de usuário deve ser CHEF ou CLIENT";
        else if (errorLower.includes("password is required")) errorMessage = "A senha é obrigatória";
        else if (errorLower.includes("password can only have 255")) errorMessage = "A senha pode ter no máximo 255 caracteres";
        else if (errorLower.includes("password must be at least 7")) errorMessage = "A senha deve ter pelo menos 7 caracteres";
        else if (errorLower.includes("you do not have permission")) errorMessage = "Você não tem permissão para realizar esta ação";
        else if (errorLower.includes("invalid credentials")) errorMessage = "Credenciais inválidas";
        else if (errorLower.includes("email already exists")) errorMessage = "Este e-mail já está cadastrado";
        else if (errorLower.includes("user not found")) errorMessage = "Usuário não encontrado";
        else if (errorLower.includes("file too large") || errorLower.includes("file size exceeds")) errorMessage = "Arquivo muito grande. Verifique o tamanho máximo permitido.";
        else if (errorLower.includes("invalid file type") || errorLower.includes("file type not allowed")) errorMessage = "Tipo de arquivo inválido. Verifique os formatos permitidos.";
        else if (errorLower.includes("upload failed")) errorMessage = "Falha no upload do arquivo. Tente novamente.";
        else if (errorLower.includes("unauthorized")) errorMessage = "Não autorizado";
        else if (errorLower.includes("forbidden")) errorMessage = "Acesso negado";
        else if (errorLower.includes("not found")) errorMessage = "Não encontrado";
        else if (errorLower.includes("internal server error")) errorMessage = "Erro interno do servidor";
        else if (errorLower.includes("bad request")) errorMessage = "Requisição inválida";

        throw new Error(errorMessage);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        return undefined as T;
      }

      const text = await response.text();
      if (!text) {
        return undefined as T;
      }

      return JSON.parse(text) as T;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Erro desconhecido na requisição");
    }
  },

  get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  },

  post<T>(endpoint: string, data?: unknown, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  patch<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  },

  delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  },
};
