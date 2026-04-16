import { Hono } from "hono";
import { Env } from "../types";
import { slugify } from "../lib/utils";

export const plansRoutes = new Hono<{ Bindings: Env }>();

plansRoutes.get("/", async (c) => {
  const category = c.req.query("category");
  const bedrooms = c.req.query("bedrooms");
  const search = c.req.query("search");

  let query = "SELECT id, title, slug, description, category, surface, bedrooms, bathrooms, floors, price, views, is_premium, thumbnail_key, distribution_key, quote_key, gallery_3d, created_at FROM plans WHERE 1=1";
  const params: any[] = [];

  if (category) {
    query += " AND category = ?";
    params.push(category);
  }
  if (bedrooms) {
    query += " AND bedrooms = ?";
    params.push(parseInt(bedrooms));
  }
  if (search) {
    query += " AND (title LIKE ? OR description LIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }

  query += " ORDER BY created_at DESC";

  const stmt = c.env.DB.prepare(query).bind(...params);
  const results = await stmt.all();

  return c.json({ plans: results.results });
});

plansRoutes.get("/categories", async (c) => {
  const results = await c.env.DB.prepare(
    "SELECT DISTINCT category FROM plans WHERE category IS NOT NULL ORDER BY category"
  ).all();

  return c.json({ categories: results.results.map((r: any) => r.category) });
});

plansRoutes.get("/:slug", async (c) => {
  const { slug } = c.req.param();

  const plan = await c.env.DB.prepare(
    "SELECT * FROM plans WHERE slug = ?"
  )
    .bind(slug)
    .first();

  if (!plan) {
    return c.json({ error: "Plan introuvable" }, 404);
  }

  await c.env.DB.prepare(
    "UPDATE plans SET views = views + 1 WHERE id = ?"
  )
    .bind(plan.id as string)
    .run();

  return c.json({ plan });
});

plansRoutes.get("/:slug/images", async (c) => {
  const { slug } = c.req.param();
  const email = c.req.header("X-User-Email");
  const pin = c.req.header("X-User-PIN");

  const plan = await c.env.DB.prepare(
    "SELECT id, slug, thumbnail_key, distribution_key, quote_key, is_premium, gallery_3d FROM plans WHERE slug = ?"
  )
    .bind(slug)
    .first();

  if (!plan) {
    return c.json({ error: "Plan introuvable" }, 404);
  }

  let isPremiumUser = false;
  if (email && pin) {
    const user = await c.env.DB.prepare(
      "SELECT is_premium, premium_expires_at FROM users WHERE email = ? AND pin_code = ?"
    )
      .bind(email, pin)
      .first();

    if (user && user.is_premium) {
      const expiry = user.premium_expires_at
        ? new Date(user.premium_expires_at as string)
        : null;
      isPremiumUser = expiry ? expiry > new Date() : false;
    }
  }

  const baseUrl = c.env.BUNNYCDN_BASE_URL;
  let gallery3d: string[] = [];
  try {
    gallery3d = JSON.parse((plan.gallery_3d as string) || "[]");
  } catch {}

  return c.json({
    thumbnail: `${baseUrl}/${plan.thumbnail_key}`,
    distribution: `${baseUrl}/${plan.distribution_key}`,
    quote: `${baseUrl}/${plan.quote_key}`,
    gallery_3d: gallery3d.map((key: string) => `${baseUrl}/${key}`),
    is_premium: plan.is_premium,
    is_unlocked: isPremiumUser,
  });
});
