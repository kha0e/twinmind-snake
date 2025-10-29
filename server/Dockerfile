# Multi‑stage build pour le serveur

FROM node:20-alpine as builder
WORKDIR /app
COPY package.json package-lock.json* pnpm-lock.yaml* ./
# Installe les dépendances (dev inclus) pour la compilation
RUN npm install
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine as runner
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
# Copie uniquement les fichiers nécessaires au runtime
EXPOSE 4000
CMD ["node", "dist/server.js"]
