#!/usr/bin/env bash
# Render every mermaid source (doc/guide/diagrams/*.mmd) to a sibling SVG.
#
# Diagrams are committed as BOTH source (.mmd, readable/editable) and rendered (.svg, embedded in
# the guides). Edit a .mmd, re-run this script, commit both. No runtime dependency is added to
# skillsentry — `mmdc` (mermaid-cli) is MAINTAINER tooling only; readers need nothing installed
# (GitHub renders the committed SVGs).
#
# Requirements: `mmdc` (npm i -g @mermaid-js/mermaid-cli) + a Chromium/Chrome browser.
# The browser is auto-detected; override with CHROME=/path/to/chrome.
set -euo pipefail

here="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
diagrams_dir="$here/doc/guide/diagrams"
config="$diagrams_dir/mermaid-config.json"
css="$diagrams_dir/diagram.css"

if ! command -v mmdc >/dev/null 2>&1; then
  echo "error: mmdc not found. Install with: npm i -g @mermaid-js/mermaid-cli" >&2
  exit 1
fi

# Auto-detect a browser for mermaid-cli's headless render.
chrome="${CHROME:-}"
if [ -z "$chrome" ]; then
  for c in /usr/bin/chromium /usr/bin/chromium-browser /usr/bin/google-chrome \
           /usr/bin/google-chrome-stable "$(command -v chromium 2>/dev/null || true)"; do
    if [ -n "$c" ] && [ -x "$c" ]; then chrome="$c"; break; fi
  done
fi

pptr_cfg=""
if [ -n "$chrome" ]; then
  pptr_cfg="$(mktemp)"
  printf '{ "executablePath": "%s", "args": ["--no-sandbox", "--disable-setuid-sandbox"] }\n' "$chrome" > "$pptr_cfg"
  echo "using browser: $chrome"
else
  echo "note: no system browser found; relying on mermaid-cli's bundled puppeteer browser." >&2
fi

shopt -s nullglob
count=0
for src in "$diagrams_dir"/*.mmd; do
  out="${src%.mmd}.svg"
  echo "rendering $(basename "$src") -> $(basename "$out")"
  # Transparent background + injected CSS so diagrams honour both light and dark page themes
  # (nodes are light cards with outlines + drop-shadows that read on any background).
  if [ -n "$pptr_cfg" ]; then
    mmdc -p "$pptr_cfg" -c "$config" -C "$css" -b transparent -i "$src" -o "$out" >/dev/null
  else
    mmdc -c "$config" -C "$css" -b transparent -i "$src" -o "$out" >/dev/null
  fi
  count=$((count + 1))
done

[ -n "$pptr_cfg" ] && rm -f "$pptr_cfg"
echo "rendered $count diagram(s)."
