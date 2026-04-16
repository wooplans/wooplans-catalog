export function generateId(): string {
  return crypto.randomUUID();
}

export function generatePIN(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function createJWT(payload: object, secret: string): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload64 = btoa(JSON.stringify({ ...payload, iat: Date.now() }));
  const encoder = new TextEncoder();
  const data = encoder.encode(`${header}.${payload64}.${secret}`);
  return `${header}.${payload64}.${btoa(String.fromCharCode(...new Uint8Array(data)))}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
