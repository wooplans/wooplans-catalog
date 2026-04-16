import { Hono } from "hono";
import { Env } from "../types";
import { generateId, generatePIN } from "../lib/utils";
import { sendEmail, buildPremiumWelcomeEmail, buildRenewalEmail } from "../lib/email";

export const webhookRoutes = new Hono<{ Bindings: Env }>();

webhookRoutes.post("/chariow", async (c) => {
  const body = await c.req.text();
  const signature = c.req.header("X-Chariow-Signature") || "";

  let event: any;
  try {
    event = JSON.parse(body);
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  const eventType = event.event || event.type;
  const saleData = event.data || event;

  if (eventType !== "sale.completed" && saleData.status !== "completed") {
    return c.json({ received: true, ignored: true });
  }

  const customerEmail = saleData.customer?.email || saleData.email;
  const customerName =
    `${saleData.customer?.first_name || saleData.first_name || ""} ${saleData.customer?.last_name || saleData.last_name || ""}`.trim();
  const customerPhone =
    saleData.customer?.phone || saleData.phone || "";
  const chariowCustomerId =
    saleData.customer?.id || saleData.customer_id || "";

  if (!customerEmail) {
    return c.json({ error: "No customer email" }, 400);
  }

  const existingUser = await c.env.DB.prepare(
    "SELECT id, pin_code, name FROM users WHERE email = ?"
  )
    .bind(customerEmail)
    .first();

  if (existingUser) {
    const currentExpiry = existingUser.premium_expires_at
      ? new Date(existingUser.premium_expires_at as string)
      : new Date();
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    const newExpiry = new Date(baseDate);
    newExpiry.setFullYear(newExpiry.getFullYear() + 1);

    await c.env.DB.prepare(
      "UPDATE users SET is_premium = 1, premium_expires_at = ?, updated_at = datetime('now') WHERE id = ?"
    )
      .bind(newExpiry.toISOString(), existingUser.id as string)
      .run();

    const loginUrl = `${c.env.PUBLIC_URL}/login?email=${encodeURIComponent(customerEmail)}`;
    await sendEmail(
      c.env,
      {
        to: customerEmail,
        subject: "WOOPLANS - Renouvellement Premium confirmé",
        html: buildRenewalEmail(
          existingUser.name as string,
          newExpiry.toLocaleDateString("fr-FR"),
          loginUrl
        ),
      }
    );

    return c.json({ received: true, action: "renewed" });
  }

  let pin = generatePIN();
  let pinExists = true;
  while (pinExists) {
    const check = await c.env.DB.prepare(
      "SELECT id FROM users WHERE pin_code = ?"
    )
      .bind(pin)
      .first();
    if (!check) {
      pinExists = false;
    } else {
      pin = generatePIN();
    }
  }

  const userId = generateId();
  const expiryDate = new Date();
  expiryDate.setFullYear(expiryDate.getFullYear() + 1);

  await c.env.DB.prepare(
    "INSERT INTO users (id, email, name, phone, pin_code, is_premium, premium_expires_at, chariow_customer_id) VALUES (?, ?, ?, ?, ?, 1, ?, ?)"
  )
    .bind(
      userId,
      customerEmail,
      customerName,
      customerPhone,
      pin,
      expiryDate.toISOString(),
      chariowCustomerId
    )
    .run();

  const loginUrl = `${c.env.PUBLIC_URL}/login?email=${encodeURIComponent(customerEmail)}`;
  await sendEmail(
    c.env,
    {
      to: customerEmail,
      subject: "WOOPLANS - Votre code PIN Premium",
      html: buildPremiumWelcomeEmail(customerName, pin, loginUrl),
    }
  );

  return c.json({ received: true, action: "created", pin });
});
