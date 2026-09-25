FROM node:20-alpine AS builder

WORKDIR /app

# Copy backend package and Prisma schema
COPY backend/package*.json ./backend/
COPY backend/prisma ./backend/prisma/

WORKDIR /app/backend
RUN npm install

# Copy backend source code and compile
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/prisma ./prisma
COPY --from=builder /app/backend/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/backend/node_modules/.prisma ./node_modules/.prisma

EXPOSE 8080 5000

ENV PORT=8080
ENV HOST=0.0.0.0
ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
