import unittest
import numpy as np
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

    def test_predict_demand(self):
        req = main.ForecastRequest(
            phc_id='phc-001',
            medicine_id='med-001',
            historical_daily_consumption=[15.0, 18.0, 22.0, 20.0, 25.0],
            days_ahead=14,
            current_stock=100,
            minimum_threshold=30
        )
        res = main.predict_demand(req)
        self.assertEqual(len(res.forecast_points), 14)
        self.assertIn(res.projected_stockout_risk, ['NORMAL', 'MODERATE', 'HIGH', 'CRITICAL'])
        self.assertGreater(res.recommended_reorder_qty, 0)
        self.assertGreaterEqual(res.confidence_score, 0.7)

    def test_detect_anomalies(self):
        req = main.AnomalyDetectionRequest(
            phc_id='phc-001',
            metric_name='fever_cases',
            series=[12.0, 13.0, 11.0, 14.0, 12.0, 85.0, 13.0],
            z_threshold=3.0
        )
        res = main.detect_anomalies(req)
        self.assertEqual(res.anomalies_detected, 1)
        self.assertEqual(res.anomaly_points[5].is_anomaly, True)
        self.assertEqual(res.outbreak_risk_level, 'HIGH')

    def test_optimize_redistribution(self):
        req = main.RedistributionRequest(
            medicine_id='med-001',
            nodes=[
                main.RedistributionNode(phc_id='phc-A', surplus=50, deficit=0, urgency=0.1),
                main.RedistributionNode(phc_id='phc-B', surplus=0, deficit=30, urgency=0.9)
            ]
        )
        res = main.optimize_redistribution(req)
        self.assertEqual(res.total_transfers_recommended, 1)
        self.assertEqual(res.transfers[0].quantity, 30)
        self.assertEqual(res.transfers[0].priority, 'CRITICAL')

    def test_simulate_crisis(self):
        req = main.CrisisScenarioRequest(
            scenario_type='outbreak',
            footfall_delta_percent=50.0,
            supply_disruption_percent=20.0,
            duration_days=14
        )
        res = main.simulate_crisis(req)
        self.assertIn(res.risk_rating, ['HIGH', 'CRITICAL'])
        self.assertGreater(res.additional_beds_needed, 0)
        self.assertGreater(res.additional_oxygen_needed, 0)

    def test_federation_round_simulate(self):
        req = main.FedAvgAggregationRequest(
            round_number=19,
            participating_countries=['IN', 'BR', 'RU', 'ZA']
        )
        res = main.simulate_fedavg_round(req)
        self.assertTrue(res.quorum_met)
        self.assertEqual(res.global_model_version, 'v1.19')
        self.assertEqual(res.status, 'awaiting_review')
        self.assertEqual(len(res.aggregated_weights_hash), 64)

if __name__ == '__main__':
    unittest.main()
