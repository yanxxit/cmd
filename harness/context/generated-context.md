# Generated Context

- generated_at: 2026-05-29 09:56:56
- project_root: /Users/bytedance/github/cmd
- package_name: @yanit/cmd
- package_description: cmd tools 

## Top Level Directories
- .agents
- .claude
- .http-sniffer
- .jsondb
- .lingma
- .pgdata
- .trae
- bin
- bun-app
- docs
- harness
- logs
- next-app
- public
- scripts
- src
- tasks
- temp
- templates
- test

## Harness Touchpoints
- bin/harness.js
- src/harness/index.js
- src/http-server/harness-api.js
- public/web-ide-lite-v2/js/actions/harness-actions.js
- test/harness.vitest.test.js

## Test Scripts
- test: vitest run
- test:cli: vitest run test/cli-tools.vitest.test.js
- test:coverage: vitest run --coverage
- test:dict: vitest run test/dict.vitest.test.js
- test:fast: vitest run --exclude='test/performance/**'
- test:git: vitest run test/git/
- test:jsondb: vitest run test/jsondb.vitest.test.js
- test:performance: vitest run test/performance/
- test:performance:cli: vitest run test/performance/cli-tools.vitest.test.js
- test:port: vitest run test/port.vitest.test.js test/port-tools.vitest.test.js
- test:system-top: vitest run test/system-top.vitest.test.js
- test:todo: vitest run test/todo.vitest.test.js
- test:ui: vitest --ui
- test:watch: vitest
