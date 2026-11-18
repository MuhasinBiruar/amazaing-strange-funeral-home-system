# syntax=docker/dockerfile:1
ARG NODE_VERSION=22.21.1

FROM node:${NODE_VERSION}-slim AS base
WORKDIR /usr/src/app
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Installs every workspace's dependencies from the lockfile.
FROM base AS deps
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=bind,source=client/package.json,target=client/package.json \
    --mount=type=bind,source=server/package.json,target=server/package.json \
    --mount=type=bind,source=shared/package.json,target=shared/package.json \
    --mount=type=cache,target=/root/.npm \
    npm ci

# Development image used by docker-compose.yml: dependencies only, the source
# is bind-mounted at runtime.
FROM deps AS dev
ENV NEXT_TELEMETRY_DISABLED=1
EXPOSE 3000 4000

# Production build. NEXT_PUBLIC_* values are baked into the client bundle at
# build time, so pass them as build args when the defaults don't apply:
#   docker build --build-arg NEXT_PUBLIC_API_URL=https://api.example.com .
FROM deps AS build
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} \
    NEXT_TELEMETRY_DISABLED=1
COPY . .
RUN npm run build

# Production image: runs the built client (3000) and server (4000).
# Server settings come from the environment at runtime, e.g.
#   docker run --env-file server/.env -p 3000:3000 -p 4000:4000 <image>
FROM base AS final
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps --chown=node:node /usr/src/app ./
COPY --chown=node:node package.json package-lock.json ./
COPY --chown=node:node client/package.json client/next.config.ts ./client/
COPY --chown=node:node client/public ./client/public
COPY --chown=node:node server/package.json ./server/
COPY --chown=node:node shared/package.json ./shared/
COPY --from=build --chown=node:node /usr/src/app/shared/dist ./shared/dist
COPY --from=build --chown=node:node /usr/src/app/client/.next ./client/.next
COPY --from=build --chown=node:node /usr/src/app/server/dist ./server/dist
USER node
EXPOSE 3000 4000
CMD ["npm", "run", "start"]
