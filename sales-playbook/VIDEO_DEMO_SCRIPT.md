# SupplySync AI - Video Demo Script

## Video 1: Product Overview (2 minutes)

### Scene 1: Hook (0:00 - 0:15)

**Visuals**: Animated text overlays on dark background with inventory chaos imagery

**Voiceover**:
```
"Les erreurs d'inventaire coûtent en moyenne €500K à €2M par an aux PME.

Ruptures de stock. Surstock. Données obsolètes. Synchronisation manuelle.

Et si votre ERP pouvait vous dire la vérité sur votre inventaire... en temps réel?"
```

**On-screen text**:
- "€500K - €2M perdus/an"
- "40h/semaine de vérifications manuelles"
- "87% de précision avec l'IA"

---

### Scene 2: Problem Statement (0:15 - 0:30)

**Visuals**: Split-screen showing traditional workflow vs. SupplySync AI

**Voiceover**:
```
"Aujourd'hui, les équipes supply chain passent 40 heures par semaine à exporter des CSV,
vérifier manuellement les stocks, et corriger des erreurs coûteuses.

Le résultat? Des clients perdus, du capital immobilisé, et des décisions basées sur
des données obsolètes."
```

**On-screen animation**:
- Traditional workflow: Excel sheets, manual checks, errors (red X marks)
- SupplySync workflow: Real-time sync, AI detection, instant alerts (green checkmarks)

---

### Scene 3: Solution Introduction (0:30 - 0:45)

**Visuals**: SupplySync AI logo animation, dashboard preview

**Voiceover**:
```
"SupplySync AI est la vérité sur votre inventaire.

Nous synchronisons 5 ERPs en temps réel, détectons les anomalies avec 87% de précision,
et prévoyons la demande avec une erreur moyenne de seulement 8.5%.

Fini les exports CSV. Fini les erreurs coûteuses."
```

**On-screen text**:
- "5 ERPs supportés"
- "87% précision IA"
- "8.5% erreur prévision"
- "<2s latency"

---

### Scene 4: Live Dashboard Demo (0:45 - 1:30)

**Visuals**: Screen recording of actual dashboard with mouse interactions

**Voiceover** (synchronized with clicks):
```
"Voici le dashboard en temps réel de SupplySync AI.

[CLICK on Inventory Overview]
Vous voyez ici tous vos SKUs synchronisés depuis SAP, Oracle, ou tout autre ERP.

[HOVER over anomaly alert - red indicator]
Cette alerte rouge? Notre IA a détecté un prix anormal: +150% en 24 heures.
C'est probablement une erreur de saisie qui aurait coûté €50K si elle n'avait pas été détectée.

[CLICK on Demand Forecast chart]
Et ici, nos prévisions de demande pour les 30 prochains jours.
Vous voyez cette zone grisée? C'est l'intervalle de confiance à 95%.

[CLICK on ERP Sync Status]
Synchronisation en temps réel: dernière mise à jour il y a 1.2 secondes.
Plus besoin d'attendre des heures pour des exports batch."
```

**On-screen highlights**:
- Anomaly confidence: 92%
- Potential loss prevented: €50,000
- Forecast accuracy: 91.5%
- Sync latency: <2s

---

### Scene 5: Key Features (1:30 - 1:45)

**Visuals**: 3-column feature showcase with icons

**Voiceover**:
```
"Trois fonctionnalités clés:

1. Synchronisation temps réel: webhooks avec latence inférieure à 2 secondes
2. Détection d'anomalies: IA entraînée sur des millions de transactions
3. Prévisions de demande: algorithmes hybrides Prophet + LSTM

Le tout, sans modifier votre ERP existant."
```

**Animated icons**:
- ⚡ Real-time sync (pulsing connection lines)
- 🤖 AI anomaly detection (scanning radar effect)
- 📈 Demand forecasting (trending upward graph)

---

### Scene 6: Results & CTA (1:45 - 2:00)

**Visuals**: Customer testimonial cards with metrics, then SupplySync logo

**Voiceover**:
```
"Acme Corporation a réduit ses erreurs d'inventaire de 92% et économisé €800K en Q1.

TechSupply GmbH a gagné 75% de temps sur la gestion d'inventaire.

RetailPlus a réduit ses ruptures de stock de 65%.

Prêt à éliminer vos erreurs d'inventaire?

Démo gratuite de 15 minutes sur supplysync.ai."
```

**On-screen text**:
- "92% réduction erreurs"
- "€800K économisés"
- "75% temps gagné"
- **CTA button**: "RÉSERVER UNE DÉMO" (pulsing)

---

## Video 2: Technical Deep Dive (5 minutes)

### Scene 1: Architecture Overview (0:00 - 1:00)

**Visuals**: Animated architecture diagram

**Voiceover**:
```
"Bienvenue dans la deep dive technique de SupplySync AI.

Notre architecture est construite sur 3 piliers:

1. Backend NestJS: gestion des webhooks, API REST, et synchronisation
2. ML Service Python: détection d'anomalies et prévisions de demande
3. Frontend Next.js 15: dashboard temps réel avec WebSocket

Tout tourne sur Google Cloud Run pour un auto-scaling de 1 à 100 instances."
```

**Diagram animation** (step-by-step):
1. ERP systems (SAP, Oracle, Dynamics, NetSuite, Odoo)
2. Webhook layer with HMAC verification
3. Backend NestJS + PostgreSQL TimescaleDB
4. ML Service FastAPI + TensorFlow
5. Frontend Next.js with Socket.IO
6. Cloud Run infrastructure

---

### Scene 2: ERP Integration (1:00 - 2:00)

**Visuals**: Code snippets with syntax highlighting

**Voiceover**:
```
"Nous supportons 5 ERPs majeurs, chacun avec son propre protocole d'authentification.

[SHOW SAP connector code]
SAP S/4HANA: OAuth 2.0 Client Credentials avec Event Mesh pour les webhooks.

[SHOW Dynamics 365 connector code]
Dynamics 365: Azure AD OAuth avec Service Bus pour les événements temps réel.

[SHOW NetSuite connector code]
NetSuite: OAuth 1.0a Token-Based Authentication avec SuiteTalk REST API.

Chaque connecteur hérite de notre classe BaseConnector qui gère:
- Retry logic avec exponential backoff
- Rate limiting
- Caching Redis
- Webhook signature verification
"
```

**Code snippets** (highlighted sections):
```typescript
// SAP Connector
export class SAPConnector extends BaseConnector {
  async connect(): Promise<void> {
    const token = await this.getOAuthToken()
    this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
    await this.setupWebhook()
  }
}
```

---

### Scene 3: AI Models Explained (2:00 - 3:30)

**Visuals**: Model architecture diagrams + training graphs

**Voiceover**:
```
"Nos modèles d'IA utilisent une approche hybride pour maximiser la précision.

[SHOW Anomaly Detection diagram]
Détection d'anomalies: ensemble de Isolation Forest et LSTM Autoencoder.

Isolation Forest détecte les valeurs aberrantes (prix, quantités impossibles).
LSTM Autoencoder apprend les patterns temporels normaux et flagge les déviations.

Résultat: 87% de précision avec seulement 5% de faux positifs.

[SHOW Demand Forecasting diagram]
Prévisions de demande: hybride Prophet + LSTM.

Prophet capture la saisonnalité et les tendances long-terme.
LSTM modélise les dépendances complexes et les patterns non-linéaires.

Résultat: MAPE de 8.5% sur 30 jours, avec intervalles de confiance à 95%."
```

**Animated graphs**:
- Anomaly detection confusion matrix (precision/recall)
- Forecast vs. actual demand over time
- Model training loss curves

---

### Scene 4: Real-time Sync Demo (3:30 - 4:30)

**Visuals**: Live terminal + dashboard side-by-side

**Voiceover**:
```
"Voyons la synchronisation en temps réel en action.

[Terminal shows webhook incoming]
Voici un webhook SAP qui arrive: modification de prix sur SKU ABC-123.

[Dashboard updates instantly]
Et en moins de 2 secondes, le dashboard se met à jour.

[Anomaly alert appears]
Notre IA détecte immédiatement une anomalie: prix +200% en 1 heure.

[Email notification pops up]
Notification envoyée au responsable supply chain.

[Dashboard shows corrected price]
Prix corrigé manuellement, anomalie résolue.

Tout ça en temps réel, sans intervention de votre équipe IT."
```

**On-screen metrics**:
- Webhook received: 14:32:18.234
- Dashboard updated: 14:32:19.876
- Latency: 1.642s
- Anomaly detected: 14:32:20.103
- Notification sent: 14:32:20.456

---

### Scene 5: Scalability & Security (4:30 - 5:00)

**Visuals**: Infrastructure diagram with metrics

**Voiceover**:
```
"SupplySync AI est conçu pour la production enterprise.

Scalabilité: Google Cloud Run auto-scale de 1 à 100 instances en fonction du trafic.

Sécurité:
- HMAC-SHA256 signature verification sur tous les webhooks
- Chiffrement AES-256 pour les credentials ERP
- Logs d'audit complets avec timestamps
- Rate limiting à 100 req/min par tenant

Performance:
- p95 latency <500ms
- Uptime SLA 99.9%
- Backup quotidien avec retention 30 jours

Et tout ça pour €115 à €195 par mois en infrastructure."
```

**Metrics dashboard**:
- Auto-scaling graph (1-100 instances)
- Latency p95: 450ms
- Uptime: 99.94%
- Monthly cost: $145

---

## Video 3: Customer Success Story (3 minutes)

### Scene 1: Introduction (0:00 - 0:20)

**Visuals**: Acme Corporation logo, factory exterior shots

**On-screen text**: "Acme Corporation - Manufacturing, France - €8M revenue"

**Voiceover**:
```
"Acme Corporation, fabricant français de composants en acier,
perdait €1.2M par an en erreurs d'inventaire.

40 heures par semaine de vérifications manuelles.
Ruptures de stock fréquentes.
Surstock immobilisant €500K de capital.

Voici comment SupplySync AI a transformé leur supply chain."
```

---

### Scene 2: The Challenge (0:20 - 0:50)

**Visuals**: Interview with Supply Chain Director (B-roll of warehouse chaos)

**Supply Chain Director** (on camera):
```
"On utilisait SAP S/4HANA, mais la synchronisation avec nos 3 entrepôts
était un cauchemar.

Chaque matin, on exportait des CSV, on vérifiait manuellement les stocks,
et on découvrait des erreurs... souvent trop tard.

Les ruptures de stock nous coûtaient des clients.
Le surstock immobilisait notre trésorerie.

On savait qu'il fallait une solution, mais pas question de changer d'ERP."
```

**B-roll footage**:
- Excel spreadsheets with highlighted errors
- Warehouse with excess stock
- Empty shelves (stock-out)
- Team members manually counting inventory

---

### Scene 3: The Solution (0:50 - 1:30)

**Visuals**: Implementation timeline, dashboard setup

**Voiceover**:
```
"En janvier 2025, Acme Corporation a déployé SupplySync AI.

Semaine 1: Connexion SAP S/4HANA, audit initial de 17,000 SKUs
Semaine 2: Configuration des alertes anomalies et prévisions
Semaine 3: Formation de l'équipe (2 heures)
Semaine 4: Go-live en production

Zero downtime. Zero modification de SAP."
```

**Timeline animation** (week by week):
- Week 1: SAP connector activated, 17,000 SKUs synced
- Week 2: 127 anomalies detected in historical data
- Week 3: Team training completed (2h session)
- Week 4: Production launch

**Supply Chain Director** (on camera):
```
"Ce qui m'a bluffé, c'est la rapidité.
En 4 semaines, on était opérationnel.

Et surtout: pas besoin de toucher à notre SAP.
SupplySync AI s'est branché dessus en silence."
```

---

### Scene 4: The Results (1:30 - 2:30)

**Visuals**: Animated metrics with before/after comparison

**Voiceover**:
```
"Les résultats après 3 mois:

Erreurs d'inventaire: -92%
Temps de vérification: -75% (de 40h à 10h par semaine)
Économies Q1: €800K
ROI: 2.8x en 3 mois"
```

**Animated bar charts** (before/after):
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Order errors | 8.5% | 0.7% | -92% |
| Manual hours/week | 40h | 10h | -75% |
| Stock-outs | 23/month | 8/month | -65% |
| Excess inventory | €500K | €180K | -64% |

**Supply Chain Director** (on camera):
```
"La détection d'anomalies nous a sauvés plusieurs fois.

La semaine dernière, on a failli commander 10,000 unités au lieu de 1,000.
SupplySync AI a détecté l'anomalie en 2 secondes.

Ça nous a évité €150K d'erreur."
```

---

### Scene 5: Closing Testimonial (2:30 - 3:00)

**Visuals**: Modern clean warehouse with digital screens showing SupplySync dashboard

**Supply Chain Director** (on camera, final statement):
```
"Aujourd'hui, notre inventaire est sous contrôle.

On prend des décisions basées sur des données temps réel, pas sur des CSV de la veille.

L'équipe passe moins de temps à vérifier, et plus de temps à optimiser.

Si vous avez les mêmes problèmes qu'on avait, je recommande SupplySync AI sans hésiter.

ROI garanti en 3 mois."
```

**On-screen text** (fades in):
- "92% réduction erreurs"
- "€800K économisés en Q1"
- "ROI: 2.8x en 3 mois"
- "Setup: 4 semaines"

**CTA**:
"RÉSERVER UNE DÉMO GRATUITE"
supplysync.ai

---

## Video 4: Founder Story (90 seconds - LinkedIn/Social)

### Scene 1: Hook (0:00 - 0:10)

**Visuals**: Founder on camera, casual office background

**Founder** (direct to camera):
```
"Je m'appelle Erwan, et j'ai créé SupplySync AI parce que j'en avais marre
de voir des entreprises perdre des millions à cause d'erreurs d'inventaire stupides."
```

---

### Scene 2: The "Why" (0:10 - 0:40)

**Visuals**: B-roll of manufacturing floors, warehouses, logistics

**Founder** (voiceover):
```
"Pendant 10 ans, j'ai bossé en tant qu'ingénieur software.

J'ai vu des dizaines de PME avec le même problème:
des ERPs puissants (SAP, Oracle), mais des données obsolètes.

Résultat: des décisions prises sur des infos d'hier.

Les grosses boîtes ont des équipes de data scientists.
Les PME n'ont pas ce luxe.

Alors j'ai construit SupplySync AI: l'IA qui dit la vérité sur votre inventaire."
```

**B-roll footage**:
- ERP systems (SAP interface screenshots)
- Excel spreadsheets with errors
- Warehouse workers counting manually
- Empty shelves vs. overstocked shelves

---

### Scene 3: The Product (0:40 - 1:10)

**Visuals**: Dashboard demo (fast-paced, dynamic)

**Founder** (on camera):
```
"On synchronise 5 ERPs en temps réel.
On détecte les anomalies avec 87% de précision.
On prédit la demande avec une erreur de seulement 8.5%.

Et surtout: setup en 4 semaines, zéro modification de votre ERP.

Nos premiers clients économisent entre €500K et €1M par an.

ROI garanti en 3 mois."
```

**Quick cuts**:
- Dashboard inventory overview
- Anomaly alert popping up (red flag)
- Demand forecast graph trending up
- ERP sync status (green checkmarks)

---

### Scene 4: The Vision & CTA (1:10 - 1:30)

**Visuals**: Founder on camera, confident smile

**Founder**:
```
"On lève €500K pour scaler à 50 clients d'ici fin 2025.

Si vous êtes une PME qui galère avec l'inventaire,
ou un investisseur qui cherche du SaaS B2B avec des metrics exceptionnels,

Let's talk.

Lien dans la bio pour une démo de 15 minutes."
```

**On-screen text** (final frame):
- Erwan Henry
- Founder & CEO, SupplySync AI
- 📧 hello@supplysync.ai
- 🌐 supplysync.ai
- **CTA button**: "RÉSERVER UNE DÉMO"

---

## Video 5: Feature Spotlight - Anomaly Detection (60 seconds)

### Scene 1: Problem (0:00 - 0:15)

**Visuals**: Excel sheet with highlighted error, then warehouse chaos

**Voiceover**:
```
"Une erreur de saisie: 10,000 unités au lieu de 1,000.

Résultat: €150K de surstock.

Et vous ne le découvrez que 3 semaines plus tard, quand les palettes arrivent."
```

---

### Scene 2: Solution (0:15 - 0:45)

**Visuals**: SupplySync AI dashboard with anomaly detection in action

**Voiceover**:
```
"SupplySync AI détecte les anomalies en temps réel.

[SHOW anomaly alert]
Prix anormal: +200% en 24h → flaggé en 2 secondes.
Quantité impossible: 10,000 unités (10x moyenne) → alerte envoyée.
Stock négatif: -50 unités → erreur système détectée.

Notre IA analyse 9 features:
- Prix, quantité, taux de changement
- Moyennes mobiles, déviations
- Patterns temporels

Précision: 87%. Faux positifs: <5%."
```

**Animated diagram**:
- Isolation Forest detecting outliers
- LSTM Autoencoder learning normal patterns
- Ensemble voting for final decision

---

### Scene 3: Impact (0:45 - 1:00)

**Visuals**: Customer testimonial quote + metrics

**Voiceover**:
```
"Acme Corporation: 127 anomalies détectées en 3 mois.
Économies: €800K.

Votre inventaire mérite la vérité.

Demo gratuite sur supplysync.ai."
```

**On-screen quote**:
> "SupplySync AI nous a évité €150K d'erreur la semaine dernière. ROI immédiat."
> — Directeur Supply Chain, Acme Corp

---

## Video Production Notes

### Technical Specs
- **Resolution**: 1920x1080 (1080p)
- **Frame rate**: 30fps
- **Format**: MP4 (H.264 codec)
- **Audio**: 48kHz stereo, -14 LUFS loudness
- **Captions**: French (hardcoded) + English SRT file

### Visual Style
- **Color palette**: Dark blue (#1e3a8a), cyan (#06b6d4), white (#ffffff)
- **Typography**: Inter (modern, professional)
- **Transitions**: Smooth fades, 0.3s duration
- **Graphics**: Minimalist, data-driven
- **B-roll**: Professional, clean, well-lit

### Call-to-Action Buttons
- **Primary CTA**: "RÉSERVER UNE DÉMO" (bright cyan, pulsing animation)
- **Secondary CTA**: Email address, website URL
- **Placement**: Bottom-right corner, last 10 seconds of each video

### Platform Optimization

**YouTube**:
- Thumbnail: Bold text "87% PRÉCISION IA" with dashboard screenshot
- Title: "SupplySync AI - Éliminez les Erreurs d'Inventaire avec l'IA"
- Description: Include keywords (ERP, SAP, Oracle, inventaire, IA)
- Tags: SaaS, B2B, Supply Chain, AI, Machine Learning

**LinkedIn**:
- Square format (1:1) for feed optimization
- Captions mandatory (80% watch without sound)
- Keep under 90 seconds for higher completion rate
- Post text: Personal founder story + metrics

**Website** (supplysync.ai):
- Embed Video 1 (Product Overview) on homepage hero
- Embed Video 2 (Technical Deep Dive) on /technology page
- Embed Video 3 (Customer Story) on /customers page

---

## Filming Checklist

### Pre-Production
- [ ] Write detailed shot list
- [ ] Scout locations (office, warehouse, factory)
- [ ] Hire videographer (or DIY with DSLR + gimbal)
- [ ] Schedule customer interviews
- [ ] Prepare dashboard demo environment (staging)
- [ ] Create animated graphics (Figma → After Effects)

### Production
- [ ] Record voiceover (professional mic, treated room)
- [ ] Film founder segments (good lighting, clean background)
- [ ] Capture dashboard screen recordings (1080p, 60fps)
- [ ] Film customer testimonials (on-location or remote)
- [ ] B-roll footage (warehouse, office, team working)

### Post-Production
- [ ] Edit in DaVinci Resolve or Adobe Premiere
- [ ] Add motion graphics (After Effects)
- [ ] Color grading (consistent brand palette)
- [ ] Sound design (background music, SFX)
- [ ] Export with platform-specific settings
- [ ] Create captions (French + English)
- [ ] Generate thumbnails (Canva or Photoshop)

---

## Budget Estimate

**DIY Production** (€2,000 - €5,000):
- Videographer (2 days): €1,000
- Motion graphics designer: €800
- Voiceover artist: €300
- Stock footage: €200
- Equipment rental (lights, mic): €500
- Misc (travel, catering): €500

**Professional Agency** (€10,000 - €25,000):
- Full production package
- Scriptwriting, filming, editing
- Motion graphics, sound design
- Multiple revisions included

**Recommendation**: Start with DIY for MVP validation, upgrade to professional once you have paying customers and proven ROI.

---

**Last Updated**: 2025-01-06
**Version**: 1.0
