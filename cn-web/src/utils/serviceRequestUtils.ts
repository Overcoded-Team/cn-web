import { ServiceRequestStatus } from "../services/serviceRequest.service";

/**
 * Retorna o label de status formatado para exibição
 */
export function getStatusLabel(status: ServiceRequestStatus | string | null | undefined): string {
  if (!status) return "—";

  const labels: Record<string, string> = {
    [ServiceRequestStatus.PENDING_CHEF_REVIEW]: "Pendente",
    [ServiceRequestStatus.REJECTED_BY_CHEF]: "Recusado pelo chef",
    [ServiceRequestStatus.ACCEPTED_BY_CHEF]: "Aceito",
    [ServiceRequestStatus.QUOTE_SENT]: "Orçamento enviado",
    [ServiceRequestStatus.QUOTE_ACCEPTED]: "Orçamento aceito",
    [ServiceRequestStatus.PAYMENT_PENDING]: "Pagamento pendente",
    [ServiceRequestStatus.PAYMENT_CONFIRMED]: "Pagamento confirmado",
    [ServiceRequestStatus.SCHEDULED]: "Agendado",
    [ServiceRequestStatus.COMPLETED]: "Concluído",
    [ServiceRequestStatus.CANCELLED]: "Cancelado",
  };

  return labels[status] || status;
}

/**
 * Retorna a cor CSS para um status
 */
export function getStatusColor(status: ServiceRequestStatus | string | null | undefined): string {
  if (!status) return "#757575";

  const colorMap: Record<string, string> = {
    [ServiceRequestStatus.PENDING_CHEF_REVIEW]: "#FFB300",
    [ServiceRequestStatus.REJECTED_BY_CHEF]: "#F44336",
    [ServiceRequestStatus.ACCEPTED_BY_CHEF]: "#4CAF50",
    [ServiceRequestStatus.QUOTE_SENT]: "#2196F3",
    [ServiceRequestStatus.QUOTE_ACCEPTED]: "#4CAF50",
    [ServiceRequestStatus.PAYMENT_PENDING]: "#FF9800",
    [ServiceRequestStatus.PAYMENT_CONFIRMED]: "#4CAF50",
    [ServiceRequestStatus.SCHEDULED]: "#2196F3",
    [ServiceRequestStatus.COMPLETED]: "#4CAF50",
    [ServiceRequestStatus.CANCELLED]: "#757575",
  };

  return colorMap[status] || "#757575";
}

/**
 * Verifica se um status indica que o serviço está concluído
 */
export function isCompletedStatus(status: ServiceRequestStatus | string | null | undefined): boolean {
  return status === ServiceRequestStatus.COMPLETED;
}

/**
 * Verifica se um status indica que o serviço está cancelado
 */
export function isCancelledStatus(status: ServiceRequestStatus | string | null | undefined): boolean {
  return (
    status === ServiceRequestStatus.CANCELLED ||
    status === ServiceRequestStatus.REJECTED_BY_CHEF
  );
}

/**
 * Verifica se um status indica que o serviço está pendente
 */
export function isPendingStatus(status: ServiceRequestStatus | string | null | undefined): boolean {
  return (
    status === ServiceRequestStatus.PENDING_CHEF_REVIEW ||
    status === ServiceRequestStatus.ACCEPTED_BY_CHEF ||
    status === ServiceRequestStatus.QUOTE_SENT ||
    status === ServiceRequestStatus.QUOTE_ACCEPTED ||
    status === ServiceRequestStatus.PAYMENT_PENDING
  );
}

