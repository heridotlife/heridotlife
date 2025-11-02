import { describe, it, expect } from 'vitest';
import {
  isHoneypotKey,
  hasSuspiciousPattern,
  detectHoneypot,
  getHoneypotSeverity,
  createHoneypotTrap,
  HONEYPOT_KEYS,
  SUSPICIOUS_PATTERNS,
} from './honeypot';

describe('Honeypot Detection System', () => {
  describe('isHoneypotKey', () => {
    it('should detect admin honeypot keys', () => {
      expect(isHoneypotKey('admin:password')).toBe(true);
      expect(isHoneypotKey('admin:secret')).toBe(true);
      expect(isHoneypotKey('admin:api_key')).toBe(true);
      expect(isHoneypotKey('admin:token')).toBe(true);
    });

    it('should detect config honeypot keys', () => {
      expect(isHoneypotKey('config:secrets')).toBe(true);
      expect(isHoneypotKey('config:password')).toBe(true);
      expect(isHoneypotKey('config:api_key')).toBe(true);
    });

    it('should detect API honeypot keys', () => {
      expect(isHoneypotKey('api:keys')).toBe(true);
      expect(isHoneypotKey('api:secret')).toBe(true);
      expect(isHoneypotKey('api:token')).toBe(true);
    });

    it('should detect system honeypot keys', () => {
      expect(isHoneypotKey('system:root')).toBe(true);
      expect(isHoneypotKey('system:admin')).toBe(true);
      expect(isHoneypotKey('system:password')).toBe(true);
      expect(isHoneypotKey('root:password')).toBe(true);
      expect(isHoneypotKey('root:config')).toBe(true);
    });

    it('should detect database honeypot keys', () => {
      expect(isHoneypotKey('db:password')).toBe(true);
      expect(isHoneypotKey('db:credentials')).toBe(true);
      expect(isHoneypotKey('database:password')).toBe(true);
      expect(isHoneypotKey('mysql:password')).toBe(true);
      expect(isHoneypotKey('postgres:password')).toBe(true);
    });

    it('should detect backup honeypot keys', () => {
      expect(isHoneypotKey('backup:database')).toBe(true);
      expect(isHoneypotKey('backup:config')).toBe(true);
      expect(isHoneypotKey('.env')).toBe(true);
      expect(isHoneypotKey('env:secrets')).toBe(true);
      expect(isHoneypotKey('secrets:all')).toBe(true);
    });

    it('should detect file system honeypot keys', () => {
      expect(isHoneypotKey('etc:passwd')).toBe(true);
      expect(isHoneypotKey('etc:shadow')).toBe(true);
      expect(isHoneypotKey('etc:config')).toBe(true);
    });

    it('should detect JWT/Auth honeypot keys', () => {
      expect(isHoneypotKey('jwt:secret')).toBe(true);
      expect(isHoneypotKey('jwt:key')).toBe(true);
      expect(isHoneypotKey('auth:secret')).toBe(true);
      expect(isHoneypotKey('session:secret')).toBe(true);
    });

    it('should be case-insensitive', () => {
      expect(isHoneypotKey('ADMIN:PASSWORD')).toBe(true);
      expect(isHoneypotKey('Admin:Password')).toBe(true);
      expect(isHoneypotKey('JWT:SECRET')).toBe(true);
    });

    it('should handle whitespace', () => {
      expect(isHoneypotKey('  admin:password  ')).toBe(true);
      expect(isHoneypotKey('\tadmin:secret\n')).toBe(true);
    });

    it('should return false for legitimate keys', () => {
      expect(isHoneypotKey('user:123')).toBe(false);
      expect(isHoneypotKey('cache:posts')).toBe(false);
      expect(isHoneypotKey('session:abc123')).toBe(false);
      expect(isHoneypotKey('data:value')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isHoneypotKey('')).toBe(false);
    });
  });

  describe('hasSuspiciousPattern', () => {
    it('should detect SQL injection patterns', () => {
      expect(hasSuspiciousPattern('SELECT * FROM users').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('UNION SELECT password').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('DROP TABLE users').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('INSERT INTO admin').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern("' OR '1'='1").isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('" OR "1"="1').isSuspicious).toBe(true);
    });

    it('should detect path traversal patterns', () => {
      expect(hasSuspiciousPattern('../../../etc/passwd').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('..\\..\\windows\\system32').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('%2e%2e/etc/passwd').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('..%2fetc%2fpasswd').isSuspicious).toBe(true);
    });

    it('should detect command injection patterns', () => {
      expect(hasSuspiciousPattern(';ls -la').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern(';cat /etc/passwd').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern(';rm -rf /').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('|cat /etc/passwd').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('`whoami`').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('$(ls -la)').isSuspicious).toBe(true);
    });

    it('should detect XSS patterns', () => {
      expect(hasSuspiciousPattern('<script>alert(1)</script>').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('<SCRIPT>alert(1)</SCRIPT>').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('<iframe src="evil.com">').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('javascript:alert(1)').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('<img onerror=alert(1)>').isSuspicious).toBe(true);
    });

    it('should detect dangerous file extensions', () => {
      expect(hasSuspiciousPattern('shell.php').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('backdoor.jsp').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('malware.asp').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('virus.exe').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('script.sh').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('payload.bat').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('exploit.cmd').isSuspicious).toBe(true);
    });

    it('should detect common attack file names', () => {
      expect(hasSuspiciousPattern('webshell.txt').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('shell_backdoor.php').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('c99_shell.txt').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('r57shell.php').isSuspicious).toBe(true);
    });

    it('should detect encoded attacks', () => {
      expect(hasSuspiciousPattern('%3cscript%3ealert(1)%3c/script%3e').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('test%00.php').isSuspicious).toBe(true);
    });

    it('should return matched pattern for suspicious input', () => {
      const result = hasSuspiciousPattern('SELECT * FROM users');
      expect(result.isSuspicious).toBe(true);
      expect(result.matchedPattern).toBeDefined();
      expect(result.matchedPattern).toContain('select');
    });

    it('should return false for legitimate keys', () => {
      expect(hasSuspiciousPattern('user:session:123').isSuspicious).toBe(false);
      expect(hasSuspiciousPattern('cache:blog:posts').isSuspicious).toBe(false);
      expect(hasSuspiciousPattern('data:config:settings').isSuspicious).toBe(false);
      expect(hasSuspiciousPattern('normal-file.txt').isSuspicious).toBe(false);
      expect(hasSuspiciousPattern('document.pdf').isSuspicious).toBe(false);
    });

    it('should not return matched pattern for safe input', () => {
      const result = hasSuspiciousPattern('legitimate:key');
      expect(result.isSuspicious).toBe(false);
      expect(result.matchedPattern).toBeUndefined();
    });

    it('should handle case sensitivity correctly', () => {
      // SQL patterns should be case-insensitive
      expect(hasSuspiciousPattern('select * from users').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('SELECT * FROM users').isSuspicious).toBe(true);
      expect(hasSuspiciousPattern('SeLeCt * FrOm users').isSuspicious).toBe(true);
    });

    it('should handle empty strings', () => {
      const result = hasSuspiciousPattern('');
      expect(result.isSuspicious).toBe(false);
    });
  });

  describe('detectHoneypot', () => {
    it('should detect exact honeypot matches', () => {
      const result = detectHoneypot('admin:password');
      expect(result.isHoneypot).toBe(true);
      expect(result.isSuspicious).toBe(true);
      expect(result.reason).toBe('Honeypot key accessed');
    });

    it('should detect suspicious patterns without honeypot match', () => {
      const result = detectHoneypot('SELECT * FROM users');
      expect(result.isHoneypot).toBe(false);
      expect(result.isSuspicious).toBe(true);
      expect(result.reason).toBe('Suspicious pattern detected');
      expect(result.matchedPattern).toBeDefined();
    });

    it('should return safe for legitimate keys', () => {
      const result = detectHoneypot('cache:posts:123');
      expect(result.isHoneypot).toBe(false);
      expect(result.isSuspicious).toBe(false);
      expect(result.reason).toBeUndefined();
      expect(result.matchedPattern).toBeUndefined();
    });

    it('should prioritize honeypot detection over pattern matching', () => {
      // Even if a honeypot key contains suspicious patterns, it should be flagged as honeypot first
      const result = detectHoneypot('admin:password');
      expect(result.isHoneypot).toBe(true);
      expect(result.reason).toBe('Honeypot key accessed');
    });

    it('should handle case variations', () => {
      const result = detectHoneypot('ADMIN:PASSWORD');
      expect(result.isHoneypot).toBe(true);
      expect(result.isSuspicious).toBe(true);
    });

    it('should detect combined threats', () => {
      // A key that would trigger both honeypot and pattern detection
      const result = detectHoneypot('admin:password');
      expect(result.isHoneypot).toBe(true);
      expect(result.isSuspicious).toBe(true);
    });
  });

  describe('getHoneypotSeverity', () => {
    it('should return critical for honeypot detections', () => {
      const detection = {
        isHoneypot: true,
        isSuspicious: true,
        reason: 'Honeypot key accessed',
      };
      expect(getHoneypotSeverity(detection)).toBe('critical');
    });

    it('should return high for suspicious patterns', () => {
      const detection = {
        isHoneypot: false,
        isSuspicious: true,
        matchedPattern: 'SELECT',
        reason: 'Suspicious pattern detected',
      };
      expect(getHoneypotSeverity(detection)).toBe('high');
    });

    it('should return low for safe keys', () => {
      const detection = {
        isHoneypot: false,
        isSuspicious: false,
      };
      expect(getHoneypotSeverity(detection)).toBe('low');
    });

    it('should prioritize honeypot over suspicious in severity', () => {
      const detection = {
        isHoneypot: true,
        isSuspicious: true,
      };
      expect(getHoneypotSeverity(detection)).toBe('critical');
    });
  });

  describe('createHoneypotTrap', () => {
    it('should return valid JSON', () => {
      const trap = createHoneypotTrap();
      expect(() => JSON.parse(trap)).not.toThrow();
    });

    it('should contain fake credentials', () => {
      const trap = createHoneypotTrap();
      const data = JSON.parse(trap);

      expect(data.password).toBeDefined();
      expect(data.secret).toBeDefined();
      expect(data.api_key).toBeDefined();
      expect(data.token).toBeDefined();
    });

    it('should contain warning message', () => {
      const trap = createHoneypotTrap();
      const data = JSON.parse(trap);

      expect(data.warning).toContain('honeypot');
      expect(data.warning).toContain('logged');
    });

    it('should include timestamp', () => {
      const beforeTime = new Date().toISOString();
      const trap = createHoneypotTrap();
      const data = JSON.parse(trap);
      const afterTime = new Date().toISOString();

      expect(data.timestamp).toBeDefined();
      expect(data.timestamp >= beforeTime).toBe(true);
      expect(data.timestamp <= afterTime).toBe(true);
    });

    it('should have recognizable fake data', () => {
      const trap = createHoneypotTrap();
      const data = JSON.parse(trap);

      expect(data.password).toContain('hacker');
      expect(data.secret).toContain('detected');
    });

    it('should create different timestamps on multiple calls', async () => {
      const trap1 = createHoneypotTrap();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const trap2 = createHoneypotTrap();

      const data1 = JSON.parse(trap1);
      const data2 = JSON.parse(trap2);

      expect(data1.timestamp).not.toBe(data2.timestamp);
    });
  });

  describe('HONEYPOT_KEYS constant', () => {
    it('should be an array', () => {
      expect(Array.isArray(HONEYPOT_KEYS)).toBe(true);
    });

    it('should contain expected number of honeypot keys', () => {
      expect(HONEYPOT_KEYS.length).toBeGreaterThan(20);
    });

    it('should have no duplicate keys', () => {
      const uniqueKeys = new Set(HONEYPOT_KEYS);
      expect(uniqueKeys.size).toBe(HONEYPOT_KEYS.length);
    });

    it('should contain all critical honeypot patterns', () => {
      const criticalPatterns = [
        'admin:password',
        'api:secret',
        'db:password',
        'jwt:secret',
        '.env',
        'etc:passwd',
      ];

      criticalPatterns.forEach((pattern) => {
        expect(HONEYPOT_KEYS).toContain(pattern as any);
      });
    });
  });

  describe('SUSPICIOUS_PATTERNS constant', () => {
    it('should be an array', () => {
      expect(Array.isArray(SUSPICIOUS_PATTERNS)).toBe(true);
    });

    it('should contain regex patterns', () => {
      SUSPICIOUS_PATTERNS.forEach((pattern) => {
        expect(pattern).toBeInstanceOf(RegExp);
      });
    });

    it('should contain expected categories of patterns', () => {
      const patternTests = [
        { input: 'SELECT * FROM', category: 'SQL injection' },
        { input: '../etc', category: 'Path traversal' },
        { input: '<script>', category: 'XSS' },
        { input: 'shell.php', category: 'File extension' },
        { input: ';ls -la', category: 'Command injection' },
      ];

      patternTests.forEach(({ input }) => {
        const matched = SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(input));
        expect(matched).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long strings', () => {
      const longKey = 'a'.repeat(10000);
      const result = detectHoneypot(longKey);
      expect(result.isHoneypot).toBe(false);
      expect(result.isSuspicious).toBe(false);
    });

    it('should handle special characters', () => {
      const specialKey = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      expect(() => detectHoneypot(specialKey)).not.toThrow();
    });

    it('should handle unicode characters', () => {
      const unicodeKey = '密码:秘密';
      expect(() => detectHoneypot(unicodeKey)).not.toThrow();
    });

    it('should handle null bytes attempt', () => {
      const result = hasSuspiciousPattern('test%00.php');
      expect(result.isSuspicious).toBe(true);
    });

    it('should handle multiple suspicious patterns', () => {
      const result = hasSuspiciousPattern('<script>SELECT * FROM users</script>');
      expect(result.isSuspicious).toBe(true);
    });
  });

  describe('Security Best Practices', () => {
    it('should detect common admin paths', () => {
      expect(isHoneypotKey('admin:password')).toBe(true);
      expect(isHoneypotKey('admin:secret')).toBe(true);
      expect(isHoneypotKey('admin:api_key')).toBe(true);
    });

    it('should detect environment variable patterns', () => {
      expect(isHoneypotKey('.env')).toBe(true);
      expect(isHoneypotKey('env:secrets')).toBe(true);
    });

    it('should detect backup file patterns', () => {
      expect(isHoneypotKey('backup:database')).toBe(true);
      expect(isHoneypotKey('backup:config')).toBe(true);
    });

    it('should not flag legitimate cache keys', () => {
      const legitimateKeys = [
        'cache:user:123',
        'session:user:abc',
        'data:posts:recent',
        'config:theme:dark',
      ];

      legitimateKeys.forEach((key) => {
        const result = detectHoneypot(key);
        expect(result.isHoneypot).toBe(false);
        expect(result.isSuspicious).toBe(false);
      });
    });
  });
});
