import { defineConfig, loadEnv } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import viteReact from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    server: {
      port: 3001,
    },
    resolve: {
      alias: {
        'node:http':
          '/Users/captjay98/projects/jayfarms/app/lib/shims/node-http.ts',
      },
    },
    define: {
      // Inject environment variables for Cloudflare Workers
      'process.env.DATABASE_URL': JSON.stringify(env.DATABASE_URL),
      'process.env.BETTER_AUTH_SECRET': JSON.stringify(env.BETTER_AUTH_SECRET),
      'process.env.BETTER_AUTH_URL': JSON.stringify(env.BETTER_AUTH_URL),
      'process.env.NODE_ENV': JSON.stringify(env.NODE_ENV || 'development'),
      // SMS Providers
      'process.env.SMS_PROVIDER': JSON.stringify(env.SMS_PROVIDER || ''),
      'process.env.TERMII_API_KEY': JSON.stringify(env.TERMII_API_KEY || ''),
      'process.env.TERMII_SENDER_ID': JSON.stringify(
        env.TERMII_SENDER_ID || '',
      ),
      'process.env.TWILIO_ACCOUNT_SID': JSON.stringify(
        env.TWILIO_ACCOUNT_SID || '',
      ),
      'process.env.TWILIO_AUTH_TOKEN': JSON.stringify(
        env.TWILIO_AUTH_TOKEN || '',
      ),
      'process.env.TWILIO_PHONE_NUMBER': JSON.stringify(
        env.TWILIO_PHONE_NUMBER || '',
      ),
      // Email Providers
      'process.env.EMAIL_PROVIDER': JSON.stringify(env.EMAIL_PROVIDER || ''),
      'process.env.EMAIL_FROM': JSON.stringify(env.EMAIL_FROM || ''),
      'process.env.RESEND_API_KEY': JSON.stringify(env.RESEND_API_KEY || ''),
      'process.env.SMTP_HOST': JSON.stringify(env.SMTP_HOST || ''),
      'process.env.SMTP_PORT': JSON.stringify(env.SMTP_PORT || ''),
      'process.env.SMTP_USER': JSON.stringify(env.SMTP_USER || ''),
      'process.env.SMTP_PASS': JSON.stringify(env.SMTP_PASS || ''),
    },
    plugins: [
      cloudflare({
        viteEnvironment: { name: 'ssr' },
      }),
      tailwindcss(),
      tsconfigPaths({
        projects: ['./tsconfig.json'],
      }),
      tanstackStart({
        srcDirectory: 'app',
        server: {
          entry: './server.ts',
        },
        router: {
          routesDirectory: 'routes',
        },
      }),
      viteReact(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: env.VITE_APP_NAME || 'OpenLivestock',
          short_name: env.VITE_APP_NAME || 'OpenLivestock',
          description: 'Open source livestock management system',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        },
      }),
    ],
  }
})
