import crypto from 'node:crypto';
import os from 'node:os';
import { getInstanceId } from './instance-id.js';

interface TelemetryEvent {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  instanceId: string;
}

export interface InstanceSnapshot {
  activeRooms: number;
  totalSessions: number;
  totalConnections: number;
  uniqueIps: number;
}

/**
 * Privacy-first telemetry.
 *
 * - Can be disabled via TELEMETRY_ENABLED=false
 * - Never sends raw IPs, hostnames, or user-agents
 * - IPs are hashed (one-way) before leaving the process
 * - Only aggregated, non-identifying stats are sent in heartbeats
 * - Instance ID is a random UUID — not tied to any person
 */
export class Telemetry {
  private buffer: TelemetryEvent[] = [];
  private readonly endpoint: string;
  private readonly heartbeatEndpoint: string;
  readonly instanceId: string;
  private readonly enabled: boolean;
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private startedAt: number;
  private statsProvider: (() => InstanceSnapshot) | null = null;

  constructor(baseUrl: string, enabled = true) {
    this.endpoint = `${baseUrl}/telemetry/events`;
    this.heartbeatEndpoint = `${baseUrl}/telemetry/heartbeat`;
    this.instanceId = getInstanceId();
    this.startedAt = Date.now();
    this.enabled = enabled;

    if (!this.enabled) return;

    this.flushTimer = setInterval(() => this.flush(), 30_000);
    if (this.flushTimer.unref) this.flushTimer.unref();

    this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), 5 * 60_000);
    if (this.heartbeatTimer.unref) this.heartbeatTimer.unref();

    const initial = setTimeout(() => this.sendHeartbeat(), 10_000);
    if (initial.unref) initial.unref();
  }

  setStatsProvider(fn: () => InstanceSnapshot): void {
    this.statsProvider = fn;
  }

  trackSessionCreated(roomId: string): void {
    this.push('session_created', { roomId });
  }

  trackConnection(roomId: string, role: string, ip: string): void {
    // Hash IP before buffering — raw IP never leaves process
    this.push('connection', { roomId, role, ipHash: this.hashIp(ip) });
  }

  trackDisconnection(roomId: string, role: string): void {
    this.push('disconnection', { roomId, role });
  }

  private hashIp(ip: string): string {
    return crypto.createHash('sha256').update(ip + 'referee-lights-salt').digest('hex').slice(0, 16);
  }

  private push(event: string, data: Record<string, unknown>): void {
    if (!this.enabled) return;
    this.buffer.push({
      event,
      data,
      timestamp: new Date().toISOString(),
      instanceId: this.instanceId
    });
    if (this.buffer.length >= 20) {
      void this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const batch = this.buffer.splice(0);
    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
        signal: AbortSignal.timeout(10_000)
      });
    } catch {
      // fire-and-forget
    }
  }

  private async sendHeartbeat(): Promise<void> {
    const stats = this.statsProvider?.() ?? null;
    // Only send non-identifying, aggregated data
    const payload = {
      instanceId: this.instanceId,
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
      stats
    };
    try {
      await fetch(this.heartbeatEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000)
      });
    } catch {
      // fire-and-forget
    }
  }
}
