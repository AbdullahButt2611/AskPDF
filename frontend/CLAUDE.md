# CLAUDE.md — frontend

React 19 + TypeScript + Vite single-page app for AskPDF. Run every command from `frontend/`.

## Commands

- `npm install`, then `npm run dev` (http://localhost:5173). The backend must be running; see `../backend/CLAUDE.md`.
- `npm run build` runs the type check (`tsc -b`) and the production build. `npm run lint` runs oxlint. There is no test suite.
- The dev server proxies `/api` to `VITE_BACKEND_URL` (default `http://localhost:8000`), so no CORS setup is needed. In production, set `VITE_API_BASE_URL` to the API origin, or serve both from the same origin.
- Add React Bits components with `npx shadcn@latest add @react-bits/<Name>-TS-TW`. `components.json` sends them to `src/components/reactbits/`.

## Structure

- `src/app/`: providers, router and query client. Each route is lazy-loaded with React Router's `lazy`.
- `src/routes/`: one component per page (Ask, Knowledge Base, Settings, 404). They compose features and contain little logic of their own.
- `src/features/<feature>/`: `api.ts` holds fetch functions that map the backend's snake_case payloads to camelCase types, `queries.ts` holds the TanStack Query hooks, plus stores and components.
  - `documents`: Knowledge Base.
  - `chat`: Ask.
  - `preferences`: theme and passages per answer.
- `src/components/`:
  - `brand/`: `Logo`, and `ReadingMark`, the animated page loader.
  - `layout/`, `ui/`, `feedback/`: shell, primitives, splash.
  - `reactbits/`: vendored React Bits components. Their default colors are pointed at theme tokens, and ThoughtLine uses lucide icons instead of hugeicons.
- `src/lib/`: `apiRequest` and `ApiError` (user-facing error messages, timeouts), `cn`, formatters.

## Conventions

- **Theme tokens are the only source of colors and fonts.** `src/styles/theme.css` defines the three brand colors and font families once. Every light and dark token is derived from them with `color-mix()`, and `@theme inline` exposes the tokens to Tailwind (`bg-surface`, `text-muted`, `font-display`, …). Don't hard-code hex values in components. React Bits components take tokens as `var(--…)` strings.
- **Fonts are vendored** in `src/assets/fonts`: Latin subsets of only the weights in use (Bricolage Grotesque 700, Hanken Grotesk 400/500/600, JetBrains Mono 400/500). If you add a weight, add both its `.woff2` file and its `@font-face` in `src/styles/fonts.css`.
- **Theme:** `features/preferences/preferences-store.ts` (Zustand, persisted as `askpdf-preferences`) applies the `dark` or `light` class to `<html>` through a module-level store subscription. The inline script in `index.html` reads the same storage key before first paint. Keep the two in sync if the key or shape changes. Logos render both variants and switch with `dark:` classes.
- **Logos** are inlined with `vite-plugin-svgr` (`?react`) so the wordmark's live text uses Bricolage Grotesque. SVGO strips their C2PA metadata at build time and must keep `removeViewBox` disabled.
- **Server state belongs to TanStack Query, not effects.** The documents list polls every 2 s only while a document is `processing`. In-flight uploads and deletes are read with `useMutationState`.
  - For per-file side effects, use `mutateAsync`. Per-call `mutate` callbacks only fire for the most recent call.
  - Chat answers are written by callbacks on the `useMutation` itself, so they still land after the user navigates away.
- **Chat history** is in-memory Zustand state (`chat-store.ts`), not persisted. `useThinkingSteps` reveals the loader's steps on a timer, because the backend returns the answer in one response. It's one of the few legitimate `useEffect`s; avoid adding others for derived state or data fetching.
- **Duplicate uploads:** the dropzone checks names against the cached list and asks before overwriting. A 409 from the API (a race) goes through the same dialog.
