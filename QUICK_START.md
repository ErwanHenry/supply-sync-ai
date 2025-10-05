# SupplySync AI - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites

```bash
# Install dependencies
node >= 18.0.0
python >= 3.11
postgresql >= 15
redis >= 7
docker (optional)
```

### 1. Clone & Install

```bash
cd ~/supply-sync-ai

# Install all workspace dependencies
npm install

# Install Python dependencies (ML service)
cd ml-service
pip install -r requirements.txt
cd ..
```

### 2. Setup Environment

```bash
# Copy environment variables
cp agents/orchestrator/.env.example agents/orchestrator/.env

# Configure your keys in agents/orchestrator/.env:
ANTHROPIC_API_KEY=sk-ant-xxx
PINECONE_API_KEY=xxx
DATABASE_URL=postgresql://user:pass@localhost:5432/supplysync
```

### 3. Setup Database

```bash
# Start PostgreSQL + TimescaleDB (Docker)
docker run -d \
  --name supplysync-db \
  -e POSTGRES_PASSWORD=supplysync \
  -e POSTGRES_DB=supplysync \
  -p 5432:5432 \
  timescale/timescaledb:latest-pg15

# Run migrations
cd backend
npm run db:migrate
npm run db:generate

# Enable TimescaleDB
npx ts-node -e "
import { PrismaService } from './src/common/prisma/prisma.service';
const prisma = new PrismaService();
prisma.enableTimescaleDB().then(() => process.exit(0));
"
```

### 4. Start Development Servers

```bash
# Terminal 1: Start Agent Orchestrator (SyncOS Commander)
npm run dev:orchestrator

# Terminal 2: Start Backend (NestJS)
npm run dev:backend

# Terminal 3: Start ML Service (Python FastAPI)
npm run dev:ml

# Terminal 4: Start Frontend (Next.js) - coming soon
npm run dev:frontend
```

### 5. Verify Installation

Open http://localhost:3100/health (Orchestrator) and you should see:

```json
{
  "status": "healthy",
  "commander": "online",
  "agents": [
    { "id": "backend-architect", "status": "idle" },
    { "id": "ml-engineer", "status": "idle" },
    { "id": "frontend-dev", "status": "idle" },
    { "id": "integration-engineer", "status": "idle" },
    { "id": "qa-devops", "status": "idle" }
  ]
}
```

## 🤖 Using the PM Agent (SyncOS Commander)

### Plan a New Feature

```bash
curl -X POST http://localhost:3100/plan/feature \
  -H "Content-Type: application/json" \
  -d '{"description": "Add predictive stock alerts"}'
```

Response:
```json
{
  "feature": "Add predictive stock alerts",
  "riceScore": 22.4,
  "priority": "High",
  "recommendation": "Add to Sprint 2 - high impact, reasonable effort"
}
```

### Delegate Task to Agent

```bash
curl -X POST http://localhost:3100/delegate \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "ml-engineer",
    "task": "Design demand forecasting model with Prophet + LSTM"
  }'
```

### Get Product Roadmap

```bash
curl http://localhost:3100/roadmap
```

### View Metrics

```bash
curl http://localhost:3100/metrics
```

## 📊 Development Workflow

### 1. PM Agent Plans Feature

```typescript
const feature = await commander.planFeature("Real-time ERP sync");
// Returns RICE score, priority, sprint recommendation
```

### 2. Delegate to Agent Team

```bash
# Backend Architect designs API
POST /delegate { agentName: "backend-architect", task: "Design sync API" }

# ML Engineer trains model
POST /delegate { agentName: "ml-engineer", task: "Train anomaly detection" }

# Frontend Dev builds UI
POST /delegate { agentName: "frontend-dev", task: "Build sync dashboard" }

# Integration Engineer connects ERP
POST /delegate { agentName: "integration-engineer", task: "SAP connector" }

# QA/DevOps tests & deploys
POST /delegate { agentName: "qa-devops", task: "E2E tests + deploy" }
```

### 3. Monitor Progress

```bash
# Check agent status
curl http://localhost:3100/agents

# View metrics
curl http://localhost:3100/metrics
```

## 🔧 Common Commands

### Backend Development

```bash
cd backend

# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# View database
npm run db:studio

# Run tests
npm test

# Start dev server
npm run dev
```

### ML Service Development

```bash
cd ml-service

# Install dependencies
pip install -r requirements.txt

# Run tests
pytest

# Start dev server
uvicorn src.main:app --reload
```

### Agent Development

```bash
cd agents/orchestrator

# Start orchestrator
npm run dev

# Initialize agents
npm run init

# Stop agents
npm run stop
```

## 📚 Next Steps

1. **Explore Documentation**
   - [Architecture Overview](./docs/architecture/overview.md)
   - [API Reference](./docs/api/reference.md)
   - [Agent System](./docs/agents/system.md)

2. **Build Your First Feature**
   - Use PM Agent to plan feature
   - Delegate to agent team
   - Monitor progress via API

3. **Deploy to Production**
   - [Deployment Guide](./docs/deployment/guide.md)
   - Configure CI/CD (GitHub Actions)
   - Setup infrastructure (Terraform)

## 🆘 Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
docker ps | grep supplysync-db

# Restart database
docker restart supplysync-db
```

### Agent Not Responding

```bash
# Check agent status
curl http://localhost:3100/agents

# Restart orchestrator
npm run dev:orchestrator
```

### Missing Environment Variables

```bash
# Verify .env file exists
cat agents/orchestrator/.env

# Copy from example if needed
cp agents/orchestrator/.env.example agents/orchestrator/.env
```

## 💡 Tips

- **Use PM Agent for all planning** - RICE scoring ensures optimal prioritization
- **Delegate complex tasks to specialists** - Each agent is optimized for specific work
- **Monitor metrics continuously** - Real-time dashboard tracks MRR, CAC, LTV, churn
- **Iterate rapidly** - Agent team delivers 3x faster than traditional development

---

**Ready to build the future of B2B inventory management? Let's go! 🚀**
