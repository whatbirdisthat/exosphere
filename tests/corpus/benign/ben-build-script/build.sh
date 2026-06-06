#!/bin/bash
set -euo pipefail
echo "Building project..."
npm ci
npm run build
echo "Build complete."
