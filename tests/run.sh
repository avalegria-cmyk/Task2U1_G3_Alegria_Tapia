#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
# Every test run owns its stack and volume. The real university data is never modified.
export COMPOSE_PROJECT_NAME="university-check-$(date +%s)-$$"
export DATABASE_VOLUME="${COMPOSE_PROJECT_NAME}_data"
export APP_PORT=0
cleanup() { docker compose down -v --remove-orphans; }
trap cleanup EXIT INT TERM
docker compose up -d --wait
docker run --rm --network "${COMPOSE_PROJECT_NAME}_default" -e DEMO_PASSWORD=UniversityDemo2026! -e BASE_URL=http://web -v "$PWD/tests:/tests:ro" node:24.21-alpine node --test /tests/api.test.mjs
