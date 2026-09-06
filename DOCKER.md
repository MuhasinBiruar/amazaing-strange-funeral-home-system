# Docker workflow

This repository is a monorepo with a shared root Docker build and a dev compose setup.

## Start the app

```bash
docker compose up --build
```

This starts two dev services:

- Client: http://localhost:3000
- Server: http://localhost:4000

The client is started with `--hostname 0.0.0.0` so the browser on your host machine can reach it.

## When you change code

If you only edit source files, save the file and Docker will pick up the change automatically because the repo is bind-mounted into both containers.

If you change dependencies, package files, the Dockerfile, or compose, rebuild the containers:

```bash
docker compose up --build
```

If the container is already running and you want a clean restart:

```bash
docker compose down
docker compose up --build
```

## Stop the app

```bash
docker compose down
```

## Notes

- Create the environment files first if they do not exist: `client/.env` and `server/.env`.
- The compose setup uses the existing root Dockerfile's build stage so the monorepo can run with hot reload in development.
