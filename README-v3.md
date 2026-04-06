# WooPlans Shop v3

## Refonte complète SSG (Static Site Generation)

### 🎯 Objectifs

- ✅ Architecture SSG pour SEO optimal
- ✅ Multilingue FR/EN
- ✅ Design sombre premium (Dark/Gold)
- ✅ Ultra rapide (optimisé pour connexions lentes)
- ✅ Pages produit et checkout refaites

### 🏗️ Architecture

```
src/
├── _data/           # Données JSON (plans, traductions, FAQ)
├── _includes/       # Composants réutilisables
├── _layouts/        # Templates de page
├── css/             # Styles (design system sombre)
├── js/              # JavaScript modulaire
├── pages/           # Pages du site
└── images/          # Assets
```

### 🚀 Installation

```bash
npm install
npm run start        # Dev server
npm run build        # Build production
npm run build:prod   # Build + optimisation
```

### 📝 Structure des URLs

- `/fr/` - Accueil FR
- `/en/` - Accueil EN
- `/fr/plans/{slug}/` - Page produit
- `/fr/checkout/` - Checkout
- `/fr/merci/` - Page de remerciement

### 🎨 Système de design

- **Couleurs**: Noir (#0a0a0a) + Or (#D4A853)
- **Typographie**: Inter + DM Sans
- **Mobile-first**: Breakpoints 640px, 1024px

### 📦 Déploiement

Déploiement automatique via GitHub Actions vers Cloudflare Pages.

### 🔧 Cache

- HTML: 1h + revalidation
- Assets: 1 an (immutable)
- Images: 1 an

---

**Branche:** `v3-ssg-refonte`
