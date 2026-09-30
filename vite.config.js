// vite.config.js
import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || '';
  const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY || '';

  return {
  root: '.',
  define: {
    __COMMUN_SUPABASE_URL__: JSON.stringify(supabaseUrl),
    __COMMUN_SUPABASE_KEY__: JSON.stringify(supabaseKey),
  },
  base: './',
  server: {
    port: 5173,
    open: true,
    host: true,
    allowedHosts: true,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        feed: resolve(__dirname, 'feed.html'),
        discover: resolve(__dirname, 'discover.html'),
        people: resolve(__dirname, 'people.html'),
        profile: resolve(__dirname, 'profile.html'),
        projects: resolve(__dirname, 'projects.html'),
        opportunities: resolve(__dirname, 'opportunities.html'),
        discussions: resolve(__dirname, 'discussions.html'),
        discussion: resolve(__dirname, 'discussion.html'),
        communities: resolve(__dirname, 'communities.html'),
        community: resolve(__dirname, 'community.html'),
        events: resolve(__dirname, 'events.html'),
        resources: resolve(__dirname, 'resources.html'),
        workspace: resolve(__dirname, 'workspace.html'),
        messages: resolve(__dirname, 'messages.html'),
        notifications: resolve(__dirname, 'notifications.html'),
        onboarding: resolve(__dirname, 'onboarding.html'),
        login: resolve(__dirname, 'login.html'),
        register: resolve(__dirname, 'register.html'),
        forgot_password: resolve(__dirname, 'forgot-password.html'),
        pricing: resolve(__dirname, 'pricing.html'),
        about: resolve(__dirname, 'about.html'),
        settings: resolve(__dirname, 'settings.html'),
        saved: resolve(__dirname, 'saved.html'),
        write: resolve(__dirname, 'write.html'),
      },
    },
  },
  };
});
