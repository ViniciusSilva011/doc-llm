![Next.js 16](https://img.shields.io/badge/Next.js-16-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![S3 Compatible](https://img.shields.io/badge/S3--Compatible-569A31?style=for-the-badge&logo=amazons3&logoColor=white)

![Lint](https://img.shields.io/badge/npm%20run%20lint-passes-brightgreen?style=for-the-badge&logo=eslint&logoColor=white)
![Typecheck](https://img.shields.io/badge/npm%20run%20typecheck-passes-brightgreen?style=for-the-badge&logo=typescript&logoColor=white)
![Unit Tests](https://img.shields.io/badge/npm%20run%20test%3Aunit-passes-brightgreen?style=for-the-badge&logo=vitest&logoColor=white)
![Integration Tests](https://img.shields.io/badge/npm%20run%20test%3Aintegration-passes-brightgreen?style=for-the-badge&logo=vitest&logoColor=white)
![E2E Tests](https://img.shields.io/badge/npm%20run%20test%3Ae2e-passes-brightgreen?style=for-the-badge&logo=playwright&logoColor=white)

# The App

Note: `This is not the finished product yet.`

Today, it gives you:

- A Next.js app with a landing page, credentials sign-in, protected dashboard, upload page,
  document query page, and per-document chat pages
- A user-scoped document access, so dashboards, uploads, queries, and chat history stay tied to the
  authenticated owner
- PDF upload with client and server validation, configurable size limits, unique per-user titles,
  storage-backed records, and automatic ingestion job creation
- Local filesystem storage by default, plus an S3-compatible storage adapter with endpoint,
  path-style, bucket, credential, and prefix configuration
- PostgreSQL schemas for users, documents, document chunks, ingestion jobs, chat messages, and
  asynchronous chat jobs
- a worker that runs ingestion and document-chat job loops, claims queued work with
  `SKIP LOCKED`, records failures, and retries retryable ingestion errors
- PDF text extraction, chunking, embedding generation, and pgvector-backed semantic retrieval
- A library-wide document Q&A with optional PDF scoping and matched chunk scores returned with every
  answer
- A per-document chat that saves user and assistant messages, generates answers from that PDF's
  retrieved chunks, and pushes completion/failure updates over server-sent events
- An OpenAI-compatible AI layer that uses Ollama embeddings by default and can generate text through
  OpenRouter or OpenAI
- Docker Compose support for pgvector PostgreSQL, the development app, the worker, and a
  production-style app container
- Unit, integration, live connection, and Playwright end-to-end checks for auth, upload, storage,
  ingestion, retrieval, chat, and protected browser flows

# How To Load Up The App

## 1. Install dependencies

```bash
npm install
```

## 2. Create the environment file

```bash
cp .env.example .env
```

Embeddings default to Ollama's OpenAI-compatible endpoint. Before running the worker, make sure
Ollama is running locally and the model is available:

```bash
ollama pull nomic-embed-text
```

Text generation defaults to OpenRouter. Set these values in `.env`:

```bash
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=openai/gpt-5-mini
```

To use OpenAI directly instead, set `LLM_PROVIDER=openai` and configure `OPENAI_API_KEY` plus
`OPENAI_GENERATION_MODEL`.

## 3. Start PostgreSQL with pgvector

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

## 4. Run the database setup

```bash
npm run db:migrate
npm run db:seed
```

## 5. Start the web app

```bash
npm run dev -- --port 3100
```

## 6. Start the worker in another terminal

```bash
npm run worker
```

If you are using Docker Compose for local development instead, you can skip steps 5 and 6 and run:

```bash
docker compose up -d dev worker
```

If you want to validate the production-style container too, run:

```bash
docker compose up -d prod
```

## 7. Open the app in your browser

Open [http://localhost:3100](http://localhost:3100) for the local dev server.

If you are validating the production-style container instead, open
[http://localhost:3000](http://localhost:3000).

Use the seeded credentials from `.env`:

- Email: `DEMO_USER_EMAIL`
- Password: `DEMO_USER_PASSWORD`

## Fast checks

```bash
npm run lint
npm run typecheck
```

## Unit tests

These are the safest checks to run first and currently pass in the project:

```bash
npm run test:unit
```

## Live connection checks

These send small live requests to configured external services and fail if connection, auth,
routing, or response parsing fails:

```bash
npm run test:llm:connection
npm run test:openrouter:connection
npm run test:embedding:connection
npm run test:s3:connection
npm run test:live
```

`test:llm:connection` checks the app's configured generation provider. `test:openrouter:connection`
checks OpenRouter directly. `test:live` runs all live connection checks in sequence.

## Integration tests

These exercise API handlers, auth logic, and database-backed flows.

Requirements:

- PostgreSQL running
- `TEST_DATABASE_URL` reachable
- migrations available
- Ollama running at `EMBEDDING_BASE_URL`
- `nomic-embed-text` pulled in Ollama:

```bash
ollama pull nomic-embed-text
```

Command:

```bash
npm run test:integration
```

## End-to-end tests

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
