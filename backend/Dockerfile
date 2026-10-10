FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
EXPOSE 3000

# Seed e criação do administrador são idempotentes: só agem se os dados ainda não existirem.
CMD ["sh", "-c", "node src/scripts/seed.js && node src/scripts/criar-usuario.js && node src/server.js"]
