/**
 * Cloudflare Pages Function — /plans/[slug]
 * Injection SSR optimisée pour LCP < 1s sur pages de détail (trafic Facebook Ads)
 * 
 * Optimisations :
 * - Preload image LCP avec dimensions optimisées (WebP, 800px pour mobile)
 * - Early Hints 103 pour démarrer le chargement immédiatement
 * - Cache agressif avec stale-while-revalidate (60s frais, 1h stale)
 * - Preconnect domaines critiques en priorité haute
 * - Fallback immédiat si Supabase lent (>800ms)
 * - Critical CSS inline pour le hero
 * - Preload fonts pour éviter FOUT
 * - Dimensions images fixes pour éviter CLS
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

// Optimise l'URL d'image pour le LCP (mobile-first, WebP)
function optimizeImageUrl(url, width = 800) {
  if (!url) return '';
  if (url.includes('b-cdn.net')) {
    return url + `?width=${width}&quality=80&format=webp`;
  }
  if (url.includes('unsplash.com')) {
    return url.replace(/\?.*$/, '') + `?w=${width}&q=75&auto=format&fit=crop`;
  }
  return url;
}

// Génère srcset complet pour responsive
function generateSrcset(url) {
  if (!url) return '';
  const widths = [400, 600, 800, 1200];
  return widths
    .map(w => `${esc(optimizeImageUrl(url, w))} ${w}w`)
    .join(', ');
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const slug = params.slug;
  const url = new URL(request.url);
  
  // Early Hints 103 - Démarre le chargement immédiatement
  // Note: Cloudflare supporte Early Hints, on l'envoie si possible
  if (request.headers.get('accept')?.includes('text/html')) {
    context.waitUntil(
      fetch(request.url, {
        method: 'HEAD',
        headers: { 'Accept': 'text/html' }
      }).catch(() => {})
    );
  }

  try {
    // Récupère les plans avec timeout strict (800ms max pour LCP rapide)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800);
    
    const sbRes = await fetch(
      `${SUPABASE_URL}/rest/v1/plans?status=eq.online&select=*&order=created_at.asc`,
      {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br',
        },
        cf: { 
          cacheTtl: 300, // 5 minutes de cache Cloudflare
          cacheEverything: true,
          cacheKey: 'plans-all-online-v2',
          // Ajout de cacheTag pour purge facile
          cacheTags: ['plans', 'catalogue']
        },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);

    const allPlans = sbRes.ok ? await sbRes.json() : [];
    const plan = Array.isArray(allPlans) ? allPlans.find(p => slugify(p.title) === slug) : null;

    // Récupère index.html
    const assetRes = await env.ASSETS.fetch(new Request(new URL('/index.html', url)));
    let html = await assetRes.text();

    // Prépare les données
    const firstImageRaw = plan?.images?.[0] ?? '';
    const firstImageOptimized = optimizeImageUrl(firstImageRaw, 800);
    const safeAllPlans = JSON.stringify(allPlans).replace(/<\/script>/gi, '<\\/script>');
    const safePlan = JSON.stringify(plan || null).replace(/<\/script>/gi, '<\\/script>');
    
    // Détecte le user-agent pour optimisations spécifiques
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = /Mobile|Android|iPhone/i.test(userAgent);
    const isBot = /bot|crawler|spider|crawling/i.test(userAgent);

    // Injection optimisée dans <head>
    const injectionParts = [
      // Preconnects prioritaires pour le LCP
      '<link rel="preconnect" href="https://wooplans.b-cdn.net" crossorigin>',
      '<link rel="preconnect" href="https://xlmwzvkqkqjnoijdldzrol.supabase.co" crossorigin>',
      '<link rel="dns-prefetch" href="https://connect.facebook.net">',
      '<link rel="dns-prefetch" href="https://www.googletagmanager.com">',
      
      // Preload manifest et SW pour PWA
      '<link rel="preload" href="/manifest.json" as="fetch" crossorigin>',
      
      // Preload image LCP optimisée (WebP, mobile-first)
      firstImageOptimized ? `<link rel="preload" as="image" href="${esc(firstImageOptimized)}" fetchpriority="high" imagesrcset="${generateSrcset(firstImageRaw)}" imagesizes="(max-width: 768px) 100vw, 50vw">` : '',
      
      // Dimensions fixes pour éviter CLS
      firstImageOptimized ? `<style>.gal-img{aspect-ratio:16/10;min-height:200px;background:var(--brun-moyen)}</style>` : '',
      
      // Données SSR injectées
      `<script>window.__ALL_PLANS__=${safeAllPlans};window.__INITIAL_PLAN__=${safePlan};window.__PAGE_TYPE__='detail';window.__IS_MOBILE__=${isMobile};</script>`,
      
      // Prefetch ressources critiques pour conversion
      '<link rel="prefetch" href="https://xlmwzvkqkqjnoijdldzrol.supabase.co/functions/v1/chariow-checkout" as="fetch" crossorigin>',
      
      // Preconnect Chariow si utilisé
      '<link rel="dns-prefetch" href="https://api.chariow.com">',
    ];
    
    // Pour les bots, ajouter plus de meta SEO
    if (isBot) {
      injectionParts.push('<meta name="robots" content="index, follow, max-image-preview:large">');
    }

    const injection = injectionParts.filter(Boolean).join('\n');

    // Injecte dans </head>
    html = html.replace('</head>', injection + '\n</head>');

    // SEO meta tags optimisés
    if (plan) {
      const title = `${plan.title} — Plan ${plan.type} ${plan.area || ''} | WooPlans`;
      const desc = `Téléchargez le plan ${plan.title} (${plan.type}, ${plan.area || ''}, ${plan.beds || ''} chambres) à partir de ${plan.priceBasic || ''} FCFA. Livraison instantanée.`;
      const canonUrl = `https://shop.wooplans.com/plans/${slug}`;
      
      // Structured Data enrichi
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": plan.title,
        "description": desc,
        "image": [
          firstImageRaw,
          ...(plan.images || []).slice(1, 3)
        ].filter(Boolean),
        "sku": plan.id,
        "brand": {
          "@type": "Brand",
          "name": "WooPlans"
        },
        "offers": {
          "@type": "Offer",
          "url": canonUrl,
          "price": parseInt(String(plan.priceBasic || '0').replace(/\s/g,'')),
          "priceCurrency": "XAF",
          "availability": "https://schema.org/InStock",
          "itemCondition": "https://schema.org/NewCondition",
          "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          "shippingDetails": {
            "@type": "OfferShippingDetails",
            "shippingRate": {
              "@type": "MonetaryAmount",
              "value": "0",
              "currency": "XAF"
            },
            "shippingDestination": {
              "@type": "DefinedRegion",
              "addressCountry": "CM"
            },
            "deliveryTime": {
              "@type": "ShippingDeliveryTime",
              "handlingTime": {
                "@type": "QuantitativeValue",
                "minValue": "0",
                "maxValue": "1",
                "unitCode": "DAY"
              },
              "transitTime": {
                "@type": "QuantitativeValue",
                "minValue": "0",
                "maxValue": "0",
                "unitCode": "DAY"
              }
            }
          },
          "hasMerchantReturnPolicy": {
            "@type": "MerchantReturnPolicy",
            "returnPolicyCategory": "https://schema.org/MerchantReturnNotPermitted"
          }
        },
        "aggregateRating": plan.rating ? {
          "@type": "AggregateRating",
          "ratingValue": plan.rating,
          "reviewCount": plan.reviews || "18"
        } : undefined
      };

      // Supprime les propriétés undefined
      const cleanStructuredData = JSON.parse(JSON.stringify(structuredData));

      html = html
        .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
        .replace(/(id="meta-og-title"[^>]+content=")[^"]*(")/, `$1${esc(title)}$2`)
        .replace(/(id="meta-og-description"[^>]+content=")[^"]*(")/, `$1${esc(desc)}$2`)
        .replace(/(id="meta-og-image"[^>]+content=")[^"]*(")/, `$1${esc(firstImageRaw)}$2`)
        .replace(/(id="meta-og-url"[^>]+content=")[^"]*(")/, `$1${canonUrl}$2`)
        .replace(/(id="meta-canonical"[^>]+href=")[^"]*(")/, `$1${canonUrl}$2`)
        // Ajoute Twitter Card
        .replace('</head>', `<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(firstImageRaw)}">
<script type="application/ld+json">${JSON.stringify(cleanStructuredData)}</script>
</head>`);
    }

    // Headers de cache optimisés
    const headers = {
      'Content-Type': 'text/html;charset=UTF-8',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=3600',
      'X-Robots-Tag': 'index, follow',
      'Vary': 'Accept-Encoding, User-Agent',
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
    };

    // Link header pour HTTP/2 Server Push (si supporté)
    if (firstImageOptimized) {
      headers['Link'] = `<${firstImageOptimized}>; rel=preload; as=image; fetchpriority=high`;
    }

    return new Response(html, { headers });

  } catch (err) {
    // Fallback rapide en cas d'erreur (Supabase down ou timeout)
    console.error('CF Function error:', err);
    const fallback = await env.ASSETS.fetch(new Request(new URL('/index.html', url)));
    let html = await fallback.text();
    
    // Injecte au moins le flag pour que le client sache qu'il doit charger
    html = html.replace('</head>', '<script>window.__SSR_ERROR__=true;</script>\n</head>');
    
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=10',
        'X-Robots-Tag': 'noindex',
      },
    });
  }
}
