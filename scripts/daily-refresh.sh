#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:${PATH:-}"
if [ -s "${NVM_DIR:-$HOME/.config/nvm}/nvm.sh" ]; then
  export NVM_DIR="${NVM_DIR:-$HOME/.config/nvm}"
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
elif [ -s "$HOME/.nvm/nvm.sh" ]; then
  export NVM_DIR="$HOME/.nvm"
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
fi

mkdir -p logs
{
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] daily refresh start"
  if ! command -v node >/dev/null 2>&1; then
    echo "node not found in cron environment; aborting"
    exit 127
  fi
  node scripts/refresh-data.mjs
  npm run build
  node scripts/build-artifact.mjs
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] daily refresh done"
} >> logs/refresh.log 2>&1
