# SupplySync AI - Frontend Dashboard

Real-time B2B inventory dashboard with AI-powered anomaly detection and demand forecasting.

## 🎯 Features

### Real-Time Updates
- 🔄 **WebSocket Integration** - Live inventory sync updates
- 🚨 **Anomaly Alerts** - Instant notifications for detected issues
- 📊 **Live Metrics** - Real-time KPIs and charts

### AI-Powered Insights
- 🤖 **Anomaly Detection** - Price spikes, impossible quantities, stock jumps
- 📈 **Demand Forecasting** - 7-30 day predictions with confidence intervals
- 🎯 **Accuracy Metrics** - MAPE, RMSE, MAE displayed

### Data Visualization
- 📊 **Charts** - Recharts for beautiful, interactive visualizations
- 📉 **Confidence Intervals** - Shaded areas for forecast uncertainty
- 🎨 **Color-Coded Severity** - Critical, high, medium, low alerts

### ERP Integration Status
- 🟢 **Connection Monitoring** - SAP, Oracle, Dynamics, NetSuite, Odoo
- ⏱️ **Sync Status** - Last sync time, items synced, duration
- ⚠️ **Error Tracking** - Connection issues, timeout alerts

## 🚀 Quick Start

### Prerequisites

```bash
# Node.js 18+
node --version

# Install dependencies
npm install
```

### Development

```bash
# Start dev server
npm run dev

# Open browser
http://localhost:3000
```

### Build for Production

```bash
# Build
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Dashboard page
│   │   └── globals.css         # Global styles
│   │
│   ├── components/
│   │   └── dashboard/
│   │       ├── InventoryOverview.tsx    # Inventory stats + chart
│   │       ├── AnomalyAlerts.tsx        # Anomaly list + details
│   │       ├── DemandForecasts.tsx      # Forecast chart + table
│   │       ├── SyncStatus.tsx           # Sync logs
│   │       └── ERPConnections.tsx       # ERP connection cards
│   │
│   ├── hooks/
│   │   └── useWebSocket.ts     # WebSocket real-time hook
│   │
│   ├── store/
│   │   └── inventoryStore.ts   # Zustand state management
│   │
│   └── lib/
│       └── apiClient.ts        # API client (backend + ML)
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## 🎨 Components

### 1. InventoryOverview
Displays inventory statistics and category breakdown.

```tsx
<InventoryOverview />
```

**Features:**
- Total value (€2.45M)
- Total items (12,458)
- Category bar chart (Electronics, Clothing, Food, Tools)

### 2. AnomalyAlerts
Real-time anomaly detection alerts with severity and recommended actions.

```tsx
<AnomalyAlerts />
```

**Anomaly Types:**
- 💰 Price Spike (50%+ deviation)
- 📦 Impossible Quantity (negative, extreme)
- 📈 Stock Jump (200%+ change)
- ⚠️ General Anomaly

**Severity Levels:**
- 🔴 Critical (pause sync)
- 🟠 High (verify immediately)
- 🟡 Medium (monitor closely)
- 🔵 Low (informational)

### 3. DemandForecasts
7-30 day demand forecasting with Prophet + LSTM ensemble.

```tsx
<DemandForecasts />
```

**Features:**
- Interactive line chart with confidence intervals
- Selectable SKUs and forecast horizons
- Accuracy metrics (MAPE: 8.5%, MAE: 9.8)
- Forecast details table

### 4. SyncStatus
Displays recent ERP sync logs with status and duration.

```tsx
<SyncStatus />
```

**Status Types:**
- ✅ Success (items synced, duration)
- ❌ Error (error message, retry)
- ⚠️ Partial (some items failed)

### 5. ERPConnections
Grid of ERP connection cards showing status.

```tsx
<ERPConnections />
```

**Connections:**
- 🟢 SAP (connected, 1,250 items)
- 🟢 Oracle (connected, 850 items)
- 🔴 Dynamics 365 (error)
- 🟢 NetSuite (connected, 620 items)
- ⚪ Odoo (disconnected)

## 🔌 WebSocket Integration

### useWebSocket Hook

```tsx
const { isConnected, lastMessage, sendMessage } = useWebSocket()

useEffect(() => {
  if (lastMessage?.type === 'anomaly:detected') {
    // Handle anomaly alert
    toast.error(`🚨 ${lastMessage.data.anomaly_type}`)
  }
}, [lastMessage])
```

### Events

**Incoming:**
- `inventory:update` - Item quantity/price changed
- `anomaly:detected` - Anomaly detected by ML service
- `sync:started` - ERP sync initiated
- `sync:completed` - ERP sync finished successfully
- `sync:error` - ERP sync failed

**Outgoing:**
- `subscribe:inventory` - Subscribe to inventory updates
- `unsubscribe:inventory` - Unsubscribe from updates

## 📊 State Management

### Zustand Store

```tsx
import { useInventoryStore } from '@/store/inventoryStore'

const { inventory, anomalies, syncLogs, updateInventory } = useInventoryStore()
```

**Store Methods:**
- `setInventory(items)` - Set full inventory list
- `updateInventory(message)` - Handle WebSocket update
- `addAnomaly(anomaly)` - Add new anomaly alert
- `addSyncLog(log)` - Add sync log entry
- `setAnomalies(anomalies)` - Set full anomaly list

## 🎨 Styling

### Tailwind CSS

**Color Scheme:**
- Primary: Blue (#3b82f6)
- Success: Green (#22c55e)
- Warning: Yellow (#f59e0b)
- Danger: Red (#ef4444)

**Custom Classes:**
```css
.card {
  @apply bg-white rounded-lg shadow-sm p-6;
}

.metric-value {
  @apply text-3xl font-bold text-gray-900;
}
```

## 🔧 Configuration

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_ML_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

### API Endpoints

**Backend (NestJS):**
- `GET /api/v1/inventory` - Get inventory items
- `GET /api/v1/anomalies` - Get anomaly alerts
- `GET /api/v1/sync-logs` - Get sync logs
- `GET /api/v1/erp-connections` - Get ERP connections

**ML Service (Python FastAPI):**
- `POST /api/ml/detect-anomaly` - Detect anomalies
- `POST /api/ml/forecast-demand` - Forecast demand
- `GET /api/ml/models/info` - Get model info

## 🚀 Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Environment variables
vercel env add NEXT_PUBLIC_API_URL
vercel env add NEXT_PUBLIC_ML_API_URL
vercel env add NEXT_PUBLIC_WS_URL
```

### Docker

```bash
# Build
docker build -t supplysync-frontend .

# Run
docker run -p 3000:3000 supplysync-frontend
```

## 📝 Development Tips

### Hot Reload

Changes to components automatically refresh the browser.

### Type Safety

All components use TypeScript for type safety.

```tsx
interface InventoryItem {
  id: string
  sku: string
  quantity: number
  price: number
}
```

### Debugging WebSocket

```tsx
// Enable debug logging
const { isConnected, lastMessage } = useWebSocket()

useEffect(() => {
  console.log('WebSocket connected:', isConnected)
  console.log('Last message:', lastMessage)
}, [isConnected, lastMessage])
```

## 🐛 Troubleshooting

### WebSocket Won't Connect

```bash
# Check backend is running
curl http://localhost:3001/health

# Check WebSocket server
curl http://localhost:3001/socket.io/

# Verify environment variable
echo $NEXT_PUBLIC_WS_URL
```

### Charts Not Rendering

```bash
# Install Recharts
npm install recharts

# Clear Next.js cache
rm -rf .next
npm run dev
```

### API Calls Failing

```bash
# Check backend is running
curl http://localhost:3001/api/v1/inventory

# Check ML service is running
curl http://localhost:8000/health

# Check CORS settings
```

## 📚 Resources

- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Recharts Documentation](https://recharts.org/)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 📄 License

Proprietary - SupplySync AI © 2025

---

**Built with ❤️ for real-time B2B inventory management**
