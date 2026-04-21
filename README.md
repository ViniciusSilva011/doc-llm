# Doc LLM Starter

Production-oriented SaaS starter built on:

- Next.js App Router
- TypeScript with strict settings
- Auth.js / NextAuth credentials flow
- PostgreSQL + pgvector
- Local-first object storage abstraction
- Standalone background ingestion worker
- Centralized OpenAI text + embeddings service
- Vitest + Playwright testing foundation

## Architecture

The project is intentionally split into a few stable seams:

- `src/app`: App Router pages and route handlers
- `src/auth`: Auth configuration, providers, and session guards
- `src/db`: Drizzle schema, migrations, and database scripts
- `src/lib/services`: storage, ingestion, retrieval, dashboard, and OpenAI service layers
- `src/worker`: independent ingestion worker entrypoint
- `tests`: unit, integration, e2e, setup helpers, and mocks

The web app and worker share the same typed services instead of duplicating logic. The worker owns ingestion lifecycle work, while the web app only creates jobs and reads indexed state.

## Folder Structure

```text
.
├─ .github/workflows/ci.yml
├─ .env.example
├─ Dockerfile
├─ docker-compose.yml
├─ drizzle.config.ts
├─ package.json
├─ playwright.config.ts
├─ vitest.config.ts
├─ vitest.unit.config.ts
├─ vitest.integration.config.ts
├─ docker/
│  └─ postgres/init/01-create-test-db.sql
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  │  ├─ auth/[...nextauth]/route.ts
│  │  │  ├─ documents/route.ts
│  │  │  ├─ ingestion-jobs/route.ts
│  │  │  └─ query/route.ts
│  │  ├─ dashboard/page.tsx
│  │  ├─ documents/page.tsx
│  │  ├─ sign-in/page.tsx
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ auth/
│  ├─ components/
│  ├─ db/
│  │  ├─ migrations/
│  │  ├─ schema/
│  │  └─ scripts/
│  ├─ lib/
│  │  ├─ services/
│  │  └─ validations/
│  ├─ server/
│  ├─ types/
│  └─ worker/
└─ tests/
   ├─ e2e/
   ├─ helpers/
   ├─ integration/
   ├─ mocks/
   ├─ setup/
   └─ unit/
```

## Key Decisions

### Auth

- Uses NextAuth credentials sign-in today
- Keeps provider creation isolated in `src/auth/providers.ts` so OAuth can be added without rewriting route guards
- Uses JWT sessions for a lean starter, while keeping `accounts`, `sessions`, and `verification_tokens` tables ready for future expansion

### Database

- Uses Drizzle ORM with SQL migrations committed to the repo
- Enables `pgcrypto` and `vector` in the initial migration
- Stores chunk embeddings in `document_chunks.embedding`
- Includes a dedicated `doc_llm_test` database path for integration tests

### Storage

- Business logic depends on the `ObjectStorage` interface, not a vendor SDK
- `LocalObjectStorage` is ready for development
- `S3CompatibleObjectStorage` is a wired stub so future S3 work has a clear home

### Ingestion

- Web app creates jobs and writes source objects
- Worker polls pending jobs, extracts text, chunks content, embeds chunks, writes results, and updates status
- Extraction is intentionally placeholder-first for non-text files, with TODO markers where a real PDF/Office pipeline should plug in

### OpenAI

- All OpenAI calls live under `src/lib/services/openai`
- Embeddings and generation models are configurable by env
- Query route already exercises retrieval + generation through that single service layer

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create env file

```bash
cp .env.example .env
```

On Windows PowerShell, create `.env` manually or use:

```powershell
Copy-Item .env.example .env
```

### 3. Start PostgreSQL with pgvector

```bash
docker compose up -d db
```

The compose setup creates:

- `doc_llm` for the application
- `doc_llm_test` for integration tests

### 4. Run migrations and seed a demo user

```bash
npm run db:migrate
npm run db:seed
```

### 5. Start the web app and worker

In one terminal:

```bash
npm run dev
```

In another terminal:

```bash
npm run worker:dev
```

Open [http://localhost:3000](http://localhost:3000).

Use the demo credentials from `.env`:

- Email: `DEMO_USER_EMAIL`
- Password: `DEMO_USER_PASSWORD`

## Testing

### Lint and types

```bash
npm run lint
npm run typecheck
```

### Unit tests

```bash
npm run test:unit
```

### Integration tests

Requires PostgreSQL running and `TEST_DATABASE_URL` reachable.

```bash
npm run test:integration
```

### E2E tests

Requires:

- dependencies installed
- database running
- migrations + seed completed
- Playwright browsers installed

```bash
npx playwright install
npm run test:e2e
```

## API Surface

- `POST /api/ingestion-jobs`: create a document + ingestion job from supplied text
- `GET /api/documents`: list the signed-in user's documents
- `POST /api/query`: embed a question, retrieve similar chunks, and generate an answer
- `GET|POST /api/auth/[...nextauth]`: Auth.js route handler

## Environment Variables

Required variables are documented in `.env.example`.

Important notes:

- `OPENAI_EMBEDDING_MODEL` defaults to `text-embedding-3-small`
- the starter schema is fixed to `1536` embedding dimensions
- if you switch to a model with a different embedding dimension, update schema + migration together

## Verification Status

At the time this starter was generated:

- `npm run lint`: passes
- `npm run typecheck`: passes
- `npm run test:unit`: passes
- `npm run test:integration`: requires a running PostgreSQL instance

## What To Build Next

1. Add real file upload flows and wire them into object storage
2. Replace placeholder extraction with PDF / DOCX / HTML parsing pipeline
3. Add retry scheduling, dead-letter behavior, and richer worker observability
4. Improve retrieval with metadata filters, chunk citations, and ranking strategies
5. Add user registration, password reset, and OAuth providers
6. Add document ownership roles, multi-tenant orgs, and audit trails
7. Add production deployment manifests and secret management for your target platform
