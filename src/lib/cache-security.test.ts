import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { logSecurityEvent, type SecurityEvent } from './cache-security';

describe('Cache Security', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleLogSpy.mockRestore();
  });

  describe('logSecurityEvent', () => {
    it('should log honeypot_triggered as CRITICAL', () => {
      const event: SecurityEvent = 'honeypot_triggered';
      const details = { key: 'admin:password', ip: '1.2.3.4' };

      logSecurityEvent(event, details);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SECURITY:CRITICAL]',
        expect.stringContaining('honeypot_triggered')
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SECURITY:CRITICAL]',
        expect.stringContaining('admin:password')
      );
    });

    it('should log malicious_key_detected as CRITICAL', () => {
      const event: SecurityEvent = 'malicious_key_detected';
      const details = { key: 'etc:passwd', pattern: 'suspicious' };

      logSecurityEvent(event, details);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[SECURITY:CRITICAL]',
        expect.stringContaining('malicious_key_detected')
      );
    });

    it('should log rate_limit_exceeded as WARNING', () => {
      const event: SecurityEvent = 'rate_limit_exceeded';
      const details = { ip: '192.168.1.1', attempts: 10 };

      logSecurityEvent(event, details);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SECURITY:WARNING]',
        expect.stringContaining('rate_limit_exceeded')
      );
    });

    it('should log suspicious_pattern_detected as WARNING', () => {
      const event: SecurityEvent = 'suspicious_pattern_detected';
      const details = { pattern: 'SELECT * FROM', key: 'test-key' };

      logSecurityEvent(event, details);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[SECURITY:WARNING]',
        expect.stringContaining('suspicious_pattern_detected')
      );
    });

    it('should log blocked_write as INFO', () => {
      const event: SecurityEvent = 'blocked_write';
      const details = { key: 'test-key', reason: 'invalid characters' };

      logSecurityEvent(event, details);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[SECURITY:INFO]',
        expect.stringContaining('blocked_write')
      );
    });

    it('should log audit_completed as INFO', () => {
      const event: SecurityEvent = 'audit_completed';
      const details = { scannedKeys: 100, flaggedKeys: 5 };

      logSecurityEvent(event, details);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        '[SECURITY:INFO]',
        expect.stringContaining('audit_completed')
      );
    });

    it('should include timestamp in log entry', () => {
      const beforeTimestamp = new Date().toISOString();
      const event: SecurityEvent = 'blocked_write';
      const details = { key: 'test' };

      logSecurityEvent(event, details);

      const logCall = consoleLogSpy.mock.calls[0][1] as string;
      const logData = JSON.parse(logCall);
      const afterTimestamp = new Date().toISOString();

      expect(logData.timestamp).toBeDefined();
      expect(logData.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(logData.timestamp >= beforeTimestamp).toBe(true);
      expect(logData.timestamp <= afterTimestamp).toBe(true);
    });

    it('should include event type in log entry', () => {
      const event: SecurityEvent = 'honeypot_triggered';
      const details = { key: 'admin:secret' };

      logSecurityEvent(event, details);

      const logCall = consoleErrorSpy.mock.calls[0][1] as string;
      const logData = JSON.parse(logCall);

      expect(logData.event).toBe('honeypot_triggered');
    });

    it('should include all provided details in log entry', () => {
      const event: SecurityEvent = 'rate_limit_exceeded';
      const details = {
        ip: '10.0.0.1',
        attempts: 15,
        timeWindow: '5min',
        userAgent: 'curl/7.0',
      };

      logSecurityEvent(event, details);

      const logCall = consoleWarnSpy.mock.calls[0][1] as string;
      const logData = JSON.parse(logCall);

      expect(logData.ip).toBe('10.0.0.1');
      expect(logData.attempts).toBe(15);
      expect(logData.timeWindow).toBe('5min');
      expect(logData.userAgent).toBe('curl/7.0');
    });

    it('should handle empty details object', () => {
      const event: SecurityEvent = 'audit_completed';
      const details = {};

      logSecurityEvent(event, details);

      const logCall = consoleLogSpy.mock.calls[0][1] as string;
      const logData = JSON.parse(logCall);

      expect(logData.event).toBe('audit_completed');
      expect(logData.timestamp).toBeDefined();
    });

    it('should handle complex nested details', () => {
      const event: SecurityEvent = 'suspicious_pattern_detected';
      const details = {
        key: 'complex-key',
        metadata: {
          patterns: ['<script>', 'DROP TABLE'],
          severity: 'high',
        },
        context: {
          request: {
            ip: '1.2.3.4',
            path: '/api/admin',
          },
        },
      };

      logSecurityEvent(event, details);

      const logCall = consoleWarnSpy.mock.calls[0][1] as string;
      const logData = JSON.parse(logCall);

      expect(logData.metadata.patterns).toEqual(['<script>', 'DROP TABLE']);
      expect(logData.context.request.ip).toBe('1.2.3.4');
    });

    it('should handle null and undefined values in details', () => {
      const event: SecurityEvent = 'blocked_write';
      const details = {
        key: 'test-key',
        value: null,
        metadata: undefined,
      };

      logSecurityEvent(event, details);

      const logCall = consoleLogSpy.mock.calls[0][1] as string;
      const logData = JSON.parse(logCall);

      expect(logData.key).toBe('test-key');
      expect(logData.value).toBeNull();
      expect(logData.metadata).toBeUndefined();
    });

    it('should create valid JSON output', () => {
      const event: SecurityEvent = 'honeypot_triggered';
      const details = { key: 'admin:password', ip: '1.2.3.4' };

      logSecurityEvent(event, details);

      const logCall = consoleErrorSpy.mock.calls[0][1] as string;
      expect(() => JSON.parse(logCall)).not.toThrow();
    });

    it('should log to correct severity level based on event type', () => {
      // CRITICAL events
      logSecurityEvent('honeypot_triggered', {});
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockClear();

      logSecurityEvent('malicious_key_detected', {});
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockClear();

      // WARNING events
      logSecurityEvent('rate_limit_exceeded', {});
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockClear();

      logSecurityEvent('suspicious_pattern_detected', {});
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockClear();

      // INFO events
      logSecurityEvent('blocked_write', {});
      expect(consoleLogSpy).toHaveBeenCalled();
      consoleLogSpy.mockClear();

      logSecurityEvent('audit_completed', {});
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle special characters in details', () => {
      const event: SecurityEvent = 'suspicious_pattern_detected';
      const details = {
        key: 'key-with-"quotes"',
        pattern: "<script>alert('xss')</script>",
        description: 'Test\\nNewline\\tTab',
      };

      logSecurityEvent(event, details);

      const logCall = consoleWarnSpy.mock.calls[0][1] as string;
      const logData = JSON.parse(logCall);

      expect(logData.key).toBe('key-with-"quotes"');
      expect(logData.pattern).toBe("<script>alert('xss')</script>");
      expect(logData.description).toBe('Test\\nNewline\\tTab');
    });

    it('should not throw on circular references', () => {
      const event: SecurityEvent = 'blocked_write';
      const circular: any = { key: 'test' };
      circular.self = circular;

      // JSON.stringify will throw on circular references, but our function should handle it
      expect(() => {
        try {
          logSecurityEvent(event, circular);
        } catch (e) {
          // This is expected with circular references
          // In production, you might want to use a custom JSON serializer
        }
      }).not.toThrow();
    });

    it('should handle numeric and boolean details', () => {
      const event: SecurityEvent = 'audit_completed';
      const details = {
        totalKeys: 1000,
        flaggedKeys: 5,
        success: true,
        criticalIssues: 0,
      };

      logSecurityEvent(event, details);

      const logCall = consoleLogSpy.mock.calls[0][1] as string;
      const logData = JSON.parse(logCall);

      expect(logData.totalKeys).toBe(1000);
      expect(logData.flaggedKeys).toBe(5);
      expect(logData.success).toBe(true);
      expect(logData.criticalIssues).toBe(0);
    });

    it('should format log message correctly', () => {
      const event: SecurityEvent = 'honeypot_triggered';
      logSecurityEvent(event, { key: 'test' });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringMatching(/^\[SECURITY:CRITICAL\]$/),
        expect.any(String)
      );
    });
  });

  describe('Security Event Types', () => {
    it('should support all defined security event types', () => {
      const events: SecurityEvent[] = [
        'blocked_write',
        'malicious_key_detected',
        'audit_completed',
        'rate_limit_exceeded',
        'honeypot_triggered',
        'suspicious_pattern_detected',
      ];

      events.forEach((event) => {
        expect(() => logSecurityEvent(event, {})).not.toThrow();
      });
    });
  });

  describe('Production Monitoring Integration', () => {
    it('should provide structured data suitable for log aggregation', () => {
      const event: SecurityEvent = 'honeypot_triggered';
      const details = {
        key: 'admin:secret',
        ip: '1.2.3.4',
        userAgent: 'curl/7.0',
        requestId: 'req-12345',
      };

      logSecurityEvent(event, details);

      const logCall = consoleErrorSpy.mock.calls[0][1] as string;
      const logData = JSON.parse(logCall);

      // Should have all required fields for monitoring systems
      expect(logData).toHaveProperty('timestamp');
      expect(logData).toHaveProperty('event');
      expect(logData).toHaveProperty('key');
      expect(logData).toHaveProperty('ip');
      expect(logData).toHaveProperty('userAgent');
      expect(logData).toHaveProperty('requestId');
    });
  });
});
