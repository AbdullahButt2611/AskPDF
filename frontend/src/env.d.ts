interface ImportMetaEnv {
  /** Origin of the backend API. Empty means same origin (the Vite dev server proxies /api). */
  readonly VITE_API_BASE_URL?: string
  /** Where the dev server proxies /api requests. Defaults to http://localhost:8000. */
  readonly VITE_BACKEND_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
