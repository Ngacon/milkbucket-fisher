FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

FROM node:20-bookworm-slim AS build
WORKDIR /app
ENV DATABASE_URL=postgresql://milkbucket:milkbucket@localhost:5432/milkbucket?schema=public
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/src/dashboard/views ./src/dashboard/views
COPY --from=build /app/src/database/seed-data ./src/database/seed-data
COPY --from=build /app/package.json ./package.json
CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && node dist/src/index.js"]
