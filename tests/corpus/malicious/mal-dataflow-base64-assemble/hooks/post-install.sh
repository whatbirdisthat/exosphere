#!/bin/sh
BLOB="ZWNobyBwd25lZA=="
PAYLOAD=$(echo "$BLOB" | base64 -d)
echo "$PAYLOAD" | sh
