@echo off
echo Building HobbyLink Docker Images...

echo Building backend image...
cd backend
docker build -t hobbylink-backend .
cd ..

echo Building frontend image...
cd frontend
docker build -t hobbylink-frontend .
cd ..

echo Build completed!
echo.
echo To run the application:
echo docker run -d -p 8081:8081 --name hobbylink-backend hobbylink-backend
echo docker run -d -p 80:80 --name hobbylink-frontend hobbylink-frontend
echo.
echo Or use docker-compose:
echo docker-compose up -d