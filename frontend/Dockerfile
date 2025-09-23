# 멀티스테이지 빌드 - Node.js 빌드 스테이지
FROM node:18-alpine AS build

WORKDIR /app

# package.json과 package-lock.json을 먼저 복사하여 의존성 캐싱 최적화
COPY package*.json ./
RUN npm ci --only=production --silent

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# 프로덕션 스테이지 - Nginx
FROM nginx:1.25-alpine

# 보안을 위한 설정
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# 빌드된 파일 복사
COPY --from=build /app/build /usr/share/nginx/html

# Nginx 설정 복사
COPY nginx.conf /etc/nginx/nginx.conf

# 파일 권한 설정
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# 필요한 디렉토리 생성 및 권한 설정
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

# non-root 사용자로 전환
USER nginx

EXPOSE 80

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]