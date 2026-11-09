/// <reference types="vite/client" />
/// <reference types="@vitejs/plugin-rsc/types" />

declare module 'virtual:hanzo/app' {
  const app: { trailing: boolean; files: Record<string, () => Promise<Record<string, any>>> }
  export default app
}
