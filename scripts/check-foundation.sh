#!/usr/bin/env bash
# scripts/check-foundation.sh — one-shot local verification for the Acta foundation.
# Verifies structure, env hygiene, and forbidden-language guards. Does NOT install deps
# or spawn servers — those are separate manual steps.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail=0
pass() { printf "  \033[32m✓\033[0m %s\n" "$1"; }
warn() { printf "  \033[33m!\033[0m %s\n" "$1"; }
err()  { printf "  \033[31m✗\033[0m %s\n" "$1"; fail=1; }

echo "==> Foundation structure"
required_paths=(
  "package.json"
  "pnpm-workspace.yaml"
  "tsconfig.base.json"
  ".env.example"
  ".gitignore"
  "biome.json"
  "docker-compose.yml"
  "vitest.config.ts"
  "src/frontend/package.json"
  "src/frontend/app/page.tsx"
  "src/frontend/app/healthz/route.ts"
  "src/backend/package.json"
  "src/backend/src/server.ts"
  "src/backend/src/routes/healthz.ts"
  "src/backend/src/lib/synthetic-data-guard.ts"
  "src/ai/README.md"
  "tests/foundation.test.ts"
  ".github/workflows/ci.yml"
)
for p in "${required_paths[@]}"; do
  if [ -e "$p" ]; then pass "$p"; else err "missing: $p"; fi
done

echo "==> Env hygiene"
if [ -f ".env" ]; then
  err ".env is present in repo — must not be committed"
else
  pass "no .env in repo"
fi
if grep -q "^\.env$" .gitignore 2>/dev/null; then
  pass ".env is gitignored"
else
  err ".env is not in .gitignore"
fi

echo "==> Synthetic-data default"
if grep -q "^ALLOW_REAL_STUDENT_DATA=false" .env.example; then
  pass "ALLOW_REAL_STUDENT_DATA defaults to false in .env.example"
else
  err "ALLOW_REAL_STUDENT_DATA must default to false in .env.example"
fi

echo "==> D-002 language guard (no 'legally admissible')"
# Search source files only — docs explicitly discuss the prohibition.
forbidden="legally"" admissible"
if grep -Rni --exclude="check-foundation.sh" "$forbidden" src/ tests/ scripts/ 2>/dev/null; then
  err "forbidden phrase found in source — D-002 forbids this language"
else
  pass "no forbidden D-002 phrase in source"
fi

echo "==> docker-compose local-only label"
if grep -q "LOCAL DEVELOPMENT ONLY" docker-compose.yml; then
  pass "docker-compose.yml is labeled LOCAL DEVELOPMENT ONLY"
else
  err "docker-compose.yml must be labeled LOCAL DEVELOPMENT ONLY"
fi

echo "==> No real student PII placeholders in src/ai/"
ai_files=$(find src/ai -type f ! -name ".gitkeep" ! -name "package.json" ! -name "README.md" 2>/dev/null || true)
if [ -z "$ai_files" ]; then
  pass "src/ai/ has no real-content files (placeholders only)"
else
  warn "src/ai/ contains files beyond placeholders: $ai_files"
fi

echo ""
if [ $fail -eq 0 ]; then
  echo "Foundation checks: PASS"
  exit 0
else
  echo "Foundation checks: FAIL"
  exit 1
fi
