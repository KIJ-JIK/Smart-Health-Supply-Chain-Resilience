import { pool } from './pool';
import { seedGapPhcs } from './seedGapPhcs';

export async function ensureM2SeedsAndIndexes(): Promise<void> {
  const client = await pool.connect();
  try {
    // -1. Ensure canonical 192 PHC facilities baseline
    try {
      await seedGapPhcs(client);
    } catch (e: any) {
      console.warn('[M2 Seed] Warning in seedGapPhcs:', e?.message || e);
    }

    // 0. Ensure columns exist on redistribution_transfers and resource_requests
    await client.query(`
      ALTER TABLE redistribution_transfers ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE redistribution_transfers ADD COLUMN IF NOT EXISTS recommended_by VARCHAR(20) DEFAULT 'ai';
      ALTER TABLE redistribution_transfers ADD COLUMN IF NOT EXISTS item_ref VARCHAR(100);
      ALTER TABLE redistribution_transfers ADD COLUMN IF NOT EXISTS item_type VARCHAR(30) DEFAULT 'medicine';
      ALTER TABLE redistribution_transfers ADD COLUMN IF NOT EXISTS transfer_status VARCHAR(50) DEFAULT 'recommended';
      ALTER TABLE redistribution_transfers ADD COLUMN IF NOT EXISTS carrier VARCHAR(255);
      ALTER TABLE redistribution_transfers ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
      ALTER TABLE redistribution_transfers ADD COLUMN IF NOT EXISTS decided_at TIMESTAMPTZ;
      ALTER TABLE redistribution_transfers ADD COLUMN IF NOT EXISTS decided_by VARCHAR(255);
      ALTER TABLE redistribution_transfers ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ;
      ALTER TABLE redistribution_transfers ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

      CREATE TABLE IF NOT EXISTS resource_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phc_id UUID NOT NULL,
        district_id UUID,
        state_id UUID,
        request_type VARCHAR(20) DEFAULT 'medicine',
        item_ref VARCHAR(100),
        medicine_id UUID,
        item_name VARCHAR(255),
        quantity INT DEFAULT 1,
        priority VARCHAR(20) DEFAULT 'routine',
        reason VARCHAR(50) DEFAULT 'manual',
        source VARCHAR(20) DEFAULT 'manual',
        status VARCHAR(20) DEFAULT 'pending',
        carrier VARCHAR(255),
        tracking_number VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        decided_at TIMESTAMPTZ,
        decided_by VARCHAR(255)
      );

      ALTER TABLE resource_requests DROP CONSTRAINT IF EXISTS resource_requests_priority_check;
      ALTER TABLE resource_requests DROP CONSTRAINT IF EXISTS resource_requests_reason_check;
      ALTER TABLE resource_requests DROP CONSTRAINT IF EXISTS resource_requests_status_check;
      ALTER TABLE resource_requests DROP CONSTRAINT IF EXISTS resource_requests_request_type_check;
      ALTER TABLE resource_requests DROP CONSTRAINT IF EXISTS resource_requests_source_check;

      ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS quantity INT DEFAULT 1;
      ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS item_ref VARCHAR(100);
      ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS medicine_id UUID;
      ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS district_id UUID;
      ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS state_id UUID;
      ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS item_name VARCHAR(255);
      ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'routine';
      ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS reason VARCHAR(50) DEFAULT 'manual';
      ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual';
      ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
      ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS request_type VARCHAR(20) DEFAULT 'medicine';
      ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS carrier VARCHAR(255);
      ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(100);
      ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS notes TEXT;
      ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS decided_at TIMESTAMPTZ;
      ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS decided_by VARCHAR(255);
      ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ;
      ALTER TABLE resource_requests ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

      ALTER TABLE supply_chain_shipments ADD COLUMN IF NOT EXISTS transfer_id UUID;
      ALTER TABLE supply_chain_shipments ADD COLUMN IF NOT EXISTS request_id UUID;

      UPDATE resource_requests r
      SET district_id = f.district_id, state_id = f.state_id
      FROM phc_facilities f
      WHERE r.phc_id = f.id AND (r.district_id IS NULL OR r.state_id IS NULL);
    `);

    // 1. Performance Indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_alerts_state_status_created ON alerts(state_id, status, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_inventory_batches_med ON inventory_batches(medicine_id);
      CREATE INDEX IF NOT EXISTS idx_phc_dist_status ON phc_facilities(district_id, operational_status);
      CREATE INDEX IF NOT EXISTS idx_sc_shipments_dest_status ON supply_chain_shipments(dest_phc_id, status);
      CREATE INDEX IF NOT EXISTS idx_redist_transfers_status ON redistribution_transfers(status);
      CREATE INDEX IF NOT EXISTS idx_resource_requests_dist_status ON resource_requests(district_id, status);
      CREATE INDEX IF NOT EXISTS idx_resource_requests_state_status ON resource_requests(state_id, status);
    `);

    // 2. Check supply_chain_shipments count
    const shipCountRes = await client.query('SELECT count(*)::int AS count FROM supply_chain_shipments');
    const shipCount = shipCountRes.rows[0]?.count || 0;

    if (shipCount < 20) {
      console.log(`[M2 Seed] Seeding realistic supply_chain_shipments (current count: ${shipCount})...`);
      await client.query(`
        INSERT INTO supply_chain_shipments (
            id, source_phc_id, dest_phc_id, medicine_id, item_type, quantity, carrier,
            tracking_number, status, dispatched_at, estimated_delivery_at, delivered_at,
            is_delayed, notes, created_at, updated_at
        ) VALUES
        -- Stage: manufacturer (status: 'pending' -> displayed as 'ordered')
        (
            'e0000001-0000-0000-0000-000000000001',
            'c0000003-0000-0000-0000-000000000001',
            'c0000003-0000-0000-0000-000000000004',
            'd0000004-0000-0000-0000-000000000002',
            'medicine', 1200, 'Bharat Biotech Logistics',
            'TRK-MH-MFR-101', 'pending',
            NULL, now() + interval '5 days', NULL,
            false, 'Manufacturer dispatch pending quality signoff at plant', now() - interval '1 day', now()
        ),
        (
            'e0000001-0000-0000-0000-000000000002',
            'c0000003-0000-0000-0000-000000000002',
            'c0000003-0000-0000-0000-000000000003',
            'd0000004-0000-0000-0000-000000000001',
            'medicine', 3500, 'Cipla National Freight',
            'TRK-MH-MFR-102', 'pending',
            NULL, now() + interval '4 days', NULL,
            false, 'Awaiting batch release from Kurkumbh production facility', now() - interval '18 hours', now()
        ),
        (
            'e0000001-0000-0000-0000-000000000003',
            'c0000003-0000-0000-0000-000000000003',
            'c0000003-0000-0000-0000-000000000001',
            'd0000004-0000-0000-0000-000000000009',
            'medicine', 450, 'Biocon Cold-Chain Express',
            'TRK-MH-MFR-103', 'pending',
            NULL, now() + interval '3 days', NULL,
            false, 'Packaging and temperature logger calibration at manufacturer hub', now() - interval '12 hours', now()
        ),
        (
            'e0000001-0000-0000-0000-000000000004',
            'c0000003-0000-0000-0000-000000000004',
            'c0000003-0000-0000-0000-000000000002',
            'd0000004-0000-0000-0000-000000000003',
            'medicine', 2000, 'Serum Logistics Ltd',
            'TRK-MH-MFR-104', 'pending',
            NULL, now() + interval '6 days', NULL,
            false, 'Monsoon reserve batch staged at manufacturer plant', now() - interval '8 hours', now()
        ),
        (
            'e0000001-0000-0000-0000-000000000005',
            'c0000003-0000-0000-0000-000000000005',
            'c0000003-0000-0000-0000-000000000004',
            'd0000004-0000-0000-0000-000000000011',
            'medicine', 600, 'Sun Pharma Transport',
            'TRK-MH-MFR-105', 'pending',
            NULL, now() + interval '4 days', NULL,
            false, 'Final QA inspection complete at Boisar pharmaceutical plant', now() - interval '6 hours', now()
        ),

        -- Stage: warehouse (status: 'approved')
        (
            'e0000001-0000-0000-0000-000000000006',
            'c0000003-0000-0000-0000-000000000001',
            'c0000003-0000-0000-0000-000000000003',
            'd0000004-0000-0000-0000-000000000004',
            'medicine', 800, 'State Health Logistics',
            'TRK-MH-WH-201', 'approved',
            NULL, now() + interval '3 days', NULL,
            false, 'Staged at Pune Central Medical Warehouse Bay 2', now() - interval '2 days', now()
        ),
        (
            'e0000001-0000-0000-0000-000000000007',
            'c0000003-0000-0000-0000-000000000002',
            'c0000003-0000-0000-0000-000000000004',
            'd0000004-0000-0000-0000-000000000005',
            'medicine', 1100, 'Maharashtra Medical Supplies Depot',
            'TRK-MH-WH-202', 'approved',
            NULL, now() + interval '3 days', NULL,
            false, 'Cross-docked at Hadapsar regional distribution depot', now() - interval '1 day', now()
        ),
        (
            'e0000001-0000-0000-0000-000000000008',
            'c0000003-0000-0000-0000-000000000003',
            'c0000003-0000-0000-0000-000000000002',
            'd0000004-0000-0000-0000-000000000007',
            'medicine', 2500, 'State Health Logistics',
            'TRK-MH-WH-203', 'approved',
            NULL, now() + interval '2 days', NULL,
            false, 'Allocated for maternal health priority distribution', now() - interval '20 hours', now()
        ),
        (
            'e0000001-0000-0000-0000-000000000009',
            'c0000003-0000-0000-0000-000000000004',
            'c0000003-0000-0000-0000-000000000001',
            'd0000004-0000-0000-0000-000000000012',
            'medicine', 1500, 'National Health Mission Fleet',
            'TRK-MH-WH-204', 'approved',
            NULL, now() + interval '2 days', NULL,
            false, 'Palletized and awaiting loading dock assignment', now() - interval '14 hours', now()
        ),
        (
            'e0000001-0000-0000-0000-000000000010',
            'c0000003-0000-0000-0000-000000000005',
            'c0000003-0000-0000-0000-000000000003',
            'd0000004-0000-0000-0000-000000000013',
            'medicine', 400, 'State Health Logistics',
            'TRK-MH-WH-205', 'approved',
            NULL, now() + interval '3 days', NULL,
            false, 'Stored in temperature-controlled room A at central depot', now() - interval '10 hours', now()
        ),

        -- Stage: state (status: 'dispatched')
        (
            'e0000001-0000-0000-0000-000000000011',
            'c0000003-0000-0000-0000-000000000001',
            'c0000003-0000-0000-0000-000000000002',
            'd0000004-0000-0000-0000-000000000001',
            'medicine', 2200, 'Maharashtra State Road Transport Fleet',
            'TRK-MH-ST-301', 'dispatched',
            now() - interval '10 hours', now() + interval '1 day', NULL,
            false, 'Departed Mumbai central warehouse for Pune division hub', now() - interval '12 hours', now()
        ),
        (
            'e0000001-0000-0000-0000-000000000012',
            'c0000003-0000-0000-0000-000000000002',
            'c0000003-0000-0000-0000-000000000005',
            'd0000004-0000-0000-0000-000000000002',
            'medicine', 1400, 'State Health Logistics Express',
            'TRK-MH-ST-302', 'dispatched',
            now() - interval '8 hours', now() + interval '18 hours', NULL,
            false, 'In transit on Mumbai-Pune expressway regional corridor', now() - interval '9 hours', now()
        ),
        (
            'e0000001-0000-0000-0000-000000000013',
            'c0000003-0000-0000-0000-000000000003',
            'c0000003-0000-0000-0000-000000000004',
            'd0000004-0000-0000-0000-000000000015',
            'medicine', 3000, 'MSRTC Health Cargo',
            'TRK-MH-ST-303', 'dispatched',
            now() - interval '6 hours', now() + interval '20 hours', NULL,
            false, 'Statewide health program consignment en route', now() - interval '7 hours', now()
        ),
        (
            'e0000001-0000-0000-0000-000000000014',
            'c0000003-0000-0000-0000-000000000004',
            'c0000003-0000-0000-0000-000000000003',
            'd0000004-0000-0000-0000-000000000010',
            'medicine', 950, 'State Health Logistics',
            'TRK-MH-ST-304', 'dispatched',
            now() - interval '5 hours', now() + interval '16 hours', NULL,
            false, 'Dispatched from state intermediate transit hub to Pune', now() - interval '6 hours', now()
        ),
        (
            'e0000001-0000-0000-0000-000000000015',
            'c0000003-0000-0000-0000-000000000005',
            'c0000003-0000-0000-0000-000000000001',
            'd0000004-0000-0000-0000-000000000006',
            'medicine', 1800, 'Maharashtra Medical Fleet',
            'TRK-MH-ST-305', 'dispatched',
            now() - interval '4 hours', now() + interval '14 hours', NULL,
            false, 'En route to western Maharashtra medical supply node', now() - interval '5 hours', now()
        ),

        -- Stage: district (status: 'in_transit')
        (
            'e0000001-0000-0000-0000-000000000016',
            'c0000003-0000-0000-0000-000000000001',
            'c0000003-0000-0000-0000-000000000004',
            'd0000004-0000-0000-0000-000000000003',
            'medicine', 1500, 'Pune District Health Supply Van',
            'TRK-MH-DT-401', 'in_transit',
            now() - interval '4 hours', now() + interval '4 hours', NULL,
            false, 'Last-mile delivery en route to Baramati PHC', now() - interval '5 hours', now()
        ),
        (
            'e0000001-0000-0000-0000-000000000017',
            'c0000003-0000-0000-0000-000000000002',
            'c0000003-0000-0000-0000-000000000003',
            'd0000004-0000-0000-0000-000000000001',
            'medicine', 1200, 'District Medical Logistics #3',
            'TRK-MH-DT-402', 'in_transit',
            now() - interval '3 hours', now() + interval '3 hours', NULL,
            false, 'In transit via NH-60 to Junnar Mountain PHC', now() - interval '4 hours', now()
        ),
        (
            'e0000001-0000-0000-0000-000000000018',
            'c0000003-0000-0000-0000-000000000003',
            'c0000003-0000-0000-0000-000000000002',
            'd0000004-0000-0000-0000-000000000011',
            'medicine', 350, 'Pune Rural Express Dispatch',
            'TRK-MH-DT-403', 'in_transit',
            now() - interval '2 hours', now() + interval '5 hours', NULL,
            false, 'In transit to Shirur Rural PHC', now() - interval '3 hours', now()
        ),
        (
            'e0000001-0000-0000-0000-000000000019',
            'c0000003-0000-0000-0000-000000000004',
            'c0000003-0000-0000-0000-000000000001',
            'd0000004-0000-0000-0000-000000000006',
            'medicine', 1800, 'Pune District Health Fleet',
            'TRK-MH-DT-404', 'in_transit',
            now() - interval '3 hours', now() + interval '2 hours', NULL,
            false, 'Departed Pune hub toward Dharavi Urban Health Clinic', now() - interval '4 hours', now()
        ),
        (
            'e0000001-0000-0000-0000-000000000020',
            'c0000003-0000-0000-0000-000000000005',
            'c0000003-0000-0000-0000-000000000002',
            'd0000004-0000-0000-0000-000000000002',
            'medicine', 900, 'District Supply Vehicle #1',
            'TRK-MH-DT-405', 'in_transit',
            now() - interval '2 hours', now() + interval '4 hours', NULL,
            false, 'Navigating rural arterial corridor to Kolhapur PHC', now() - interval '3 hours', now()
        ),

        -- Stage: phc (status: 'delivered')
        (
            'e0000001-0000-0000-0000-000000000021',
            'c0000003-0000-0000-0000-000000000001',
            'c0000003-0000-0000-0000-000000000004',
            'd0000004-0000-0000-0000-000000000001',
            'medicine', 2000, 'District Logistics Team',
            'TRK-MH-PHC-501', 'delivered',
            now() - interval '18 hours', now() - interval '6 hours', now() - interval '6 hours',
            false, 'Received and shelf-stocked at Baramati PHC pharmacy', now() - interval '1 day', now()
        ),
        (
            'e0000001-0000-0000-0000-000000000022',
            'c0000003-0000-0000-0000-000000000002',
            'c0000003-0000-0000-0000-000000000003',
            'd0000004-0000-0000-0000-000000000002',
            'medicine', 1000, 'District Logistics Team',
            'TRK-MH-PHC-502', 'delivered',
            now() - interval '24 hours', now() - interval '18 hours', now() - interval '18 hours',
            false, 'Received and verified at Shirur Rural PHC inventory', now() - interval '2 days', now()
        ),

        -- Status: delayed (is_delayed = true)
        (
            'e0000001-0000-0000-0000-000000000023',
            'c0000003-0000-0000-0000-000000000003',
            'c0000003-0000-0000-0000-000000000001',
            'd0000004-0000-0000-0000-000000000009',
            'medicine', 300, 'Cold-Chain Express #5',
            'TRK-MH-DLY-601', 'delayed',
            now() - interval '14 hours', now() - interval '2 hours', NULL,
            true, 'Cold chain monitoring delay at checkpoint near Khed', now() - interval '16 hours', now()
        ),
        (
            'e0000001-0000-0000-0000-000000000024',
            'c0000003-0000-0000-0000-000000000004',
            'c0000003-0000-0000-0000-000000000002',
            'd0000004-0000-0000-0000-000000000004',
            'medicine', 750, 'State Rural Logistics',
            'TRK-MH-DLY-602', 'delayed',
            now() - interval '16 hours', now() - interval '4 hours', NULL,
            true, 'Road maintenance detours on Pune-Nashik highway cause 14h delay', now() - interval '18 hours', now()
        )
        ON CONFLICT (id) DO UPDATE
        SET status = EXCLUDED.status,
            is_delayed = EXCLUDED.is_delayed,
            carrier = EXCLUDED.carrier,
            notes = EXCLUDED.notes,
            updated_at = now();
      `);
      console.log('[M2 Seed] Successfully seeded 24 supply_chain_shipments records.');
    }

    // 3. Ensure redistribution_transfers has active records with status 'recommended'
    const recCountRes = await client.query(`SELECT count(*)::int AS count FROM redistribution_transfers WHERE status = 'recommended'`);
    const recCount = recCountRes.rows[0]?.count || 0;

    if (recCount < 5) {
      console.log(`[M2 Seed] Seeding active recommended records into redistribution_transfers (current: ${recCount})...`);
      await client.query(`
        INSERT INTO redistribution_transfers (
            id, source_phc_id, dest_phc_id, medicine_id, item_ref, item_type, quantity, recommended_by, status, notes, ai_explanation, urgency_level, created_at
        ) VALUES
        (
            '07000007-0000-0000-0000-000000000011',
            'c0000003-0000-0000-0000-000000000003',
            'c0000003-0000-0000-0000-000000000004',
            'd0000004-0000-0000-0000-000000000002',
            'd0000004-0000-0000-0000-000000000002',
            'medicine', 1200, 'ai', 'recommended',
            'Shirur has 42 days surplus coverage. Baramati facing stockout within 3 days. AI MILP recommendation.',
            'Shirur has 42 days surplus coverage. Baramati facing stockout within 3 days. AI MILP recommendation.',
            'CRITICAL',
            now() - interval '4 hours'
        ),
        (
            '07000007-0000-0000-0000-000000000012',
            'c0000003-0000-0000-0000-000000000002',
            'c0000003-0000-0000-0000-000000000001',
            'd0000004-0000-0000-0000-000000000001',
            'd0000004-0000-0000-0000-000000000001',
            'medicine', 1800, 'ai', 'recommended',
            'High patient demand surge detected in urban clinic. Rebalance 1800 Paracetamol units from northern reserve.',
            'High patient demand surge detected in urban clinic. Rebalance 1800 Paracetamol units from northern reserve.',
            'HIGH',
            now() - interval '6 hours'
        ),
        (
            '07000007-0000-0000-0000-000000000013',
            'c0000003-0000-0000-0000-000000000005',
            'c0000003-0000-0000-0000-000000000003',
            'd0000004-0000-0000-0000-000000000003',
            'd0000004-0000-0000-0000-000000000003',
            'medicine', 600, 'ai', 'recommended',
            'Diarrheal outbreak signal in rural catchment; transfer 600 ORS sachets from regional surplus.',
            'Diarrheal outbreak signal in rural catchment; transfer 600 ORS sachets from regional surplus.',
            'HIGH',
            now() - interval '8 hours'
        ),
        (
            '07000007-0000-0000-0000-000000000014',
            'c0000003-0000-0000-0000-000000000004',
            '9087af08-490c-498f-ae26-c90a2be11af0',
            'd0000004-0000-0000-0000-000000000004',
            'd0000004-0000-0000-0000-000000000004',
            'medicine', 400, 'ai', 'recommended',
            'Baramati inventory buffer exceeds 3.5x baseline safety threshold; reallocate 400 units to Solapur.',
            'Baramati inventory buffer exceeds 3.5x baseline safety threshold; reallocate 400 units to Solapur.',
            'MEDIUM',
            now() - interval '12 hours'
        ),
        (
            '07000007-0000-0000-0000-000000000015',
            'c0000003-0000-0000-0000-000000000001',
            'c0000003-0000-0000-0000-000000000002',
            'd0000004-0000-0000-0000-000000000011',
            'd0000004-0000-0000-0000-000000000011',
            'medicine', 250, 'ai', 'recommended',
            'Seasonal respiratory illness spike in mountain terrain; dispatch 250 Salbutamol inhalers from urban stock.',
            'Seasonal respiratory illness spike in mountain terrain; dispatch 250 Salbutamol inhalers from urban stock.',
            'MEDIUM',
            now() - interval '14 hours'
        ),
        (
            '07000007-0000-0000-0000-000000000016',
            'c0000003-0000-0000-0000-000000000003',
            'c0000003-0000-0000-0000-000000000005',
            'd0000004-0000-0000-0000-000000000012',
            'd0000004-0000-0000-0000-000000000012',
            'medicine', 850, 'ai', 'recommended',
            'Pediatric clinic stock rebalancing recommendation based on upcoming batch expiration dates (FEFO rotation).',
            'Pediatric clinic stock rebalancing recommendation based on upcoming batch expiration dates (FEFO rotation).',
            'HIGH',
            now() - interval '16 hours'
        )
        ON CONFLICT (id) DO UPDATE
        SET status = EXCLUDED.status,
            quantity = EXCLUDED.quantity,
            notes = EXCLUDED.notes,
            ai_explanation = EXCLUDED.ai_explanation;
      `);
      console.log('[M2 Seed] Successfully seeded recommended redistribution_transfers records.');
    }
  } catch (err: any) {
    console.error('[M2 Seed] Error ensuring seeds and indexes:', err?.message || err);
  } finally {
    client.release();
  }
}

if (require.main === module) {
  ensureM2SeedsAndIndexes().then(() => {
    console.log('[M2 Seed] Finished seeding database.');
    pool.end();
  });
}
