#!/bin/bash
# helper functions, sourced by install.sh — pure helpers, no tainted source captured.
log() {
  printf '[install] %s\n' "$1"
}
require() {
  command -v "$1" >/dev/null 2>&1 || { printf 'missing: %s\n' "$1"; exit 1; }
}
