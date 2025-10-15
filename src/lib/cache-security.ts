/**
 * Security utilities for KV cache
 */

/**
 * Security event types
 */
export type SecurityEvent =
  | 'blocked_write'
  | 'malicious_key_detected'
  | 'audit_completed'
  | 'rate_limit_exceeded'
  | 'honeypot_triggered'
  | 'suspicious_pattern_detected';

/**
 * Log security event for monitoring
 */
export function logSecurityEvent(event: SecurityEvent, details: Record<string, unknown>): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ...details,
  };

  // Determine severity level
  const severity =
    event === 'honeypot_triggered' || event === 'malicious_key_detected'
      ? 'CRITICAL'
      : event === 'rate_limit_exceeded' || event === 'suspicious_pattern_detected'
        ? 'WARNING'
        : 'INFO';

  // In production, send to logging service
  if (severity === 'CRITICAL') {
    console.error(`[SECURITY:${severity}]`, JSON.stringify(logEntry));
  } else if (severity === 'WARNING') {
    console.warn(`[SECURITY:${severity}]`, JSON.stringify(logEntry));
  } else {
    console.log(`[SECURITY:${severity}]`, JSON.stringify(logEntry));
  }
}
