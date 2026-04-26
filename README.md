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

- a web app with a landing page, sign-in page, protected dashboard, and documents page
- a credentials-first auth setup that can grow into OAuth later
- PostgreSQL tables for users, documents, chunks, and ingestion jobs
- PDF upload with authenticated route handling and storage-backed document records
- a background worker that processes pending ingestion jobs
- pgvector-backed chunk storage for semantic retrieval
- a single OpenAI service layer for embeddings and text generation


# How To Load Up The App

## 1. Install dependencies

```bash
npm install
```

## 2. Create the environment file

```bash
cp .env.example .env
```

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

## Integration tests

These exercise API handlers, auth logic, and database-backed flows.

Requirements:

- PostgreSQL running
- `TEST_DATABASE_URL` reachable
- migrations available

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