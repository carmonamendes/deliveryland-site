/// <reference types="vite/client" />

interface Window {
  __FESTAS_API__?: string;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
