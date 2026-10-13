# Imagem do serviço `seed` do docker-compose: aplica as migrations e cria os dados de demonstração.
FROM node:24-bookworm-slim
# o Prisma precisa do openssl; o corepack usa o pnpm fixado no packageManager
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* && corepack enable
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app

# só os manifestos (e o schema, para o prisma generate do postinstall) antes do install,
# para mudanças no código não refazerem a instalação
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json packages/shared/
COPY apps/web/package.json apps/web/
COPY apps/api/package.json apps/api/
COPY apps/api/prisma apps/api/prisma
RUN pnpm install --frozen-lockfile --filter @wifi/api...

COPY packages/shared packages/shared
COPY apps/api apps/api
RUN pnpm --filter @wifi/shared build

CMD pnpm --filter @wifi/api exec prisma migrate deploy && pnpm --filter @wifi/api seed
