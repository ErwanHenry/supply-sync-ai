import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../common/prisma/prisma.service'
import * as crypto from 'crypto'

interface WebhookPayload {
  event: string
  data: any
  timestamp: Date
}

interface InventoryData {
  sku: string
  name?: string
  quantity: number
  price: number
  supplierId?: string
  warehouseId?: string
}

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * SAP Webhook Processing
   */
  async processSAPWebhook(payload: WebhookPayload): Promise<void> {
    const materialData = payload.data?.MaterialStock || payload.data

    const inventoryData: InventoryData = {
      sku: materialData.Material,
      name: materialData.MaterialDescription,
      quantity: Math.floor(materialData.QuantityInStock || 0),
      price: materialData.PricePerUnit || 0,
      supplierId: materialData.Supplier,
      warehouseId: materialData.Plant,
    }

    await this.saveInventoryUpdate(inventoryData, 'SAP')
  }

  verifySAPSignature(payload: WebhookPayload, signature: string): boolean {
    const secret = process.env.SAP_WEBHOOK_SECRET || ''
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computedSignature),
      )
    } catch (error) {
      return false
    }
  }

  /**
   * Oracle Webhook Processing
   */
  async processOracleWebhook(payload: WebhookPayload): Promise<void> {
    const itemData = payload.data

    const inventoryData: InventoryData = {
      sku: itemData.ItemId,
      name: itemData.ItemDescription,
      quantity: Math.floor(itemData.OnHandQuantity || 0),
      price: itemData.UnitPrice || 0,
      supplierId: itemData.SupplierId,
      warehouseId: itemData.OrganizationId,
    }

    await this.saveInventoryUpdate(inventoryData, 'Oracle')
  }

  /**
   * Dynamics 365 Webhook Processing
   */
  async processDynamics365Webhook(payload: WebhookPayload): Promise<void> {
    const itemData = payload.data

    const inventoryData: InventoryData = {
      sku: itemData.ItemNumber,
      name: itemData.ProductName,
      quantity: Math.floor(itemData.AvailablePhysical || 0),
      price: itemData.Price || 0,
      supplierId: itemData.DefaultSupplier,
      warehouseId: itemData.WarehouseId,
    }

    await this.saveInventoryUpdate(inventoryData, 'Dynamics365')
  }

  /**
   * NetSuite Webhook Processing
   */
  async processNetSuiteWebhook(payload: WebhookPayload): Promise<void> {
    const itemData = payload.data

    const inventoryData: InventoryData = {
      sku: itemData.itemId,
      name: itemData.displayName,
      quantity: Math.floor(itemData.quantityAvailable || 0),
      price: itemData.cost || 0,
      supplierId: itemData.vendor?.id,
      warehouseId: itemData.location,
    }

    await this.saveInventoryUpdate(inventoryData, 'NetSuite')
  }

  verifyNetSuiteSignature(payload: WebhookPayload, signature: string): boolean {
    const secret = process.env.NETSUITE_WEBHOOK_SECRET || ''
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computedSignature),
      )
    } catch (error) {
      return false
    }
  }

  /**
   * Odoo Webhook Processing
   */
  async processOdooWebhook(payload: WebhookPayload): Promise<void> {
    const itemData = payload.data

    const inventoryData: InventoryData = {
      sku: itemData.default_code || `ODOO-${itemData.id}`,
      name: itemData.name,
      quantity: Math.floor(itemData.qty_available || 0),
      price: itemData.standard_price || 0,
      supplierId: itemData.seller_ids?.[0]?.toString(),
      warehouseId: itemData.location_id?.[0]?.toString(),
    }

    await this.saveInventoryUpdate(inventoryData, 'Odoo')
  }

  verifyOdooSignature(payload: WebhookPayload, signature: string): boolean {
    const secret = process.env.ODOO_WEBHOOK_SECRET || ''
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex')

    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(computedSignature),
      )
    } catch (error) {
      return false
    }
  }

  /**
   * Save inventory update to database
   */
  private async saveInventoryUpdate(
    data: InventoryData,
    erpSystem: string,
  ): Promise<void> {
    try {
      // Find or create inventory item
      const existingItem = await this.prisma.inventoryItem.findFirst({
        where: { sku: data.sku },
      })

      if (existingItem) {
        // Update existing item
        await this.prisma.inventoryItem.update({
          where: { id: existingItem.id },
          data: {
            name: data.name || existingItem.name,
            quantity: data.quantity,
            price: data.price,
            supplierId: data.supplierId,
            warehouseId: data.warehouseId,
            updatedAt: new Date(),
          },
        })

        // Create snapshot for time-series analysis
        await this.prisma.inventorySnapshot.create({
          data: {
            inventoryId: existingItem.id,
            quantity: data.quantity,
            price: data.price,
            timestamp: new Date(),
          },
        })

        this.logger.log(`[${erpSystem}] Updated inventory item: ${data.sku}`)
      } else {
        this.logger.warn(
          `[${erpSystem}] Inventory item not found: ${data.sku} (skipping creation)`,
        )
        // In production, you might want to create the item or queue it for review
      }

      // Trigger anomaly detection (async)
      this.triggerAnomalyDetection(data.sku).catch((error) => {
        this.logger.error(
          `[${erpSystem}] Anomaly detection failed for ${data.sku}: ${error.message}`,
        )
      })
    } catch (error: any) {
      this.logger.error(
        `[${erpSystem}] Failed to save inventory update: ${error.message}`,
      )
      throw error
    }
  }

  /**
   * Trigger anomaly detection for updated item
   */
  private async triggerAnomalyDetection(sku: string): Promise<void> {
    // Get last 30 snapshots for this item
    const item = await this.prisma.inventoryItem.findFirst({
      where: { sku },
      include: {
        snapshots: {
          orderBy: { timestamp: 'desc' },
          take: 30,
        },
      },
    })

    if (!item || item.snapshots.length < 10) {
      this.logger.debug(`[Anomaly] Not enough data for ${sku}`)
      return
    }

    // Prepare data for ML service
    const dataPoints = item.snapshots.map((snapshot) => ({
      timestamp: snapshot.timestamp.toISOString(),
      quantity: snapshot.quantity,
      price: Number(snapshot.price),
    }))

    // Call ML service (would be done via HTTP in real implementation)
    this.logger.debug(
      `[Anomaly] Triggering detection for ${sku} with ${dataPoints.length} data points`,
    )

    // TODO: Implement actual ML service call
    // const result = await this.mlClient.detectAnomaly({ sku, data_points: dataPoints })
    //
    // if (result.is_anomaly) {
    //   await this.prisma.anomalyAlert.create({
    //     data: {
    //       inventoryId: item.id,
    //       anomalyType: result.anomaly_type,
    //       severity: result.severity,
    //       confidence: result.confidence,
    //       description: result.description,
    //       recommendedAction: result.recommended_action,
    //     },
    //   })
    // }
  }

  /**
   * Get webhook statistics
   */
  async getWebhookStats(): Promise<{
    totalProcessed: number
    byERP: Record<string, number>
  }> {
    // This would track webhook events in a separate table
    // For now, return mock data
    return {
      totalProcessed: 0,
      byERP: {
        SAP: 0,
        Oracle: 0,
        Dynamics365: 0,
        NetSuite: 0,
        Odoo: 0,
      },
    }
  }
}
