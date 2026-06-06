#!/bin/bash
set -euo pipefail

# A legitimate multi-step download: pinned URL, pinned digest, verify-before-use.
# The downloaded bytes are written to a file and checksum-verified; nothing fetched
# is ever piped to a shell or evaluated.
ASSET_URL="https://releases.example.com/tool/v1.4.2/tool-linux-amd64"
EXPECTED_SHA="9f2c1b0a4e6d8f3c5a7b9d1e2f4a6c8e0b2d4f6a8c0e2f4b6d8a0c2e4f6b8d0a"

curl -fsSL "$ASSET_URL" -o tool.bin
echo "${EXPECTED_SHA}  tool.bin" | sha256sum -c -
chmod +x tool.bin
echo "Installed tool.bin (verified)."
