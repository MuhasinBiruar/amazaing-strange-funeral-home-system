# Docker workflow

This repository is a monorepo (client, server, shared). `docker-compose.yml`
runs it for development with hot reload; the `Dockerfile`'s default stage is a
production image.

## Before you start

Create `client/.env` and `server/.env` (copy the `.env.example` files).
Docker Compose is stricter than Next.js about `.env` files: every line must be
`KEY=value`, a comment starting with `#`, or blank.

## Development

```bash
docker compose up --build
```

- Client: http://localhost:3000
- Server: http://localhost:4000

The `shared` service builds `shared/dist` first, then the client and server
start. Source files are bind-mounted, so saving a file reloads the app.

After editing anything in `shared/`, rebuild it:

```bash
docker compose run --rm shared
```

After changing dependencies (`package.json`, `package-lock.json`) or the
Dockerfile, rebuild the images and replace the containers' `node_modules`
volumes:

```bash
docker compose up --build --renew-anon-volumes
```

Stop everything:

```bash
docker compose down
```

## Production image

```bash
docker build -t funeral-home \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:4000 \
  --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 .

docker run --env-file server/.env -e NODE_ENV=production \
  -p 3000:3000 -p 4000:4000 funeral-home
```

`NEXT_PUBLIC_*` values are compiled into the client bundle, so pass the URLs
the browser will use at build time. The server reads its settings from the
environment when the container starts.
