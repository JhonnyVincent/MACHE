import { loadEnv } from '@medusajs/framework/utils'
import { withMercur } from '@mercurjs/core'
import fs from 'fs'
import path from 'path'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Resolves where a dashboard app lives:
// - in the source tree (development): ../../apps/<name>
// - in the production build artifact: hosts that deploy only `.medusa/server` (for example
//   Medusa Cloud) get the panels bundled into ./dashboards/<name> by
//   scripts/bundle-dashboards.mjs during `build`. The compiled config runs from the
//   artifact root, so __dirname points there.
const dashboardAppDir = (name: string) => {
  const bundled = path.join(__dirname, 'dashboards', name)
  return fs.existsSync(bundled) ? bundled : path.join(__dirname, `../../apps/${name}`)
}

/*
  Origines autorisées.

  Elles se déduisent de deux adresses, au lieu d'être saisies quatre fois
  à la main lors du déploiement — quatre occasions de se tromper, pour une
  erreur qui ne se voit qu'au premier appel refusé par le navigateur.

  - L'adresse du backend lui-même : Render l'injecte dans
    RENDER_EXTERNAL_URL, il n'y a rien à renseigner. Les autres
    hébergeurs ont leur propre variable ; FILE_BACKEND_URL sert alors de
    réponse explicite.
  - L'adresse du site : STOREFRONT_URL, la seule à saisir.

  Les variables STORE_CORS, ADMIN_CORS, VENDOR_CORS et AUTH_CORS restent
  lues en priorité. Un déploiement existant ne change pas de
  comportement, et une origine supplémentaire — un domaine propre, une
  préproduction — se déclare toujours de la même façon.
*/
const trimSlash = (value: string) => value.replace(/\/+$/, '')

const selfUrl = trimSlash(
  process.env.RENDER_EXTERNAL_URL ||
    process.env.FILE_BACKEND_URL ||
    'http://localhost:9000'
)

const storefrontUrl = trimSlash(
  process.env.STOREFRONT_URL || 'http://localhost:3000'
)

/*
  Le panneau d'administration et le panneau vendeur sont servis par ce
  serveur : leur origine est la sienne. Le site, lui, est ailleurs.

  `authCors` couvre les deux : on s'authentifie depuis le site (clients)
  comme depuis les panneaux (personnel et vendeurs).
*/
const storeCors = process.env.STORE_CORS || storefrontUrl
const adminCors = process.env.ADMIN_CORS || selfUrl
const vendorCors = process.env.VENDOR_CORS || selfUrl
const authCors = process.env.AUTH_CORS || `${storefrontUrl},${selfUrl}`

module.exports = withMercur({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors,
      adminCors,
      vendorCors,
      authCors,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  featureFlags: {
    seller_registration: true
  },
  modules: [
    {
      resolve: '@mercurjs/core/modules/admin-ui',
      options: {
        appDir: dashboardAppDir('admin'),
        path: '/dashboard',
      }
    },
    {
      resolve: '@mercurjs/core/modules/vendor-ui',
      options: {
        appDir: dashboardAppDir('vendor'),
        path: '/seller',
      }
    },
    {
      resolve: '@medusajs/medusa/file',
      options: {
        providers: [
          {
            resolve: '@medusajs/medusa/file-local',
            id: 'local',
            options: {
              // The local provider bakes this into every uploaded file URL.
              // It must be the publicly reachable origin in production, or
              // images resolve to localhost and render broken.
              backend_url: process.env.FILE_BACKEND_URL || `${selfUrl}/static`,
            },
          },
        ],
      },
    },
  ],
})
