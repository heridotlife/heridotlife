/**
 * Security utilities for KV cache
 */

/**
 * Log security event for monitoring
 */
export function logSecurityEvent(
  event: 'blocked_write' | 'malicious_key_detected' | 'audit_completed',
  details: Record<string, unknown>
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    ...details,
  };

  // In production, send to logging service
  console.warn('[SECURITY]', JSON.stringify(logEntry));
}
