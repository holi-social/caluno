#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$SCRIPT_DIR"

usage() {
  cat <<EOF
Usage: $0 [--build] [--push] [--help]

  --build   Build Docker images for frontend and backend
  --push    Push Docker images for frontend and backend
  --help    Show this help message

If no flags are provided, the script will build and push both images.
EOF
}

DO_BUILD=false
DO_PUSH=false

parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --build)
        DO_BUILD=true
        ;;
      --push)
        DO_PUSH=true
        ;;
      --help|-h)
        usage
        exit 0
        ;;
      *)
        echo "Unknown argument: $1" >&2
        usage
        exit 1
        ;;
    esac
    shift
  done

  if [[ "$DO_BUILD" == "false" && "$DO_PUSH" == "false" ]]; then
    DO_BUILD=true
    DO_PUSH=true
  fi
}

load_env() {
  local env_file="$REPO_ROOT/.env"
  if [[ -f "$env_file" ]]; then
    # shellcheck disable=SC1090
    . "$env_file"
  fi
}

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: $name" >&2
    echo "Make sure it is set in your environment or in $REPO_ROOT/.env" >&2
    exit 1
  fi
}

validate_env() {
  require_env "REGISTRY_URL"
  require_env "SCW_CR_NAMESPACE"
  require_env "IMAGE_TAG"

  REGISTRY_NAMESPACE="$REGISTRY_URL/$SCW_CR_NAMESPACE"
  FRONTEND_IMAGE="$REGISTRY_NAMESPACE/caluno-frontend:$IMAGE_TAG"
  BACKEND_IMAGE="$REGISTRY_NAMESPACE/caluno-backend:$IMAGE_TAG"
}

check_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "docker command not found. Please install Docker and ensure it is on your PATH." >&2
    exit 1
  fi
}

check_buildx() {
  if ! docker buildx version >/dev/null 2>&1; then
    echo "docker buildx is not available. Please enable Docker Buildx (Docker Desktop or docker buildx plugin)." >&2
    exit 1
  fi
}

ensure_docker_logged_in() {
  local config_dir="${DOCKER_CONFIG:-"$HOME/.docker"}"
  local config_file="$config_dir/config.json"

  if [[ ! -f "$config_file" ]]; then
    echo "Docker config file not found at $config_file." >&2
    echo "Please log in to the Scaleway registry first, e.g.:" >&2
    echo "  docker login $REGISTRY_URL" >&2
    exit 1
  fi

  if ! grep -q "$REGISTRY_URL" "$config_file"; then
    echo "No Docker login entry found for registry '$REGISTRY_URL' in $config_file." >&2
    echo "Please log in to the Scaleway registry first, e.g.:" >&2
    echo "  docker login $REGISTRY_URL" >&2
    exit 1
  fi
}

build_frontend() {
  echo "Building frontend image: $FRONTEND_IMAGE"
  docker buildx build --no-cache --load \
    --platform linux/amd64 \
    -f "$REPO_ROOT/apps/frontend/Dockerfile" \
    --build-arg NEXT_PUBLIC_WEB_URL="https://staging.app.caluno.org" \
    --build-arg NEXT_PUBLIC_API_URL="https://staging.api.caluno.org" \
    -t "$FRONTEND_IMAGE" \
    "$REPO_ROOT"
}

build_backend() {
  echo "Building backend image: $BACKEND_IMAGE"
  docker buildx build --no-cache --load \
    --platform linux/amd64 \
    -f "$REPO_ROOT/apps/backend/Dockerfile" \
    -t "$BACKEND_IMAGE" \
    "$REPO_ROOT"
}

push_frontend() {
  echo "Pushing frontend image: $FRONTEND_IMAGE"
  docker push "$FRONTEND_IMAGE"
}

push_backend() {
  echo "Pushing backend image: $BACKEND_IMAGE"
  docker push "$BACKEND_IMAGE"
}

main() {
  parse_args "$@"
  load_env
  validate_env
  check_docker
  check_buildx
  ensure_docker_logged_in

  if [[ "$DO_BUILD" == "true" ]]; then
    build_frontend
    build_backend
  fi

  if [[ "$DO_PUSH" == "true" ]]; then
    push_backend
    push_frontend
  fi
}

main "$@"
