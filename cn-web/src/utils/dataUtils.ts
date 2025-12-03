/**
 * Utilitários para manipulação e formatação de dados
 */

/**
 * Extrai um array de uma resposta da API que pode estar em diferentes formatos
 */
export function extractArrayFromResponse<T>(data: any): T[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

/**
 * Formata um valor em centavos para reais (BRL)
 */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

/**
 * Formata uma data para o formato brasileiro
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("pt-BR");
}

/**
 * Formata uma data e hora para o formato brasileiro
 */
export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("pt-BR");
}

/**
 * Calcula a média e contagem de avaliações
 */
export function calculateRating(reviews: Array<{ rating?: number; stars?: number }>): {
  avg: number;
  count: number;
} {
  if (!reviews || reviews.length === 0) return { avg: 0, count: 0 };

  const ratings = reviews
    .map((r) => Number(r.rating ?? r.stars ?? 0))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (ratings.length === 0) return { avg: 0, count: 0 };

  const sum = ratings.reduce((acc, n) => acc + n, 0);
  const avgRaw = sum / ratings.length;
  const avg = avgRaw > 5 ? avgRaw / 2 : avgRaw;

  return { avg, count: ratings.length };
}

/**
 * Normaliza uma URL adicionando https:// se necessário
 */
export function normalizeUrl(url: string): string {
  if (!url) return "";
  let fullUrl = url.trim();
  if (!fullUrl.startsWith("http://") && !fullUrl.startsWith("https://")) {
    fullUrl = `https://${fullUrl}`;
  }
  return fullUrl;
}

/**
 * Formata um endereço completo
 */
export function formatAddress(address: {
  address?: string;
  addressNumber?: string | number;
  district?: string;
  uf?: string;
  cepCode?: string;
}): string {
  if (!address) return "";

  const parts: string[] = [];
  if (address.address) {
    let line = address.address;
    if (address.addressNumber) {
      line += `, ${address.addressNumber}`;
    }
    parts.push(line);
  }

  const midParts: string[] = [];
  if (address.district) midParts.push(address.district);
  if (address.uf) midParts.push(address.uf);
  if (midParts.length) {
    parts.push(midParts.join(" - "));
  }

  if (address.cepCode) {
    parts.push(`CEP ${address.cepCode}`);
  }

  return parts.join(" • ");
}

/**
 * Calcula porcentagem de forma segura
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

