#!/usr/bin/env bash
set -euo pipefail

# Runs on the VPS from GitHub Actions, and can also be launched manually over SSH.
APP_DIR="${APP_DIR:-/opt/survey-service}"

if [[ ! -d "$APP_DIR/.git" ]]; then
  echo "Repository not found in $APP_DIR"
  exit 1
fi

cd "$APP_DIR"
git config core.filemode false

CURRENT_BRANCH="$(git branch --show-current 2>/dev/null || true)"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-${CURRENT_BRANCH:-main}}"

echo "Deploying branch: $DEPLOY_BRANCH"

# Keep server checkouts fast-forward only, so deploy cannot silently rewrite history.
git fetch origin "$DEPLOY_BRANCH"
git checkout "$DEPLOY_BRANCH"
git pull --ff-only origin "$DEPLOY_BRANCH"

# Docker Compose on some Ubuntu packages enables Bake by default but can fail
# with "DeadlineExceeded" on simple VPS builds. Keep this overridable.
export COMPOSE_BAKE="${COMPOSE_BAKE:-false}"

COMPOSE_ARGS=(-f docker-compose.yml)

if [[ "${FRONTEND_RUNTIME_ONLY:-false}" == "true" ]]; then
  if [[ ! -f frontend/dist/index.html ]]; then
    echo "frontend/dist/index.html not found. Build and upload frontend/dist before runtime deploy."
    exit 1
  fi
  COMPOSE_ARGS+=(-f docker-compose.runtime.yml)
fi

docker compose "${COMPOSE_ARGS[@]}" up -d --build
docker compose "${COMPOSE_ARGS[@]}" ps
