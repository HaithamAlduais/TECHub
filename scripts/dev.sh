#!/bin/bash
# TECHub Development Helper
# Usage: ./scripts/dev.sh [command]

set -e

SERVICES=("cv-aggregator" "opportunities")

case "$1" in
  "setup")
    echo "Setting up TECHub development environment..."
    echo "Installing Node.js dependencies..."
    pnpm install
    echo ""
    echo "Setting up Python virtual environments for each service..."
    for service in "${SERVICES[@]}"; do
      echo "  → Setting up $service..."
      cd "services/$service"
      python -m venv .venv
      source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate
      pip install -r requirements.txt -q
      deactivate
      cd ../..
    done
    echo ""
    echo "Setup complete! Copy .env.example to .env and fill in your values."
    ;;

  "services")
    echo "Starting all backend services..."
    for service in "${SERVICES[@]}"; do
      port=$(grep "${service^^}_PORT" .env 2>/dev/null | cut -d= -f2 || echo "")
      if [ -z "$port" ]; then
        case "$service" in
          "cv-aggregator") port=8001 ;;
          "opportunities") port=8003 ;;
        esac
      fi
      echo "  → Starting $service on port $port..."
      cd "services/$service"
      source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate
      uvicorn app.main:app --host 0.0.0.0 --port "$port" --reload &
      deactivate
      cd ../..
    done
    echo ""
    echo "All services started. Press Ctrl+C to stop all."
    wait
    ;;

  "health")
    echo "Checking health of all services..."
    for service in "${SERVICES[@]}"; do
      case "$service" in
        "cv-aggregator") port=8001 ;;
        "opportunities") port=8003 ;;
      esac
      status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port/health" 2>/dev/null || echo "000")
      if [ "$status" = "200" ]; then
        echo "  ✓ $service (:$port) — healthy"
      else
        echo "  ✗ $service (:$port) — unreachable (HTTP $status)"
      fi
    done
    ;;

  "test")
    echo "Running tests for all services..."
    for service in "${SERVICES[@]}"; do
      echo "  → Testing $service..."
      cd "services/$service"
      source .venv/bin/activate 2>/dev/null || source .venv/Scripts/activate
      pytest tests/ -v
      deactivate
      cd ../..
    done
    echo ""
    echo "Running frontend tests..."
    pnpm turbo run test --filter=@techub/web
    ;;

  *)
    echo "TECHub Development Helper"
    echo ""
    echo "Usage: ./scripts/dev.sh [command]"
    echo ""
    echo "Commands:"
    echo "  setup     Install all dependencies (Node + Python)"
    echo "  services  Start all backend services"
    echo "  health    Check health of all running services"
    echo "  test      Run all tests (backend + frontend)"
    ;;
esac
