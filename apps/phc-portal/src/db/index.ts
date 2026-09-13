import Dexie, { Table } from 'dexie';
import {
  PHCFacility,
  Equipment,
  Medicine,
  InventoryBatch,
  StockMovement,
  BillingTransaction,
  DispensedItem,
  StaffRegistry,
  StaffAttendance,
  PatientFootfall,
  ResourceRequest,
  Alert,
  State,
  District,
  SystemConfig,
  MutationQueueEntry,
} from '../types';

export class PHCDatabase extends Dexie {
  phc_facilities!: Table<PHCFacility, string>;
  equipment!: Table<Equipment, string>;
  medicines!: Table<Medicine, string>;
  inventory_batches!: Table<InventoryBatch, string>;
  stock_movements!: Table<StockMovement, string>;
  billing_transactions!: Table<BillingTransaction, string>;
  dispensed_items!: Table<DispensedItem, string>;
  staff_registry!: Table<StaffRegistry, string>;
  staff_attendance!: Table<StaffAttendance, string>;
  patient_footfall!: Table<PatientFootfall, string>;
  resource_requests!: Table<ResourceRequest, string>;
  alerts!: Table<Alert, string>;
  states!: Table<State, string>;
  districts!: Table<District, string>;
  system_config!: Table<SystemConfig, string>;
  mutation_queue!: Table<MutationQueueEntry, string>;

  constructor() {
    super('PHC_Portal_DB');

    this.version(1).stores({
      phc_facilities: 'id, district_id, state_id, status',
      equipment: 'id, phc_id, equipment_type, maintenance_status',
      medicines: 'id, name, category',
      inventory_batches: 'id, phc_id, medicine_id, batch_no, expiry_date, remaining_qty',
      stock_movements: 'id, phc_id, medicine_id, batch_id, type, timestamp',
      billing_transactions: 'id, phc_id, client_txn_id, dispensed_by_staff_id, client_timestamp, sync_status, status',
      dispensed_items: 'id, billing_transaction_id, batch_id, medicine_id',
      staff_registry: 'id, phc_id, role, active',
      staff_attendance: 'id, [staff_id+attendance_date], staff_id, phc_id, attendance_date, status',
      patient_footfall: 'id, phc_id, date, category, [phc_id+date+category]',
      resource_requests: 'id, phc_id, request_type, priority, status, created_at',
      alerts: 'id, phc_id, alert_type, severity, status, created_at',
      states: 'id, code',
      districts: 'id, state_id, name',
      system_config: 'key',
      mutation_queue: 'id, entity_type, device_id, local_seq, sync_status, created_at',
    });
  }
}

export const db = new PHCDatabase();
