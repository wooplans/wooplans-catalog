# WooPlans React - Architecture Moderne

## 🚀 Stack Technique

- **React 18** - UI Library
- **Vite** - Build tool ultra-rapide
- **Tailwind CSS** - Utility-first CSS
- **React Router** - Navigation
- **Cloudflare Pages** - Hébergement + Edge Functions (optionnel pour SSR)

## 📁 Structure du Projet

```
react-wooplans/
├── src/
│   ├── components/     # Composants réutilisables
│   ├── pages/          # Pages principales
│   │   ├── HomePage.jsx
│   │   └── PlanDetail.jsx
│   ├── hooks/          # Custom hooks
│   │   └── usePlans.js
│   ├── utils/          # Utilitaires
│   ├── assets/         # Images, fonts
│   ├── App.jsx         # Routeur principal
│   ├── main.jsx        # Point d'entrée
│   └── index.css       # Styles globaux + Tailwind
├── public/             # Assets statiques
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## ⚡ Fonctionnalités Clés

### Performance
- Code splitting automatique avec Vite
- Lazy loading des images
- Cache localStorage pour les données API
- Preload de l'image LCP
- Fast path pour trafic Facebook Ads

### SEO
- Meta tags dynamiques par page
- Structured data JSON-LD
- URLs optimisées `/plans/:slug`
- Sitemap-ready

### UX/UI
- Responsive design mobile-first
- Animations fluides
- Sticky bar mobile
- Galerie swipeable
- Partage social intégré

## 🔧 Installation

```bash
cd react-wooplans
npm install
```

## 🏃 Démarrage

```bash
# Développement local
npm run dev

# Build production
npm run build

# Preview build
npm run preview

# Déploiement Cloudflare Pages
npm run deploy
```

## 🌍 Variables d'Environnement

Créez un fichier `.env` à la racine :

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 📊 Architecture des Données

### Hook `usePlans()`
- Récupère tous les plans depuis Supabase
- Cache 5 min dans localStorage
- Timeout 2s sur les requêtes
- Fallback sur données injectées (SSR)

### Hook `usePlan(slug)`
- Trouve un plan spécifique par slug
- Supporte les données pre-injectées
- Utilisé sur les pages détail

## 🎨 Personnalisation Tailwind

Le fichier `tailwind.config.js` inclut :
- Couleurs personnalisées (primary, secondary, accent)
- Polices Inter
- Animations custom (fade-in, slide-up)
- Composants réutilisables (.btn-primary, .card, etc.)

## 🔄 Migration depuis l'ancienne version

### Avantages de cette architecture
1. **DX amélioré** - Hot reload instantané avec Vite
2. **Composants réactifs** - État géré proprement avec hooks
3. **Tailwind natif** - Pas de CSS personnalisé
4. **TypeScript ready** - Facile à migrer vers TS
5. **Écosystème React** - Accès à toutes les librairies

### Limitations vs SSR pur
- Pas de SSR natif (SPA)
- SEO dépend du client-side rendering
- Solution: Utiliser Cloudflare Pages Functions pour SSR si nécessaire

## 🚀 Prochaines Étapes

1. Installer les dépendances: `npm install`
2. Configurer les variables d'environnement
3. Tester en local: `npm run dev`
4. Ajouter les vraies images/assets
5. Connecter à votre API Supabase
6. Déployer sur Cloudflare Pages

## 📱 Features Implémentées

✅ Page d'accueil avec grille de plans
✅ Page détail complète avec galerie
✅ Sticky bar mobile
✅ Fast path pour Facebook Ads
✅ SEO meta tags dynamiques
✅ Structured data JSON-LD
✅ Partage WhatsApp/Facebook
✅ Cache localStorage
✅ Responsive design
✅ Animations fluides
