#!/bin/bash
set -e
# A captured value that is a tainted SOURCE ($(...)), but it only ever reaches
# a benign sink (echo) — it never flows into a shell, eval, or autorun location.
VER=$(cat VERSION)
echo "Project version: $VER"
echo "$VER" > build/version.txt
