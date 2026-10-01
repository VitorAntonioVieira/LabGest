# ==========================================
# Dockerfile Multi-Stage para Next.js 14
# Otimizado para Produção e Segurança
# ==========================================

# 1. Dependências
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copia manifestos de pacotes
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./
COPY prisma ./prisma/

# Instala dependências
RUN \
  if [ -f package-lock.json ]; then npm ci; \
  else npm install; \
  fi

# 2. Construtor (Builder)
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p /app/public

# Desabilita telemetria do Next.js durante a compilação
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Gera o cliente Prisma e compila o Next.js
RUN npx prisma generate
RUN npm run build

# 3. Executável de Produção (Runner)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Instalação das bibliotecas nativas para execução do runtime do Prisma
RUN apk add --no-cache libc6-compat openssl

# Criação de usuário não-root por segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia arquivos necessários do estágio builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Se usando output: "standalone" no next.config.mjs:
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
