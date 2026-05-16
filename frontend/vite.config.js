 import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',     // ← এটা চেঞ্জ করলাম
      
      manifest: {
        name: "uthiYO",
        short_name: "uthiYO",
        description: "বাংলাদেশের সেরা টুর্নামেন্ট অ্যাপ",
        start_url: "/",
        display: "standalone",
        background_color: "#0f172a",
        theme_color: "#ff8a00",
        lang: "bn",
        icons: [
          {
            src: "/image/icon/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable"
          },
          {
            src: "/image/icon/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },

      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true
      },

      devOptions: { enabled: true }
    }),
  ],
})