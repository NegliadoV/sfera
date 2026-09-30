---
name: performance-profile
description: Analyze bundle size, SSR/ISR optimization, slow queries, and runtime performance bottlenecks
trigger: manual
---

# Performance Profiling

## Purpose
Identify performance bottlenecks in Next.js apps: bundle size, unnecessary re-renders, slow database queries, unoptimized images, and SSR/ISR misconfigurations.

## When to invoke
- Before production deploy
- After adding heavy dependencies (charts, editors, video players)
- User reports slow page loads
- User asks: "optimize performance", "why is it slow", "reduce bundle size"

## Process

### 1. Bundle Size Analysis

**Check `package.json` dependencies:**
- Heavy libraries (>100KB): TipTap, ReactFlow, LiveKit, Markdown parsers
- Duplicate dependencies (e.g., `react-dom` from multiple sources)
- Unused dependencies (imported but never used)

**Analyze build output:**
```bash
npm run build 2>&1 | grep -E "(First Load JS|Route|MB|KB)"
```

Look for:
- Individual route bundles >200KB (slow initial load)
- Shared chunks >500KB (split further)
- Routes that shouldn't be large (e.g., `/about` with 300KB)

**Tools to suggest:**
```bash
# Bundle analyzer
npm install --save-dev @next/bundle-analyzer
# Then add to next.config.ts
```

**Common fixes:**
- Dynamic imports for heavy components: `const Editor = dynamic(() => import('./Editor'), { ssr: false })`
- Tree-shaking: check if libraries support named imports
- Replace heavy libs: `moment` → `date-fns`, `lodash` → `lodash-es`

### 2. SSR vs ISR vs CSR

**Check rendering strategy per page:**

- **`force-dynamic`**: Every request hits server — expensive for high-traffic pages
  - Flag: Landing page with `export const dynamic = 'force-dynamic'`
  - Fix: Use ISR with revalidation: `export const revalidate = 60`

- **Over-fetching on SSR**: Fetching data that's not needed for initial render
  - Example: User profile page fetching 100 posts when only showing 10
  - Fix: Add LIMIT to queries, implement pagination

- **No caching headers**: Static pages without cache headers
  - Fix: Set `Cache-Control` in headers for static assets

**Optimal patterns:**
```typescript
// ISR with 5-minute revalidation
export const revalidate = 300;

// Static generation for known paths
export async function generateStaticParams() {
  const posts = await db.select({ slug: content.slug }).from(content);
  return posts.map(p => ({ slug: p.slug }));
}

// Client-side data with SWR
import useSWR from 'swr';
const { data } = useSWR('/api/feed', fetcher, { refreshInterval: 30000 });
```

### 3. Database Query Performance

**Find slow queries:**

- **N+1 queries**: Fetching relations in loops
  ```typescript
  // BAD
  const posts = await db.select().from(content);
  for (const post of posts) {
    const author = await db.select().from(user).where(eq(user.id, post.authorId));
  }
  
  // GOOD (Drizzle relational query)
  const posts = await db.query.content.findMany({
    with: { author: true }
  });
  ```

- **Missing indexes**: JOINs on non-indexed foreign keys
- **SELECT ***: Fetching all columns when only need 2-3
- **No LIMIT**: Queries that could return 10,000+ rows

**Tools to suggest:**
- Enable Postgres slow query log: `log_min_duration_statement = 100` (log queries >100ms)
- Use `EXPLAIN ANALYZE` for complex queries
- Drizzle Studio for query inspection

**Check for:**
- API routes that do multiple sequential DB calls (could batch)
- Queries inside loops (move outside loop)
- Lack of database connection pooling

### 4. Image Optimization

**Check:**
- Using Next.js `<Image>` component? (has built-in optimization)
- Large images (>500KB) not compressed
- No lazy loading for below-the-fold images
- Missing `sizes` attribute (causes over-fetching)
- Hotlinking external images without proxy (privacy + slow)

**Fixes:**
```tsx
// Good pattern
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // for above-the-fold
  sizes="(max-width: 768px) 100vw, 50vw"
/>

// For dynamic external images
<Image
  src={user.avatar}
  alt={user.name}
  width={48}
  height={48}
  unoptimized={false} // Let Next.js optimize
/>
```

### 5. React Performance

**Check components for:**

- **Unnecessary re-renders**
  - Inline function definitions in JSX: `onClick={() => doThing()}` (creates new function every render)
  - Missing `React.memo()` for expensive components
  - Context value changing on every render

- **Large lists without virtualization**
  - Rendering 1000+ items at once
  - Should use `react-window` or `react-virtualized`

- **Heavy computations on every render**
  - Should use `useMemo()` or `useCallback()`

**Example fix:**
```tsx
// BAD
function Feed({ posts }) {
  const sorted = posts.sort((a, b) => b.createdAt - a.createdAt); // Runs every render
  return <div>{sorted.map(p => <Post key={p.id} post={p} />)}</div>;
}

// GOOD
function Feed({ posts }) {
  const sorted = useMemo(
    () => posts.sort((a, b) => b.createdAt - a.createdAt),
    [posts]
  );
  return <div>{sorted.map(p => <Post key={p.id} post={p} />)}</div>;
}
```

### 6. Network & Loading

**Check for:**

- **Missing loading states**: User sees blank page during data fetch
  - Add Suspense boundaries: `<Suspense fallback={<Spinner />}>`
  
- **Serial requests**: Waterfalls (request 1 finishes, then request 2 starts)
  - Fix: Use `Promise.all([fetch1, fetch2])`

- **Large API payloads**: Sending 5MB JSON responses
  - Fix: Pagination, field filtering, compression

- **No prefetching**: Links not using `<Link prefetch>`
  - Next.js `<Link>` prefetches by default, but check if disabled

### 7. Web Vitals

**Core metrics to check:**
- **LCP (Largest Contentful Paint)**: <2.5s good, >4s poor
  - Usually caused by: large images, slow API, render-blocking resources
  
- **FID (First Input Delay)**: <100ms good
  - Caused by: heavy JS execution blocking main thread
  
- **CLS (Cumulative Layout Shift)**: <0.1 good
  - Caused by: images without dimensions, dynamic content insertion

**How to measure:**
```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://roominate.rest --view
```

Or use Next.js built-in:
```typescript
// app/layout.tsx
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 8. Third-Party Scripts

**Check for:**
- Blocking analytics/tracking scripts
  - Load with `next/script` strategy="lazyOnload"
  
- Multiple analytics tools (Google, Meta, Amplitude) — each adds 50-100KB
  - Consolidate or defer

- Font Awesome CDN (350KB+) when only using 10 icons
  - Switch to tree-shakeable icon library or inline SVGs

### 9. Server Performance

**Check:**
- Cold starts (serverless functions)
  - Next.js on Vercel/Railway: first request slow
  - Fix: Warm-up routes, use edge functions for critical paths

- Memory leaks
  - Node.js process RSS growing over time
  - Check event listeners, timers, database connections

- Concurrency limits
  - Database pool size too small (100 users → 100 connections)
  - Fix: Set `max_connections` in Postgres, use connection pooling

### 10. Output Format

```markdown
## 🎯 Performance Score: 65/100

### Bundle Size
- ❌ **Critical**: Route `/explore` is 847KB (target: <200KB)
  - `@tiptap/react` (245KB) — use dynamic import
  - `@xyflow/react` (180KB) — lazy load mind-map editor
  - Fix: [code snippet]

### Rendering
- ⚠️ **Warning**: Landing page uses `force-dynamic` with no caching
  - 500ms TTFB for every visitor
  - Fix: Use `revalidate: 300` for 5-minute ISR

### Database
- ❌ **Critical**: N+1 query in `/api/feed` (400ms → 40ms potential)
  - Fetching authors in loop (100 queries for 100 posts)
  - Fix: [Drizzle relational query]

- ⚠️ **Warning**: Missing index on `content.universeId`
  - JOINs taking 120ms
  - Fix: [migration script]

### Images
- ✅ **Good**: Using Next.js Image component
- ⚠️ **Warning**: 12 images without `sizes` attribute (over-fetching)

### React
- ⚠️ **Warning**: `Feed` component re-renders on every route change
  - Fix: Wrap in `React.memo()`

### Web Vitals (Lighthouse)
- LCP: 3.2s (target: <2.5s) — caused by large hero image
- FID: 85ms ✅
- CLS: 0.15 (target: <0.1) — caused by dynamic ad insertion

## Recommendations (by impact)

1. **High Impact, Low Effort**:
   - Add indexes to `content.universeId`, `comments.contentId`
   - Switch landing to ISR
   - Dynamic import TipTap editor

2. **High Impact, Medium Effort**:
   - Fix N+1 queries in feed
   - Implement image CDN (Cloudflare Images)
   - Add React.memo to 5 heavy components

3. **Medium Impact**:
   - Replace Font Awesome CDN with tree-shakeable icons
   - Add Suspense boundaries
   - Compress API responses with gzip

## Before/After Estimates
- Landing page TTFB: 500ms → 50ms (ISR)
- Feed API: 400ms → 40ms (fix N+1)
- Bundle size: 847KB → 320KB (dynamic imports)
- Lighthouse score: 65 → 90
```

## Tools to recommend

```bash
# Bundle analyzer
npm install --save-dev @next/bundle-analyzer

# React DevTools Profiler (built-in)
# Lighthouse (Chrome DevTools or CLI)
npm install -g lighthouse

# Database query profiler
# Enable in postgres.conf: log_min_duration_statement = 100
```

## Scope

**Do profile:**
- Client bundle size
- SSR/ISR configuration
- Database queries
- React rendering
- Core Web Vitals

**Don't profile:**
- Infrastructure (that's DevOps)
- CDN configuration (unless app-level caching)
- Network latency (can't control)
