# amazaing-strange-funeral-home-system

![Gagamboy: Bagong Araw](https://imgs.crazygames.com/auto-covers/amazing-strange-rope-police-vice-spider_1x1.png)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create the environment files:

   - Copy `client/.env.example` to `client/.env`
   - Copy `server/.env.example` to `server/.env`

3. Update the environment variables as needed.

4. Build `shared` before running anything else

> `client` and `server` both depend on its compiled output, and things will fail with confusing type errors otherwise. If `shared` is changed, make sure to build it again.

```bash
npm run build:shared
```

5. Run the application.

```bash
npm run dev
```

## Development Setup

### VS Code

1. Accept the prompt to install recommended extensions, or install manually:

   - [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
   - [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

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
