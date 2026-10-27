# ADR-001: Mandate MariaDB with Prisma MySQL Provider

## Status
Accepted

## Context
The project rules in `AGENTS.md` and `SPEC.md` strictly prohibit PostgreSQL, SQLite, and external proprietary DBaaS (such as Supabase or Firebase). The application requires full ACID compliance for transactions (exam finalization, batch CSV import), reliable UTF-8 Unicode encoding for simultaneous Vietnamese diacritics and Japanese CJK characters, and seamless compatibility with Hostinger hosting environments.

## Decision
We mandate **MariaDB 10.11+ LTS** using the InnoDB storage engine with the `utf8mb4` character set and `utf8mb4_unicode_ci` collation.
In Prisma ORM (`prisma/schema.prisma`), we configure:
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```
At runtime, we connect using Prisma's official MySQL/MariaDB driver adapter with a strict connection pooling limit (`connection_limit=5`).

## Consequences
- **Positive:** Full compliance with Hostinger persistent MariaDB processes; zero vendor lock-in; reliable ACID transactions.
- **Negative:** We cannot use PostgreSQL-specific extensions (such as native `JSONB` path operators, native array columns, or partial indexes). MariaDB's `JSON` is an alias for `LONGTEXT` with JSON validity checks, requiring explicit normalized columns for relational filtering.
