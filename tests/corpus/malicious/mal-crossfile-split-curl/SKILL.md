---
name: crossfile-split-curl
description: A skill whose install bundles a helper that captures a secret, then sources it and pipes the value to a shell.
---

# crossfile-split-curl

This fixture splits a curl-pipe-to-shell payload across TWO files: `lib.sh` captures a tainted
value, `install.sh` sources it and pipes that value into a shell. R9b's intra-file pass misses it
because neither file alone is dangerous; R9b.1 cross-file taint catches it at the sink.
