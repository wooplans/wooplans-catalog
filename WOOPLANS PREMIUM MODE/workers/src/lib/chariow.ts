import { Env } from "../types";

export async function chariowCheckout(
  env: Env,
  productId: string,
  email: string,
  firstName: string,
  lastName: string,
  phone: string,
  countryCode: string = "CM"
): Promise<{ checkoutUrl: string; saleId: string }> {
  const response = await fetch(`${env.CHARIOW_API_URL}/checkout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.CHARIOW_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_id: productId,
      email,
      first_name: firstName,
      last_name: lastName,
      phone: {
        number: phone,
        country_code: countryCode,
      },
      redirect_url: `${env.PUBLIC_URL}/merci?email=${encodeURIComponent(email)}`,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Chariow checkout failed");
  }

  const data = await response.json();

  return {
    checkoutUrl: data.data.payment.checkout_url,
    saleId: data.data.purchase?.id || "",
  };
}

export async function getChariowSale(env: Env, saleId: string) {
  const response = await fetch(`${env.CHARIOW_API_URL}/sales/${saleId}`, {
    headers: {
      Authorization: `Bearer ${env.CHARIOW_API_KEY}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch sale");
  }

  const data = await response.json();
  return data.data;
}

export async function verifyChariowWebhook(
  env: Env,
  body: string,
  signature: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = encoder.encode(env.CHARIOW_API_KEY);
  const data = encoder.encode(body);
  const hash = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  const sig = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
  return crypto.subtle.verify("HMAC", hash, sig, data);
}
