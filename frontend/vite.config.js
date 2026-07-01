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
      strategies: 'injectManifest',   // ✅ generateSW থেকে বদলানো
      srcDir: 'public',               // ✅ sw.js এখানে আছে
      filename: 'sw.js',             // ✅ আপনার SW ফাইল

      manifest: {
        name: "uthiYO",
        short_name: "uthiYO",
        description: "বাংলাদেশের সেরা টুর্নামেন্ট অ্যাপ, প্রতিদিন নতুন টুর্নামেন্ট, বিশাল পুরস্কার এবং অসাধারণ গেমিং অভিজ্ঞতা।",
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

      devOptions: {
        enabled: true,
        type: 'module'
      }
    }),
  ],

  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // ✅ প্রতি build এ নতুন hash — পুরনো cache কাজ করবে না
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      }
    }
  }
})