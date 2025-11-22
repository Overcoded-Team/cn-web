import { api } from "../utils/api";

export interface UserAddress {
  id: number;
  address: string;
  addressNumber: number;
  district: string;
  uf: string;
  cepCode: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserAddressDTO {
  address: string;
  addressNumber: number;
  district: string;
  uf: string;
  cepCode: string;
}

export interface UpdateUserAddressDTO {
  address?: string;
  addressNumber?: number;
  district?: string;
  uf?: string;
  cepCode?: string;
}

export const userAddressService = {
  async listAddresses(): Promise<UserAddress[]> {
    return api.get<UserAddress[]>("/user/addresses/list");
  },

  async getAddressById(id: number): Promise<UserAddress> {
    return api.get<UserAddress>(`/user/addresses/${id}`);
  },

  async createAddress(data: CreateUserAddressDTO): Promise<UserAddress> {
    return api.post<UserAddress>("/user/addresses", data);
  },

  async updateAddress(
    id: number,
    data: UpdateUserAddressDTO
  ): Promise<UserAddress> {
    return api.patch<UserAddress>(`/user/addresses/${id}`, data);
  },

  async togglePrimaryAddress(id: number): Promise<UserAddress> {
    return api.put<UserAddress>(`/user/addresses/${id}/toggle-primary`);
  },

  async deleteAddress(id: number): Promise<void> {
    return api.delete(`/user/addresses/${id}`);
  },
};

