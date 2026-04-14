import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/OreCopilot/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'AI Second Brain',
        short_name: 'SecondBrain',
        description: 'Serverless AI-powered personal knowledge & project management',
        theme_color: '#1e293b',
        background_color: '#0f172a',
        display: 'standalone',
        scope: '/OreCopilot/',
        start_url: '/OreCopilot/',
        icons: [
          { src: '/OreCopilot/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/OreCopilot/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
})
