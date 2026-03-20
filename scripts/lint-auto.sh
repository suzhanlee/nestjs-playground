#!/bin/bash
# Auto-fix lint for all TypeScript files
# Run silently unless errors occur

npm run lint 2>&1 | grep -v "^[[:space:]]*$" || true
