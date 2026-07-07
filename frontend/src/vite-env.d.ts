/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />


interface ImportMetaEnv {
 
  readonly VITE_API_BASE_URL?: string
  readonly VITE_API_BASE_URL_FALLBACK?: string
  readonly VITE_API_NO_RENDER_FALLBACK?: string
  readonly VITE_ALLOW_API_BASE_QUERY?: string
  readonly VITE_PRODUCT_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '@/shared/lib/utils' {
  import type { ClassValue } from 'clsx'

  export function cn(...inputs: ClassValue[]): string
}
