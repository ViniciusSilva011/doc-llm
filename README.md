# Doc LLM Starter

Production-oriented SaaS starter built on:

- Next.js App Router
- TypeScript with strict settings
- Auth.js / NextAuth credentials flow
- PostgreSQL + pgvector
- Pluggable object storage abstraction (local by default, optional S3)
- Standalone background ingestion worker
- Centralized OpenAI text + embeddings service
- Vitest + Playwright testing foundation

## What This App Is About

This repository is a starter foundation for a document-aware SaaS application.

Today, it gives you:

- a web app with a landing page, sign-in page, protected dashboard, and documents page
- a credentials-first auth setup that can grow into OAuth later
- PostgreSQL tables for users, documents, chunks, and ingestion jobs
- PDF upload with authenticated route handling and storage-backed document records
- a background worker that processes pending ingestion jobs
- pgvector-backed chunk storage for semantic retrieval
- a single OpenAI service layer for embeddings and text generation

This is not the finished product yet. It is the base application you build the real product on top of.

## Current User Flow

The current starter already supports this development flow:

1. Start the app and sign in with the seeded demo account.
2. Open the documents page and upload a PDF.
3. The app validates the file, stores it through the configured object storage backend, creates a document record, and enqueues an ingestion job.
4. The worker picks up the job, loads the PDF bytes through the same storage abstraction, extracts text, chunks it, generates embeddings, and stores chunk rows.
5. Open the protected dashboard and query indexed content through the retrieval flow once processing completes.

## Architecture

The project is intentionally split into a few stable seams:

- `src/app`: App Router pages and route handlers
- `src/auth`: Auth configuration, providers, and session guards
- `src/db`: Drizzle schema, migrations, and database scripts
- `src/lib/services`: ingestion, retrieval, dashboard, and OpenAI service layers
- `src/server/documents`: upload validation and document upload orchestration
- `src/server/storage`: provider-agnostic object storage contract, local implementation, S3 implementation, and factory
- `src/worker`: independent ingestion worker entrypoint
- `tests`: unit, integration, e2e, setup helpers, and mocks

The web app and worker share the same typed services instead of duplicating logic. The worker owns ingestion lifecycle work, while the web app creates jobs and reads indexed state.

## Folder Structure

```text
.
|-- .github/workflows/ci.yml
|-- .env.example
|-- Dockerfile
|-- docker-compose.yml
|-- drizzle.config.ts
|-- package.json
|-- playwright.config.ts
|-- vitest.config.ts
|-- vitest.unit.config.ts
|-- vitest.integration.config.ts
|-- docker/
|   `-- postgres/init/01-create-test-db.sql
|-- src/
|   |-- app/
|   |   |-- api/
|   |   |   |-- auth/[...nextauth]/route.ts
|   |   |   |-- documents/route.ts
|   |   |   |-- documents/upload/route.ts
|   |   |   |-- ingestion-jobs/route.ts
|   |   |   `-- query/route.ts
|   |   |-- dashboard/page.tsx
|   |   |-- documents/page.tsx
|   |   |-- sign-in/page.tsx
|   |   |-- globals.css
|   |   |-- layout.tsx
|   |   `-- page.tsx
|   |-- auth/
|   |-- components/
|   |-- db/
|   |   |-- migrations/
|   |   |-- schema/
|   |   `-- scripts/
|   |-- lib/
|   |   |-- services/
|   |   `-- validations/
|   |-- server/
|   |-- types/
|   `-- worker/
`-- tests/
    |-- e2e/
    |-- helpers/
    |-- integration/
    |-- mocks/
    |-- setup/
    `-- unit/
```

## Key Decisions

### Auth

- Uses NextAuth credentials sign-in today.
- Keeps provider creation isolated in `src/auth/providers.ts` so OAuth can be added without rewriting route guards.
- Uses JWT sessions for a lean starter while keeping `accounts`, `sessions`, and `verification_tokens` tables ready for future expansion.

### Database

- Uses Drizzle ORM with SQL migrations committed to the repo.
- Enables `pgcrypto` and `vector` in the initial migration.
- Stores embeddings in `document_chunks.embedding`.
- Includes a dedicated `doc_llm_test` database path for integration tests.

### Storage

- Business logic depends on a small `ObjectStorageService` interface, not on filesystem paths or the AWS SDK.
- `LocalObjectStorageService` stores files under `STORAGE_LOCAL_DIR` and is the default backend.
- `S3ObjectStorageService` uses AWS SDK v3 and is selected only through env configuration.
- The upload route and ingestion worker use the same storage entrypoint, so calling code does not change between local and S3 mode.

### Ingestion

- The web app validates uploads, persists PDF bytes, creates jobs, and returns quickly.
- The worker polls pending jobs, fetches source objects through the storage abstraction, extracts text, chunks content, embeds chunks, writes results, and updates status.
- PDF extraction is now wired in for the upload flow, while richer format support can be added behind the same worker pipeline.

### OpenAI

- All OpenAI calls live under `src/lib/services/openai`.
- Embeddings and generation models are configurable through environment variables.
- The query route already exercises retrieval plus generation through one centralized service layer.

## How To Load Up The App

### 1. Install dependencies

```bash
npm install
```

### 2. Create the environment file

```bash
cp .env.example .env
```

### 3. Start PostgreSQL with pgvector

```bash
docker compose up -d db
```

The compose setup initializes:

- `doc_llm` for the application
- `doc_llm_test` for integration tests

Optional: use Docker Compose for either the live development server or the production-style app
container:

```bash
docker compose up -d dev worker
docker compose exec dev sh
```

The `dev` service runs `npm run dev` with bind mounts for live code changes and still works as
your interactive workspace container on [http://localhost:3100](http://localhost:3100).

To run the production-style containerized app instead:

```bash
docker compose up -d prod
```

The `prod` service builds the production image target and serves the standalone app on
[http://localhost:3000](http://localhost:3000).

### 4. Run the database setup

```bash
npm run db:migrate
npm run db:seed
```

### 5. Start the web app

```bash
npm run dev -- --port 3100
```

### 6. Start the worker in another terminal

```bash
npm run worker:dev
```

If you are using Docker Compose for local development instead, you can skip steps 5 and 6 and run:

```bash
docker compose up -d dev worker
```

If you want to validate the production-style container too, run:

```bash
docker compose up -d prod
```

### 7. Open the app in your browser

Open [http://localhost:3100](http://localhost:3100) for the local dev server.

If you are validating the production-style container instead, open
[http://localhost:3000](http://localhost:3000).

Use the seeded credentials from `.env`:

- Email: `DEMO_USER_EMAIL`
- Password: `DEMO_USER_PASSWORD`

### 8. What to click first

- Visit `/sign-in` and authenticate.
- Visit `/documents` and upload a sample PDF.
- Keep the worker running so the ingestion job can be processed.
- Visit `/dashboard` and test the retrieval flow.

## API Surface

- `POST /api/documents/upload`: validate and upload a PDF, persist document metadata, and enqueue ingestion
- `GET /api/documents`: list the signed-in user's documents
- `POST /api/ingestion-jobs`: create a document and ingestion job from supplied text
- `POST /api/query`: embed a question, retrieve similar chunks, and generate an answer
- `GET|POST /api/auth/[...nextauth]`: Auth.js route handler

## Environment Variables

Required variables are documented in `.env.example`.

Important notes:

- `OPENAI_EMBEDDING_MODEL` defaults to `text-embedding-3-small`
- the starter schema is fixed to `1536` embedding dimensions
- if you switch to a model with a different embedding dimension, update schema and migration together
- `STORAGE_BACKEND` defaults to `local`
- `STORAGE_LOCAL_DIR` controls the local upload root
- `STORAGE_MAX_UPLOAD_SIZE_BYTES` enforces the PDF upload size limit
- S3 mode requires `AWS_REGION`, `AWS_S3_BUCKET`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_ENDPOINT`, `AWS_S3_FORCE_PATH_STYLE`, and `AWS_S3_PREFIX` support S3-compatible providers

## Security Notes

This starter is production-oriented, but there are still important security considerations before shipping a real product.

### Secrets and credentials

- Do not commit `.env` files or real secrets.
- Replace `NEXTAUTH_SECRET` with a long random production secret.
- Replace the seeded demo credentials before any shared or public deployment.
- Store database, OpenAI, and storage credentials in your deployment platform's secret manager.

### Authentication and session model

- The current setup uses credentials auth with JWT sessions for simplicity.
- If you need forced sign-out, device/session revocation, or more advanced session management, move toward database-backed session controls.
- Add account lockout, rate limiting, and audit logging before exposing credential login publicly.

### File and ingestion safety

- The upload route only accepts PDFs, rejects empty files, checks file extension and MIME type, and enforces a configured max upload size.
- The local storage driver resolves all writes beneath `STORAGE_LOCAL_DIR` and rejects traversal attempts.
- The S3 storage driver writes private objects by default. Keep buckets private and add signed access only when you intentionally need file delivery.
- Before production, add deeper file signature validation and malware scanning on top of the current PDF validation.
- User-submitted content will be sent to OpenAI for embeddings and generation. Review privacy, retention, and data handling requirements for your product.

### API and abuse prevention

- Add API rate limiting and abuse controls around ingestion and query endpoints.
- Add request logging, monitoring, and alerting around worker failures and suspicious usage patterns.
- Review authorization carefully as you introduce orgs, roles, shared documents, and multi-tenant data access.

### Data protection

- Consider encryption at rest for storage and database layers.
- Consider redaction or classification for sensitive documents before sending them to third-party AI services.
- Keep the embedding dimension aligned with the configured embedding model or your retrieval layer will break.

## Tests You Can Run So Far

The repository already includes linting, type checks, unit tests, integration tests, and e2e tests.

### Fast checks

```bash
npm run lint
npm run typecheck
```

### Unit tests

These are the safest checks to run first and currently pass in the project:

```bash
npm run test:unit
```

Current unit coverage includes:

- auth credential validation logic
- text chunking logic
- storage key generation and filename sanitization
- local object storage behavior
- S3 object storage behavior with mocked AWS SDK calls
- PDF upload validation
- ingestion processor storage access through the abstraction
- OpenAI service behavior with mocked responses

### Integration tests

These exercise API handlers, auth logic, and database-backed flows.

Requirements:

- PostgreSQL running
- `TEST_DATABASE_URL` reachable
- migrations available

Command:

```bash
npm run test:integration
```

Current integration coverage includes:

- auth against the seeded user
- authenticated PDF upload route behavior
- document record creation and queued ingestion status
- safe storage failure handling
- ingestion job creation route
- documents listing route
- query route authorization behavior

### End-to-end tests

These cover critical browser flows.

Requirements:

- dependencies installed
- database running
- migrations and seed completed
- Playwright browsers installed

Playwright loads `.env` through `playwright.config.ts` and defaults to the running dev server on
`http://127.0.0.1:3100`. If `APP_URL` or `NEXTAUTH_URL` are set in the shell, those values take
precedence.

Commands:

```bash
npx playwright install
npx playwright test
```

Current e2e coverage includes:

- sign-in flow
- protected route redirect behavior
- valid PDF upload through the documents page
- uploading `public/ai_text_full_v2.pdf` with a custom title
- invalid file upload validation in the UI

## Verification Status

At the time of this README update:

- `npm run lint`: passes
- `npm run typecheck`: passes
- `npm run test:unit`: passes
- `npm run test:integration`: passes
- `npm run test:e2e`: passes

## What To Build Next

1. Add stronger file security, including file signature inspection and malware scanning.
2. Expand ingestion to DOCX, HTML, and other source formats through the same worker pipeline.
3. Add retry scheduling, dead-letter behavior, and richer worker observability.
4. Improve retrieval with metadata filters, citations, and ranking strategies.
5. Add user registration, password reset, and OAuth providers.
6. Add organization, role, and multi-tenant authorization models.
7. Add production deployment manifests, secret management, and operational monitoring.
