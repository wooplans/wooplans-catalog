import { Env } from "../types";

export async function uploadToBunny(
  env: Env,
  file: File,
  path: string
): Promise<string> {
  const uploadUrl = `https://storage.bunnycdn.com/${env.BUNNYCDN_STORAGE_ZONE}/${path}`;

  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: env.BUNNYCDN_API_KEY,
      "Content-Type": "application/octet-stream",
    },
    body: await file.arrayBuffer(),
  });

  if (!response.ok) {
    throw new Error(`BunnyCDN upload failed: ${response.status}`);
  }

  return `${env.BUNNYCDN_BASE_URL}/${path}`;
}

export function getBunnyPublicUrl(env: Env, path: string): string {
  return `${env.BUNNYCDN_BASE_URL}/${path}`;
}

export async function deleteFromBunny(env: Env, path: string): Promise<boolean> {
  const deleteUrl = `https://storage.bunnycdn.com/${env.BUNNYCDN_STORAGE_ZONE}/${path}`;

  const response = await fetch(deleteUrl, {
    method: "DELETE",
    headers: {
      AccessKey: env.BUNNYCDN_API_KEY,
    },
  });

  return response.ok;
}

export function generateSignedUrl(
  env: Env,
  path: string,
  expiresIn: number = 3600
): string {
  const expiry = Math.floor(Date.now() / 1000) + expiresIn;
  const tokenSource = `${env.BUNNYCDN_BASE_URL}/${path}${expiry}${env.BUNNYCDN_API_KEY}`;

  return `${env.BUNNYCDN_PRIVATE_URL}/${path}?token=${tokenSource}&expires=${expiry}`;
}
