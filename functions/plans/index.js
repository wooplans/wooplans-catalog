/**
 * Cloudflare Pages Function — /plans (liste)
 * Optimisations pour la page catalogue
 */

const SUPABASE_URL = 'https://xlmwzvkqjnoijdldzrol.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbXd6dmtxam5vaWpkbGR6cm9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTAzMjAsImV4cCI6MjA4OTY4NjMyMH0.cQcRRHaaMiht2Tq9CB9l4_XN8-SOjixxhHFJDjytze4';

export async function onRequest(context) {
  const { request, env, waitUntil } = context;
  const url = new URL(request.url);

  // Cache normalisé (sans query params)
  const cacheUrl = new URL(request.url);
  cacheUrl.search = '';
  const cacheKey = new Request(cacheUrl.toString());
  const edgeCache = caches.default;
  try {
    const cached = await edgeCache.match(cacheKey);
    if (cached) return cached;
  } catch(_) {}

  try {
    // Récupère tous les plans
    const sbRes = await fetch(
      `${SUPABASE_URL}/rest/v1/plans?status=eq.online&select=*&order=created_at.asc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        },
        cf: { 
          cacheTtl: 300,
          cacheEverything: true,
          cacheKey: 'plans-all-online-list',
          cacheTags: ['plans', 'catalogue', 'list']
        }
      }
    );

    const allPlans = sbRes.ok ? await sbRes.json() : [];
    
    // Récupère index.html
    const assetRes = await env.ASSETS.fetch(new Request(new URL('/index.html', url)));
    let html = await assetRes.text();

    // Injection SSR
    const safeAllPlans = JSON.stringify(allPlans).replace(/<\/script>/gi, '<\\/script>');
    
    const injection = [
      '<link rel="preconnect" href="https://wooplans.b-cdn.net" crossorigin>',
      '<link rel="preconnect" href="https://xlmwzvkqkqjnoijdldzrol.supabase.co" crossorigin>',
      `<script>window.__ALL_PLANS__=${safeAllPlans};window.__PAGE_TYPE__='list';</script>`,
      '<meta name="description" content="Catalogue complet des plans de maison WooPlans. Villas et duplex conçus pour l\'Afrique.">',
    ].join('\n');

    html = html.replace('</head>', injection + '\n</head>');
    
    // SEO pour la liste
    html = html
      .replace(/<title>[^<]*<\/title>/, '<title>Catalogue de Plans — Villas & Duplex | WooPlans</title>')
      .replace(/(id="meta-og-title"[^>]+content=")[^"]*(")/, '$1Catalogue de Plans — WooPlans$2')
      .replace(/(id="meta-og-description"[^>]+content=")[^"]*(")/, '$1Parcourez notre catalogue de plans de maison. Villas et duplex premium pour l\'Afrique.$2')
      .replace(/(id="meta-og-url"[^>]+content=")[^"]*(")/, '$1https://shop.wooplans.com/plans$2')
      .replace(/(id="meta-canonical"[^>]+href=")[^"]*(")/, '$1https://shop.wooplans.com/plans$2');

    const response = new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=1800',
        'X-Robots-Tag': 'index, follow',
        'Vary': 'Accept-Encoding',
      },
    });
    waitUntil(edgeCache.put(cacheKey, response.clone()));
    return response;

  } catch (err) {
    console.error('CF Function error (list):', err);
    const fallback = await env.ASSETS.fetch(new Request(new URL('/index.html', url)));
    return new Response(fallback.body, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=10',
      },
    });
  }
}
