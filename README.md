Release Link: https://github.com/hlevy108/papitrampoline/releases/tag/v.0.0

## Leaderboard (Firebase / Firestore)

The leaderboard uses Firestore. If Firebase config is missing, the app will show:
`Leaderboard disabled: missing Firebase config.` / `Could not load scores right now.`

### Local dev setup

- Create a Firebase project (or pick an existing one).
- In Firebase Console, enable **Firestore Database**.
- Create a **Web app** in the Firebase project and copy the Web SDK config values.
- Create a `.env.local` file in the project root (same folder as `package.json`) and set:

```bash
VITE_FIREBASE_API_KEY="..."
VITE_FIREBASE_AUTH_DOMAIN="YOUR_PROJECT.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
VITE_FIREBASE_STORAGE_BUCKET="YOUR_PROJECT.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="..."
VITE_FIREBASE_APP_ID="..."
VITE_FIREBASE_MEASUREMENT_ID="..." # optional
```

You can start from `env.example` and copy/paste values into `.env.local`.

- Restart the dev server after editing env vars (Vite only reads them at startup):
  - `npm run dev`

### Deploying to Firebase Hosting

Firebase Hosting serves built static files; it does **not** inject Vite env vars at runtime.
Make sure the `VITE_FIREBASE_*` variables are present **when you run** `npm run build`
in whatever environment is building the app.

### Switching Firebase project for deploy

Firebase CLI uses `.firebaserc` to decide which Firebase project to deploy to.

- To change the default project, edit `.firebaserc` (`projects.default`)
- Or add/use an alias:
  - `firebase use --add`
  - `firebase use <alias>`
  - `firebase deploy --project <projectId>`

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
