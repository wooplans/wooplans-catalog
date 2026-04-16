const API_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:8787";
const CDN_URL = import.meta.env.PUBLIC_CDN_URL || "https://wooplans.b-cdn.net";
const WHATSAPP_NUMBER = import.meta.env.PUBLIC_WHATSAPP_NUMBER || "237694327885";

export { API_URL, CDN_URL, WHATSAPP_NUMBER };

export interface Plan {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  surface: number;
  bedrooms: number;
  bathrooms: number;
  floors: number;
  thumbnail_key: string;
  distribution_key: string;
  quote_key: string;
  full_pdf_key: string;
  price: number;
  views: number;
  is_premium: number;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  is_premium: number;
  premium_expires_at: string;
}

export async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Erreur réseau" }));
    throw new Error(error.error || "Erreur serveur");
  }

  return response.json();
}

export function getImageUrl(key: string): string {
  if (!key) return "";
  if (key.startsWith("http")) return key;
  return `${CDN_URL}/${key}`;
}

export function getWhatsAppUrl(planTitle: string, planId: string): string {
  const message = encodeURIComponent(
    `Je veux commander le plan ${planTitle} (ID: ${planId})`
  );
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("fr-FR").format(price) + " FCFA";
}
