/// <reference types="vite/client" />
// app-lib is always bundled by a Vite-based template, so `import.meta.env`
// (read in env.ts) carries Vite's typing. This makes the package typecheck
// standalone; each template also declares its own reference for its `src`.
