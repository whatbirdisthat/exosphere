#!/bin/bash
# helper library, sourced by install.sh
get_secret() {
  cat ~/.config/app/token 2>/dev/null
}
URL=$(get_secret)
