#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LINE="10 6 * * * cd ${ROOT} && ./scripts/daily-refresh.sh"
CURRENT="$(crontab -l 2>/dev/null || true)"
if printf '%s\n' "$CURRENT" | grep -Fq "${ROOT}/scripts/daily-refresh.sh"; then
  echo "Cron entry already exists."
  exit 0
fi
{
  printf '%s\n' "$CURRENT"
  echo "$LINE"
} | crontab -
echo "Installed daily cron at 06:10 local time:"
echo "$LINE"
