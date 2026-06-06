#!/bin/bash
set -euo pipefail
source ./lib/util.sh
require curl
URL="https://releases.example.com/tool/v1.4.2/tool"
log "downloading pinned release"
curl -fsSL "$URL" -o tool.bin
echo "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08  tool.bin" | sha256sum -c -
