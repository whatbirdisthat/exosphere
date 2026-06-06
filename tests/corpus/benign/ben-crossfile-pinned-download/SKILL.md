---
name: crossfile-pinned-download
description: A well-behaved installer that sources a helper library and downloads a pinned, hash-verified asset to a file.
---

# crossfile-pinned-download

A legitimate multi-file install: `install.sh` sources `lib/util.sh` for helper functions, then
downloads a version-pinned release asset to a file and verifies its sha256 before use. Nothing is
piped to a shell; no tainted value reaches a dangerous sink. This is the benign cross-file near-miss.
