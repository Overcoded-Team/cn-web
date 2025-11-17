import { api } from "../utils/api";

export type PixKeyType = "CPF" | "CNPJ" | "EMAIL" | "PHONE" | "EVP";

export type WalletEntryType = "CREDIT" | "DEBIT";

export type ChefPayoutStatus =
  | "REQUESTED"
  | "PROCESSING"
  | "PAID"
  | "FAILED"
  | "CANCELLED";

export interface WalletBalance {
  available_cents: number;
  blocked_cents: number;
}

export interface WalletEntry {
  id: number;
  chef_profiles_id: number;
  type: WalletEntryType;
  amount_cents: number;
  balance_after_cents: number;
  description?: string;
  service_request_id?: number;
  payout_id?: number;
  created_at: string;
}

export interface PaginatedWalletEntries {
  items: WalletEntry[];
  page: number;
  limit: number;
  total: number;
}

export interface ChefPayout {
  id: number;
  chef_profiles_id: number;
  amount_cents: number;
  status: ChefPayoutStatus;
  provider: string;
  provider_payout_id?: string;
  external_id: string;
  method: string;
  pix_key: string;
  pix_key_type: PixKeyType;
  requested_at: string;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedPayouts {
  items: ChefPayout[];
  page: number;
  limit: number;
  total: number;
}

export interface RequestPayoutDTO {
  amount_cents: number;
  pix_key: string;
  pix_key_type: PixKeyType;
}

export interface ListWalletQuery {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
}

export const chefWalletService = {
  async getBalance(): Promise<WalletBalance> {
    return api.get<WalletBalance>("/chefs/wallet/balance");
  },

  async listEntries(
    query: ListWalletQuery = {}
  ): Promise<PaginatedWalletEntries> {
    const params = new URLSearchParams();
    if (query.page) params.append("page", query.page.toString());
    if (query.limit) params.append("limit", query.limit.toString());
    if (query.from) params.append("from", query.from);
    if (query.to) params.append("to", query.to);

    const queryString = params.toString();
    return api.get<PaginatedWalletEntries>(
      `/chefs/wallet/entries${queryString ? `?${queryString}` : ""}`
    );
  },

  async listPayouts(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedPayouts> {
    return api.get<PaginatedPayouts>(
      `/chefs/wallet/payouts?page=${page}&limit=${limit}`
    );
  },

  async requestPayout(data: RequestPayoutDTO): Promise<ChefPayout> {
    return api.post<ChefPayout>("/chefs/wallet/payouts", data);
  },
};

