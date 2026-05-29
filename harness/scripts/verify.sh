#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

required_files=(
  "$ROOT_DIR/AGENTS.md"
  "$ROOT_DIR/CLAUDE.md"
  "$ROOT_DIR/docs/design.md"
  "$ROOT_DIR/tasks/README.md"
  "$ROOT_DIR/tasks/00-harness-foundation.md"
  "$ROOT_DIR/harness/README.md"
  "$ROOT_DIR/harness/concepts.md"
  "$ROOT_DIR/harness/scripts/generate_context.sh"
)

echo "[verify] checking required files"
for file in "${required_files[@]}"; do
  if [ ! -f "$file" ]; then
    echo "[verify] missing required file: $file" >&2
    exit 1
  fi
  echo "[verify] ok: ${file#$ROOT_DIR/}"
done

echo "[verify] generating context"
bash "$ROOT_DIR/harness/scripts/generate_context.sh" >/dev/null

echo "[verify] markdown/task baseline passed"

if [ -d "$ROOT_DIR/node_modules" ] && [ -f "$ROOT_DIR/package.json" ]; then
  echo "[verify] running targeted harness vitest"
  npm run test:fast -- --run test/harness.vitest.test.js
else
  echo "[verify] skip npm tests: node_modules not found"
fi
