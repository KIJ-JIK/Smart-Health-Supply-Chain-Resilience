import { EventEmitter } from 'events';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Validation Error
// ---------------------------------------------------------------------------

export class EventValidationError extends Error {
  public readonly topic: string;
  public readonly issues: z.ZodIssue[];

  constructor(topic: string, issues: z.ZodIssue[]) {
    const details = issues.map((i) => `[${i.path.join('.') || 'root'}]: ${i.message}`).join('; ');
    super(`EventValidationError on '${topic}': ${details}`);
    this.name = 'EventValidationError';
    this.topic = topic;
    this.issues = issues;
    Object.setPrototypeOf(this, EventValidationError.prototype);
  }
}

// ---------------------------------------------------------------------------
// 12 Canonical Event Schemas (Masterplan §47 & Prompt 14)
// ---------------------------------------------------------------------------

export const BillingTransactionCompletedSchema = z.object({
  transaction_id: z.string().min(1, 'transaction_id is required'),
  phc_id: z.string().min(1, 'phc_id is required'),
  client_txn_id: z.string().min(1, 'client_txn_id is required'),
  patient_ref: z.string().nullable().optional(),
  total_amount: z.number().optional(),
  item_count: z.number().optional(),
  dispensed_medicine_ids: z.array(z.string()).optional(),
});

export const StockThresholdBreachedSchema = z.object({
  phc_id: z.string().min(1, 'phc_id is required'),
  medicine_id: z.string().min(1, 'medicine_id is required'),
  remaining_qty: z.number().optional(),
  minimum_threshold: z.number().optional(),
  health_status: z.string().optional(),
  triggered_by: z.string().optional(),
});

export const RequestCreatedSchema = z.object({
  id: z.string().min(1, 'id is required'),
  phc_id: z.string().min(1, 'phc_id is required'),
  request_type: z.string().optional(),
  item_ref: z.string().nullable().optional(),
  medicine_id: z.string().optional(),
  quantity: z.number().optional(),
  priority: z.string().optional(),
  reason: z.string().nullable().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export const RequestApprovedSchema = z.object({
  id: z.string().min(1, 'id is required'),
  phc_id: z.string().min(1, 'phc_id is required'),
  status: z.string().default('approved'),
  request_type: z.string().optional(),
  item_ref: z.string().nullable().optional(),
  medicine_id: z.string().optional(),
  quantity: z.number().optional(),
  priority: z.string().optional(),
  reason: z.string().nullable().optional(),
  source: z.string().optional(),
  decided_by: z.string().optional(),
  decided_at: z.string().optional(),
  notes: z.string().nullable().optional(),
  created_at: z.string().optional(),
});

export const RedistributionApprovedSchema = z.object({
  transfer_id: z.string().min(1, 'transfer_id is required'),
  source_phc_id: z.string().min(1, 'source_phc_id is required'),
  dest_phc_id: z.string().min(1, 'dest_phc_id is required'),
  medicine_id: z.string().min(1, 'medicine_id is required'),
  quantity: z.number().positive('quantity must be positive'),
  approved_by: z.string().optional(),
  approved_at: z.string().optional(),
});

export const ShipmentDispatchedSchema = z.object({
  shipment_id: z.string().min(1, 'shipment_id is required'),
  transfer_id: z.string().optional(),
  source_phc_id: z.string().min(1, 'source_phc_id is required'),
  dest_phc_id: z.string().min(1, 'dest_phc_id is required'),
  dispatched_at: z.string().min(1, 'dispatched_at is required'),
  tracking_ref: z.string().optional(),
  carrier: z.string().optional(),
});

export const ShipmentDeliveredSchema = z.object({
  shipment_id: z.string().min(1, 'shipment_id is required'),
  transfer_id: z.string().optional(),
  dest_phc_id: z.string().min(1, 'dest_phc_id is required'),
  delivered_at: z.string().min(1, 'delivered_at is required'),
  received_by: z.string().optional(),
  items: z.array(z.any()).optional(),
});

export const FootfallUpdatedSchema = z.object({
  phc_id: z.string().min(1, 'phc_id is required'),
  category: z.string().min(1, 'category is required'),
  count: z.number().int().nonnegative('count must be non-negative integer'),
  time: z.string().optional(),
});

export const StaffShortageDetectedSchema = z.object({
  phc_id: z.string().min(1, 'phc_id is required'),
  attendance_date: z.string().min(1, 'attendance_date is required'),
  role: z.string().optional(),
  shortage_type: z.string().optional(),
  active_count: z.number().optional(),
  present_count: z.number().optional(),
  missing_count: z.number().optional(),
  total_doctors: z.number().optional(),
  present_doctors: z.number().optional(),
});

export const EmergencyCreatedSchema = z.object({
  id: z.string().min(1, 'id is required'),
  phc_id: z.string().min(1, 'phc_id is required'),
  alert_type: z.string().default('emergency_report'),
  severity: z.string().default('critical'),
  payload: z.any().optional(),
  district_id: z.string().nullable().optional(),
  state_id: z.string().nullable().optional(),
  status: z.string().optional(),
  created_at: z.string().optional(),
});

export const ForecastGeneratedSchema = z.object({
  phc_id: z.string().min(1, 'phc_id is required'),
  medicine_id: z.string().min(1, 'medicine_id is required'),
  forecast_type: z.string().min(1, 'forecast_type is required'),
  predicted_value: z.number(),
  horizon_days: z.number().int().positive('horizon_days must be positive integer'),
  confidence_lower: z.number().optional(),
  confidence_upper: z.number().optional(),
  model_used: z.string().optional(),
  model_version: z.string().optional(),
  generated_at: z.string().optional(),
});

export const AlertCreatedSchema = z.object({
  id: z.string().min(1, 'id is required'),
  alert_type: z.string().min(1, 'alert_type is required'),
  severity: z.string().min(1, 'severity is required'),
  phc_id: z.string().nullable().optional(),
  district_id: z.string().nullable().optional(),
  state_id: z.string().nullable().optional(),
  payload: z.any().optional(),
  status: z.string().optional(),
  risk_score: z.number().optional(),
  created_at: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Operational Facility & Resource Event Schemas
// ---------------------------------------------------------------------------

export const FacilityUpdatedSchema = z.object({
  phcId: z.string().optional(),
  phc_id: z.string().optional(),
  action: z.string().optional(),
  name: z.string().optional(),
  updated_by: z.string().optional(),
});

export const BedUpdatedSchema = z.object({
  phcId: z.string().optional(),
  phc_id: z.string().optional(),
  total_beds: z.number().optional(),
  occupied_beds: z.number().optional(),
});

export const OxygenUpdatedSchema = z.object({
  phcId: z.string().optional(),
  phc_id: z.string().optional(),
  oxygen_cylinders_available: z.number().optional(),
});

export const EquipmentUpdatedSchema = z.object({
  id: z.string().optional(),
  equipment_id: z.string().optional(),
  phcId: z.string().optional(),
  phc_id: z.string().optional(),
  status: z.string().optional(),
});

export const StockReceivedSchema = z.object({
  phc_id: z.string().optional(),
  medicine_id: z.string().optional(),
  batch_no: z.string().optional(),
  quantity: z.number().optional(),
});

export const StockAdjustedSchema = z.object({
  phc_id: z.string().optional(),
  medicine_id: z.string().optional(),
  batch_id: z.string().optional(),
  adjustment_qty: z.number().optional(),
  reason: z.string().optional(),
  adjustmentId: z.string().optional(),
  adjustment_id: z.string().optional(),
});

export const RequestStatusChangedSchema = z.object({
  id: z.string().min(1, 'id is required'),
  phc_id: z.string().optional(),
  status: z.string().min(1, 'status is required'),
  previous_status: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Schema Registry Map
// ---------------------------------------------------------------------------

export const CANONICAL_EVENTS = [
  'billing.transaction_completed',
  'stock.threshold_breached',
  'request.created',
  'request.approved',
  'redistribution.approved',
  'shipment.dispatched',
  'shipment.delivered',
  'footfall.updated',
  'staff.shortage_detected',
  'emergency.created',
  'forecast.generated',
  'alert.created',
] as const;

export type CanonicalEventTopic = typeof CANONICAL_EVENTS[number];

export const OPERATIONAL_EVENTS = [
  'facility.updated',
  'bed.updated',
  'oxygen.updated',
  'equipment.updated',
  'stock.received',
  'stock.adjusted',
  'request.status_changed',
  'alert.raised',
] as const;

export type OperationalEventTopic = typeof OPERATIONAL_EVENTS[number];

export type EventTopic = CanonicalEventTopic | OperationalEventTopic;

export const EVENT_SCHEMAS: Record<string, z.ZodType<any>> = {
  'billing.transaction_completed': BillingTransactionCompletedSchema,
  'stock.threshold_breached':      StockThresholdBreachedSchema,
  'request.created':               RequestCreatedSchema,
  'request.approved':              RequestApprovedSchema,
  'redistribution.approved':       RedistributionApprovedSchema,
  'shipment.dispatched':           ShipmentDispatchedSchema,
  'shipment.delivered':            ShipmentDeliveredSchema,
  'footfall.updated':              FootfallUpdatedSchema,
  'staff.shortage_detected':       StaffShortageDetectedSchema,
  'emergency.created':             EmergencyCreatedSchema,
  'forecast.generated':            ForecastGeneratedSchema,
  'alert.created':                 AlertCreatedSchema,
  'facility.updated':              FacilityUpdatedSchema,
  'bed.updated':                   BedUpdatedSchema,
  'oxygen.updated':                OxygenUpdatedSchema,
  'equipment.updated':             EquipmentUpdatedSchema,
  'stock.received':                StockReceivedSchema,
  'stock.adjusted':                StockAdjustedSchema,
  'request.status_changed':        RequestStatusChangedSchema,
  'alert.raised':                  AlertCreatedSchema,
};

// ---------------------------------------------------------------------------
// Inferred TypeScript Payload Types
// ---------------------------------------------------------------------------

export type BillingTransactionCompletedPayload = z.infer<typeof BillingTransactionCompletedSchema>;
export type StockThresholdBreachedPayload      = z.infer<typeof StockThresholdBreachedSchema>;
export type RequestCreatedPayload              = z.infer<typeof RequestCreatedSchema>;
export type RequestApprovedPayload             = z.infer<typeof RequestApprovedSchema>;
export type RedistributionApprovedPayload      = z.infer<typeof RedistributionApprovedSchema>;
export type ShipmentDispatchedPayload          = z.infer<typeof ShipmentDispatchedSchema>;
export type ShipmentDeliveredPayload           = z.infer<typeof ShipmentDeliveredSchema>;
export type FootfallUpdatedPayload             = z.infer<typeof FootfallUpdatedSchema>;
export type StaffShortageDetectedPayload       = z.infer<typeof StaffShortageDetectedSchema>;
export type EmergencyCreatedPayload            = z.infer<typeof EmergencyCreatedSchema>;
export type ForecastGeneratedPayload           = z.infer<typeof ForecastGeneratedSchema>;
export type AlertCreatedPayload                = z.infer<typeof AlertCreatedSchema>;
export type FacilityUpdatedPayload             = z.infer<typeof FacilityUpdatedSchema>;
export type BedUpdatedPayload                  = z.infer<typeof BedUpdatedSchema>;
export type OxygenUpdatedPayload               = z.infer<typeof OxygenUpdatedSchema>;
export type EquipmentUpdatedPayload            = z.infer<typeof EquipmentUpdatedSchema>;
export type StockReceivedPayload               = z.infer<typeof StockReceivedSchema>;
export type StockAdjustedPayload               = z.infer<typeof StockAdjustedSchema>;
export type RequestStatusChangedPayload        = z.infer<typeof RequestStatusChangedSchema>;

export interface EventPayloadMap {
  'billing.transaction_completed': BillingTransactionCompletedPayload;
  'stock.threshold_breached':      StockThresholdBreachedPayload;
  'request.created':               RequestCreatedPayload;
  'request.approved':              RequestApprovedPayload;
  'redistribution.approved':       RedistributionApprovedPayload;
  'shipment.dispatched':           ShipmentDispatchedPayload;
  'shipment.delivered':            ShipmentDeliveredPayload;
  'footfall.updated':              FootfallUpdatedPayload;
  'staff.shortage_detected':       StaffShortageDetectedPayload;
  'emergency.created':             EmergencyCreatedPayload;
  'forecast.generated':            ForecastGeneratedPayload;
  'alert.created':                 AlertCreatedPayload;
  'facility.updated':              FacilityUpdatedPayload;
  'bed.updated':                   BedUpdatedPayload;
  'oxygen.updated':                OxygenUpdatedPayload;
  'equipment.updated':             EquipmentUpdatedPayload;
  'stock.received':                StockReceivedPayload;
  'stock.adjusted':                StockAdjustedPayload;
  'request.status_changed':        RequestStatusChangedPayload;
  'alert.raised':                  AlertCreatedPayload;
}

// ---------------------------------------------------------------------------
// Domain Event Envelope
// ---------------------------------------------------------------------------

export interface DomainEvent<T = any> {
  eventId:   string;
  topic:     EventTopic;
  timestamp: string;
  source:    string;
  payload:   T;
}

export type EventHandler<T = any> = (event: DomainEvent<T>) => void | Promise<void>;

// ---------------------------------------------------------------------------
// Schema-Validated Domain Event Bus
// ---------------------------------------------------------------------------

class DomainEventBus {
  private emitter = new EventEmitter();
  private eventHistory: DomainEvent[] = [];
  private readonly maxHistory = 1000;

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  /**
   * Validate and publish a domain event.
   * Throws EventValidationError if the payload fails schema validation.
   */
  async publish<TTopic extends EventTopic>(
    topic: TTopic,
    payload: EventPayloadMap[TTopic] | Record<string, any>,
    source: string = 'backend',
  ): Promise<DomainEvent<EventPayloadMap[TTopic]>> {
    const schema = EVENT_SCHEMAS[topic];
    let validatedPayload: any = payload;

    if (schema) {
      const result = schema.safeParse(payload);
      if (!result.success) {
        throw new EventValidationError(topic, result.error.issues);
      }
      validatedPayload = result.data;
    }

    const event: DomainEvent<EventPayloadMap[TTopic]> = {
      eventId: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
      topic,
      timestamp: new Date().toISOString(),
      source,
      payload: validatedPayload,
    };

    this.eventHistory.unshift(event);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.pop();
    }

    this.emitter.emit(topic, event);
    this.emitter.emit('*', event);

    return event;
  }

  /**
   * Resilient publish helper that catches EventValidationError without throwing.
   */
  async publishSafe<TTopic extends EventTopic>(
    topic: TTopic,
    payload: EventPayloadMap[TTopic] | Record<string, any>,
    source: string = 'backend',
  ): Promise<{ success: boolean; event?: DomainEvent<EventPayloadMap[TTopic]>; error?: EventValidationError }> {
    try {
      const event = await this.publish(topic, payload, source);
      return { success: true, event };
    } catch (err: any) {
      return { success: false, error: err };
    }
  }

  /**
   * Subscribe to a specific event topic with strongly-typed handler, or '*' for all events.
   */
  subscribe<TTopic extends EventTopic>(
    topic: TTopic,
    handler: (event: DomainEvent<EventPayloadMap[TTopic]>) => void | Promise<void>,
  ): () => void;
  subscribe(
    topic: '*',
    handler: (event: DomainEvent<any>) => void | Promise<void>,
  ): () => void;
  subscribe(
    topic: EventTopic | '*',
    handler: EventHandler<any>,
  ): () => void {
    this.emitter.on(topic, handler);
    return () => {
      this.emitter.off(topic, handler);
    };
  }

  once<TTopic extends EventTopic>(
    topic: TTopic,
    handler: (event: DomainEvent<EventPayloadMap[TTopic]>) => void | Promise<void>,
  ): void;
  once(
    topic: '*',
    handler: (event: DomainEvent<any>) => void | Promise<void>,
  ): void;
  once(
    topic: EventTopic | '*',
    handler: EventHandler<any>,
  ): void {
    this.emitter.once(topic, handler);
  }

  getHistory<TTopic extends EventTopic>(topic?: TTopic): DomainEvent<EventPayloadMap[TTopic]>[] {
    if (!topic) return [...this.eventHistory] as any;
    return this.eventHistory.filter((e) => e.topic === topic) as any;
  }

  clearHistory(): void {
    this.eventHistory = [];
  }
}

export const eventBus = new DomainEventBus();
