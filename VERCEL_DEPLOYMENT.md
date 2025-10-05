# SupplySync AI - Vercel Deployment Guide

## 🚀 Deployment Status

**Landing Page**: Deployed on Vercel
**URL**: https://supply-sync-ai.vercel.app (or custom domain)

---

## 📋 Deployment Checklist

### ✅ Step 1: Landing Page Deployment (DONE)

The landing page (Next.js 15) is now deployed on Vercel.

**Project Settings:**
- **Framework**: Next.js
- **Root Directory**: `landing-page/`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`
- **Node Version**: 18.x or 20.x

---

### 🔧 Step 2: Environment Variables (Optional)

If you want to add email capture functionality, add these variables in Vercel dashboard:

**Settings → Environment Variables:**

```env
# Email service (optional - for contact form)
NEXT_PUBLIC_CONTACT_EMAIL=hello@supplysync.ai

# Analytics (optional)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=supplysync.ai

# API endpoint (when backend is deployed)
NEXT_PUBLIC_API_URL=https://api.supplysync.ai
```

---

### 🌐 Step 3: Custom Domain (Recommended)

**Option A: Buy domain on Vercel**
1. Go to **Settings → Domains**
2. Click "Buy domain"
3. Search for `supplysync.ai` or similar
4. Complete purchase

**Option B: Use existing domain**
1. Go to **Settings → Domains**
2. Add your domain: `supplysync.ai`
3. Configure DNS records:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

**Recommended domains:**
- `supplysync.ai` (primary)
- `supply-sync.ai` (alternative)
- `supplysync.io` (tech-focused)

---

### 📊 Step 4: Analytics Setup (Optional)

**Google Analytics:**
```bash
npm install --save next/third-parties
```

Then add to `landing-page/src/app/layout.tsx`:
```typescript
import { GoogleAnalytics } from '@next/third-parties/google'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>{children}</body>
      <GoogleAnalytics gaId="G-XXXXXXXXXX" />
    </html>
  )
}
```

**Plausible Analytics** (privacy-friendly alternative):
```html
<!-- Add to <head> in layout.tsx -->
<script defer data-domain="supplysync.ai" src="https://plausible.io/js/script.js"></script>
```

---

### 📧 Step 5: Email Capture Integration

**Option A: Formspree (easiest)**
1. Sign up at https://formspree.io
2. Create form endpoint
3. Update form action in `landing-page/src/app/page.tsx`:

```typescript
<form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
  <input type="email" name="email" required />
  <button type="submit">Réserver une démo</button>
</form>
```

**Option B: Vercel Serverless Function**

Create `landing-page/api/contact.ts`:
```typescript
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { email, name, company } = req.body

  // Send email via SendGrid, Resend, or Mailgun
  // Or save to database

  return res.status(200).json({ message: 'Success' })
}
```

**Option C: HubSpot Forms** (for CRM integration)
1. Create form in HubSpot
2. Embed script in landing page
3. Auto-sync leads to CRM

---

### 🔒 Step 6: Security Headers (Already configured)

The `vercel.json` includes security headers:
- ✅ X-Frame-Options: DENY (prevent clickjacking)
- ✅ X-Content-Type-Options: nosniff
- ✅ Referrer-Policy: strict-origin-when-cross-origin
- ✅ Permissions-Policy (disable camera, microphone, geolocation)

---

### ⚡ Step 7: Performance Optimization

**Image Optimization** (automatically enabled with Next.js)
- Images served as WebP
- Lazy loading enabled
- Responsive images

**Code Splitting** (automatic)
- Route-based splitting
- Dynamic imports for large components

**Caching**
- Static assets: 31536000s (1 year)
- HTML: revalidate on deploy

**Check performance:**
- Lighthouse score: https://pagespeed.web.dev
- Vercel Analytics: Settings → Analytics

---

### 📱 Step 8: Social Media Cards

Add Open Graph and Twitter meta tags to `landing-page/src/app/layout.tsx`:

```typescript
export const metadata = {
  title: 'SupplySync AI - B2B Inventory Truth Engine',
  description: 'Éliminez les erreurs d\'inventaire avec l\'IA. Synchronisation ERP temps réel, détection d\'anomalies 87%, prévisions de demande. ROI 2.8x en 3 mois.',
  openGraph: {
    title: 'SupplySync AI - B2B Inventory Truth Engine',
    description: 'Éliminez les erreurs d\'inventaire avec l\'IA',
    url: 'https://supplysync.ai',
    siteName: 'SupplySync AI',
    images: [
      {
        url: 'https://supplysync.ai/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SupplySync AI - B2B Inventory Truth Engine',
    description: 'Éliminez les erreurs d\'inventaire avec l\'IA',
    images: ['https://supplysync.ai/twitter-image.png'],
  },
}
```

**Create og-image.png:**
- Size: 1200x630px
- Include: Logo, tagline, key metric (87% AI precision)
- Tool: Canva, Figma, or https://www.opengraph.xyz

---

### 🎯 Step 9: Conversion Tracking

**Add tracking pixels for ads:**

```typescript
// Google Ads conversion
<Script id="google-ads-conversion">
  {`gtag('event', 'conversion', {'send_to': 'AW-XXXXXXXXX/XXXXXXXXXXXXXX'})`}
</Script>

// LinkedIn Insight Tag
<Script id="linkedin-insight">
  {`_linkedin_partner_id = "XXXXXX"; window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || []; window._linkedin_data_partner_ids.push(_linkedin_partner_id);`}
</Script>

// Facebook Pixel
<Script id="facebook-pixel">
  {`!function(f,b,e,v,n,t,s){...}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js'); fbq('init', 'XXXXXXXXXXXXXXXX'); fbq('track', 'PageView');`}
</Script>
```

---

### 🚀 Step 10: Deploy Backend & ML Service (Future)

When ready to deploy backend:

**Backend (Google Cloud Run):**
1. Build Docker image: `docker build -t backend:latest ./backend`
2. Push to GCR: `docker push gcr.io/PROJECT_ID/backend`
3. Deploy: `gcloud run deploy backend --image gcr.io/PROJECT_ID/backend`
4. Set environment variables (DATABASE_URL, REDIS_URL, etc.)

**ML Service (Google Cloud Run with GPU):**
1. Build: `docker build -t ml-service:latest ./ml-service`
2. Push: `docker push gcr.io/PROJECT_ID/ml-service`
3. Deploy: `gcloud run deploy ml-service --image gcr.io/PROJECT_ID/ml-service --gpu 1`

**Connect landing page to backend:**
- Update `NEXT_PUBLIC_API_URL` in Vercel env vars
- Update API proxy in `vercel.json` rewrites

---

### 📊 Step 11: Monitoring & Alerts

**Vercel Dashboard:**
- Settings → Monitoring: Enable
- Set up alerts for:
  - Build failures
  - High error rate (>5%)
  - Slow response time (>3s)

**External Monitoring:**
- **UptimeRobot**: Free ping monitoring (https://uptimerobot.com)
- **Sentry**: Error tracking (https://sentry.io)
- **LogRocket**: Session replay (https://logrocket.com)

**Add Sentry:**
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

---

### 🎨 Step 12: A/B Testing (Optional)

**Vercel Edge Middleware for A/B testing:**

Create `landing-page/middleware.ts`:
```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const bucket = Math.random() < 0.5 ? 'A' : 'B'
  const response = NextResponse.next()
  response.cookies.set('ab-test-bucket', bucket)
  return response
}
```

**Test variations:**
- Variant A: Current hero text
- Variant B: Different value proposition
- Track conversions in Google Analytics

---

### 📋 Post-Deployment Checklist

- [ ] Landing page deployed on Vercel ✅
- [ ] Custom domain configured (supplysync.ai)
- [ ] SSL certificate active (automatic with Vercel)
- [ ] Environment variables set (if needed)
- [ ] Analytics tracking (Google Analytics or Plausible)
- [ ] Email capture working (Formspree or serverless function)
- [ ] Social media cards (og-image.png created)
- [ ] Lighthouse score >90 (performance, accessibility, SEO)
- [ ] Mobile responsive tested
- [ ] Forms tested (email capture, demo request)
- [ ] Monitoring enabled (Vercel + UptimeRobot)
- [ ] Error tracking (Sentry)
- [ ] Git repository synced with Vercel

---

### 🔗 Useful Links

**Vercel Dashboard:**
- Project: https://vercel.com/dashboard
- Analytics: https://vercel.com/analytics
- Logs: https://vercel.com/logs

**Documentation:**
- Next.js: https://nextjs.org/docs
- Vercel: https://vercel.com/docs
- Tailwind CSS: https://tailwindcss.com/docs

**Tools:**
- Lighthouse: https://pagespeed.web.dev
- OG Image Generator: https://www.opengraph.xyz
- Formspree: https://formspree.io
- Plausible Analytics: https://plausible.io

---

### 🎯 Next Steps

**Immediate (Week 1):**
1. Configure custom domain (supplysync.ai)
2. Set up email capture (Formspree or HubSpot)
3. Add Google Analytics tracking
4. Create og-image.png for social sharing
5. Test all forms and links

**Short-term (Month 1):**
1. Deploy backend API to Google Cloud Run
2. Connect landing page to backend API
3. Set up automated email sequences (when lead captured)
4. A/B test hero section variations
5. Add customer testimonials (Acme Corp, TechSupply)

**Long-term (Quarter 1):**
1. Deploy ML service to Cloud Run
2. Create demo environment (app.supplysync.ai)
3. Video production (5 scripts ready)
4. SEO optimization (blog content)
5. Paid ads (Google Ads, LinkedIn Ads)

---

### 💡 Pro Tips

**Performance:**
- Use `next/image` for all images (automatic optimization)
- Preload critical fonts in `layout.tsx`
- Minimize JavaScript bundle (<200KB)

**SEO:**
- Add sitemap.xml (automatic with Next.js)
- robots.txt (allow all)
- Schema.org markup (SoftwareApplication)

**Conversion:**
- Single clear CTA: "Réserver une démo"
- Social proof: "3 clients, €800K économisés"
- Trust signals: Logos (SAP, Oracle, etc.)

**Security:**
- Enable Vercel Firewall (Pro plan)
- Rate limiting on API routes
- CAPTCHA on forms (hCaptcha or reCAPTCHA)

---

### 🆘 Troubleshooting

**Build fails:**
- Check Node version (18.x or 20.x)
- Run `npm install` locally
- Check build logs in Vercel dashboard

**404 on deployment:**
- Verify Root Directory is `landing-page/`
- Check `next.config.js` configuration
- Ensure `package.json` has correct scripts

**Slow performance:**
- Enable Image Optimization (automatic)
- Check bundle size: `npm run build` → `.next/analyze`
- Use `next/dynamic` for code splitting

**Email form not working:**
- Verify Formspree endpoint
- Check CORS settings
- Test with curl: `curl -X POST https://formspree.io/f/YOUR_ID -d email=test@test.com`

---

**Deployment Date**: 2025-01-06
**Status**: ✅ LIVE on Vercel
**URL**: https://supply-sync-ai.vercel.app

**Next step**: Configure custom domain (supplysync.ai) 🚀
