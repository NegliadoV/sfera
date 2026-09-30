---
name: db-schema-review
description: Analyze Drizzle/Prisma database schema for missing indexes, N+1 queries, and optimization opportunities
trigger: manual
---

# Database Schema Review

## Purpose
Audit the database schema for performance bottlenecks, missing indexes, inefficient queries, and data modeling issues.

## When to invoke
- After adding new tables or columns
- Before deploying to production
- When experiencing slow queries
- During performance optimization sprints
- User asks: "review database schema", "check indexes", "optimize queries"

## Process

### 1. Load Schema
- Read `lib/db/schema.ts` (or the project's schema file)
- Identify all tables, columns, relationships, and existing indexes

### 2. Analyze Tables

For each table, check:

**Indexes:**
- Foreign keys without indexes (will cause slow JOINs)
- Columns used in WHERE clauses without indexes
- Composite indexes for common query patterns (e.g., `userId + createdAt`)
- Missing unique indexes where data should be unique
- Over-indexing (too many indexes slow down writes)

**Relationships:**
- Many-to-many without junction tables
- Missing cascade delete/update rules
- Circular dependencies

**Data Types:**
- `text` instead of `varchar(N)` where length is known
- `integer` for IDs instead of `uuid` (or vice versa based on scale)
- Missing `notNull()` constraints where nulls are invalid
- Timestamps without timezone info in production apps

**Query Patterns (check actual usage in API routes/components):**
- N+1 queries (fetching relations in loops instead of JOINs)
- Missing pagination on large collections
- SELECT * instead of specific columns
- Missing LIMIT on queries that could return thousands of rows

### 3. Check Migrations
- Look for migration scripts in `drizzle/` or `scripts/add-*.ts`
- Verify indexes were actually created (not just schema defined)
- Check for data migrations that might lock tables

### 4. Performance Hotspots

Common anti-patterns:
- Full table scans on large tables
- Text search without full-text indexes (GIN/GiST in Postgres)
- JSONB columns queried frequently without indexes
- Enum types with 20+ values (better as a lookup table)
- Soft deletes without filtering (should have `WHERE deletedAt IS NULL` index)

### 5. Security

- Sensitive columns (passwordHash, tokens) should not be in default SELECT
- User-facing IDs should be UUIDs (not auto-increment integers that leak scale)
- Email/username columns should be case-insensitive (use LOWER() or citext)

### 6. Output Format

Structure findings as:

```markdown
## Critical Issues (fix before production)
- **Table `content`**: Missing index on `universeId` (foreign key) — will cause slow JOINs
- **Table `user`**: `email` is case-sensitive — `user@EXAMPLE.com` ≠ `user@example.com`

## Performance Warnings
- **Table `comments`**: No index on `contentId + createdAt` — pagination queries will be slow
- **API route `/api/content`**: N+1 query detected (fetching author in loop)

## Recommendations
- Add composite index: `CREATE INDEX idx_content_universe_created ON content(universeId, createdAt DESC)`
- Add GIN index for JSONB: `CREATE INDEX idx_metadata_search ON content USING GIN(metadata)`
- Use `db.query.content.findMany({ with: { author: true } })` instead of loop

## Migration Scripts
[Provide ready-to-run Drizzle migration code]
```

### 7. Generate Migration

If issues found, create migration file:
- File: `scripts/add-performance-indexes-YYYYMMDD.ts`
- Use Drizzle syntax with proper error handling
- Add comments explaining each index purpose

## Scope

**Do review:**
- Schema structure (tables, columns, constraints)
- Existing indexes and missing ones
- Common query patterns in API routes
- Foreign key relationships

**Don't review:**
- Application logic (that's for code-review)
- Business rules (that's for product)
- UI/UX decisions

## Example invocation

User: "Review database schema for performance issues"
Assistant: [Loads schema, checks API routes for query patterns, outputs structured findings + migration script]
