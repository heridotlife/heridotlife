# Security Policy

## Overview

We take the security of heridotlife seriously. This document outlines our security policies, supported versions, and procedures for reporting security vulnerabilities.

## Supported Versions

We actively maintain and provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < 1.0   | :x:                |

## Security Features

### Implemented Security Measures

- **Host Header Injection Protection**: Comprehensive validation of host headers to prevent host header injection attacks
- **Environment Variable Security**: Secure handling of sensitive configuration through Cloudflare secrets
- **Input Validation**: Strict validation using Zod schemas for all API endpoints
- **Authentication**: Session-based authentication for admin functionality
- **HTTPS Enforcement**: Production deployment enforces HTTPS connections
- **Content Security Policy**: CSP headers to prevent XSS attacks
- **Cache Security**: Secure caching implementation with proper key management

### Security Architecture

- **Cloudflare Pages**: Leverages Cloudflare's security features and DDoS protection
- **D1 Database**: Prepared statements prevent SQL injection
- **KV Storage**: Secure key-value storage for caching and sessions
- **Environment Isolation**: Proper separation between development and production environments

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

### Contact Information

- **Email**: mail@heri.life
- **Response Time**: We aim to respond within 48 hours
- **Acknowledgment**: We will acknowledge receipt of your report within 24 hours

### What to Include

Please include the following information in your security report:

1. **Description**: Clear description of the vulnerability
2. **Steps to Reproduce**: Detailed steps to reproduce the issue
3. **Impact Assessment**: Your assessment of the potential impact
4. **Affected Components**: Which parts of the system are affected
5. **Suggested Fix**: If you have suggestions for fixing the issue
6. **Contact Information**: How we can reach you for follow-up questions

### Security Report Template

```
## Security Vulnerability Report

**Summary**: Brief description of the vulnerability

**Severity**: [Critical/High/Medium/Low]

**Affected Component**: [API/Frontend/Database/Authentication/etc.]

**Description**:
[Detailed description of the vulnerability]

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Impact**:
[Potential security impact]

**Suggested Mitigation**:
[Your suggestions for fixing this issue]

**Additional Information**:
[Any other relevant information]
```

## Security Response Process

1. **Acknowledgment**: We acknowledge receipt of the report within 24 hours
2. **Initial Assessment**: We perform an initial assessment within 48 hours
3. **Investigation**: We investigate the reported vulnerability
4. **Fix Development**: We develop and test a fix for confirmed vulnerabilities
5. **Disclosure**: We coordinate responsible disclosure with the reporter
6. **Release**: We release the security fix and update this document

## Security Best Practices for Contributors

### Code Security

- **Input Validation**: Always validate and sanitize user inputs
- **SQL Injection Prevention**: Use prepared statements for database queries
- **XSS Prevention**: Properly escape output and use CSP headers
- **Authentication**: Implement proper authentication and authorization
- **Secrets Management**: Never commit secrets to version control
- **Dependencies**: Keep dependencies updated and scan for vulnerabilities

### Development Security

- **Environment Variables**: Use `.env` files for local development (never commit)
- **Secure Defaults**: Implement secure defaults for all configurations
- **Error Handling**: Don't expose sensitive information in error messages
- **Logging**: Be careful not to log sensitive information
- **Testing**: Include security test cases

### Deployment Security

- **HTTPS Only**: Always use HTTPS in production
- **Environment Separation**: Separate development, staging, and production environments
- **Access Control**: Implement proper access controls
- **Monitoring**: Monitor for suspicious activities
- **Backup Security**: Secure backup procedures

## Known Security Considerations

### Current Security Measures

1. **Host Header Validation**:
   - Validates incoming host headers against allowed hosts
   - Prevents host header injection attacks
   - Configurable through environment variables

2. **Input Validation**:
   - Zod schema validation for all API endpoints
   - URL validation for short URL creation
   - Sanitization of user inputs

3. **Authentication**:
   - Session-based authentication for admin access
   - Secure session management with Cloudflare KV
   - Password protection for admin functionality

4. **Caching Security**:
   - Secure cache key generation
   - Proper cache invalidation
   - TTL-based cache expiration

### Security Headers

The application implements the following security headers:

- `Strict-Transport-Security` (HSTS)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Security Scanning and Monitoring

### Automated Security Scanning

- **CodeQL**: Automated code scanning for security vulnerabilities
- **Dependency Scanning**: Regular scanning of dependencies for known vulnerabilities
- **SAST**: Static Application Security Testing integrated into CI/CD

### Monitoring

- **Access Logging**: Monitoring of access patterns
- **Error Monitoring**: Tracking of application errors and exceptions
- **Performance Monitoring**: Monitoring for unusual performance patterns

## Compliance and Standards

- **OWASP Top 10**: We follow OWASP Top 10 security guidelines
- **Security Headers**: Implementation of recommended security headers
- **Data Protection**: Proper handling of user data and privacy

## Security Updates

Security updates will be communicated through:

- GitHub Security Advisories
- Release notes highlighting security fixes
- This SECURITY.md file updates

## Contact

For security-related questions or concerns:

- **Security Team**: mail@heri.life
- **Maintainer**: mail@heri.life
- **GitHub Issues**: For non-security related issues only

## Acknowledgments

We appreciate the security research community and acknowledge contributors who help improve our security posture through responsible disclosure.

---

**Last Updated**: October 12, 2025
**Version**: 1.0
