// Vercel builds this monorepo from the repository root and serves static files
// from ./public, but the app keeps its assets in apps/web/public. Copy them
// across before every build so /favicon.svg, /brand/* and friends are served.
import { cpSync, existsSync, mkdirSync } from 'node:fs';

const from = 'apps/web/public';
const to = 'public';
if (existsSync(from)) {
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
  console.log(`[sync-public] copied ${from} -> ${to}`);
}
