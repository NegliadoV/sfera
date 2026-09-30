---
name: api-security-audit
description: Security audit of API endpoints for rate limiting, input validation, auth bypass, and OWASP Top 10 vulnerabilities
trigger: manual
---

# API Security Audit

## Purpose
Identify security vulnerabilities in API routes before they reach production. Focus on authentication, authorization, input validation, and common attack vectors.

## When to invoke
- Before deploying new API endpoints
- After auth system changes
- User asks: "security audit", "check API security", "find vulnerabilities"
- Before handling sensitive data (payments, PII, health records)

## Threat Model

Target these OWASP Top 10 risks:
1. **Broken Access Control** (A01)
2. **Cryptographic Failures** (A02)
3. **Injection** (A03)
4. **Insecure Design** (A04)
5. **Security Misconfiguration** (A05)
6. **Identification and Authentication Failures** (A07)

## Process

### 1. Discover API Routes

Find all endpoints:
```bash
find ./app/api -name "route.ts" -o -name "route.js"
```

For each route, analyze:
- HTTP methods (GET, POST, PUT, DELETE, PATCH)
- Auth requirements
- Input parameters
- Database queries
- External API calls

### 2. Authentication & Authorization

**Check for:**

- **Missing auth guards**
  - Routes handling sensitive data without `await auth()` check
  - Webhooks without signature verification
  - Admin endpoints without role check

- **Broken session management**
  - JWT without expiry or refresh
  - Session tokens in URL params (should be httpOnly cookies)
  - No session invalidation on logout/password change

- **Authorization bypass**
  - Checking `userId` from JWT but not verifying ownership of resource
  - Example: `DELETE /api/content/:id` — does it check if user owns content?
  - Mass assignment: accepting `role` or `isAdmin` from request body

**Pattern to flag:**
```typescript
// BAD: No ownership check
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  await db.delete(content).where(eq(content.id, params.id));
}

// GOOD: Verify ownership
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return new Response('Unauthorized', { status: 401 });
  
  const [item] = await db.select().from(content).where(eq(content.id, params.id));
  if (item.authorId !== session.user.id) return new Response('Forbidden', { status: 403 });
  
  await db.delete(content).where(eq(content.id, params.id));
}
```

### 3. Input Validation

**Check for:**

- **SQL Injection**
  - Raw SQL with string interpolation: `db.execute(sql\`SELECT * FROM users WHERE id = ${userId}\`)`
  - Should use parameterized queries or ORM (Drizzle is safe by default)

- **NoSQL Injection**
  - If using MongoDB: `{ $where: userInput }` is dangerous

- **XSS (Cross-Site Scripting)**
  - User content rendered without sanitization
  - In React: `dangerouslySetInnerHTML={{ __html: userInput }}` is dangerous
  - Markdown/rich text editors: should sanitize HTML tags

- **Path Traversal**
  - File uploads: `../../etc/passwd` in filename
  - Image proxy: `/api/proxy-image?url=file:///etc/passwd`

- **Command Injection**
  - Executing shell commands with user input: `exec(\`convert ${userFile}\`)`

- **Mass Assignment**
  - Accepting all fields from request body without whitelist
  - Example: `await db.insert(user).values(req.body)` — user could inject `role: 'admin'`

**Safe patterns:**
```typescript
// Input validation with Zod
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  age: z.number().int().positive().max(150),
});

const input = schema.parse(await req.json()); // Throws if invalid
```

### 4. Rate Limiting

**Check for missing rate limits on:**
- `/api/auth/*` (login, register, password reset) — prevent brute force
- `/api/content` (POST) — prevent spam
- `/api/comments` (POST) — prevent spam
- `/api/search` — prevent DoS
- Any endpoint that sends emails/SMS

**Should have:**
- Per-IP limits (e.g., 10 requests/minute for auth)
- Per-user limits (e.g., 100 posts/day)
- Exponential backoff on failed attempts

**Libraries:**
- `express-rate-limit` (if using Express)
- `@upstash/ratelimit` (Redis-based, works with serverless)
- Middleware in Next.js API routes

### 5. Data Exposure

**Check for:**

- **Sensitive data in responses**
  - Password hashes in user objects
  - API keys, tokens, secrets
  - Internal IDs that leak scale (use UUIDs for public-facing IDs)

- **Over-fetching**
  - Returning entire user object when only `name` and `image` needed
  - `SELECT *` instead of specific columns

- **Error messages**
  - Stack traces in production
  - "User not found" vs "Invalid credentials" (leaks existence)

### 6. External Dependencies

**Check for:**

- **Dependency vulnerabilities**
  - Run `npm audit` (but check manually too — audit misses logic flaws)
  - Look for outdated packages with known CVEs

- **Third-party API keys**
  - Hardcoded in code (should be in `.env`)
  - Exposed in client-side code
  - No expiry or rotation policy

### 7. CORS & CSRF

**Check for:**

- **Open CORS**
  - `Access-Control-Allow-Origin: *` on authenticated endpoints
  - Should whitelist specific origins

- **Missing CSRF protection**
  - State-changing requests (POST/PUT/DELETE) without CSRF token
  - Next.js API routes should check `Origin` or use `SameSite` cookies

### 8. File Upload

If app handles uploads:

- **File type validation**
  - Check MIME type AND file signature (magic bytes)
  - Reject executables (.exe, .sh, .bat)

- **File size limits**
  - Prevent DoS via huge uploads

- **Storage location**
  - Don't serve uploads from same domain as app (XSS risk)
  - Use CDN or separate subdomain

### 9. OAuth Security

**Check for:**

- **`allowDangerousEmailAccountLinking: true`**
  - This is a HIGH-RISK setting
  - Allows account takeover if attacker knows victim's email
  - Should require email verification before linking

- **Missing state parameter**
  - OAuth flows should include CSRF token

- **Redirect URI validation**
  - Whitelist exact URLs, not wildcard domains

### 10. Output Format

```markdown
## 🔴 Critical (fix immediately)

### 1. Account Takeover via OAuth Email Linking
**File:** `auth.ts:64`
**Risk:** An attacker can link their Google account to any user's email without verification
**Fix:** Remove `allowDangerousEmailAccountLinking: true` or add email verification flow
**CVSS:** 9.1 (Critical)

## 🟠 High

### 2. Missing Rate Limiting on Login
**File:** `app/api/auth/[...nextauth]/route.ts`
**Risk:** Brute force attacks on password login
**Fix:** Add rate limiter (10 attempts/15min per IP)

### 3. Authorization Bypass in Content Deletion
**File:** `app/api/content/[id]/route.ts:45`
**Risk:** Any authenticated user can delete any content
**Fix:** Add ownership check before `db.delete()`

## 🟡 Medium

### 4. User Enumeration via Error Messages
**File:** `app/api/auth/register/route.ts:23`
**Risk:** "Email already exists" leaks registered users
**Fix:** Return generic "Check your email for confirmation" for both new and existing

## 🟢 Low / Info

### 5. Missing Security Headers
**File:** `middleware.ts`
**Note:** Add `X-Content-Type-Options: nosniff` (already done ✓)

## Mitigation Scripts

[Provide code snippets to fix each issue]
```

### Example: Rate Limiter Implementation

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const authLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '15 m'),
});

// Usage in route:
const identifier = req.headers.get('x-forwarded-for') ?? 'unknown';
const { success } = await authLimiter.limit(identifier);
if (!success) return new Response('Too many requests', { status: 429 });
```

## Scope

**Do audit:**
- API routes (`/api/**`)
- Server Actions (if used)
- Auth configuration
- Middleware security

**Don't audit:**
- UI/UX issues
- Business logic correctness
- Performance (that's for other skills)

## Notes

- Findings should be **exploitable**, not theoretical
- Provide **working fix code**, not just descriptions
- Prioritize by impact × likelihood (CVSS score)
- Include references to OWASP/CWE when relevant
