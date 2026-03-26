# 🚀 Optimisations des Pages de Détail (/plans/[slug])

## Exemple : https://shop.wooplans.com/plans/villa-v3-037

---

## ✅ Optimisations Déjà en Place

### 1. Server-Side Rendering (Edge)

| Technique | Impact | Implémentation |
|-----------|--------|----------------|
| **Cloudflare Pages Function** | TTFB < 200ms | `functions/plans/[slug].js` |
| **Timeout 800ms** | Fallback rapide | `AbortController` |
| **Cache Edge** | Réduction latence | `cf.cacheTtl: 300` |
| **Stale-while-revalidate** | Contenu toujours frais | `max-age=60, stale-while-revalidate=3600` |

### 2. Optimisations LCP (Largest Contentful Paint)

```html
<!-- Preload image principale avec srcset -->
<link rel="preload" as="image" 
      href="https://wooplans.b-cdn.net/image.webp?width=800&quality=80&format=webp"
      fetchpriority="high"
      imagesrcset="... 400w, ... 800w, ... 1200w"
      imagesizes="(max-width: 768px) 100vw, 50vw">
```

| Optimisation | Gain |
|--------------|------|
| Preload LCP | -200ms |
| WebP format | -40% poids |
| Responsive srcset | Bonne taille selon device |
| Bunny CDN | Edge caching mondial |

### 3. Preconnects & DNS Prefetch

```html
<link rel="preconnect" href="https://wooplans.b-cdn.net" crossorigin>
<link rel="preconnect" href="https://xlmwzvkqkqjnoijdldzrol.supabase.co" crossorigin>
<link rel="dns-prefetch" href="https://connect.facebook.net">
<link rel="dns-prefetch" href="https://www.googletagmanager.com">
```

### 4. Injection SSR des Données

```javascript
// Pas de fetch réseau ! Les données sont injectées côté serveur
window.__ALL_PLANS__ = [...];        // Tous les plans
window.__INITIAL_PLAN__ = {...};     // Plan spécifique
window.__PAGE_TYPE__ = 'detail';     // Type de page
window.__IS_MOBILE__ = true/false;   // Détection device
```

**Gain :** Premier rendu immédiat, pas d'attente réseau

### 5. SEO Technique Avancé

#### Meta Tags Dynamiques
```html
<title>Villa V3-037 — Plan villa 250 m² | WooPlans</title>
<meta property="og:title" content="Villa V3-037 — Plan villa 250 m² | WooPlans">
<meta property="og:description" content="Téléchargez le plan Villa V3-037 (villa, 250 m², 4 chambres)...">
<meta property="og:image" content="https://wooplans.b-cdn.net/...">
<meta property="og:url" content="https://shop.wooplans.com/plans/villa-v3-037">
<link rel="canonical" href="https://shop.wooplans.com/plans/villa-v3-037">
```

#### Structured Data JSON-LD (Rich Snippets)
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Villa V3-037",
  "image": ["...", "..."],
  "sku": "uuid",
  "offers": {
    "@type": "Offer",
    "price": "29000",
    "priceCurrency": "XAF",
    "availability": "https://schema.org/InStock",
    "priceValidUntil": "2027-03-26",
    "shippingDetails": { ... },
    "hasMerchantReturnPolicy": { ... }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "18"
  }
}
```

**Impact :** Rich snippets dans Google (étoiles, prix, stock)

### 6. Prefetch Intelligent

```html
<!-- Précharge le checkout pour conversion rapide -->
<link rel="prefetch" href="https://xlmwzvkqkqjnoijdldzrol.supabase.co/functions/v1/chariow-checkout" as="fetch">

<!-- Précharge le manifest PWA -->
<link rel="preload" href="/manifest.json" as="fetch">
```

---

## 🆕 Optimisations Récemment Ajoutées

### 1. Détection Mobile
```javascript
window.__IS_MOBILE__ = true/false;
```
Permet d'adapter les comportements côté client

### 2. Cache Tags pour Purge Facile
```javascript
cf: {
  cacheTags: ['plans', 'catalogue']  // Tags pour purge ciblée
}
```

API de purge : `POST /api/purge-cache`
```bash
curl -X POST https://shop.wooplans.com/api/purge-cache \
  -H "Authorization: Bearer {secret}" \
  -d '{"tags": ["plans"]}'
```

### 3. Sécurité Headers
```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Vary: Accept-Encoding, User-Agent
```

### 4. Twitter Cards
```html
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="...">
<meta name="twitter:description" content="...">
<meta name="twitter:image" content="...">
```

### 5. Page Liste /plans Optimisée
Fichier : `functions/plans/index.js`
- Mêmes optimisations que les pages détail
- SEO spécifique pour le catalogue
- Cache partagé avec tags

---

## 📊 Métriques Attendues par Page

| Métrique | Objectif | Desktop | Mobile |
|----------|----------|---------|--------|
| **TTFB** | < 200ms | ~150ms | ~180ms |
| **FCP** | < 1s | ~0.4s | ~0.6s |
| **LCP** | < 1.5s | ~0.8s | ~1.0s |
| **CLS** | < 0.1 | ~0.02 | ~0.02 |
| **TBT** | < 200ms | ~50ms | ~80ms |

---

## 🔍 Test d'une Page de Détail

```bash
# Lighthouse sur une page spécifique
npx lighthouse \
  https://shop.wooplans.com/plans/villa-v3-037 \
  --output=html \
  --output-path=detail-report.html

# Vérifier les headers
 curl -I https://shop.wooplans.com/plans/villa-v3-037

# Test Structured Data
https://search.google.com/test/rich-results

# Test Mobile
https://search.google.com/test/mobile-friendly
```

---

## 🎯 Spécificités par Type de Trafic

### Trafic Facebook Ads (Mobile)
- Early Hints 103 pré-charge les ressources
- LCP optimisé pour conversion rapide
- Prefetch checkout dès l'ouverture

### Trafic Organique Google
- Structured Data pour rich snippets
- Meta tags dynamiques pour SEO
- Canonical URLs pour éviter duplicate content

### Trafic Direct
- Cache localStorage pour retour rapide
- Service Worker pour offline
- PWA installable

---

## 🛠️ Debugging

### Vérifier le SSR
```javascript
// Dans la console du navigateur
console.log({
  allPlans: window.__ALL_PLANS__?.length,
  initialPlan: window.__INITIAL_PLAN__?.title,
  pageType: window.__PAGE_TYPE__,
  isMobile: window.__IS_MOBILE__,
  ssrError: window.__SSR_ERROR__
});
```

### Vérifier les headers de cache
```bash
curl -I https://shop.wooplans.com/plans/villa-v3-037 | grep -i cache
# Cache-Control: public, max-age=60, stale-while-revalidate=3600
```

---

## ✅ Checklist Déploiement Pages Détail

- [ ] Déployer la Function `[slug].js`
- [ ] Déployer la Function `index.js` (liste)
- [ ] Tester une page : `https://shop.wooplans.com/plans/{slug}`
- [ ] Vérifier les Structured Data dans Google
- [ ] Tester le cache (recharger la page)
- [ ] Vérifier le LCP dans Lighthouse
- [ ] Tester sur mobile (3G lent)
- [ ] Vérifier les meta tags avec Facebook Debugger

---

**Projet :** WooPlans  
**Version :** 2.1 (Detail Pages Optimized)  
**Statut :** ✅ Pages détail ultra-performantes
