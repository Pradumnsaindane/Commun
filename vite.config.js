import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      __COMMUN_SUPABASE_URL__: JSON.stringify(env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || ''),
      __COMMUN_SUPABASE_KEY__: JSON.stringify(env.VITE_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || ''),
      __COMMUN_REDIRECT_URL__: JSON.stringify(env.VITE_DEV_SUPABASE_REDIRECT_URL || env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || ''),
    },
    server: {
      port: 3000,
      host: true,
      allowedHosts: true,
    },
  }
})
