import { Hono } from "hono";
import { Env } from "../types";
import { uploadToBunny, deleteFromBunny } from "../lib/bunny";
import { generateId, slugify } from "../lib/utils";

export const uploadRoutes = new Hono<{ Bindings: Env }>();

uploadRoutes.post("/image", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File;
  const folder = (formData.get("folder") as string) || "plans/misc";
  const planId = formData.get("plan_id") as string;

  if (!file) {
    return c.json({ error: "Fichier requis" }, 400);
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];
  if (!allowedTypes.includes(file.type)) {
    return c.json({ error: "Type de fichier non autorisé" }, 400);
  }

  if (file.size > 50 * 1024 * 1024) {
    return c.json({ error: "Fichier trop volumineux (max 50MB)" }, 400);
  }

  const ext = file.name.split(".").pop();
  const filename = `${generateId()}.${ext}`;
  const path = `${folder}/${filename}`;

  try {
    const url = await uploadToBunny(c.env, file, path);
    return c.json({ url, path, filename });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

uploadRoutes.post("/plan-assets", async (c) => {
  const formData = await c.req.formData();
  const thumbnail = formData.get("thumbnail") as File;
  const distribution = formData.get("distribution") as File;
  const quote = formData.get("quote") as File;
  const fullPdf = formData.get("full_pdf") as File | null;
  const planId = (formData.get("plan_id") as string) || generateId();

  const results: Record<string, string> = {};

  try {
    if (thumbnail) {
      const ext = thumbnail.name.split(".").pop();
      const path = `plans/thumbnails/${planId}.${ext}`;
      results.thumbnail_key = path;
      await uploadToBunny(c.env, thumbnail, path);
    }

    if (distribution) {
      const ext = distribution.name.split(".").pop();
      const path = `plans/distributions/${planId}.${ext}`;
      results.distribution_key = path;
      await uploadToBunny(c.env, distribution, path);
    }

    if (quote) {
      const ext = quote.name.split(".").pop();
      const path = `plans/quotes/${planId}.${ext}`;
      results.quote_key = path;
      await uploadToBunny(c.env, quote, path);
    }

    if (fullPdf) {
      const ext = fullPdf.name.split(".").pop();
      const path = `plans/full-pdfs/${planId}.${ext}`;
      results.full_pdf_key = path;
      await uploadToBunny(c.env, fullPdf, path);
    }

    return c.json({ success: true, keys: results });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

uploadRoutes.post("/gallery-3d", async (c) => {
  const formData = await c.req.formData();
  const files = formData.getAll("images") as File[];
  const planId = formData.get("plan_id") as string;

  if (!files || files.length === 0) {
    return c.json({ error: "Aucune image fournie" }, 400);
  }

  if (files.length > 10) {
    return c.json({ error: "Maximum 10 images autorisees" }, 400);
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  for (const file of files) {
    if (!allowedTypes.includes(file.type)) {
      return c.json({ error: `Type non autorise: ${file.name}. Formats acceptes: JPG, PNG, WebP` }, 400);
    }
    if (file.size > 20 * 1024 * 1024) {
      return c.json({ error: `${file.name} depasse 20MB` }, 400);
    }
  }

  const uploadedKeys: string[] = [];

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split(".").pop();
      const path = `plans/gallery-3d/${planId}/${generateId()}.${ext}`;
      await uploadToBunny(c.env, file, path);
      uploadedKeys.push(path);
    }

    return c.json({ success: true, keys: uploadedKeys });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

uploadRoutes.delete("/gallery-3d", async (c) => {
  const { path } = await c.req.json();

  if (!path) {
    return c.json({ error: "Chemin requis" }, 400);
  }

  try {
    await deleteFromBunny(c.env, path);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

uploadRoutes.delete("/:path{.+}", async (c) => {
  const path = c.req.param("path");

  try {
    await deleteFromBunny(c.env, path);
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});
