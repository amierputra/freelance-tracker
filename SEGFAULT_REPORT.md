# better-sqlite3 segfault — root cause report

## Symptom

`npm run dev` and even a bare `node -e "require('better-sqlite3')"` crashed
immediately with SIGSEGV, no JS-level error or stack trace. Reproducible
100% of the time when actually opening a database (`new Database(path)`),
and present regardless of how the native addon was built.

## Environment

- macOS 26.4.1 (25E253), Apple Silicon (arm64)
- Node v22.12.0, via Herd's bundled nvm
  (`~/Library/Application Support/Herd/config/nvm`)
- better-sqlite3 v13.0.3
- Nuxt 4 + Drizzle ORM (`drizzle-orm/better-sqlite3`)

## What was ruled out

1. **Corrupt/stale build** — `rm -rf node_modules package-lock.json` +
   fresh `npm install`: still crashed.
2. **Bad prebuilt binary** — forced a real local compile via
   `node-gyp rebuild -- -Dforce_build=1` (confirmed real CXX/SOLINK steps,
   produced a fresh 1.96MB `.node`). Still crashed — and crashed
   identically to the prebuilt binary shipped by npm.
3. **Codesign / Gatekeeper** — binary was arm64, adhoc-signed
   (`flags=0x20002(adhoc,linker-signed)`), no quarantine xattr set
   (`com.apple.provenance` present but empty). Not a Gatekeeper block.
4. **Node build itself broken for native addons** — other native addons in
   the same project (`lightningcss`, `@rollup/rollup-darwin-arm64`,
   `@tailwindcss/oxide`, `@unrs/resolver-binding-darwin-arm64`) all loaded
   fine on the exact same Node binary. Ruled out a broken/nonstandard Herd
   Node build.
5. **iCloud/cloud-sync interference** — project lives on local APFS
   (`/System/Volumes/Data`), not iCloud Drive/Dropbox. Ruled out.

## Root cause

Confirmed via `lldb`, deterministic repro:

```
node`napi_module_register_by_symbol(...) + 584
->  ldp    w24, w22, [x23, #0x90]
```

`EXC_BAD_ACCESS` at offset `0x90` into the module registration struct —
a null/garbage pointer dereference while Node registers the addon's N-API
module.

**better-sqlite3 v13.0.3 is built against `NAPI_VERSION=10`. Node's
Node-API support was capped at version 9 through v22.13, and only bumped
to version 10 in v22.14** (confirmed against
[WiseLibs/better-sqlite3#1514](https://github.com/WiseLibs/better-sqlite3/issues/1514)).
Node does not reject the mismatch cleanly with a JS error — it segfaults
inside its own registration code. This matches every crash observed,
independent of whether the `.node` file was the npm-shipped prebuild or a
fresh local compile, because the problem isn't the binary — it's the
Node runtime loading it.

Confirmed on the machine:

```
process.config.variables.napi_build_version → "9"   (Node 22.12.0)
```

## Fix

Upgrade Node to the latest 22.x LTS (same major, no app-level changes
needed):

```bash
export NVM_DIR="$HOME/Library/Application Support/Herd/config/nvm"
source "$NVM_DIR/nvm.sh"
nvm install 22.23.3
nvm alias default 22.23.3
rm -rf node_modules/better-sqlite3/build
```

After the upgrade: `process.versions.napi` → `10`, `new Database(...)`
opens cleanly, `npm run dev` boots, `/login` returns 200.

## Follow-up

- Default Node version on this machine is now 22.23.3 (was 22.12.0).
  Any other terminal/IDE session pinned to the old version needs a
  restart to pick this up.
- No driver swap needed — `@libsql/client` was considered but the actual
  problem was Node-API version, not better-sqlite3/Drizzle compatibility.
