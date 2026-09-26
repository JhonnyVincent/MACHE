#!/usr/bin/env node
/**
 * Bundles the admin and vendor panels into the Medusa build artifact so a host that deploys
 * only `.medusa/server` (for example Medusa Cloud) can serve them statically.
 *
 * Runs after `medusa build` as part of this package's `build` script:
 *  1. expects each panel's production build at apps/<name>/dist — Turborepo produces it first,
 *     because this package declares the panel workspaces as devDependencies (`^build`),
 *  2. verifies the build is servable under its sub-path (assets referenced via /dashboard/…
 *     or /seller/… — a base of "/" would 404 once the backend strips the route prefix),
 *  3. copies each dist into .medusa/server/dashboards/<name>/dist, where medusa-config.ts
 *     resolves it via dashboardAppDir(),
 *  4. removes the workspace-protocol dependencies from the artifact's package.json copy —
 *     `workspace:*` is not installable outside the monorepo and the artifact only needs
 *     the copied dist.
 *
 * In production builds (NODE_ENV=production — Medusa Cloud builds this way) the script fails
 * fast on a missing panel build, a wrong base path, or a panel that would call a FIXED backend
 * address instead of the page's own origin, rather than shipping a panel that points at
 * http://localhost:9000 or 404s on its own assets. Outside production it warns and skips the
 * affected panel, so local builds keep working.
 *
 * MERCUR_BACKEND_URL is no longer required: the panels are always served by this backend, so
 * apps/same-origin-backend.ts makes them call window.location.origin — correct by construction,
 * on the Render address and on any future custom domain, with nothing to type in.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const apiDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const repoRoot = path.resolve(apiDir, '../..')
const artifactDir = path.join(apiDir, '.medusa/server')
const isProduction = process.env.NODE_ENV === 'production'

// Keep in sync with the admin-ui / vendor-ui module options in medusa-config.ts.
const PANELS = [
  { name: 'admin', basePath: '/dashboard/' },
  { name: 'vendor', basePath: '/seller/' },
]

const fail = (message) => {
  console.error(`[bundle-dashboards] ${message}`)
  process.exit(1)
}

if (!fs.existsSync(artifactDir)) {
  fail(`${artifactDir} not found — run \`medusa build\` first (the build script chains it).`)
}

let bundled = 0

for (const panel of PANELS) {
  const dist = path.join(repoRoot, 'apps', panel.name, 'dist')
  const indexHtml = path.join(dist, 'index.html')

  if (!fs.existsSync(indexHtml)) {
    const message =
      `apps/${panel.name}/dist/index.html not found — build the panels first ` +
      '(run the build from the repository root so Turborepo builds them, e.g. `npm run build`).'
    if (isProduction) {
      fail(message)
    }
    console.warn(`[bundle-dashboards] ${message} Skipping the ${panel.name} panel.`)
    continue
  }

  const html = fs.readFileSync(indexHtml, 'utf8')
  if (!html.includes(`${panel.basePath}assets/`)) {
    const message =
      `the ${panel.name} panel was built with the wrong base path — index.html does not ` +
      `reference ${panel.basePath}assets/, so its assets would 404 when served under ` +
      `${panel.basePath.slice(0, -1)}. This usually means the dashboard-sdk Vite plugin ` +
      'could not load medusa-config.ts at build time (check the build output for its warning).'
    if (isProduction) {
      fail(message)
    }
    console.warn(`[bundle-dashboards] ${message} Skipping the ${panel.name} panel.`)
    continue
  }

  /*
    The panel must call the server that serves it. A build that skipped
    apps/same-origin-backend.ts would bake a fixed address — historically
    http://localhost:9000 — and every vendor sign-in would end in
    « Failed to fetch » with a correct password. Check the built output
    itself rather than trusting the configuration.
  */
  const assetsDir = path.join(dist, 'assets')
  const callsOwnOrigin = fs.existsSync(assetsDir) && fs
    .readdirSync(assetsDir)
    .filter((file) => file.endsWith('.js'))
    .some((file) =>
      fs.readFileSync(path.join(assetsDir, file), 'utf8').includes('backendUrl:window.location.origin')
    )

  if (!callsOwnOrigin) {
    const message =
      `the ${panel.name} panel does not resolve its API from the page origin — it would call a ` +
      'fixed address and every sign-in would fail with « Failed to fetch ». Check that ' +
      `apps/${panel.name}/vite.config.ts still registers sameOriginBackend() after the Mercur plugin.`
    if (isProduction) {
      fail(message)
    }
    console.warn(`[bundle-dashboards] ${message}`)
  }

  const target = path.join(artifactDir, 'dashboards', panel.name, 'dist')
  fs.rmSync(target, { recursive: true, force: true })
  fs.cpSync(dist, target, { recursive: true })
  bundled++
  console.log(`[bundle-dashboards] ${panel.name}: apps/${panel.name}/dist -> ${path.relative(apiDir, target)}`)
}

// `medusa build` copies this package.json verbatim into the artifact. Strip workspace-protocol
// dependencies — they exist only so the panel sources travel with this package (Turborepo
// pruning follows the workspace dependency graph), and they cannot be installed from a registry.
const artifactPkgPath = path.join(artifactDir, 'package.json')
const artifactPkg = JSON.parse(fs.readFileSync(artifactPkgPath, 'utf8'))
for (const field of ['dependencies', 'devDependencies']) {
  for (const [dep, version] of Object.entries(artifactPkg[field] ?? {})) {
    if (typeof version === 'string' && version.startsWith('workspace:')) {
      delete artifactPkg[field][dep]
    }
  }
}
fs.writeFileSync(artifactPkgPath, JSON.stringify(artifactPkg, null, 2) + '\n')

console.log(
  bundled > 0
    ? `[bundle-dashboards] done — the artifact serves ${bundled} panel(s) at their configured paths.`
    : '[bundle-dashboards] done — no panels were bundled (see the warnings above).'
)
