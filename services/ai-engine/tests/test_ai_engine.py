import unittest
import main

class TestAIEngine(unittest.TestCase):
    def test_health(self):
        res = main.health_check()
        self.assertEqual(res['status'], 'healthy')
        self.assertEqual(res['port'], 5000)

    def test_root(self):
        res = main.read_root()
        self.assertEqual(res['status'], 'online')
        self.assertIn('Prophet-Demand-Forecaster-v2.1', res['models'])
        self.assertIn('forecasting', res['modules'])

    def test_predict_demand(self):
        req = main.ForecastRequest(
            phc_id='phc-001',
            medicine_id='med-001',
            historical_daily_consumption=[15.0, 18.0, 22.0, 20.0, 25.0],
            days_ahead=14,
            current_stock=100,
            safety_buffer_pct=20.0
        )
        res = main.predict_demand(req)
        self.assertEqual(len(res.forecasted_daily_demand), 14)
        self.assertIn(res.stockout_risk, ['NORMAL', 'WARNING', 'CRITICAL'])
        self.assertGreater(res.recommended_reorder_qty, 0)
        self.assertGreaterEqual(res.predicted_value, 0)
        self.assertGreaterEqual(res.confidence_upper, res.predicted_value)

    def test_detect_anomalies(self):
        req = main.AnomalyRequest(
            phc_id='phc-001',
            series_type='consumption',
            values=[12.0, 13.0, 11.0, 14.0, 12.0, 13.0, 85.0],
            sigma_threshold=2.5
        )
        res = main.detect_anomaly(req)
        self.assertTrue(res.anomaly_detected)
        self.assertIn(res.severity, ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'])
        self.assertEqual(res.signal_type, 'isolated_anomaly')

    def test_optimize_redistribution(self):
        req = main.RedistributionRequest(
            surplus_nodes=[
                main.SurplusNode(
                    phc_id='phc-A',
                    medicine_id='med-001',
                    available_qty=50,
                    expiry_date='2026-12-31',
                    lat=12.9716,
                    lon=77.5946
                )
            ],
            deficit_nodes=[
                main.DeficitNode(
                    phc_id='phc-B',
                    medicine_id='med-001',
                    deficit_qty=30,
                    urgency='critical',
                    lat=12.9800,
                    lon=77.6000
                )
            ]
        )
        res = main.optimize_redistribution(req)
        self.assertIn(res.status, ['optimal', 'partial'])
        self.assertGreaterEqual(len(res.recommendations), 1)
        self.assertEqual(res.recommendations[0].quantity, 30)
        self.assertEqual(res.recommendations[0].source_phc_id, 'phc-A')
        self.assertEqual(res.recommendations[0].dest_phc_id, 'phc-B')

    def test_simulate_crisis(self):
        req = main.CrisisScenario(
            footfall_delta_pct=50.0,
            supply_delta_pct=-20.0,
            duration_days=14,
            affected_district_ids=['dist-01']
        )
        res = main.simulate_crisis(req)
        self.assertGreater(res.additional_beds_needed, 0)
        self.assertGreater(res.additional_oxygen_needed, 0)
        self.assertEqual(len(res.most_affected_districts), 1)

    def test_federation_round_lifecycle(self):
        # 1. Start round
        start_req = main.StartRoundRequest(model_id='brics-demand-v1', target_epsilon=1.0)
        round_summary = main.start_round(start_req)
        self.assertEqual(round_summary.status, 'pending')
        self.assertEqual(len(round_summary.this_hash), 64)

        # 2. Submit DP-SGD update
        agg_req = main.AggregateRequest(
            round_id=round_summary.id,
            country_code='IN',
            local_weight_updates=[0.1, 0.2, 0.3],
            epsilon_spent=0.5
        )
        submit_res = main.aggregate_update(agg_req)
        self.assertIn(submit_res['status'], ['update_received', 'aggregated'])
        self.assertEqual(submit_res['epsilon_spent'], 0.5)

        # 3. Approve round
        approve_req = main.ApproveRoundRequest(round_id=round_summary.id, decision='approve', notes='Verified accuracy')
        final_round = main.approve_round(round_summary.id, approve_req)
        self.assertEqual(final_round['status'], 'completed')

    def test_risk_scoring(self):
        req = main.RiskScoreRequest(
            phc_id='phc-001',
            current_stock=10.0,
            minimum_threshold=30.0,
            consumption_acceleration=2.0
        )
        res = main.score_risk(req)
        self.assertIn(res.risk_level, ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'])
        self.assertGreaterEqual(res.risk_score, 0)

    def test_copilot_query(self):
        req = main.CopilotRequest(
            question='Why is District A at high risk?',
            role='state_admin',
            scope_id='state-01',
            context_snippets=['District A current_stock: 10\nDistrict A forecast_demand: 100\nconsumption_rate: 25']
        )
        res = main.copilot_query(req)
        self.assertTrue(len(res.answer) > 0)
        self.assertIn('copilot', res.model_version)

if __name__ == '__main__':
    unittest.main()
