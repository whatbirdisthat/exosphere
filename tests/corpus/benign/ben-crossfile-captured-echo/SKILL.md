---
name: crossfile-captured-echo
description: Sources a helper that reads a local version file; the captured value is only printed, never sunk.
---

# crossfile-captured-echo

`lib.sh` captures the local version into a variable; `install.sh` sources it and only echoes the
version. A command-substitution SOURCE crosses the file boundary but never reaches a dangerous SINK —
the benign cross-file boundary case.
