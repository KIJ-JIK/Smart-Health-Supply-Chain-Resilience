export interface MetricsSnapshot {
  timestamp: string;
  totalRequests: number;
  totalErrors: number;
  errorRatePct: number;
  apiLatencyAvgMs: number;
  apiLatencyP50Ms: number;
  apiLatencyP95Ms: number;
  apiLatencyP99Ms: number;
  syncFailuresCount: number;
  queueDepth: number;
  eventLagMs: number;
  dbLatencyMs: number;
  activeAlerts: Array<{
    metric: string;
    severity: 'warning' | 'critical';
    message: string;
    value: number;
    threshold: number;
  }>;
}

export class MetricsService {
  private static totalRequests = 0;
  private static totalErrors = 0;
  private static latencies: number[] = [];
  private static maxLatencySamples = 1000;

  private static syncFailures = 0;
  private static queueDepth = 0;
  private static eventLag = 12.5; // Baseline ms
  private static dbLatency = 8.2;  // Baseline ms

  /**
   * Feed request telemetry from structured logger
   */
  static recordRequestTelemetry(latencyMs: number, statusCode: number, _operation?: string): void {
    this.totalRequests++;
    if (statusCode >= 400) {
      this.totalErrors++;
    }

    this.latencies.push(latencyMs);
    if (this.latencies.length > this.maxLatencySamples) {
      this.latencies.shift();
    }
  }

  static recordSyncFailure(): void {
    this.syncFailures++;
  }

  static recordQueueDepth(depth: number): void {
    this.queueDepth = Math.max(0, depth);
  }

  static recordEventLag(lagMs: number): void {
    this.eventLag = parseFloat(lagMs.toFixed(2));
  }

  static recordDbLatency(latencyMs: number): void {
    this.dbLatency = parseFloat(latencyMs.toFixed(2));
  }

  /**
   * Reset metrics (useful for isolated testing)
   */
  static reset(): void {
    this.totalRequests = 0;
    this.totalErrors = 0;
    this.latencies = [];
    this.syncFailures = 0;
    this.queueDepth = 0;
    this.eventLag = 12.5;
    this.dbLatency = 8.2;
  }

  /**
   * Calculate percentile from latency samples
   */
  private static calculatePercentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
  }

  /**
   * Generate current real-time telemetry snapshot with threshold alerts (Prompt 21).
   */
  static getMetricsSnapshot(): MetricsSnapshot {
    const errorRatePct = this.totalRequests > 0
      ? parseFloat(((this.totalErrors / this.totalRequests) * 100).toFixed(2))
      : 0;

    const sorted = [...this.latencies].sort((a, b) => a - b);
    const sum = sorted.reduce((acc, v) => acc + v, 0);
    const apiLatencyAvgMs = sorted.length > 0 ? parseFloat((sum / sorted.length).toFixed(2)) : 0;
    const apiLatencyP50Ms = this.calculatePercentile(sorted, 50);
    const apiLatencyP95Ms = this.calculatePercentile(sorted, 95);
    const apiLatencyP99Ms = this.calculatePercentile(sorted, 99);

    const activeAlerts: MetricsSnapshot['activeAlerts'] = [];

    // Threshold Alert Checks
    if (errorRatePct > 5.0) {
      activeAlerts.push({
        metric: 'error_rate',
        severity: errorRatePct > 15.0 ? 'critical' : 'warning',
        message: `High error rate detected: ${errorRatePct}% exceeds threshold`,
        value: errorRatePct,
        threshold: 5.0,
      });
    }

    if (apiLatencyP95Ms > 500) {
      activeAlerts.push({
        metric: 'api_latency_p95',
        severity: apiLatencyP95Ms > 1000 ? 'critical' : 'warning',
        message: `P95 API latency is high: ${apiLatencyP95Ms}ms exceeds 500ms SLA`,
        value: apiLatencyP95Ms,
        threshold: 500,
      });
    }

    if (this.queueDepth > 1000) {
      activeAlerts.push({
        metric: 'queue_depth',
        severity: 'warning',
        message: `Mutation queue depth backlog: ${this.queueDepth} pending operations`,
        value: this.queueDepth,
        threshold: 1000,
      });
    }

    if (this.dbLatency > 100) {
      activeAlerts.push({
        metric: 'db_latency',
        severity: 'warning',
        message: `PostgreSQL connection latency degraded: ${this.dbLatency}ms`,
        value: this.dbLatency,
        threshold: 100,
      });
    }

    return {
      timestamp: new Date().toISOString(),
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      errorRatePct,
      apiLatencyAvgMs,
      apiLatencyP50Ms,
      apiLatencyP95Ms,
      apiLatencyP99Ms,
      syncFailuresCount: this.syncFailures,
      queueDepth: this.queueDepth,
      eventLagMs: this.eventLag,
      dbLatencyMs: this.dbLatency,
      activeAlerts,
    };
  }

  /**
   * Format metrics in standard Prometheus exposition format
   */
  static toPrometheusFormat(): string {
    const s = this.getMetricsSnapshot();
    return [
      '# HELP http_requests_total Total HTTP requests received',
      '# TYPE http_requests_total counter',
      `http_requests_total ${s.totalRequests}`,
      '',
      '# HELP http_requests_errors_total Total HTTP 4xx/5xx errors',
      '# TYPE http_requests_errors_total counter',
      `http_requests_errors_total ${s.totalErrors}`,
      '',
      '# HELP http_request_duration_milliseconds API Latency Summary',
      '# TYPE http_request_duration_milliseconds summary',
      `http_request_duration_milliseconds{quantile="0.5"} ${s.apiLatencyP50Ms}`,
      `http_request_duration_milliseconds{quantile="0.95"} ${s.apiLatencyP95Ms}`,
      `http_request_duration_milliseconds{quantile="0.99"} ${s.apiLatencyP99Ms}`,
      '',
      '# HELP sync_failures_total Total failed sync pushes',
      '# TYPE sync_failures_total counter',
      `sync_failures_total ${s.syncFailuresCount}`,
      '',
      '# HELP queue_depth_current Pending mutation queue backlog',
      '# TYPE queue_depth_current gauge',
      `queue_depth_current ${s.queueDepth}`,
      '',
      '# HELP event_bus_lag_milliseconds Average event dispatch delay',
      '# TYPE event_bus_lag_milliseconds gauge',
      `event_bus_lag_milliseconds ${s.eventLagMs}`,
      '',
      '# HELP db_query_latency_milliseconds Average database query latency',
      '# TYPE db_query_latency_milliseconds gauge',
      `db_query_latency_milliseconds ${s.dbLatencyMs}`,
      '',
    ].join('\n');
  }
}
