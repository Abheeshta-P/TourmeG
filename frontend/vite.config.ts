import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['tourmeg_logo.png', 'tourmeg.png'],
      manifest: {
        name: 'TourmeG - Route Planner',
        short_name: 'TourmeG',
        description: 'Optimal GPS routing for tourists in Mangaluru',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/tourmeg_logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/tourmeg_logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
})
