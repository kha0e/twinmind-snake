# Multi‑stage build pour le client

FROM node:20-alpine as builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY public ./public
COPY src ./src
RUN npm run build

# Étape finale : service statique
FROM nginx:alpine as runner
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
