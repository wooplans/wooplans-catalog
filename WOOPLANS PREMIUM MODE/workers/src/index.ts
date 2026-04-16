import { Hono } from "hono";
import { cors } from "hono/cors";
import { Env } from "./types";
import { authRoutes } from "./routes/auth";
import { checkoutRoutes } from "./routes/checkout";
import { webhookRoutes } from "./routes/webhook";
import { plansRoutes } from "./routes/plans";
import { uploadRoutes } from "./routes/upload";
import { adminRoutes } from "./routes/admin";

const app = new Hono<{ Bindings: Env }>();

app.use("/*", cors({
  origin: ["https://wooplans.pages.dev", "https://568f908b.wooplans.pages.dev", "https://5dbabe97.wooplans.pages.dev", "http://localhost:4321"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "X-User-Email", "X-User-PIN"],
  exposeHeaders: ["Content-Length"],
  maxAge: 86400,
  credentials: true,
}));

app.get("/", (c) => {
  return c.json({ message: "WOOPLANS API", version: "1.0.0" });
});

app.route("/auth", authRoutes);
app.route("/checkout", checkoutRoutes);
app.route("/webhook", webhookRoutes);
app.route("/plans", plansRoutes);
app.route("/upload", uploadRoutes);
app.route("/admin", adminRoutes);

export default app;
