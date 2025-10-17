/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLUSTER: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
