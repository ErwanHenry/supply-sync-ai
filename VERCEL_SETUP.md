# 🚀 Vercel Setup - Fix Deployment

## ⚠️ Problème actuel

Le déploiement échoue car Vercel essaie de build depuis la racine au lieu du dossier `landing-page/`.

---

## ✅ Solution : Configuration Vercel Dashboard

### Option 1 : Via Dashboard Vercel (RECOMMANDÉ)

**1. Va sur Vercel Dashboard**
- https://vercel.com/dashboard
- Trouve ton projet "supply-sync-ai"

**2. Settings → General**

Configure ces paramètres :

```
Framework Preset: Next.js
Root Directory: landing-page    ← IMPORTANT !
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Node Version: 20.x
```

**3. Sauvegarde et redéploie**
- Click "Save"
- Go to Deployments tab
- Click "Redeploy" sur le dernier deployment

---

### Option 2 : Supprimer et recréer le projet

Si Option 1 ne marche pas :

**1. Supprime le projet actuel**
- Vercel Dashboard → Settings → Delete Project

**2. Import depuis GitHub**
- Click "Add New..." → Project
- Select "supply-sync-ai" from GitHub
- **IMPORTANT** : Configure avant le premier deploy :

```
Project Name: supply-sync-ai
Framework: Next.js
Root Directory: landing-page    ← Clique "Edit" et sélectionne ce dossier
Build Command: npm run build (auto-detected)
Output Directory: .next (auto-detected)
Install Command: npm install (auto-detected)
```

**3. Deploy**
- Click "Deploy"
- Attends 2-3 minutes

---

### Option 3 : Via Vercel CLI (Alternative)

```bash
# 1. Installe Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy depuis le bon dossier
cd ~/supply-sync-ai/landing-page
vercel --prod

# Vercel va détecter Next.js automatiquement
# Confirme les questions avec Enter
```

---

## 🔍 Vérification du problème

**Check les logs d'erreur :**

1. Va sur Vercel Dashboard → Deployments
2. Click sur le dernier deployment (Failed)
3. Lis les "Build Logs"

**Erreurs communes :**

### Erreur 1 : "No package.json found"
```
Cause: Vercel cherche package.json à la racine
Solution: Set Root Directory = landing-page
```

### Erreur 2 : "Module not found"
```
Cause: Dependencies pas installées
Solution: Vérifie que landing-page/package.json existe
```

### Erreur 3 : "Build command failed"
```
Cause: Node version ou commande incorrecte
Solution: Node 20.x + Build command = npm run build
```

---

## 📦 Structure actuelle du projet

```
supply-sync-ai/
├── backend/           (NestJS - pas pour Vercel)
├── frontend/          (Next.js dashboard - pas pour Vercel)
├── ml-service/        (Python - pas pour Vercel)
├── landing-page/      ← CECI doit être déployé
│   ├── package.json   ✅
│   ├── next.config.js ✅
│   ├── src/
│   │   └── app/
│   │       └── page.tsx
│   └── vercel.json    ✅
├── pitch-deck/
├── sales-playbook/
└── README.md
```

**Vercel doit SEULEMENT déployer le dossier `landing-page/`**

---

## ✅ Checklist finale

Après avoir configuré Root Directory = `landing-page` :

- [ ] Build Status: Success (green)
- [ ] Production URL accessible (ex: https://supply-sync-ai.vercel.app)
- [ ] Page se charge correctement
- [ ] Images visibles
- [ ] Formulaire présent
- [ ] Animations smooth (Framer Motion)
- [ ] Mobile responsive

---

## 🆘 Si ça ne marche toujours pas

**Partage-moi :**
1. Screenshot des "Build Logs" depuis Vercel
2. Screenshot de Settings → General (Root Directory visible)
3. L'URL du deployment

**Ou essaye :**

```bash
# Test en local d'abord
cd ~/supply-sync-ai/landing-page
npm install
npm run build
npm start

# Si ça marche en local, ça devrait marcher sur Vercel
```

---

## 🎯 Configuration correcte finale

**Dans Vercel Dashboard → Settings → General :**

| Setting | Value |
|---------|-------|
| Framework Preset | Next.js |
| **Root Directory** | **landing-page** ← CRUCIAL |
| Build Command | npm run build |
| Output Directory | .next |
| Install Command | npm install |
| Node.js Version | 20.x |

**Une fois configuré, le deploy devrait prendre 2-3 minutes et réussir.** ✅

---

**Quick Fix :**

```bash
# Si tu as accès à Vercel CLI :
cd ~/supply-sync-ai/landing-page
vercel --prod

# Vercel va demander :
# "Link to existing project?" → Yes
# "What's the name?" → supply-sync-ai
# Et ça va déployer directement depuis ce dossier
```

---

**Created**: 2025-01-06
**Status**: ⚠️ Fix required
**Next Step**: Configure Root Directory in Vercel Dashboard
