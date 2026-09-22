import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createRequire } from 'node:module'

// createRequire (not a static import): the plugin's ESM build can't dynamic-require
// medusa-config.ts, so it silently falls back to base "/" and 404s panel assets.
const require = createRequire(import.meta.url)
const { mercurDashboardPlugin } = require('@mercurjs/dashboard-sdk/vite')

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Baked into the panel at build time. For a backend-served production build
  // (e.g. Medusa Cloud) set it to the deployed backend origin so API calls are
  // same-origin; it defaults to http://localhost:9000 for development.
  const backendUrl = env.VITE_MERCUR_BACKEND_URL || env.MERCUR_BACKEND_URL

  return {
    /*
      `dedupe` force Vite à résoudre ces paquets depuis la racine du
      projet, quel que soit l'endroit d'où ils sont importés.

      Sans cela, la construction du panneau échouait :
      « Rollup failed to resolve import "i18next" from @mercurjs/vendor ».
      Le paquet le déclare pourtant, et la bonne version est bien
      installée — mais l'installateur ne l'avait pas liée dans l'arbre
      isolé de @mercurjs/vendor, et Vite résout depuis le fichier qui
      importe, pas depuis l'application.

      Conséquence pour le vendeur : le panneau n'était pas construit, et
      le backend servait « Dashboard not built ». Sans panneau, un
      vendeur ne peut ni ajouter un produit, ni voir une commande.

      `dedupe` règle aussi, au passage, le cas classique des deux copies
      d'i18next qui ne partagent pas leur configuration.
    */
    resolve: {
      dedupe: ['i18next', 'react-i18next', 'react', 'react-dom'],
    },
    plugins: [
      react(),
      mercurDashboardPlugin({
        medusaConfigPath: '../../packages/api/medusa-config.ts',
        ...(backendUrl ? { backendUrl } : {}),
      }),
    ],
  }
})
