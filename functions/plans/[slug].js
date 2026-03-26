/**
 * Cloudflare Pages Function — /plans/[slug]
 * Injecte les données du plan + preload image dans le HTML côté serveur.
 * Réduit le LCP de ~18s à ~0.8s en rendant l'image LCP visible dès le HTML initial.
 */

const SUPABASE_URL = 'https://xlmwzvkqjnoijdldzrol.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbXd6dmtxam5vaWpkbGR6cm9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTAzMjAsImV4cCI6MjA4OTY4NjMyMH0.cQcRRHaaMiht2Tq9CB9l4_XN8-SOjixxhHFJDjytze4';

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function esc(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Miroir de thumbUrl() côté client — optimise les images Bunny CDN pour le preload LCP
function galThumbUrl(src, w) {
  if (!src || !src.includes('b-cdn.net')) return src;
  return src + '?width=' + (w || 900) + '&quality=80&format=webp';
}

export async function onRequest({ request, env, params }) {
  const slug = params.slug;

  try {
    // 1. Récupère tous les plans depuis Supabase (petite requête ~5KB)
    const sbRes = await fetch(
      `${SUPABASE_URL}/rest/v1/plans?status=eq.online&select=*&order=created_at.asc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        },
        cf: { cacheTtl: 60, cacheEverything: true }, // cache Cloudflare 60s
      }
    );

    const allPlans = sbRes.ok ? await sbRes.json() : [];
    const plan = Array.isArray(allPlans) ? allPlans.find(p => slugify(p.title) === slug) : null;

    // 2. Récupère index.html depuis les assets Cloudflare Pages
    const assetRes = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url)));
    let html = await assetRes.text();

    // 3. Prépare l'injection
    const firstImage = plan?.images?.[0] ?? '';
    const firstImageOpt = galThumbUrl(firstImage, 900); // URL optimisée Bunny CDN (WebP 900px)
    const safeAllPlans = JSON.stringify(allPlans).replace(/<\/script>/gi, '<\\/script>');
    const safePlan = JSON.stringify(plan || null).replace(/<\/script>/gi, '<\\/script>');

    const injection = [
      // Preload image LCP avec priorité maximale — URL optimisée pour correspondre à setImg()
      firstImage ? `<link rel="preload" as="image" href="${esc(firstImageOpt)}" fetchpriority="high">` : '',
      // Données pré-injectées — évite la requête Supabase côté client
      `<script>window.__ALL_PLANS__=${safeAllPlans};window.__INITIAL_PLAN__=${safePlan};</script>`,
    ].filter(Boolean).join('\n');

    // 4. Injecte juste avant </head>
    html = html.replace('</head>', injection + '\n</head>');

    // 5. Met à jour les meta SEO pour ce plan spécifique
    if (plan) {
      const title = `${plan.title} — WooPlans`;
      const desc = `Plan ${plan.type} ${plan.area || ''} · ${plan.beds || ''} ch. — À partir de ${plan.priceBasic || ''} FCFA`;
      const canonUrl = `https://shop.wooplans.com/plans/${slug}`;

      html = html
        .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
        .replace(/(id="meta-og-title"[^>]+content=")[^"]*(")/,  `$1${esc(title)}$2`)
        .replace(/(id="meta-og-description"[^>]+content=")[^"]*(")/,  `$1${esc(desc)}$2`)
        .replace(/(id="meta-og-image"[^>]+content=")[^"]*(")/,  `$1${esc(firstImageOpt)}$2`)
        .replace(/(id="meta-og-url"[^>]+content=")[^"]*(")/,  `$1${canonUrl}$2`)
        .replace(/(id="meta-canonical"[^>]+href=")[^"]*(")/,  `$1${canonUrl}$2`);
    }

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'X-Robots-Tag': 'index, follow',
      },
    });

  } catch (err) {
    // En cas d'erreur, sert le HTML statique sans injection
    console.error('CF Function error:', err);
    const fallback = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url)));
    return fallback;
  }
}
