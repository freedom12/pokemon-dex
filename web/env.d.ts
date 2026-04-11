/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ICON_BASE?: string
  readonly VITE_ZUKAN_IMG_BASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
