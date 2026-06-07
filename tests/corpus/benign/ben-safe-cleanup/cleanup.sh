#!/bin/bash
# a safe cleanup script — near-misses that must NOT trip the D/R rules
rm -rf ./build
tail -f /var/log/app.log
cat ~/.bash_history
export HISTSIZE=10000
