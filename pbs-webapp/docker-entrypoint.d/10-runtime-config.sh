#!/usr/bin/env sh
set -eu

CONFIG_PATH="/usr/share/nginx/html/assets/runtime-config.js"

SENTRY_DSN="${SENTRY_DSN:-}"
SENTRY_ENVIRONMENT="${SENTRY_ENVIRONMENT:-production}"
SENTRY_RELEASE="${SENTRY_RELEASE:-}"

{
  echo "window.__PBS_RUNTIME__ = window.__PBS_RUNTIME__ || {};"
  echo "window.__PBS_RUNTIME__.sentry = {"
  if [ -n "$SENTRY_DSN" ]; then
    echo "  dsn: \"${SENTRY_DSN}\","
  else
    echo "  dsn: undefined,"
  fi
  echo "  environment: \"${SENTRY_ENVIRONMENT}\","
  if [ -n "$SENTRY_RELEASE" ]; then
    echo "  release: \"${SENTRY_RELEASE}\""
  else
    echo "  release: undefined"
  fi
  echo "};"
} > "$CONFIG_PATH"
