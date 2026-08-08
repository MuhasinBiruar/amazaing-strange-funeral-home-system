# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.21.1

FROM node:${NODE_VERSION}-slim AS base
WORKDIR /usr/src/app

FROM base AS deps
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=bind,source=client/package.json,target=client/package.json \
    --mount=type=bind,source=server/package.json,target=server/package.json \
    --mount=type=cache,target=/root/.npm \
    npm install --omit=dev --package-lock=false

FROM deps AS build
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=bind,source=client/package.json,target=client/package.json \
    --mount=type=bind,source=server/package.json,target=server/package.json \
    --mount=type=cache,target=/root/.npm \
    npm install --package-lock=false

COPY . .
RUN npm run build

FROM base AS final
ENV NODE_ENV=production
USER node
COPY package.json .
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/client/.next ./client/.next
COPY --from=build /usr/src/app/server/dist ./server/dist
EXPOSE 4000
CMD npm run dev
