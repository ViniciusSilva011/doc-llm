FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps
COPY package.json ./
RUN npm install

FROM deps AS dev
COPY . .
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

FROM deps AS builder
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/src/db/migrations ./src/db/migrations
COPY --from=builder /app/data ./data
EXPOSE 3000
CMD ["node", "server.js"]
