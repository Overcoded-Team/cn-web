import { api } from "../utils/api";

export enum ServiceRequestStatus {
  PENDING_CHEF_REVIEW = "PENDING_CHEF_REVIEW",
  REJECTED_BY_CHEF = "REJECTED_BY_CHEF",
  ACCEPTED_BY_CHEF = "ACCEPTED_BY_CHEF",
  QUOTE_SENT = "QUOTE_SENT",
  QUOTE_ACCEPTED = "QUOTE_ACCEPTED",
  PAYMENT_PENDING = "PAYMENT_PENDING",
  PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED",
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum PaymentStatus {
  CREATED = "CREATED",
  PENDING = "PENDING",
  PAID = "PAID",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export interface ServiceQuote {
  id: number;
  service_request_id: number;
  chef_profiles_id: number;
  amount_cents: number;
  total_cents: number;
  platform_fee_cents: number;
  currency: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Payment {
  id: number;
  service_request_id: number;
  service_quote_id: number;
  provider: string;
  provider_charge_id: string;
  amount_cents: number;
  currency: string;
  status: PaymentStatus;
  method: string;
  platform_fee_cents: number;
  brcode: string;
  brcode_base64: string;
  expires_at: Date;
  paid_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface ServiceRequest {
  id: number;
  client_profiles_id: number;
  chef_profiles_id: number;
  service_type: string;
  location: string;
  description?: string;
  requested_date: Date;
  expected_duration_minutes?: number;
  status: ServiceRequestStatus;
  quote?: ServiceQuote;
  client_profile?: {
    id: number;
    user?: {
      id: number;
      name: string;
      email: string;
      profilePictureUrl?: string;
    };
  };
  created_at: Date;
  updated_at: Date;
}

export interface PaginatedServiceRequestsResponse {
  items: ServiceRequest[];
  page: number;
  limit: number;
  total: number;
}

export interface CreateServiceRequestDTO {
  chef_profiles_id: number;
  service_type: string;
  location: string;
  description?: string;
  requested_date: string;
  expected_duration_minutes?: number;
}

export interface UpdateServiceRequestDTO {
  service_type?: string;
  location?: string;
  description?: string;
  requested_date?: string;
  expected_duration_minutes?: number;
}

export interface CreateQuoteDTO {
  amount_cents: number;
  notes?: string;
}

export interface AcceptQuoteResponse {
  request_id: number;
  quote_id: number;
  payment: {
    brcode: string;
    brcode_base64: string;
    expires_at: string;
    amount_cents: number;
  };
}

export const serviceRequestService = {
  async createServiceRequest(
    data: CreateServiceRequestDTO
  ): Promise<ServiceRequest> {
    return api.post<ServiceRequest>("/service-requests", data);
  },

  async listMyServiceRequests(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedServiceRequestsResponse> {
    return api.get<PaginatedServiceRequestsResponse>(
      `/service-requests/me?page=${page}&limit=${limit}`
    );
  },

  async listChefServiceRequests(
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedServiceRequestsResponse> {
    return api.get<PaginatedServiceRequestsResponse>(
      `/service-requests/chef/me?page=${page}&limit=${limit}`
    );
  },

  async updateServiceRequest(
    requestId: number,
    data: UpdateServiceRequestDTO
  ): Promise<ServiceRequest> {
    return api.patch<ServiceRequest>(`/service-requests/${requestId}`, data);
  },

  async acceptRequest(requestId: number): Promise<ServiceRequest> {
    return api.patch<ServiceRequest>(
      `/service-requests/${requestId}/accept`,
      {}
    );
  },

  async rejectRequest(requestId: number): Promise<ServiceRequest> {
    return api.patch<ServiceRequest>(
      `/service-requests/${requestId}/reject`,
      {}
    );
  },

  async sendQuote(
    requestId: number,
    data: CreateQuoteDTO
  ): Promise<ServiceQuote> {
    return api.post<ServiceQuote>(`/service-requests/${requestId}/quote`, data);
  },

  async acceptQuote(requestId: number): Promise<AcceptQuoteResponse> {
    return api.patch<AcceptQuoteResponse>(
      `/service-requests/${requestId}/quote/accept`
    );
  },

  async rejectQuote(requestId: number): Promise<ServiceRequest> {
    return api.patch<ServiceRequest>(
      `/service-requests/${requestId}/quote/reject`
    );
  },

  async completeService(requestId: number): Promise<ServiceRequest> {
    return api.patch<ServiceRequest>(`/service-requests/${requestId}/complete`);
  },

  async simulatePayment(chargeId: string): Promise<any> {
    return api.post("/abacatepay/dev/simulate-payment", {
      charge_id: chargeId,
    });
  },
};
