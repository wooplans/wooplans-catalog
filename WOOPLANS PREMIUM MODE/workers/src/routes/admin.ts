import { Hono } from "hono";
import { Env } from "../types";
import { generateId, slugify, hashPassword } from "../lib/utils";

export const adminRoutes = new Hono<{ Bindings: Env }>();

const adminAuth = async (c: any, next: any) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "Non autorisé" }, 401);
  }

  const session = await c.env.DB.prepare(
    "SELECT * FROM admin_sessions WHERE token = ? AND expires_at > datetime('now')"
  )
    .bind(token)
    .first();

  if (!session) {
    return c.json({ error: "Session expirée" }, 401);
  }

  await next();
};

adminRoutes.post("/login", async (c) => {
  const { password } = await c.req.json();

  if (password !== c.env.ADMIN_PASSWORD) {
    return c.json({ error: "Mot de passe incorrect" }, 401);
  }

  const token = generateId();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  await c.env.DB.prepare(
    "INSERT INTO admin_sessions (id, token, expires_at) VALUES (?, ?, ?)"
  )
    .bind(generateId(), token, expiresAt.toISOString())
    .run();

  return c.json({ token });
});

adminRoutes.get("/stats", adminAuth, async (c) => {
  const totalUsers = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM users"
  ).first();

  const premiumUsers = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM users WHERE is_premium = 1"
  ).first();

  const totalPlans = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM plans"
  ).first();

  const pendingOrders = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM plan_orders WHERE status = 'pending'"
  ).first();

  const totalViews = await c.env.DB.prepare(
    "SELECT SUM(views) as total FROM plans"
  ).first();

  const recentUsers = await c.env.DB.prepare(
    "SELECT id, email, name, is_premium, premium_expires_at, created_at FROM users ORDER BY created_at DESC LIMIT 10"
  ).all();

  return c.json({
    stats: {
      total_users: (totalUsers as any)?.count || 0,
      premium_users: (premiumUsers as any)?.count || 0,
      total_plans: (totalPlans as any)?.count || 0,
      pending_orders: (pendingOrders as any)?.count || 0,
      total_views: (totalViews as any)?.total || 0,
    },
    recent_users: recentUsers.results,
  });
});

adminRoutes.get("/users", adminAuth, async (c) => {
  const page = parseInt(c.req.query("page") || "1");
  const limit = 20;
  const offset = (page - 1) * limit;

  const users = await c.env.DB.prepare(
    "SELECT id, email, name, phone, pin_code, is_premium, premium_expires_at, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?"
  )
    .bind(limit, offset)
    .all();

  const total = await c.env.DB.prepare(
    "SELECT COUNT(*) as count FROM users"
  ).first();

  return c.json({
    users: users.results,
    pagination: {
      page,
      limit,
      total: (total as any)?.count || 0,
    },
  });
});

adminRoutes.get("/orders", adminAuth, async (c) => {
  const status = c.req.query("status");

  let query = "SELECT * FROM plan_orders";
  const params: any[] = [];

  if (status) {
    query += " WHERE status = ?";
    params.push(status);
  }

  query += " ORDER BY created_at DESC";

  const orders = await c.env.DB.prepare(query).bind(...params).all();

  return c.json({ orders: orders.results });
});

adminRoutes.put("/orders/:id/status", adminAuth, async (c) => {
  const { id } = c.req.param();
  const { status, notes } = await c.req.json();

  const validStatuses = ["pending", "paid", "delivered"];
  if (!validStatuses.includes(status)) {
    return c.json({ error: "Statut invalide" }, 400);
  }

  const updates: string[] = [];
  const params: any[] = [];

  if (status === "paid") {
    updates.push("status = ?", "paid_at = datetime('now')");
    params.push(status);
  } else if (status === "delivered") {
    updates.push("status = ?", "delivered_at = datetime('now')");
    params.push(status);
  } else {
    updates.push("status = ?");
    params.push(status);
  }

  if (notes) {
    updates.push("notes = ?");
    params.push(notes);
  }

  params.push(id);

  await c.env.DB.prepare(
    `UPDATE plan_orders SET ${updates.join(", ")} WHERE id = ?`
  )
    .bind(...params)
    .run();

  return c.json({ success: true });
});

adminRoutes.post("/plans", adminAuth, async (c) => {
  const body = await c.req.json();

  const id = generateId();
  const slug = body.slug || slugify(body.title);

  await c.env.DB.prepare(
    "INSERT INTO plans (id, title, slug, description, category, surface, bedrooms, bathrooms, floors, thumbnail_key, distribution_key, quote_key, full_pdf_key, gallery_3d, price, is_premium) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  )
    .bind(
      id,
      body.title,
      slug,
      body.description || null,
      body.category || null,
      body.surface || null,
      body.bedrooms || null,
      body.bathrooms || null,
      body.floors || 1,
      body.thumbnail_key,
      body.distribution_key,
      body.quote_key,
      body.full_pdf_key || null,
      JSON.stringify(body.gallery_3d || []),
      body.price || null,
      body.is_premium ? 1 : 0
    )
    .run();

  return c.json({ success: true, plan: { id, slug } });
});

adminRoutes.put("/plans/:id", adminAuth, async (c) => {
  const { id } = c.req.param();
  const body = await c.req.json();

  const fields = [
    "title",
    "description",
    "category",
    "surface",
    "bedrooms",
    "bathrooms",
    "floors",
    "thumbnail_key",
    "distribution_key",
    "quote_key",
    "full_pdf_key",
    "gallery_3d",
    "price",
    "is_premium",
  ];

  const updates: string[] = [];
  const params: any[] = [];

  for (const field of fields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);
      params.push(field === "gallery_3d" ? JSON.stringify(body[field]) : body[field]);
    }
  }

  if (body.title) {
    updates.push("slug = ?");
    params.push(slugify(body.title));
  }

  updates.push("updated_at = datetime('now')");
  params.push(id);

  if (updates.length === 1) {
    return c.json({ error: "Aucune modification" }, 400);
  }

  await c.env.DB.prepare(
    `UPDATE plans SET ${updates.join(", ")} WHERE id = ?`
  )
    .bind(...params)
    .run();

  return c.json({ success: true });
});

adminRoutes.delete("/plans/:id", adminAuth, async (c) => {
  const { id } = c.req.param();

  await c.env.DB.prepare("DELETE FROM plans WHERE id = ?")
    .bind(id)
    .run();

  return c.json({ success: true });
});

adminRoutes.get("/plans/:id", adminAuth, async (c) => {
  const { id } = c.req.param();

  const plan = await c.env.DB.prepare("SELECT * FROM plans WHERE id = ?")
    .bind(id)
    .first();

  if (!plan) {
    return c.json({ error: "Plan introuvable" }, 404);
  }

  let gallery3d: string[] = [];
  try {
    gallery3d = JSON.parse((plan.gallery_3d as string) || "[]");
  } catch {}

  return c.json({ plan: { ...plan, gallery_3d: gallery3d } });
});

adminRoutes.put("/plans/:id/gallery", adminAuth, async (c) => {
  const { id } = c.req.param();
  const { gallery_3d } = await c.req.json();

  if (!Array.isArray(gallery_3d)) {
    return c.json({ error: "gallery_3d doit etre un tableau" }, 400);
  }

  if (gallery_3d.length > 10) {
    return c.json({ error: "Maximum 10 images" }, 400);
  }

  await c.env.DB.prepare(
    "UPDATE plans SET gallery_3d = ?, updated_at = datetime('now') WHERE id = ?"
  )
    .bind(JSON.stringify(gallery_3d), id)
    .run();

  return c.json({ success: true });
});

adminRoutes.put("/users/:id/premium", adminAuth, async (c) => {
  const { id } = c.req.param();
  const { is_premium, premium_expires_at } = await c.req.json();

  await c.env.DB.prepare(
    "UPDATE users SET is_premium = ?, premium_expires_at = ?, updated_at = datetime('now') WHERE id = ?"
  )
    .bind(is_premium ? 1 : 0, premium_expires_at || null, id)
    .run();

  return c.json({ success: true });
});

adminRoutes.delete("/users/:id", adminAuth, async (c) => {
  const { id } = c.req.param();

  await c.env.DB.prepare("DELETE FROM users WHERE id = ?")
    .bind(id)
    .run();

  return c.json({ success: true });
});

adminRoutes.post("/create-initial", async (c) => {
  const adminSecret = c.req.query("secret");
  if (adminSecret !== c.env.ADMIN_PASSWORD) {
    return c.json({ error: "Non autorisé" }, 401);
  }

  const existing = await c.env.DB.prepare(
    "SELECT id FROM admin_sessions LIMIT 1"
  ).first();

  if (existing) {
    return c.json({ error: "Admin déjà initialisé" }, 400);
  }

  return c.json({ message: "Admin prêt à être créé" });
});
