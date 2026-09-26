import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { MetricsService } from '../modules/observability/metricsService';

export interface StructuredLogEntry {
  request_id: string;
  correlation_id: string;
  user_id: string | null;
  device_id: string | null;
  phc_id: string | null;
  timestamp: string;
  service: string;
  operation: string;
  latency: number;
  status: number;
}

export class Logger {
  private static recentLogs: StructuredLogEntry[] = [];
  private static maxInMemoryLogs = 500;

  static log(entry: StructuredLogEntry): void {
    // Keep in-memory ring buffer for test assertions and monitoring
    this.recentLogs.push(entry);
    if (this.recentLogs.length > this.maxInMemoryLogs) {
      this.recentLogs.shift();
    }

    // Standard JSON output format for log aggregation (Fluentd/Elastic/Datadog)
    if (process.env.NODE_ENV !== 'test') {
      console.log(JSON.stringify(entry));
    }
  }

  static getRecentLogs(limit: number = 50): StructuredLogEntry[] {
    return this.recentLogs.slice(-limit);
  }

  static clearLogs(): void {
    this.recentLogs = [];
  }
}

/**
 * Request-level structured logging middleware (Prompt 21).
 * Captures all 10 mandatory fields on every request.
 */
export function structuredLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startHrTime = process.hrtime();
  const timestamp = new Date().toISOString();

  // Extract or generate request correlation IDs
  const requestId = (req.headers['x-request-id'] as string) || crypto.randomUUID();
  const correlationId = (req.headers['x-correlation-id'] as string) || requestId;
  const deviceId = (req.headers['x-device-id'] as string) || (req.headers['x-device-cert'] as string) || null;

  // Intercept finish event to calculate final latency and response status code
  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    // Convert hrtime to milliseconds with 2 decimal places
    const latency = parseFloat(((elapsedHrTime[0] * 1000) + (elapsedHrTime[1] / 1000000)).toFixed(2));

    const claims = (req as any).claims;
    const userId = claims?.sub || null;
    const phcId = claims?.phcId || (claims as any)?.phc_id || req.params?.phcId || null;

    const entry: StructuredLogEntry = {
      request_id: requestId,
      correlation_id: correlationId,
      user_id: userId,
      device_id: deviceId,
      phc_id: phcId,
      timestamp,
      service: 'smart-health-backend',
      operation: `${req.method} ${req.baseUrl || ''}${req.path}`,
      latency,
      status: res.statusCode,
    };

    Logger.log(entry);

    // Feed telemetry metrics
    MetricsService.recordRequestTelemetry(latency, res.statusCode, entry.operation);
  });

  next();
}
