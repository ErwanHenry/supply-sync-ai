import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Clean existing data (in reverse order of dependencies)
  console.log('🧹 Cleaning existing data...')
  await prisma.anomalyAlert.deleteMany()
  await prisma.demandForecast.deleteMany()
  await prisma.inventorySnapshot.deleteMany()
  await prisma.syncLog.deleteMany()
  await prisma.inventoryItem.deleteMany()
  await prisma.erpConnection.deleteMany()
  await prisma.company.deleteMany()
  await prisma.user.deleteMany()

  // Create demo companies
  console.log('🏢 Creating demo companies...')

  const acmeCorp = await prisma.company.create({
    data: {
      name: 'Acme Corporation',
      industry: 'Manufacturing',
      size: 'MEDIUM',
      country: 'FR',
    },
  })

  const techSupply = await prisma.company.create({
    data: {
      name: 'TechSupply GmbH',
      industry: 'Technology Distribution',
      size: 'LARGE',
      country: 'DE',
    },
  })

  const retailPlus = await prisma.company.create({
    data: {
      name: 'RetailPlus SAS',
      industry: 'Retail',
      size: 'SMALL',
      country: 'FR',
    },
  })

  // Create demo users
  console.log('👥 Creating demo users...')

  const hashedPassword = await bcrypt.hash('Demo123!', 10)

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@acmecorp.com',
      passwordHash: hashedPassword,
      firstName: 'John',
      lastName: 'Admin',
      role: 'ADMIN',
      companyId: acmeCorp.id,
    },
  })

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@techsupply.de',
      passwordHash: hashedPassword,
      firstName: 'Maria',
      lastName: 'Schmidt',
      role: 'MANAGER',
      companyId: techSupply.id,
    },
  })

  const viewerUser = await prisma.user.create({
    data: {
      email: 'viewer@retailplus.fr',
      passwordHash: hashedPassword,
      firstName: 'Pierre',
      lastName: 'Dupont',
      role: 'VIEWER',
      companyId: retailPlus.id,
    },
  })

  // Create ERP connections
  console.log('🔌 Creating ERP connections...')

  const sapConnection = await prisma.erpConnection.create({
    data: {
      companyId: acmeCorp.id,
      erpSystem: 'SAP',
      status: 'ACTIVE',
      syncMethod: 'HYBRID',
      lastSyncAt: new Date(),
    },
  })

  const oracleConnection = await prisma.erpConnection.create({
    data: {
      companyId: techSupply.id,
      erpSystem: 'Oracle',
      status: 'ACTIVE',
      syncMethod: 'POLLING',
      lastSyncAt: new Date(),
    },
  })

  const odooConnection = await prisma.erpConnection.create({
    data: {
      companyId: retailPlus.id,
      erpSystem: 'Odoo',
      status: 'ACTIVE',
      syncMethod: 'WEBHOOK',
      lastSyncAt: new Date(),
    },
  })

  // Create inventory items
  console.log('📦 Creating inventory items...')

  const inventoryItems = []

  // Acme Corp items (Manufacturing)
  for (let i = 1; i <= 20; i++) {
    const item = await prisma.inventoryItem.create({
      data: {
        companyId: acmeCorp.id,
        erpConnectionId: sapConnection.id,
        sku: `ACME-${i.toString().padStart(4, '0')}`,
        name: `Steel Component ${i}`,
        quantity: Math.floor(Math.random() * 500) + 50,
        price: Math.random() * 100 + 10,
        supplierId: `SUP-${Math.floor(Math.random() * 5) + 1}`,
        warehouseId: `WH-${['PAR', 'LYO', 'MRS'][Math.floor(Math.random() * 3)]}`,
      },
    })
    inventoryItems.push(item)

    // Create historical snapshots
    for (let j = 30; j > 0; j--) {
      const date = new Date()
      date.setDate(date.getDate() - j)

      await prisma.inventorySnapshot.create({
        data: {
          inventoryId: item.id,
          quantity: Math.floor(Math.random() * 500) + 50,
          price: item.price + (Math.random() * 10 - 5),
          timestamp: date,
        },
      })
    }
  }

  // TechSupply items (Technology)
  for (let i = 1; i <= 15; i++) {
    const item = await prisma.inventoryItem.create({
      data: {
        companyId: techSupply.id,
        erpConnectionId: oracleConnection.id,
        sku: `TECH-${i.toString().padStart(4, '0')}`,
        name: `Electronic Part ${i}`,
        quantity: Math.floor(Math.random() * 1000) + 100,
        price: Math.random() * 500 + 50,
        supplierId: `TECH-SUP-${Math.floor(Math.random() * 3) + 1}`,
        warehouseId: `WH-${['BER', 'MUN', 'HAM'][Math.floor(Math.random() * 3)]}`,
      },
    })
    inventoryItems.push(item)

    // Snapshots
    for (let j = 30; j > 0; j--) {
      const date = new Date()
      date.setDate(date.getDate() - j)

      await prisma.inventorySnapshot.create({
        data: {
          inventoryId: item.id,
          quantity: Math.floor(Math.random() * 1000) + 100,
          price: item.price + (Math.random() * 20 - 10),
          timestamp: date,
        },
      })
    }
  }

  // RetailPlus items (Retail)
  for (let i = 1; i <= 10; i++) {
    const item = await prisma.inventoryItem.create({
      data: {
        companyId: retailPlus.id,
        erpConnectionId: odooConnection.id,
        sku: `RETAIL-${i.toString().padStart(4, '0')}`,
        name: `Consumer Product ${i}`,
        quantity: Math.floor(Math.random() * 200) + 20,
        price: Math.random() * 50 + 5,
        supplierId: `RET-SUP-${Math.floor(Math.random() * 2) + 1}`,
        warehouseId: 'WH-PARIS',
      },
    })
    inventoryItems.push(item)
  }

  // Create some anomalies
  console.log('🚨 Creating anomaly alerts...')

  await prisma.anomalyAlert.create({
    data: {
      inventoryId: inventoryItems[0].id,
      anomalyType: 'price_spike',
      severity: 'HIGH',
      confidence: 0.92,
      description: 'Unusual price increase detected (45% above normal)',
      recommendedAction: 'Review supplier pricing changes or verify data accuracy',
      status: 'OPEN',
    },
  })

  await prisma.anomalyAlert.create({
    data: {
      inventoryId: inventoryItems[5].id,
      anomalyType: 'impossible_quantity',
      severity: 'CRITICAL',
      confidence: 0.98,
      description: 'Quantity shows negative value (-50 units)',
      recommendedAction: 'Investigate stock count discrepancy immediately',
      status: 'OPEN',
    },
  })

  await prisma.anomalyAlert.create({
    data: {
      inventoryId: inventoryItems[10].id,
      anomalyType: 'stock_jump',
      severity: 'MEDIUM',
      confidence: 0.85,
      description: 'Sudden stock increase of 300% in 24 hours',
      recommendedAction: 'Verify recent purchase orders or transfers',
      status: 'ACKNOWLEDGED',
    },
  })

  // Create demand forecasts
  console.log('📈 Creating demand forecasts...')

  for (const item of inventoryItems.slice(0, 10)) {
    await prisma.demandForecast.create({
      data: {
        inventoryId: item.id,
        forecastDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
        predictedDemand: Math.floor(item.quantity * (0.8 + Math.random() * 0.4)),
        confidence: 0.7 + Math.random() * 0.25,
        lowerBound: Math.floor(item.quantity * 0.6),
        upperBound: Math.floor(item.quantity * 1.4),
      },
    })
  }

  // Create sync logs
  console.log('📝 Creating sync logs...')

  await prisma.syncLog.create({
    data: {
      erpConnectionId: sapConnection.id,
      status: 'SUCCESS',
      itemsSynced: 20,
      itemsFailed: 0,
      duration: 3450,
    },
  })

  await prisma.syncLog.create({
    data: {
      erpConnectionId: oracleConnection.id,
      status: 'PARTIAL',
      itemsSynced: 12,
      itemsFailed: 3,
      duration: 5200,
      error: 'Connection timeout for 3 items',
    },
  })

  await prisma.syncLog.create({
    data: {
      erpConnectionId: odooConnection.id,
      status: 'SUCCESS',
      itemsSynced: 10,
      itemsFailed: 0,
      duration: 2100,
    },
  })

  console.log('✅ Database seed completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`   - Companies: 3`)
  console.log(`   - Users: 3`)
  console.log(`   - ERP Connections: 3`)
  console.log(`   - Inventory Items: ${inventoryItems.length}`)
  console.log(`   - Anomaly Alerts: 3`)
  console.log(`   - Demand Forecasts: 10`)
  console.log(`   - Sync Logs: 3`)
  console.log('\n🔑 Demo Credentials:')
  console.log(`   - admin@acmecorp.com / Demo123!`)
  console.log(`   - manager@techsupply.de / Demo123!`)
  console.log(`   - viewer@retailplus.fr / Demo123!`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
