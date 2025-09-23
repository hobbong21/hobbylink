# HobbyLink Docker 설정 가이드

이 문서는 HobbyLink 애플리케이션의 Docker 설정 및 사용법을 설명합니다.

## 📁 파일 구조

```
├── docker-compose.yml          # 프로덕션 환경 설정
├── docker-compose.dev.yml      # 개발 환경 설정
├── build.sh / build.bat        # 이미지 빌드 스크립트
├── docker-utils.sh / .bat      # Docker 유틸리티 스크립트
├── .dockerignore               # 전역 Docker ignore
├── backend/
│   ├── Dockerfile              # 백엔드 프로덕션 Dockerfile
│   ├── Dockerfile.dev          # 백엔드 개발 Dockerfile
│   └── .dockerignore           # 백엔드 Docker ignore
└── frontend/
    ├── Dockerfile              # 프론트엔드 프로덕션 Dockerfile
    ├── Dockerfile.dev          # 프론트엔드 개발 Dockerfile
    ├── nginx.conf              # Nginx 설정
    └── .dockerignore           # 프론트엔드 Docker ignore
```

## 🚀 빠른 시작

### 프로덕션 환경

```bash
# 이미지 빌드
./build.sh

# 애플리케이션 시작
docker-compose up -d

# 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f

# 애플리케이션 중지
docker-compose down
```

### 개발 환경

```bash
# 개발용 이미지 빌드
./build.sh dev

# 개발 환경 시작
docker-compose -f docker-compose.dev.yml up -d

# 상태 확인
docker-compose -f docker-compose.dev.yml ps

# 로그 확인
docker-compose -f docker-compose.dev.yml logs -f

# 개발 환경 중지
docker-compose -f docker-compose.dev.yml down
```

## 🛠 유틸리티 스크립트 사용법

편의를 위해 `docker-utils.sh` (Linux/Mac) 또는 `docker-utils.bat` (Windows) 스크립트를 제공합니다.

```bash
# 도움말
./docker-utils.sh help

# 개발 환경 시작
./docker-utils.sh start dev

# 프로덕션 환경 시작
./docker-utils.sh start prod

# 로그 확인
./docker-utils.sh logs dev

# 컨테이너 상태 확인
./docker-utils.sh status prod

# 백엔드 컨테이너 셸 접속
./docker-utils.sh shell backend dev

# 환경 정리
./docker-utils.sh clean dev
```

## 🌐 접속 정보

### 프로덕션 환경
- **웹 애플리케이션**: http://localhost
- **백엔드 API**: http://localhost:8081

### 개발 환경
- **프론트엔드**: http://localhost:3000
- **백엔드 API**: http://localhost:8081
- **디버그 포트**: localhost:5005 (Java Debug Wire Protocol)

## 🔧 환경별 특징

### 프로덕션 환경
- **멀티스테이지 빌드**: 최적화된 이미지 크기
- **보안 강화**: non-root 사용자 실행
- **Nginx 프록시**: 정적 파일 서빙 및 API 프록시
- **헬스체크**: 자동 상태 모니터링
- **로그 볼륨**: 영구 로그 저장

### 개발 환경
- **핫 리로드**: 코드 변경 시 자동 재시작
- **디버깅 지원**: Java 원격 디버깅 포트 노출
- **볼륨 마운트**: 소스 코드 실시간 반영
- **개발 도구**: 추가 개발 의존성 포함

## 📊 모니터링

### 헬스체크
```bash
# 컨테이너 상태 확인
docker-compose ps

# 헬스체크 로그 확인
docker inspect hobbylink-backend | grep -A 10 Health
docker inspect hobbylink-frontend | grep -A 10 Health
```

### 로그 관리
```bash
# 실시간 로그
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs -f backend
docker-compose logs -f frontend

# 로그 파일 위치 (컨테이너 내부)
# Backend: /app/logs/
# Frontend: /var/log/nginx/
```

## 🔒 보안 설정

### 컨테이너 보안
- non-root 사용자로 실행
- 최소 권한 원칙 적용
- 보안 헤더 설정 (Nginx)

### 네트워크 보안
- 내부 네트워크 격리
- 필요한 포트만 노출
- 프록시를 통한 API 접근

## 🚨 문제 해결

### 일반적인 문제

1. **포트 충돌**
   ```bash
   # 사용 중인 포트 확인
   netstat -tulpn | grep :80
   netstat -tulpn | grep :8081
   ```

2. **이미지 빌드 실패**
   ```bash
   # 캐시 없이 다시 빌드
   docker-compose build --no-cache
   ```

3. **컨테이너 시작 실패**
   ```bash
   # 로그 확인
   docker-compose logs
   
   # 개별 컨테이너 로그
   docker logs hobbylink-backend
   docker logs hobbylink-frontend
   ```

4. **볼륨 권한 문제**
   ```bash
   # 볼륨 재생성
   docker-compose down -v
   docker-compose up -d
   ```

### 성능 최적화

1. **메모리 사용량 조정**
   ```yaml
   # docker-compose.yml에서 JVM 옵션 수정
   environment:
     - JAVA_OPTS=-Xmx1g -Xms512m
   ```

2. **빌드 캐시 활용**
   ```bash
   # 의존성 변경 시에만 재설치되도록 Dockerfile 최적화됨
   ```

## 📝 추가 명령어

### 데이터베이스 관련
```bash
# 데이터베이스 초기화 (개발 환경)
docker-compose -f docker-compose.dev.yml exec backend java -jar app.jar --spring.jpa.hibernate.ddl-auto=create
```

### 백업 및 복원
```bash
# 볼륨 백업
docker run --rm -v hobbylink-backend-logs:/data -v $(pwd):/backup alpine tar czf /backup/logs-backup.tar.gz -C /data .

# 볼륨 복원
docker run --rm -v hobbylink-backend-logs:/data -v $(pwd):/backup alpine tar xzf /backup/logs-backup.tar.gz -C /data
```

## 🔄 업데이트 절차

1. **코드 업데이트 후**
   ```bash
   # 이미지 재빌드
   ./build.sh
   
   # 서비스 재시작
   docker-compose up -d --force-recreate
   ```

2. **설정 변경 후**
   ```bash
   # 컨테이너 재시작
   docker-compose restart
   ```

## 📞 지원

문제가 발생하거나 추가 도움이 필요한 경우:
1. 로그 파일 확인
2. GitHub Issues에 문제 보고
3. 개발팀에 문의

---

**참고**: 이 설정은 개발 및 테스트 목적으로 최적화되어 있습니다. 실제 프로덕션 환경에서는 추가적인 보안 설정과 모니터링이 필요할 수 있습니다.