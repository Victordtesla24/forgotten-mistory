# viseme-bridge — frame-accurate viseme extraction service (FR-CLONE-LIVE)
# Part of the dynamic VPS pipeline: ElevenLabs WS → VisemeBridge → D-ID Streaming
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 9003
CMD ["node", "dist/index.js"]
