import { ServiceRequestStatus } from '../services/serviceRequest.service';

const CHAT_ENABLED_STATUSES: ServiceRequestStatus[] = [
  ServiceRequestStatus.ACCEPTED_BY_CHEF,
  ServiceRequestStatus.QUOTE_SENT,
  ServiceRequestStatus.QUOTE_ACCEPTED,
  ServiceRequestStatus.PAYMENT_PENDING,
  ServiceRequestStatus.PAYMENT_CONFIRMED,
  ServiceRequestStatus.SCHEDULED,
  ServiceRequestStatus.COMPLETED,
  ServiceRequestStatus.CANCELLED,
];

const READONLY_STATUSES: ServiceRequestStatus[] = [
  ServiceRequestStatus.COMPLETED,
  ServiceRequestStatus.CANCELLED,
];

export const isChatEnabled = (status: ServiceRequestStatus): boolean => {
  return CHAT_ENABLED_STATUSES.includes(status);
};

export const isChatReadOnly = (status: ServiceRequestStatus): boolean => {
  return READONLY_STATUSES.includes(status);
};

export const getChatStatusMessage = (status: ServiceRequestStatus): string | null => {
  if (!isChatEnabled(status)) {
    switch (status) {
      case ServiceRequestStatus.PENDING_CHEF_REVIEW:
        return 'O chat estará disponível após o chef aceitar o pedido.';
      case ServiceRequestStatus.REJECTED_BY_CHEF:
        return 'O chat não está disponível para pedidos rejeitados.';
      default:
        return 'O chat não está disponível para este status de pedido.';
    }
  }

  if (isChatReadOnly(status)) {
    switch (status) {
      case ServiceRequestStatus.COMPLETED:
        return 'O serviço foi concluído. O chat está em modo somente leitura.';
      case ServiceRequestStatus.CANCELLED:
        return 'O pedido foi cancelado. O chat está em modo somente leitura.';
      default:
        return 'O chat está em modo somente leitura.';
    }
  }

  return null;
};

