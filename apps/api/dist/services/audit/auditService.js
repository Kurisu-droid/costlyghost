export class AuditService {
    events = [];
    record(event) {
        const withTimestamp = { ...event, timestamp: new Date().toISOString() };
        this.events.push(withTimestamp);
        return withTimestamp;
    }
}
