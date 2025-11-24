FROM node:18-alpine AS base

# Instala dependências do sistema necessárias
RUN apk add --no-cache libc6-compat netcat-openbsd openssl

WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instala dependências
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copia código fonte
COPY . .

# Gera cliente Prisma
RUN npx prisma generate

# Build do TypeScript
RUN npm run build

# Stage de produção
FROM node:18-alpine AS production

# Instala netcat e OpenSSL para health check e Prisma
RUN apk add --no-cache netcat-openbsd openssl

WORKDIR /app

# Copia apenas arquivos necessários
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist
COPY --from=base /app/package*.json ./
COPY --from=base /app/prisma ./prisma

# Expõe porta
EXPOSE 3000

# Script de inicialização que aguarda o banco estar pronto
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/app.js"]

