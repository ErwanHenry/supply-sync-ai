# SupplySync AI - Deployment Guide

Complete guide for deploying SupplySync AI to production.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Production Architecture                  │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│   Frontend   │       │   Backend    │       │  ML Service  │
│   (Vercel)   │◄─────►│ (Cloud Run)  │◄─────►│ (Cloud Run)  │
│   Next.js    │       │   NestJS     │       │   FastAPI    │
└──────────────┘       └──────────────┘       └──────────────┘
                              │                       │
                              ▼                       ▼
                       ┌──────────────┐       ┌──────────────┐
                       │  PostgreSQL  │       │    Redis     │
                       │ (TimescaleDB)│       │  (Managed)   │
                       └──────────────┘       └──────────────┘
                              │
                              ▼
                       ┌──────────────┐
                       │ ERP Webhooks │
                       │ SAP/Oracle/  │
                       │ Dynamics365/ │
                       │ NetSuite/Odoo│
                       └──────────────┘
```

## Prerequisites

### 1. Accounts & Credentials

- **Vercel Account** (for frontend)
- **Google Cloud Platform** (for backend + ML service)
- **GitHub Account** (for CI/CD)
- **Slack Webhook** (optional, for notifications)

### 2. Environment Variables

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://backend-url.run.app
NEXT_PUBLIC_ML_API_URL=https://ml-service-url.run.app
```

#### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/supplysync

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key

# ERP Webhooks
SAP_WEBHOOK_SECRET=your-sap-secret
DYNAMICS_WEBHOOK_SECRET=your-dynamics-secret
NETSUITE_WEBHOOK_SECRET=your-netsuite-secret
ODOO_WEBHOOK_SECRET=your-odoo-secret
```

#### ML Service (.env)
```bash
# No specific env vars needed for ML service
```

### 3. GitHub Secrets

Configure these in GitHub repository settings (Settings → Secrets and variables → Actions):

```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID_FRONTEND
GCP_SA_KEY (JSON service account key)
GCP_PROJECT_ID
DATABASE_URL
REDIS_HOST
REDIS_PORT
SLACK_WEBHOOK_URL (optional)
```

## Step-by-Step Deployment

### Phase 1: Database Setup

1. **Create PostgreSQL database with TimescaleDB**

```bash
# Using Google Cloud SQL
gcloud sql instances create supplysync-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=europe-west1

# Enable TimescaleDB extension
gcloud sql connect supplysync-db
CREATE EXTENSION IF NOT EXISTS timescaledb;
```

2. **Run Prisma migrations**

```bash
cd backend
DATABASE_URL="postgresql://..." npx prisma migrate deploy
npx prisma generate
```

### Phase 2: Redis Setup

```bash
# Using Google Cloud Memorystore
gcloud redis instances create supplysync-redis \
  --size=1 \
  --region=europe-west1 \
  --redis-version=redis_7_0
```

### Phase 3: Backend Deployment (Cloud Run)

1. **Build and push Docker image**

```bash
cd backend

# Build
docker build -t gcr.io/your-project/supplysync-backend .

# Push
docker push gcr.io/your-project/supplysync-backend

# Deploy
gcloud run deploy supplysync-backend \
  --image gcr.io/your-project/supplysync-backend \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL="..." \
  --set-env-vars REDIS_HOST="..." \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10
```

2. **Get backend URL**

```bash
gcloud run services describe supplysync-backend --region europe-west1 --format 'value(status.url)'
```

### Phase 4: ML Service Deployment (Cloud Run)

```bash
cd ml-service

# Build
docker build -t gcr.io/your-project/supplysync-ml .

# Push
docker push gcr.io/your-project/supplysync-ml

# Deploy
gcloud run deploy supplysync-ml \
  --image gcr.io/your-project/supplysync-ml \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 2 \
  --min-instances 0 \
  --max-instances 5
```

### Phase 5: Frontend Deployment (Vercel)

1. **Install Vercel CLI**

```bash
npm install -g vercel
```

2. **Deploy**

```bash
cd frontend
vercel --prod
```

3. **Configure environment variables in Vercel dashboard**

```
NEXT_PUBLIC_API_URL=https://supplysync-backend-xxx.run.app
NEXT_PUBLIC_ML_API_URL=https://supplysync-ml-xxx.run.app
```

### Phase 6: Configure ERP Webhooks

For each ERP system, configure webhooks to point to:

```
SAP:         https://your-backend.run.app/webhooks/sap
Oracle:      https://your-backend.run.app/webhooks/oracle
Dynamics365: https://your-backend.run.app/webhooks/dynamics365
NetSuite:    https://your-backend.run.app/webhooks/netsuite
Odoo:        https://your-backend.run.app/webhooks/odoo
```

**Example: SAP Event Mesh Configuration**

```bash
# In SAP Event Mesh console
POST /sap/eventmesh/subscriptions
{
  "name": "SupplySync_Inventory_Updates",
  "events": [
    "sap.s4.beh.materialstock.v1.MaterialStock.Changed.v1"
  ],
  "webhook": {
    "url": "https://your-backend.run.app/webhooks/sap",
    "method": "POST",
    "headers": {
      "X-Webhook-Secret": "your-sap-webhook-secret"
    }
  }
}
```

## CI/CD Pipeline

### Automatic Deployment

Push to `main` branch triggers:

1. **CI Pipeline** (`ci.yml`)
   - ✅ Backend tests (NestJS + PostgreSQL + Redis)
   - ✅ Frontend tests (Next.js build + lint)
   - ✅ ML tests (Python pytest + coverage)
   - ✅ ERP connectors tests
   - ✅ Security audit
   - ✅ Code quality checks

2. **Deployment Pipeline** (`deploy.yml`)
   - ✅ Deploy frontend to Vercel
   - ✅ Build & deploy backend to Cloud Run
   - ✅ Build & deploy ML service to Cloud Run
   - ✅ Run database migrations
   - ✅ Send Slack notification

### Manual Deployment

```bash
# Backend
gcloud run deploy supplysync-backend --source .

# ML Service
gcloud run deploy supplysync-ml --source .

# Frontend
vercel --prod
```

## Monitoring & Observability

### 1. Cloud Run Metrics

```bash
# Backend metrics
gcloud run services describe supplysync-backend --region europe-west1

# ML Service metrics
gcloud run services describe supplysync-ml --region europe-west1
```

### 2. Logs

```bash
# Backend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=supplysync-backend" --limit 50

# ML Service logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=supplysync-ml" --limit 50
```

### 3. Health Checks

```bash
# Backend health
curl https://your-backend.run.app/health

# ML Service health
curl https://your-ml-service.run.app/health

# Frontend
curl https://your-frontend.vercel.app/api/health
```

## Scaling Configuration

### Backend Auto-Scaling

```yaml
Min instances: 1
Max instances: 10
CPU: 1 vCPU
Memory: 512 MiB
Concurrency: 80 requests
```

### ML Service Auto-Scaling

```yaml
Min instances: 0 (scale to zero)
Max instances: 5
CPU: 2 vCPU
Memory: 2 GiB
Concurrency: 10 requests (ML-intensive)
```

## Cost Estimation

### Monthly Costs (moderate usage)

| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| **Cloud Run (Backend)** | 1-10 instances, 512MiB | $20-50 |
| **Cloud Run (ML)** | 0-5 instances, 2GiB | $30-80 |
| **Cloud SQL (PostgreSQL)** | db-f1-micro | $15 |
| **Memorystore (Redis)** | 1GB | $30 |
| **Vercel (Frontend)** | Pro plan | $20 |
| **Total** | | **$115-195/month** |

## Rollback Strategy

### Backend/ML Service Rollback

```bash
# List revisions
gcloud run revisions list --service supplysync-backend --region europe-west1

# Rollback to specific revision
gcloud run services update-traffic supplysync-backend \
  --to-revisions REVISION_NAME=100 \
  --region europe-west1
```

### Frontend Rollback

```bash
# In Vercel dashboard: Deployments → Select previous → Promote to Production
```

## Security Best Practices

1. **Use Secret Manager for sensitive data**
```bash
gcloud secrets create database-url --data-file=- <<< "postgresql://..."
```

2. **Enable Cloud Run authentication** (if not public)
```bash
gcloud run services update supplysync-backend --no-allow-unauthenticated
```

3. **Restrict API access with API Gateway**
4. **Enable Cloud Armor for DDoS protection**
5. **Regular security audits via CI/CD**

## Troubleshooting

### Backend won't start

```bash
# Check logs
gcloud run logs read --service supplysync-backend --limit 100

# Common issues:
# - DATABASE_URL not set
# - Redis connection failed
# - Prisma Client not generated
```

### ML Service slow response

```bash
# Increase memory/CPU
gcloud run services update supplysync-ml --memory 4Gi --cpu 4

# Check cold start times
# Solution: Set min-instances=1 to avoid cold starts
```

### Frontend can't reach backend

```bash
# Verify NEXT_PUBLIC_API_URL is set correctly
# Check CORS configuration in backend
# Ensure Cloud Run service allows unauthenticated requests
```

## Next Steps

1. **Set up monitoring alerts** (Cloud Monitoring)
2. **Configure backup strategy** (Cloud SQL automated backups)
3. **Implement rate limiting** (Cloud Armor)
4. **Set up custom domain** (Vercel + Cloud Run)
5. **Enable SSL certificates** (automatic with Vercel/Cloud Run)

## Support

For deployment issues:
1. Check GitHub Actions logs
2. Review Cloud Run logs
3. Contact: support@supplysync.ai

---

**Last Updated**: 2025-01-06
**Version**: 1.0.0
