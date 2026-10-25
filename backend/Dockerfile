# Build context: raiz do projeto (o backend executa o extrator Python).

# Estágio 1: compila dependências nativas (better-sqlite3) sem levar o compilador para a imagem final.
FROM node:22.15.1-bookworm-slim AS node-deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends build-essential python3 \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# Estágio 2: runtime.
FROM node:22.15.1-bookworm-slim

# Python para o extrator + Poppler (rasterização) + Tesseract com português (OCR).
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-venv poppler-utils tesseract-ocr tesseract-ocr-por \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY extractor/requirements.txt extractor/
RUN python3 -m venv extractor/.venv \
  && extractor/.venv/bin/pip install --no-cache-dir -r extractor/requirements.txt

COPY --from=node-deps /app/backend/node_modules backend/node_modules

COPY extractor/ extractor/
COPY backend/ backend/

WORKDIR /app/backend
ENV NODE_ENV=development \
    DATABASE_FILE=/data/gastos.db \
    UPLOAD_DIR=/data/uploads
EXPOSE 3333

CMD ["node", "--watch", "src/server.js"]
