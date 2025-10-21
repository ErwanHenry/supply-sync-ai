# 🎯 Guide de Configuration - Conversion Tracking

## ✅ Modifications Appliquées

Les modifications suivantes ont été apportées à la landing page pour activer le tracking de conversion :

### 1. **Formspree - Email Capture** (5 minutes)

**Fichier modifié**: `src/app/page.tsx`

**Configuration requise**:

1. Créer un compte gratuit sur **Formspree**:
   - Aller sur https://formspree.io
   - Créer un compte (gratuit jusqu'à 50 submissions/mois)
   - Créer un nouveau formulaire

2. Récupérer le Form ID:
   - Dashboard Formspree → Your Forms → Copy Form ID
   - Format: `xyzabc12`

3. Mettre à jour le code:
   ```typescript
   // Dans src/app/page.tsx, ligne 16
   // Remplacer:
   const response = await fetch('https://formspree.io/f/YOUR_FORM_ID', {

   // Par:
   const response = await fetch('https://formspree.io/f/xyzabc12', {
   ```

4. Tester le formulaire:
   - Aller sur https://landing-page.vercel.app
   - Entrer un email
   - Cliquer "Démo Gratuite"
   - Vérifier la réception dans Formspree Dashboard

### 2. **Google Analytics 4** (10 minutes)

**Fichier modifié**: `src/app/layout.tsx`

**Configuration requise**:

1. Créer une propriété Google Analytics 4:
   - Aller sur https://analytics.google.com
   - Admin → Create Property
   - Property Name: SupplySync AI Landing Page
   - Timezone: Europe/Paris
   - Currency: Euro (€)

2. Récupérer le Measurement ID:
   - Admin → Data Streams → Web
   - Copier le Measurement ID (format: `G-XXXXXXXXXX`)

3. Mettre à jour le code:
   ```typescript
   // Dans src/app/layout.tsx, lignes 35 et 42
   // Remplacer G-XXXXXXXXXX par votre Measurement ID:
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC123DEF456"></script>
   ...
   gtag('config', 'G-ABC123DEF456');
   ```

4. Vérifier l'installation:
   - Installer l'extension Chrome "Google Analytics Debugger"
   - Visiter https://landing-page.vercel.app
   - Ouvrir la console → Messages Google Analytics doivent apparaître

---

## 🚀 Déploiement des Modifications

### Option 1: Déploiement Automatique (Recommandé)

Si le repo GitHub est connecté à Vercel:

```bash
cd /Users/erwanhenry/claude-projects/supply-sync-ai/landing-page

# Commit les changements
git add src/app/page.tsx src/app/layout.tsx
git commit -m "feat: Add Formspree email capture + Google Analytics tracking"
git push origin main

# Vercel déploiera automatiquement
```

### Option 2: Déploiement Manuel

```bash
cd /Users/erwanhenry/claude-projects/supply-sync-ai/landing-page

# Deploy to Vercel
vercel --prod
```

---

## 📊 Métriques à Suivre

### Google Analytics

**Traffic**:
- ✅ Page views (total visits)
- ✅ Unique visitors
- ✅ Bounce rate (< 60% idéal)
- ✅ Time on page (> 2 min idéal)
- ✅ Traffic sources (organic, direct, referral)

**Comportement**:
- ✅ Scroll depth (combien scrollent jusqu'aux features)
- ✅ Button clicks (CTA tracking)
- ✅ Form interactions

**Conversion**:
- ✅ Form submissions (email capture)
- ✅ Conversion rate (submissions / visitors)

### Formspree Dashboard

**Email Capture**:
- Total submissions
- Submission rate (submissions/jour)
- Verification rate (emails valides)

---

## 🎯 Objectifs de Conversion

### Semaine 1
- **Traffic**: 100 visiteurs
- **Submissions**: 5 demandes démo (5% conversion)
- **Bounce rate**: < 70%

### Mois 1
- **Traffic**: 500 visiteurs
- **Submissions**: 50 demandes démo (10% conversion)
- **Bounce rate**: < 60%

### Mois 3
- **Traffic**: 2,000 visiteurs
- **Submissions**: 200 demandes démo (10% conversion)
- **Bounce rate**: < 50%

---

## 🔧 Configuration Additionnelle (Optionnel)

### Custom Domain

**Recommandé**: Acheter `supplysync.ai` pour professionnaliser

1. Acheter le domaine:
   - Via Vercel Dashboard → Domains → Buy
   - Ou chez un registrar (Namecheap, OVH, etc.)

2. Configurer DNS:
   - A Record: `@` → Vercel IP
   - CNAME Record: `www` → `cname.vercel-dns.com`

3. Vérifier:
   - Aller sur Settings → Domains
   - Suivre les instructions Vercel
   - Attendre propagation DNS (24-48h max)

### Hotjar (Session Recordings)

**Gratuit jusqu'à 35 sessions/jour**

1. Créer un compte sur https://www.hotjar.com
2. Créer un nouveau site
3. Copier le tracking code
4. Ajouter dans `src/app/layout.tsx` (après Google Analytics)

### LinkedIn Insight Tag

**Pour retargeting LinkedIn Ads**

1. LinkedIn Campaign Manager → Insight Tag
2. Copier le pixel code
3. Ajouter dans `src/app/layout.tsx`

---

## ✅ Checklist Post-Configuration

**Formspree**:
- [ ] Compte créé
- [ ] Form ID copié
- [ ] Code mis à jour (ligne 16)
- [ ] Test submission OK
- [ ] Email de confirmation reçu

**Google Analytics**:
- [ ] Propriété GA4 créée
- [ ] Measurement ID copié
- [ ] Code mis à jour (lignes 35, 42)
- [ ] Extension Chrome "GA Debugger" installée
- [ ] Page visitée → Events détectés

**Déploiement**:
- [ ] Code committed
- [ ] Push to GitHub
- [ ] Vercel build success
- [ ] Production URL testée
- [ ] Formulaire fonctionne en prod
- [ ] GA events remontent en prod

**Dashboard**:
- [ ] Google Analytics ouvert
- [ ] Formspree Dashboard vérifié
- [ ] Métriques baseline notées

---

## 📞 Support

### Problèmes Formspree
- Docs: https://help.formspree.io
- Support: support@formspree.io

### Problèmes Google Analytics
- Help Center: https://support.google.com/analytics
- Community: https://support.google.com/analytics/community

### Problèmes Vercel
- Status: https://www.vercel-status.com
- Logs: `vercel logs landing-page --follow`

---

## 🎉 Résumé

**Avant** ❌:
- Formulaire ne capturait pas les emails
- Aucun analytics configuré
- Pas de suivi de conversion

**Après** ✅:
- Formspree email capture (50 submissions/mois gratuit)
- Google Analytics 4 tracking complet
- Suivi de conversion automatique
- Métriques détaillées accessibles

**Temps de configuration**: 15 minutes
**Coût**: €0/mois (jusqu'à 50 submissions + trafic illimité GA)
**Impact**: Visibilité complète sur la conversion et le comportement utilisateur

---

**Configuration complétée par**: Claude Code
**Date**: 21 octobre 2025
**Statut**: ✅ Prêt à déployer
