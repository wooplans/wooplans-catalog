var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// api/purge-cache.js
async function onRequestPost({ request, env }) {
  const authHeader = request.headers.get("Authorization");
  const expectedSecret = env.PURGE_SECRET;
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { tags } = body;
    if (env.CLOUDFLARE_ZONE_ID && env.CLOUDFLARE_API_TOKEN && tags?.length) {
      const purgeRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${env.CLOUDFLARE_ZONE_ID}/purge_cache`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ tags })
        }
      );
      const result = await purgeRes.json();
      return new Response(JSON.stringify({
        success: true,
        purged: tags,
        cfResult: result
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    return new Response(JSON.stringify({
      success: true,
      message: "Cache purge requested (no CF API configured)",
      tags
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: "Purge failed",
      details: err.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
__name(onRequestPost, "onRequestPost");
async function onRequest({ request }) {
  return new Response(JSON.stringify({
    message: "Use POST to purge cache",
    required: {
      headers: { "Authorization": "Bearer {secret}" },
      body: { tags: ["plans"] }
    }
  }), {
    status: 405,
    headers: { "Content-Type": "application/json" }
  });
}
__name(onRequest, "onRequest");

// plans/[slug].js
var SUPABASE_URL = "https://xlmwzvkqjnoijdldzrol.supabase.co";
var SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbXd6dmtxam5vaWpkbGR6cm9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTAzMjAsImV4cCI6MjA4OTY4NjMyMH0.cQcRRHaaMiht2Tq9CB9l4_XN8-SOjixxhHFJDjytze4";
function slugify(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
__name(slugify, "slugify");
function esc(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
__name(esc, "esc");
function optimizeImageUrl(url, width = 800) {
  if (!url) return "";
  if (url.includes("b-cdn.net")) {
    return url + `?width=${width}&quality=80&format=webp`;
  }
  if (url.includes("unsplash.com")) {
    return url.replace(/\?.*$/, "") + `?w=${width}&q=75&auto=format&fit=crop`;
  }
  return url;
}
__name(optimizeImageUrl, "optimizeImageUrl");
function generateSrcset(url) {
  if (!url) return "";
  const widths = [400, 600, 800, 1200];
  return widths.map((w) => `${esc(optimizeImageUrl(url, w))} ${w}w`).join(", ");
}
__name(generateSrcset, "generateSrcset");
async function onRequest2(context) {
  const { request, env, params, waitUntil } = context;
  const slug = params.slug;
  const url = new URL(request.url);
  const cacheUrl = new URL(request.url);
  cacheUrl.search = "";
  const cacheKey = new Request(cacheUrl.toString());
  const edgeCache = caches.default;
  try {
    const cached = await edgeCache.match(cacheKey);
    if (cached) return cached;
  } catch (_) {
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2e3);
    const sbRes = await fetch(
      `${SUPABASE_URL}/rest/v1/plans?status=eq.online&select=*&order=created_at.asc`,
      {
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": "Bearer " + SUPABASE_ANON_KEY,
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate, br"
        },
        cf: {
          cacheTtl: 300,
          // 5 minutes de cache Cloudflare
          cacheEverything: true,
          cacheKey: "plans-all-online-v2",
          // Ajout de cacheTag pour purge facile
          cacheTags: ["plans", "catalogue"]
        },
        signal: controller.signal
      }
    );
    clearTimeout(timeoutId);
    const allPlans = sbRes.ok ? await sbRes.json() : [];
    const plan = Array.isArray(allPlans) ? allPlans.find((p) => slugify(p.title) === slug) : null;
    const assetRes = await env.ASSETS.fetch(new Request(new URL("/index.html", url)));
    let html = await assetRes.text();
    const firstImageRaw = plan?.images?.[0] ?? "";
    const firstImageOptimized = optimizeImageUrl(firstImageRaw, 800);
    const safeAllPlans = JSON.stringify(allPlans).replace(/<\/script>/gi, "<\\/script>");
    const safePlan = JSON.stringify(plan || null).replace(/<\/script>/gi, "<\\/script>");
    const userAgent = request.headers.get("user-agent") || "";
    const isMobile = /Mobile|Android|iPhone/i.test(userAgent);
    const isBot = /bot|crawler|spider|crawling/i.test(userAgent);
    const injectionParts = [
      // Preconnects prioritaires pour le LCP
      '<link rel="preconnect" href="https://wooplans.b-cdn.net" crossorigin>',
      '<link rel="preconnect" href="https://xlmwzvkqkqjnoijdldzrol.supabase.co" crossorigin>',
      '<link rel="dns-prefetch" href="https://connect.facebook.net">',
      '<link rel="dns-prefetch" href="https://www.googletagmanager.com">',
      // Preload manifest et SW pour PWA
      '<link rel="preload" href="/manifest.json" as="fetch" crossorigin>',
      // Preload image LCP optimisée (WebP, mobile-first)
      firstImageOptimized ? `<link rel="preload" as="image" href="${esc(firstImageOptimized)}" fetchpriority="high" imagesrcset="${generateSrcset(firstImageRaw)}" imagesizes="(max-width: 768px) 100vw, 50vw">` : "",
      // Dimensions fixes pour éviter CLS
      firstImageOptimized ? `<style>.gal-img{aspect-ratio:16/10;min-height:200px;background:var(--brun-moyen)}</style>` : "",
      // Données SSR injectées
      `<script>window.__ALL_PLANS__=${safeAllPlans};window.__INITIAL_PLAN__=${safePlan};window.__PAGE_TYPE__='detail';window.__IS_MOBILE__=${isMobile};<\/script>`,
      // Prefetch ressources critiques pour conversion
      '<link rel="prefetch" href="https://xlmwzvkqkqjnoijdldzrol.supabase.co/functions/v1/chariow-checkout" as="fetch" crossorigin>',
      // Preconnect Chariow si utilisé
      '<link rel="dns-prefetch" href="https://api.chariow.com">'
    ];
    if (isBot) {
      injectionParts.push('<meta name="robots" content="index, follow, max-image-preview:large">');
    }
    const injection = injectionParts.filter(Boolean).join("\n");
    html = html.replace("</head>", injection + "\n</head>");
    if (plan) {
      const title = `${plan.title} \u2014 Plan ${plan.type} ${plan.area || ""} | WooPlans`;
      const desc = `T\xE9l\xE9chargez le plan ${plan.title} (${plan.type}, ${plan.area || ""}, ${plan.beds || ""} chambres) \xE0 partir de ${plan.priceBasic || ""} FCFA. Livraison instantan\xE9e.`;
      const canonUrl = `https://shop.wooplans.com/plans/${slug}`;
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
          "price": parseInt(String(plan.priceBasic || "0").replace(/\s/g, "")),
          "priceCurrency": "XAF",
          "availability": "https://schema.org/InStock",
          "itemCondition": "https://schema.org/NewCondition",
          "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
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
        } : void 0
      };
      const cleanStructuredData = JSON.parse(JSON.stringify(structuredData));
      html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`).replace(/(id="meta-og-title"[^>]+content=")[^"]*(")/, `$1${esc(title)}$2`).replace(/(id="meta-og-description"[^>]+content=")[^"]*(")/, `$1${esc(desc)}$2`).replace(/(id="meta-og-image"[^>]+content=")[^"]*(")/, `$1${esc(firstImageRaw)}$2`).replace(/(id="meta-og-url"[^>]+content=")[^"]*(")/, `$1${canonUrl}$2`).replace(/(id="meta-canonical"[^>]+href=")[^"]*(")/, `$1${canonUrl}$2`).replace("</head>", `<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(firstImageRaw)}">
<script type="application/ld+json">${JSON.stringify(cleanStructuredData)}<\/script>
</head>`);
    }
    const headers = {
      "Content-Type": "text/html;charset=UTF-8",
      "Cache-Control": "public, max-age=60, stale-while-revalidate=3600",
      "X-Robots-Tag": "index, follow",
      "Vary": "Accept-Encoding, User-Agent",
      "X-Frame-Options": "DENY",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "strict-origin-when-cross-origin"
    };
    if (firstImageOptimized) {
      headers["Link"] = `<${firstImageOptimized}>; rel=preload; as=image; fetchpriority=high`;
    }
    const response = new Response(html, { headers });
    waitUntil(edgeCache.put(cacheKey, response.clone()));
    return response;
  } catch (err) {
    console.error("CF Function error:", err);
    const fallback = await env.ASSETS.fetch(new Request(new URL("/index.html", url)));
    let html = await fallback.text();
    html = html.replace("</head>", "<script>window.__SSR_ERROR__=true;<\/script>\n</head>");
    return new Response(html, {
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
        "Cache-Control": "public, max-age=10",
        "X-Robots-Tag": "noindex"
      }
    });
  }
}
__name(onRequest2, "onRequest");

// plans/index.js
var SUPABASE_URL2 = "https://xlmwzvkqjnoijdldzrol.supabase.co";
var SUPABASE_ANON_KEY2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbXd6dmtxam5vaWpkbGR6cm9sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxMTAzMjAsImV4cCI6MjA4OTY4NjMyMH0.cQcRRHaaMiht2Tq9CB9l4_XN8-SOjixxhHFJDjytze4";
async function onRequest3(context) {
  const { request, env, waitUntil } = context;
  const url = new URL(request.url);
  const cacheUrl = new URL(request.url);
  cacheUrl.search = "";
  const cacheKey = new Request(cacheUrl.toString());
  const edgeCache = caches.default;
  try {
    const cached = await edgeCache.match(cacheKey);
    if (cached) return cached;
  } catch (_) {
  }
  try {
    const sbRes = await fetch(
      `${SUPABASE_URL2}/rest/v1/plans?status=eq.online&select=*&order=created_at.asc`,
      {
        headers: {
          "apikey": SUPABASE_ANON_KEY2,
          "Authorization": "Bearer " + SUPABASE_ANON_KEY2
        },
        cf: {
          cacheTtl: 300,
          cacheEverything: true,
          cacheKey: "plans-all-online-list",
          cacheTags: ["plans", "catalogue", "list"]
        }
      }
    );
    const allPlans = sbRes.ok ? await sbRes.json() : [];
    const assetRes = await env.ASSETS.fetch(new Request(new URL("/index.html", url)));
    let html = await assetRes.text();
    const safeAllPlans = JSON.stringify(allPlans).replace(/<\/script>/gi, "<\\/script>");
    const injection = [
      '<link rel="preconnect" href="https://wooplans.b-cdn.net" crossorigin>',
      '<link rel="preconnect" href="https://xlmwzvkqkqjnoijdldzrol.supabase.co" crossorigin>',
      `<script>window.__ALL_PLANS__=${safeAllPlans};window.__PAGE_TYPE__='list';<\/script>`,
      `<meta name="description" content="Catalogue complet des plans de maison WooPlans. Villas et duplex con\xE7us pour l'Afrique.">`
    ].join("\n");
    html = html.replace("</head>", injection + "\n</head>");
    html = html.replace(/<title>[^<]*<\/title>/, "<title>Catalogue de Plans \u2014 Villas & Duplex | WooPlans</title>").replace(/(id="meta-og-title"[^>]+content=")[^"]*(")/, "$1Catalogue de Plans \u2014 WooPlans$2").replace(/(id="meta-og-description"[^>]+content=")[^"]*(")/, "$1Parcourez notre catalogue de plans de maison. Villas et duplex premium pour l'Afrique.$2").replace(/(id="meta-og-url"[^>]+content=")[^"]*(")/, "$1https://shop.wooplans.com/plans$2").replace(/(id="meta-canonical"[^>]+href=")[^"]*(")/, "$1https://shop.wooplans.com/plans$2");
    const response = new Response(html, {
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=1800",
        "X-Robots-Tag": "index, follow",
        "Vary": "Accept-Encoding"
      }
    });
    waitUntil(edgeCache.put(cacheKey, response.clone()));
    return response;
  } catch (err) {
    console.error("CF Function error (list):", err);
    const fallback = await env.ASSETS.fetch(new Request(new URL("/index.html", url)));
    return new Response(fallback.body, {
      headers: {
        "Content-Type": "text/html;charset=UTF-8",
        "Cache-Control": "public, max-age=10"
      }
    });
  }
}
__name(onRequest3, "onRequest");

// ../.wrangler/tmp/pages-vxULby/functionsRoutes-0.7920193128085373.mjs
var routes = [
  {
    routePath: "/api/purge-cache",
    mountPath: "/api",
    method: "POST",
    middlewares: [],
    modules: [onRequestPost]
  },
  {
    routePath: "/api/purge-cache",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  },
  {
    routePath: "/plans/:slug",
    mountPath: "/plans",
    method: "",
    middlewares: [],
    modules: [onRequest2]
  },
  {
    routePath: "/plans",
    mountPath: "/plans",
    method: "",
    middlewares: [],
    modules: [onRequest3]
  }
];

// ../../../../../home/agent_c3fa13a0-139b-473d-8dc6-9bf6872a0d9c/.npm/_npx/32026684e21afda6/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../../home/agent_c3fa13a0-139b-473d-8dc6-9bf6872a0d9c/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../../../../../home/agent_c3fa13a0-139b-473d-8dc6-9bf6872a0d9c/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../home/agent_c3fa13a0-139b-473d-8dc6-9bf6872a0d9c/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-lCVG5N/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../../../../home/agent_c3fa13a0-139b-473d-8dc6-9bf6872a0d9c/.npm/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-lCVG5N/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.20531340113044894.mjs.map
