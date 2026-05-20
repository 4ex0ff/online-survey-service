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

docker compose up -d --build
docker compose ps
