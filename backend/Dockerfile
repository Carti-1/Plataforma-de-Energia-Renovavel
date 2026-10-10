FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 3000

# O seed é idempotente: só insere os dados do exemplo se o banco estiver vazio.
CMD ["sh", "-c", "node src/scripts/seed.js && node src/server.js"]
