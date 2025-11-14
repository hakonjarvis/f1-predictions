# Security Documentation

This document outlines the security measures implemented in the F1 Predictions application.

## Overview

The application has been hardened with multiple security layers to protect against unauthorized access, rate limiting abuse, and common web vulnerabilities.

## Security Features Implemented

### 1. Admin Route Authentication

**Location:** `lib/auth.ts`

All admin routes are protected with basic Bearer token authentication:
- `/api/sync/drivers` - Requires authentication
- `/api/sync/results` - Requires authentication
- `/api/admin/predictions` - Requires authentication
- `/api/admin/predictions/[userId]` - Requires authentication

**How it works:**
- Admin password is stored in `ADMIN_PASSWORD` environment variable
- Requests must include header: `Authorization: Bearer <admin-password>`
- Returns 401 Unauthorized if auth fails
- Admin UI stores password in sessionStorage for convenience

**Setup:**
```bash
# Add to .env file
ADMIN_PASSWORD="your-secure-random-password-here"
```

**Generating a secure password:**
```bash
# Using OpenSSL (recommended)
openssl rand -base64 32

# Or use a password manager to generate a strong random password
```

### 2. CORS Protection

**Location:** `lib/cors.ts`

Cross-Origin Resource Sharing headers are configured on all API routes:
- Allows requests from specified origin (defaults to `*` for development)
- Handles OPTIONS preflight requests
- Configurable via `ALLOWED_ORIGIN` environment variable

**Production setup:**
```bash
# Add to .env file
ALLOWED_ORIGIN="https://your-production-domain.com"
```

### 3. Rate Limiting

**Location:** `lib/ratelimit.ts`

The predictions endpoint has rate limiting to prevent abuse:
- **Limit:** 5 requests per minute per IP address
- **Applies to:** `/api/predictions` POST endpoint
- Returns 429 Too Many Requests when exceeded
- Includes `Retry-After` header

**Rate limit headers:**
- `X-RateLimit-Limit` - Maximum requests allowed
- `X-RateLimit-Remaining` - Requests remaining in window
- `X-RateLimit-Reset` - Timestamp when limit resets
- `Retry-After` - Seconds until retry allowed

**Note:** The current implementation uses in-memory storage. For production with multiple instances, consider using Redis or a dedicated rate limiting service.

### 4. Input Validation

**Location:** `lib/validation.ts`

All user inputs are validated before processing:

**Sync endpoints:**
- `year` - Must be number between 2000-2030
- `sessionKey` - Must be positive number

**Predictions endpoint:**
- `name` - 2-100 characters, trimmed
- `email` - Valid email format (basic regex)
- `predictions` - Must be non-empty array

### 5. Environment Variables

**Protected secrets:**
- `DATABASE_URL` - Database connection string with credentials
- `ADMIN_PASSWORD` - Admin authentication password
- `ALLOWED_ORIGIN` - CORS origin (optional)

**Public variables (safe to expose):**
- `NEXT_PUBLIC_SUPABASE_URL` - Public Supabase URL (if using)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Public anon key (if using)

**File protection:**
- `.env` file is gitignored (verified in `.gitignore` line 34)
- `.env.example` provides template without secrets
- Git status verified - no secrets committed

## Deployment Checklist

Before deploying to production, complete these steps:

### Required Actions:

1. **Set a strong admin password**
   ```bash
   # Generate a secure password
   openssl rand -base64 32

   # Add to production environment variables
   ADMIN_PASSWORD="<generated-password>"
   ```

2. **Rotate database password**
   - The current `DATABASE_URL` in `.env` contains credentials that have been exposed
   - Generate new password in Supabase dashboard
   - Update `DATABASE_URL` in production environment

3. **Configure CORS origin**
   ```bash
   # Set to your production domain
   ALLOWED_ORIGIN="https://yourdomain.com"
   ```

4. **Verify environment variables**
   - Ensure all required variables are set in production
   - Never commit `.env` file to version control
   - Use platform-specific secrets management (Vercel env vars, etc.)

### Recommended Actions:

5. **Implement proper authentication** (Future enhancement)
   - Current system uses simple password - suitable for small internal apps
   - For larger scale, consider:
     - NextAuth.js for OAuth providers
     - Supabase Auth for email/password
     - Clerk for complete auth solution

6. **Upgrade rate limiting** (If scaling)
   - Current in-memory implementation doesn't work across multiple instances
   - Consider: Upstash Redis, Vercel KV, or dedicated service like Arcjet

7. **Add request logging**
   - Log admin actions for audit trail
   - Monitor failed authentication attempts
   - Set up alerts for suspicious activity

8. **Enable HTTPS only**
   - Ensure production deployment enforces HTTPS
   - Set secure cookie flags if adding session management
   - Enable HSTS headers

9. **Add CSP headers**
   - Content Security Policy helps prevent XSS attacks
   - Configure in `next.config.js`

10. **Regular security updates**
    - Keep dependencies updated: `npm audit` and `npm update`
    - Monitor for security advisories
    - Review and rotate credentials periodically

## API Routes Summary

| Route | Method | Auth Required | Rate Limited | Validated |
|-------|--------|---------------|--------------|-----------|
| `/api/drivers` | GET | No | No | No |
| `/api/predictions` | POST | No | Yes (5/min) | Yes |
| `/api/sync/drivers` | POST | Yes | No | Yes |
| `/api/sync/results` | POST | Yes | No | Yes |
| `/api/admin/predictions` | GET | Yes | No | No |
| `/api/admin/predictions/[userId]` | DELETE | Yes | No | Yes |

## Security Headers

All API responses include:
- `Access-Control-Allow-Origin` - CORS origin
- `Access-Control-Allow-Methods` - Allowed HTTP methods
- `Access-Control-Allow-Headers` - Allowed headers
- `Access-Control-Max-Age` - Preflight cache duration (24h)

Rate-limited responses include:
- `Retry-After` - Seconds until retry
- `X-RateLimit-*` - Rate limit status

## Common Security Issues Addressed

✅ **Secrets in version control** - All secrets in .env, which is gitignored
✅ **Unauthorized admin access** - Admin routes require authentication
✅ **SQL injection** - Using Prisma ORM with parameterized queries
✅ **XSS attacks** - React automatically escapes output
✅ **CSRF** - SameSite cookies and CORS headers
✅ **Rate limiting** - Predictions endpoint is rate limited
✅ **Input validation** - All inputs validated before use
✅ **CORS misconfiguration** - Configurable allowed origin

## Reporting Security Issues

If you discover a security vulnerability, please:
1. Do NOT open a public GitHub issue
2. Contact the maintainer directly
3. Provide detailed information about the vulnerability
4. Allow reasonable time for a fix before disclosure

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Prisma Security](https://www.prisma.io/docs/guides/database/advanced-database-tasks/sql-injection)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
