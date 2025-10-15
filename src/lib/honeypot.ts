/**
 * Honeypot detection system for cache security
 * Detects and logs suspicious scanning attempts
 */

/**
 * Honeypot keys - these should NEVER be accessed in normal operation
 * Any access to these keys indicates scanning/probing behavior
 */
export const HONEYPOT_KEYS = [
  // Admin/config honeypots
  'admin:password',
  'admin:secret',
  'admin:api_key',
  'admin:token',
  'config:secrets',
  'config:password',
  'config:api_key',
  'api:keys',
  'api:secret',
  'api:token',

  // System honeypots
  'system:root',
  'system:admin',
  'system:password',
  'root:password',
  'root:config',

  // Database honeypots
  'db:password',
  'db:credentials',
  'database:password',
  'mysql:password',
  'postgres:password',

  // Common attack patterns
  'backup:database',
  'backup:config',
  '.env',
  'env:secrets',
  'secrets:all',

  // File system honeypots
  'etc:passwd',
  'etc:shadow',
  'etc:config',

  // JWT/Auth honeypots
  'jwt:secret',
  'jwt:key',
  'auth:secret',
  'session:secret',
] as const;

/**
 * Suspicious patterns that might indicate scanning
 */
export const SUSPICIOUS_PATTERNS = [
  // SQL injection attempts
  /select.*from/i,
  /union.*select/i,
  /drop.*table/i,
  /insert.*into/i,
  /'.*or.*'.*=/i,
  /".*or.*".*=/i,

  // Path traversal (in addition to validation)
  /\.\.[\\/]/,
  /%2e%2e/i,
  /\.\.%2f/i,

  // Command injection
  /;.*ls/i,
  /;.*cat/i,
  /;.*rm/i,
  /\|.*cat/i,
  /`.*`/,
  /\$\(.*\)/,

  // Script tags (XSS)
  /<script/i,
  /<iframe/i,
  /javascript:/i,
  /onerror=/i,

  // File extensions (redundant with validation, but helps detection)
  /\.(php|jsp|asp|exe|sh|bat|cmd)$/i,

  // Common attack file names
  /shell/i,
  /backdoor/i,
  /webshell/i,
  /c99/i,
  /r57/i,

  // Encoded attacks
  /%3c.*%3e/i, // <script>
  /%00/i, // null byte
] as const;

export interface HoneypotDetection {
  isHoneypot: boolean;
  isSuspicious: boolean;
  matchedPattern?: string;
  reason?: string;
}

/**
 * Check if a key is a honeypot
 */
export function isHoneypotKey(key: string): boolean {
  const normalizedKey = key.toLowerCase().trim();
  return HONEYPOT_KEYS.some((honeypot) => normalizedKey === honeypot.toLowerCase());
}

/**
 * Check if a key matches suspicious patterns
 */
export function hasSuspiciousPattern(key: string): {
  isSuspicious: boolean;
  matchedPattern?: string;
} {
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(key)) {
      return {
        isSuspicious: true,
        matchedPattern: pattern.source,
      };
    }
  }
  return { isSuspicious: false };
}

/**
 * Comprehensive honeypot detection
 */
export function detectHoneypot(key: string): HoneypotDetection {
  // Check for exact honeypot match
  if (isHoneypotKey(key)) {
    return {
      isHoneypot: true,
      isSuspicious: true,
      reason: 'Honeypot key accessed',
    };
  }

  // Check for suspicious patterns
  const suspiciousCheck = hasSuspiciousPattern(key);
  if (suspiciousCheck.isSuspicious) {
    return {
      isHoneypot: false,
      isSuspicious: true,
      matchedPattern: suspiciousCheck.matchedPattern,
      reason: 'Suspicious pattern detected',
    };
  }

  return {
    isHoneypot: false,
    isSuspicious: false,
  };
}

/**
 * Get severity level based on detection
 */
export function getHoneypotSeverity(detection: HoneypotDetection): 'critical' | 'high' | 'low' {
  if (detection.isHoneypot) {
    return 'critical';
  }
  if (detection.isSuspicious) {
    return 'high';
  }
  return 'low';
}

/**
 * Create honeypot trap response
 * Returns dummy data to waste attacker's time
 */
export function createHoneypotTrap(): string {
  const dummyData = {
    password: 'nice_try_hacker',
    secret: 'you_have_been_detected',
    api_key: 'fake-key-12345-abcde-67890',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fakefakefake',
    timestamp: new Date().toISOString(),
    warning: 'This is a honeypot. Your activity has been logged.',
  };

  return JSON.stringify(dummyData);
}
