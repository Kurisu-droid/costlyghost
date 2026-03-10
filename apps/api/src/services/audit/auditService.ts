export interface AuditEvent {
  eventType: string;
  actor: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  timestamp: string;
}

export class AuditService {
  events: AuditEvent[] = [];
  record(event: Omit<AuditEvent, 'timestamp'>): AuditEvent {
    const withTimestamp = { ...event, timestamp: new Date().toISOString() };
    this.events.push(withTimestamp);
    return withTimestamp;
  }
}
