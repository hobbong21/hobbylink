# 멀티스테이지 빌드 - Maven 빌드 스테이지
FROM maven:3.9-openjdk-17-slim AS build

WORKDIR /app

# pom.xml을 먼저 복사하여 의존성 캐싱 최적화
COPY pom.xml .
RUN mvn dependency:go-offline -B

# 소스 코드 복사 및 빌드
COPY src ./src
RUN mvn clean package -DskipTests -B

# 런타임 스테이지 - 더 가벼운 JRE 이미지 사용
FROM openjdk:17-jre-slim

# 보안을 위한 non-root 사용자 생성
RUN groupadd -r hobbylink && useradd -r -g hobbylink hobbylink

WORKDIR /app

# JAR 파일 복사
COPY --from=build /app/target/hobbylink-backend-1.0.0.jar app.jar

# 파일 소유권 변경
RUN chown hobbylink:hobbylink app.jar

# non-root 사용자로 전환
USER hobbylink

EXPOSE 8081

# 헬스체크 추가
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8081/actuator/health || exit 1

# JVM 옵션 최적화
CMD ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]