#!/usr/bin/env bash
# threat-stack front-door greeting (SessionStart). Fires ONCE per machine, then stays quiet — a front
# door should welcome you in, not re-announce itself every session. Never fails a session.
set -euo pipefail

marker="${XDG_CACHE_HOME:-$HOME/.cache}/threat-stack-greeted"
[ -f "$marker" ] && exit 0
mkdir -p "$(dirname "$marker")" 2>/dev/null || true
: > "$marker" 2>/dev/null || true

echo "🛡️  threat-stack ready — /skillsentry:audit . to audit, or /threat-stack:help to browse."
