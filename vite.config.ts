import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import viteCompression from 'vite-plugin-compression'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    visualizer({
      open: false,
      // gzipSize: true,
      brotliSize: true
    }),
    viteCompression({
      algorithm: 'brotliCompress', // gzip
      ext: '.br',
      threshold: 10240
    }),
    ViteImageOptimizer({
      png: {
        quality: 80
      },
      jpeg: {
        quality: 80
      },
      jpg: {
        quality: 80
      },
      webp: {
        lossless: false,
        quality: 80
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 3000,
    target: 'es2020',
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    cssMinify: 'lightningcss',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
      },
      output: {
        comments: false
      }
    },
    rollupOptions: {
      treeshake: 'recommended',
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom', 'zustand'],
          'vendor-three': ['three', '@react-three/fiber', '@react-three/drei', 'three-globe'],
          'vendor-ui': [
            'class-variance-authority',
            'tailwind-merge',
            'clsx',
            'sonner',
            'lucide-react'
          ],
          'vendor-animation': ['gsap', '@gsap/react', 'framer-motion', 'motion'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-data': ['axios', '@tanstack/react-query'],
          'vendor-speech': ['microsoft-cognitiveservices-speech-sdk'],
          'vendor-icons': ['@iconify/react'],
          'vendor-tools': ['leva', 'react-scan', 'jwt-decode', 'usehooks-ts'],
          'vendor-spline': ['@splinetool/react-spline', '@splinetool/runtime']
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'gsap',
      'framer-motion',
      'class-variance-authority',
      'axios',
      '@tanstack/react-query',
      '@iconify/react'
    ],
    esbuildOptions: {
      target: 'es2020'
    }
  }
})