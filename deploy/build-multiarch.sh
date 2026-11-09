#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${REGISTRY:?Example: registry.example.com/team}"
: "${RELEASE_TAG:?Set an immutable release tag}"
platforms="${PLATFORMS:-linux/amd64,linux/arm64}"
docker buildx build --platform "$platforms" --tag "$REGISTRY/hispread-backend:$RELEASE_TAG" --push backend
docker buildx build --platform "$platforms" --tag "$REGISTRY/hispread-frontend:$RELEASE_TAG" --push frontend
