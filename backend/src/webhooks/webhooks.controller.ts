import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  BadRequestException,
  Logger,
  Param,
} from '@nestjs/common'
import { WebhooksService } from './webhooks.service'

interface WebhookPayload {
  event: string
  data: any
  timestamp: Date
}

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name)

  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * SAP S/4HANA Webhook Handler
   *
   * Receives events from SAP Event Mesh
   * Headers: X-Webhook-Secret (HMAC-SHA256)
   */
  @Post('sap')
  @HttpCode(HttpStatus.OK)
  async handleSAPWebhook(
    @Body() payload: WebhookPayload,
    @Headers('x-webhook-secret') signature: string,
  ): Promise<{ success: boolean }> {
    this.logger.log(`[SAP] Received webhook: ${payload.event}`)

    // Verify signature
    const isValid = await this.webhooksService.verifySAPSignature(payload, signature)
    if (!isValid) {
      this.logger.warn('[SAP] Invalid webhook signature')
      throw new UnauthorizedException('Invalid signature')
    }

    try {
      await this.webhooksService.processSAPWebhook(payload)
      this.logger.log('[SAP] Webhook processed successfully')
      return { success: true }
    } catch (error: any) {
      this.logger.error(`[SAP] Webhook processing failed: ${error.message}`)
      throw new BadRequestException(error.message)
    }
  }

  /**
   * Oracle Fusion Cloud Webhook Handler
   *
   * Note: Oracle has limited webhook support, mainly uses polling
   */
  @Post('oracle')
  @HttpCode(HttpStatus.OK)
  async handleOracleWebhook(
    @Body() payload: WebhookPayload,
  ): Promise<{ success: boolean }> {
    this.logger.log(`[Oracle] Received webhook: ${payload.event}`)

    try {
      await this.webhooksService.processOracleWebhook(payload)
      return { success: true }
    } catch (error: any) {
      this.logger.error(`[Oracle] Webhook processing failed: ${error.message}`)
      throw new BadRequestException(error.message)
    }
  }

  /**
   * Microsoft Dynamics 365 Webhook Handler
   *
   * Receives events from Azure Service Bus
   * Headers: X-Webhook-Secret (Azure AD validation)
   */
  @Post('dynamics365')
  @HttpCode(HttpStatus.OK)
  async handleDynamics365Webhook(
    @Body() payload: WebhookPayload,
    @Headers('x-webhook-secret') signature: string,
  ): Promise<{ success: boolean }> {
    this.logger.log(`[Dynamics 365] Received webhook: ${payload.event}`)

    // Verify signature (simplified - in production, validate JWT token)
    if (!signature || signature.length === 0) {
      this.logger.warn('[Dynamics 365] Missing webhook signature')
      throw new UnauthorizedException('Missing signature')
    }

    try {
      await this.webhooksService.processDynamics365Webhook(payload)
      this.logger.log('[Dynamics 365] Webhook processed successfully')
      return { success: true }
    } catch (error: any) {
      this.logger.error(`[Dynamics 365] Webhook processing failed: ${error.message}`)
      throw new BadRequestException(error.message)
    }
  }

  /**
   * NetSuite Webhook Handler
   *
   * Receives events from SuiteScript custom webhooks
   * Headers: X-Webhook-Signature (HMAC-SHA256)
   */
  @Post('netsuite')
  @HttpCode(HttpStatus.OK)
  async handleNetSuiteWebhook(
    @Body() payload: WebhookPayload,
    @Headers('x-webhook-signature') signature: string,
  ): Promise<{ success: boolean }> {
    this.logger.log(`[NetSuite] Received webhook: ${payload.event}`)

    // Verify signature
    const isValid = await this.webhooksService.verifyNetSuiteSignature(payload, signature)
    if (!isValid) {
      this.logger.warn('[NetSuite] Invalid webhook signature')
      throw new UnauthorizedException('Invalid signature')
    }

    try {
      await this.webhooksService.processNetSuiteWebhook(payload)
      this.logger.log('[NetSuite] Webhook processed successfully')
      return { success: true }
    } catch (error: any) {
      this.logger.error(`[NetSuite] Webhook processing failed: ${error.message}`)
      throw new BadRequestException(error.message)
    }
  }

  /**
   * Odoo Webhook Handler
   *
   * Receives events from Odoo automated actions
   * Headers: X-Webhook-Signature (optional - can trust IP whitelist)
   */
  @Post('odoo')
  @HttpCode(HttpStatus.OK)
  async handleOdooWebhook(
    @Body() payload: WebhookPayload,
    @Headers('x-webhook-signature') signature?: string,
  ): Promise<{ success: boolean }> {
    this.logger.log(`[Odoo] Received webhook: ${payload.event}`)

    // Verify signature (optional for Odoo)
    if (signature) {
      const isValid = await this.webhooksService.verifyOdooSignature(payload, signature)
      if (!isValid) {
        this.logger.warn('[Odoo] Invalid webhook signature')
        throw new UnauthorizedException('Invalid signature')
      }
    }

    try {
      await this.webhooksService.processOdooWebhook(payload)
      this.logger.log('[Odoo] Webhook processed successfully')
      return { success: true }
    } catch (error: any) {
      this.logger.error(`[Odoo] Webhook processing failed: ${error.message}`)
      throw new BadRequestException(error.message)
    }
  }

  /**
   * Generic webhook handler for testing
   */
  @Post('test/:erpSystem')
  @HttpCode(HttpStatus.OK)
  async handleTestWebhook(
    @Param('erpSystem') erpSystem: string,
    @Body() payload: any,
  ): Promise<{ success: boolean; received: any }> {
    this.logger.log(`[TEST] Received webhook for ${erpSystem}`)
    this.logger.debug(`[TEST] Payload: ${JSON.stringify(payload, null, 2)}`)

    return {
      success: true,
      received: {
        erpSystem,
        payload,
        timestamp: new Date(),
      },
    }
  }
}
