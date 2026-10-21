# amazaing-strange-funeral-home-system

![Gagamboy: Bagong Araw](https://imgs.crazygames.com/auto-covers/amazing-strange-rope-police-vice-spider_1x1.png)

## Setup

### Prerequisites

- A free [Supabase](https://supabase.com/) account. It provides the PostgreSQL database and the file storage for uploaded documents.

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. In the Supabase dashboard, click **New project**.
2. Pick a name and a region close to you.
3. Set a **database password**. Save it somewhere, because you will need it below. Letters and numbers only is the easiest, since special characters must be URL-encoded in `DB_URL`.
4. Wait for the project to finish provisioning (about a minute).

You do **not** need to create any tables or storage buckets by hand. The seed script in step 5 does that.

### 3. Collect your Supabase credentials

**Database**

Click **Connect** at the top of the dashboard and choose the **Session pooler** connection. Use it instead of the "Direct connection": the direct host is IPv6-only on the free plan and often fails to connect from home networks. Note these four values:

| Value    | Looks like                           |
| -------- | ------------------------------------ |
| Host     | `aws-0-<region>.pooler.supabase.com` |
| Port     | `5432`                               |
| User     | `postgres.<project-ref>`             |
| Database | `postgres`                           |

Take note of the **connection string** as well.

---

**Storage (S3)**

Go to **Storage &rarr; S3** (under the storage settings). Note the **endpoint** and **region** shown there, then click **New access key** and copy the **Access key ID** and **Secret access key**. The secret is only shown once.

### 4. Create the environment files

**Linux / macOS**

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

**Windows**

```bash
copy client/.env.example client/.env
copy server/.env.example server/.env
```

**`client/.env`**

| Variable              | Value                   |
| --------------------- | ----------------------- |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` |

**`server/.env`**

| Variable                                                | Value                                                                                                                 |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `APP_PORT`                                              | `4000`                                                                                                                |
| `CLIENT_URL`                                            | `http://localhost:3000`                                                                                               |
| `NODE_ENV`                                              | `dev`                                                                                                                 |
| `HOST`, `DB_PORT`, `DATABASE`, `DB_USER`, `DB_PASSWORD` | The same as `DB_URL` but split into parts: the host, `5432`, `postgres`, `postgres.<project-ref>`, your password      |
| `DB_URL`                                                | `postgresql://postgres.<project-ref>:<password>@<host>:5432/postgres` (from connection string)                        |
| `BETTER_AUTH_SECRET`                                    | A long random string. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `BETTER_AUTH_URL`                                       | `http://localhost:4000`                                                                                               |
| `S3_REGION`                                             | The region from the S3 page                                                                                           |
| `S3_ENDPOINT`                                           | The endpoint from the S3 page (ends in `/storage/v1/s3`)                                                              |
| `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`              | The access key you created                                                                                            |
| `S3_BUCKET`                                             | Any name you like, e.g. `user-required-docs-prod`. The seed script creates it.                                        |
| `S3_PUBLIC_BASE_URL`                                    | `https://<project-ref>.supabase.co/storage/v1/object/public`                                                          |

> The server connects to the database in two places, so **both** `DB_URL` and the `HOST`/`DB_PORT`/`DATABASE`/`DB_USER`/`DB_PASSWORD` group must be filled in and must point to the same database. If your password contains special characters, URL-encode them in `DB_URL` only (for example `@` becomes `%40`).

### 5. Build `shared`

`client` and `server` both depend on the compiled output of `shared`, and things will fail with confusing type errors otherwise. If `shared` changes, build it again.

```bash
npm run build:shared
```

### 6. Seed the database

The password for the superadmin must be at least 8 characters and contain an uppercase letter, a lowercase letter, a number and a special character. Use double quotes.

```bash
npm run seed -w server -- --password 'Str0ng!Pass'
```

Useful options (run with `--help` for the full list):

| Option                        | Meaning                                    |
| ----------------------------- | ------------------------------------------ |
| `--username`                  | Superadmin username (default `superadmin`) |
| `--first-name`, `--last-name` | Superadmin name (default `Super Admin`)    |
| `--skip-bucket`               | Don't create the storage bucket            |
| `--skip-superadmin`           | Don't create a superadmin                  |

The seed is safe to run again at any time. Every step that is already done is skipped.

After your first login, change the superadmin's password from **Admin &rarr; Staff Management**.

### 7. Run the application

```bash
npm run dev:all
```

Open <http://localhost:3000> and sign in with the superadmin username and password from step 6.

### Managing superadmins later

To promote an existing staff account instead of creating a new one (only works while no superadmin exists, since the database allows only one):

```bash
npm run create-superadmin -w server -- --promote <username>
```

### Troubleshooting

| Problem                                                              | Fix                                                                                                                 |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `ENOTFOUND`, `ETIMEDOUT` or `ENETUNREACH` connecting to the database | You are probably using the direct connection (IPv6-only). Use the **Session pooler** values from step 3.            |
| `password authentication failed`                                     | Check the password and the user (`postgres.<project-ref>` on the pooler). Reset the password if needed.             |
| `Database schema mismatch` / "Missing tables"                        | The server started before the database was seeded. Run `npm run seed -w server -- --password "..."`.                |
| `Missing one or more S3 environment variables` on startup            | Fill in all six `S3_*` variables in `server/.env`.                                                                  |
| Uploaded documents fail with an access or signature error            | Re-check `S3_ENDPOINT`, `S3_REGION` and the access key. Check that `S3_BUCKET` matches the bucket the seed created. |
| Uploaded files don't display                                         | Check that `S3_PUBLIC_BASE_URL` ends in `/storage/v1/object/public` (no trailing slash and no bucket name).         |
| Type errors about `shared`                                           | Run `npm run build:shared` again.                                                                                   |

## Development Setup

### VS Code

1. Accept the prompt to install recommended extensions, or install manually:

   - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
   - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
   - [Tailwind CSS Intellisense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss)

2. Allow the ESLint/Prettier extensions to execute in the workspace. If you miss it or nothing seems to be linting/formatting, add this to your user settings (not the repo's):

```json
  "extensions.supportUntrustedWorkspaces": {
    "esbenp.prettier-vscode": {
      "supported": true,
    },
    "dbaeumer.vscode-eslint": {
      "supported": true,
    },
  },
```
