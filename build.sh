#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정의
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

# 메인 스크립트
echo -e "${BLUE}🚀 Building HobbyLink Docker Images...${NC}"
echo ""

# 환경 선택
if [ "$1" = "dev" ]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    print_status "Building for development environment"
else
    COMPOSE_FILE="docker-compose.yml"
    print_status "Building for production environment"
fi

# Docker Compose로 빌드
print_status "Building images with Docker Compose..."
if docker-compose -f $COMPOSE_FILE build --no-cache; then
    print_success "Build completed successfully!"
else
    print_error "Build failed!"
    exit 1
fi

echo ""
print_success "🎉 All images built successfully!"
echo ""

# 사용법 안내
if [ "$1" = "dev" ]; then
    echo -e "${YELLOW}Development Environment:${NC}"
    echo "  Start: docker-compose -f docker-compose.dev.yml up -d"
    echo "  Stop:  docker-compose -f docker-compose.dev.yml down"
    echo "  Logs:  docker-compose -f docker-compose.dev.yml logs -f"
    echo ""
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:8081"
    echo "  Debug:    localhost:5005 (Java Debug Wire Protocol)"
else
    echo -e "${YELLOW}Production Environment:${NC}"
    echo "  Start: docker-compose up -d"
    echo "  Stop:  docker-compose down"
    echo "  Logs:  docker-compose logs -f"
    echo ""
    echo "  Application: http://localhost"
    echo "  Backend API: http://localhost:8081"
fi

echo ""
echo -e "${BLUE}Additional Commands:${NC}"
echo "  Health Check: docker-compose ps"
echo "  Remove All:   docker-compose down -v --rmi all"