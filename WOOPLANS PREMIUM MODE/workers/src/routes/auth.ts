import { Hono } from "hono";
import { Env } from "../types";
import { generateId, generatePIN } from "../lib/utils";
import { sendEmail, buildPremiumWelcomeEmail } from "../lib/email";

export const authRoutes = new Hono<{ Bindings: Env }>();

authRoutes.post("/login", async (c) => {
  const { email, pin_code } = await c.req.json();

  if (!email || !pin_code) {
    return c.json({ error: "Email et PIN requis" }, 400);
  }

  const user = await c.env.DB.prepare(
    "SELECT id, email, name, pin_code, is_premium, premium_expires_at FROM users WHERE email = ? AND pin_code = ?"
  )
    .bind(email, pin_code)
    .first();

  if (!user) {
    return c.json({ error: "Email ou PIN incorrect" }, 401);
  }

  const isExpired =
    user.premium_expires_at &&
    new Date(user.premium_expires_at as string) < new Date();

  if (isExpired) {
    await c.env.DB.prepare(
      "UPDATE users SET is_premium = 0, updated_at = datetime('now') WHERE id = ?"
    )
      .bind(user.id as string)
      .run();
    user.is_premium = 0;
  }

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      is_premium: isExpired ? 0 : user.is_premium,
      premium_expires_at: user.premium_expires_at,
    },
  });
});

authRoutes.post("/verify", async (c) => {
  const { email, pin_code } = await c.req.json();

  if (!email || !pin_code) {
    return c.json({ error: "Email et PIN requis" }, 400);
  }

  const user = await c.env.DB.prepare(
    "SELECT id, is_premium, premium_expires_at FROM users WHERE email = ? AND pin_code = ?"
  )
    .bind(email, pin_code)
    .first();

  if (!user) {
    return c.json({ valid: false }, 200);
  }

  const isExpired =
    user.premium_expires_at &&
    new Date(user.premium_expires_at as string) < new Date();

  return c.json({
    valid: true,
    is_premium: isExpired ? 0 : user.is_premium,
    premium_expires_at: user.premium_expires_at,
  });
});

authRoutes.get("/me", async (c) => {
  const email = c.req.header("X-User-Email");
  const pin = c.req.header("X-User-PIN");

  if (!email || !pin) {
    return c.json({ error: "Non autorisé" }, 401);
  }

  const user = await c.env.DB.prepare(
    "SELECT id, email, name, phone, is_premium, premium_expires_at, created_at FROM users WHERE email = ? AND pin_code = ?"
  )
    .bind(email, pin)
    .first();

  if (!user) {
    return c.json({ error: "Non autorisé" }, 401);
  }

  return c.json({ user });
});
