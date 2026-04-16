import { Hono } from "hono";
import { Env } from "../types";
import { chariowCheckout } from "../lib/chariow";

export const checkoutRoutes = new Hono<{ Bindings: Env }>();

checkoutRoutes.post("/premium", async (c) => {
  const { email, first_name, last_name, phone } = await c.req.json();

  if (!email || !first_name || !last_name || !phone) {
    return c.json({ error: "Tous les champs sont requis" }, 400);
  }

  try {
    const result = await chariowCheckout(
      c.env,
      c.env.CHARIOW_PRODUCT_ID,
      email,
      first_name,
      last_name,
      phone
    );

    return c.json({
      checkout_url: result.checkoutUrl,
      sale_id: result.saleId,
    });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

checkoutRoutes.post("/plan/:planId", async (c) => {
  const { planId } = c.req.param();
  const { email, first_name, last_name, phone } = await c.req.json();

  const plan = await c.env.DB.prepare(
    "SELECT id, title, price FROM plans WHERE id = ?"
  )
    .bind(planId)
    .first();

  if (!plan) {
    return c.json({ error: "Plan introuvable" }, 404);
  }

  const whatsappMessage = encodeURIComponent(
    `Je veux commander le plan ${plan.title} (ID: ${plan.id})\nPrix: ${plan.price} FCFA\n\nMes coordonnées:\nNom: ${first_name} ${last_name}\nEmail: ${email}\nTéléphone: ${phone}`
  );

  return c.json({
    method: "whatsapp",
    whatsapp_url: `https://wa.me/${c.env.WHATSAPP_NUMBER}?text=${whatsappMessage}`,
    plan_title: plan.title,
    plan_price: plan.price,
  });
});
