#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
OUTPUT_FILE="$ROOT_DIR/harness/context/generated-context.md"
TIMESTAMP="$(date '+%Y-%m-%d %H:%M:%S')"

PACKAGE_NAME="unknown"
PACKAGE_DESC=""
TEST_SCRIPTS=""

if [ -f "$ROOT_DIR/package.json" ]; then
  PACKAGE_NAME="$(node -p "const p=require('./package.json'); p.name || 'unknown'" 2>/dev/null || echo 'unknown')"
  PACKAGE_DESC="$(node -p "const p=require('./package.json'); p.description || ''" 2>/dev/null || echo '')"
  TEST_SCRIPTS="$(node - <<'NODE' 2>/dev/null
const p = require('./package.json');
const scripts = p.scripts || {};
Object.keys(scripts)
  .filter((name) => name.startsWith('test'))
  .sort()
  .forEach((name) => console.log(`- ${name}: ${scripts[name]}`));
NODE
)"
fi

cat > "$OUTPUT_FILE" <<EOF
# Generated Context

- generated_at: $TIMESTAMP
- project_root: $ROOT_DIR
- package_name: $PACKAGE_NAME
- package_description: $PACKAGE_DESC

## Top Level Directories
$(find "$ROOT_DIR" -maxdepth 1 -mindepth 1 -type d   ! -name node_modules   ! -name .git   | sed "s#^$ROOT_DIR/#- #" | sort)

## Harness Touchpoints
- bin/harness.js
- src/harness/index.js
- src/http-server/harness-api.js
- public/web-ide-lite-v2/js/actions/harness-actions.js
- test/harness.vitest.test.js

## Test Scripts
${TEST_SCRIPTS:-- no test scripts found}
EOF

echo "Generated $OUTPUT_FILE"
