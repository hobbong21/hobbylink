#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

show_help() {
    echo "HobbyLink Docker Utilities"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  start [dev|prod]     Start the application"
    echo "  stop [dev|prod]      Stop the application"
    echo "  restart [dev|prod]   Restart the application"
    echo "  logs [dev|prod]      Show logs"
    echo "  status [dev|prod]    Show container status"
    echo "  clean [dev|prod]     Clean up containers and images"
    echo "  build [dev|prod]     Build images"
    echo "  shell <service>      Open shell in container"
    echo "  help                 Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 start dev         Start development environment"
    echo "  $0 logs prod         Show production logs"
    echo "  $0 shell backend     Open shell in backend container"
}

get_compose_file() {
    if [ "$1" = "dev" ]; then
        echo "docker-compose.dev.yml"
    else
        echo "docker-compose.yml"
    fi
}

start_app() {
    local env=${1:-prod}
    local compose_file=$(get_compose_file $env)
    
    print_status "Starting HobbyLink ($env environment)..."
    docker-compose -f $compose_file up -d
    
    if [ $? -eq 0 ]; then
        print_success "Application started successfully!"
        print_status "Waiting for services to be ready..."
        sleep 10
        docker-compose -f $compose_file ps
    else
        print_error "Failed to start application"
        exit 1
    fi
}

stop_app() {
    local env=${1:-prod}
    local compose_file=$(get_compose_file $env)
    
    print_status "Stopping HobbyLink ($env environment)..."
    docker-compose -f $compose_file down
    
    if [ $? -eq 0 ]; then
        print_success "Application stopped successfully!"
    else
        print_error "Failed to stop application"
        exit 1
    fi
}

restart_app() {
    local env=${1:-prod}
    stop_app $env
    start_app $env
}

show_logs() {
    local env=${1:-prod}
    local compose_file=$(get_compose_file $env)
    
    print_status "Showing logs for $env environment..."
    docker-compose -f $compose_file logs -f
}

show_status() {
    local env=${1:-prod}
    local compose_file=$(get_compose_file $env)
    
    print_status "Container status for $env environment:"
    docker-compose -f $compose_file ps
}

clean_up() {
    local env=${1:-prod}
    local compose_file=$(get_compose_file $env)
    
    print_warning "This will remove all containers, networks, and volumes for $env environment"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Cleaning up $env environment..."
        docker-compose -f $compose_file down -v --rmi all
        print_success "Cleanup completed!"
    else
        print_status "Cleanup cancelled"
    fi
}

build_images() {
    local env=${1:-prod}
    ./build.sh $env
}

open_shell() {
    local service=$1
    local env=${2:-prod}
    local compose_file=$(get_compose_file $env)
    
    if [ -z "$service" ]; then
        print_error "Service name required. Available services: backend, frontend"
        exit 1
    fi
    
    print_status "Opening shell in $service container..."
    docker-compose -f $compose_file exec $service /bin/sh
}

# 메인 스크립트
case "$1" in
    start)
        start_app $2
        ;;
    stop)
        stop_app $2
        ;;
    restart)
        restart_app $2
        ;;
    logs)
        show_logs $2
        ;;
    status)
        show_status $2
        ;;
    clean)
        clean_up $2
        ;;
    build)
        build_images $2
        ;;
    shell)
        open_shell $2 $3
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac