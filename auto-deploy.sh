#!/usr/bin/env bash
# Auto-deploy: verifica se há versao nova no branch atelie-transfer e,
# se houver, atualiza /opt/atelie-abelhinha e roda o redeploy. Idempotente.
# Instale via cron (a cada 5 min) — veja deploy/INSTALL-AUTODEPLOY.md
set -euo pipefail
ROOT="${ATELIE_ROOT:-/opt/atelie-abelhinha}"
REPO="https://github.com/carmonamendes/deliveryland-site"
LOG="${ATELIE_LOG:-/var/log/atelie-autodeploy.log}"
say() { echo "$(date -Is) $*" | tee -a "$LOG"; }

TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
if ! git clone --depth 1 -b atelie-transfer "$REPO" "$TMP/dl" >/dev/null 2>&1; then
  say "ERRO: nao consegui clonar o branch atelie-transfer"; exit 1
fi
cp "$TMP/dl/atelie-abelhinha.bundle" "$TMP/atelie.bundle"
NEW="$(git bundle list-heads "$TMP/atelie.bundle" | awk '/refs\/heads\/main/{print $1; exit}')"
CUR="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null || echo none)"
if [ "$NEW" = "$CUR" ]; then
  say "ok: ja esta na versao ${CUR:0:8}"; exit 0
fi
say "nova versao: ${CUR:0:8} -> ${NEW:0:8} — aplicando..."
git -C "$ROOT" fetch "$TMP/atelie.bundle" main >/dev/null 2>&1
git -C "$ROOT" reset --hard FETCH_HEAD >/dev/null 2>&1
if bash "$ROOT/deploy/redeploy.sh" >>"$LOG" 2>&1; then
  say "deploy concluido em ${NEW:0:8}"
else
  say "ERRO no redeploy — veja $LOG"; exit 1
fi
