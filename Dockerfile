FROM node:20-bookworm-slim

WORKDIR /app

# Dependencias nativas para better-sqlite3
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
        make \
            g++ \
                ca-certificates \
                    && rm -rf /var/lib/apt/lists/*

                    # Instala deps a partir do package.json + lock
                    COPY package.json package-lock.json ./
                    RUN npm install --no-audit --no-fund

                    # Copia o resto do projeto
                    COPY . .

                    # Build do Next em modo standalone
                    ENV NEXT_TELEMETRY_DISABLED=1
                    RUN npm run build && \
                        cp -r public .next/standalone/ && \
                            cp -r .next/static .next/standalone/.next/ && \
                                cp -r node_modules/better-sqlite3 .next/standalone/node_modules/better-sqlite3 2>/dev/null || true

                                ENV NODE_ENV=production
                                ENV HOSTNAME=0.0.0.0
                                ENV PORT=3000
                                EXPOSE 3000

                                CMD ["node", ".next/standalone/server.js"]
                                
