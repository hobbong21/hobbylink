# HobbyLink 

A full-stack web application built with Java Spring Boot (backend) and React (frontend) that allows users to showcase their creative projects and studios.

## Features

### Core Features
- **Studios**: Create and browse creative studios
- **Projects**: Showcase and discover creative projects
- **Meetups**: Create and join spontaneous or planned meetups
- **Search**: Search for studios, projects, and meetups
- **Multi-language Support**: Korean and English language support with easy switching
- **Responsive Design**: Works on desktop and mobile devices
- **RESTful API**: Clean API design with proper HTTP methods

### Social Meetup Features
- **Easy Onboarding**: User-friendly registration with social login support (KakaoTalk, Naver, Google)
- **Profile Management**: Personalized profiles with customizable images, hobby details, and activity preferences
- **Smart Spot Recommendation**: AI-powered recommendation system suggesting hyper-local, spontaneous meetups based on interests and location
- **Instant Meetup Creation**: Quick meetup creation with timer feature for highlighting spontaneity
- **Easy Communication**: Simple chat function for easy coordination and media sharing within meetup groups
- **Member Ratings**: Robust rating system, influencing user reliability and future meetup suggestions
- **AI Based Reputation Filter**: Tool uses current and past user behavior and peer ratings to filter offered connections

## Tech Stack

### Backend
- Java 17
- Spring Boot 3.2.0
- Spring Data JPA
- Spring Security
- H2 Database (for development)
- Maven

### Frontend
- React 18
- React Router DOM
- Axios for API calls
- React i18next for internationalization
- CSS3 for styling

## Getting Started

### Prerequisites
- Java 17 or higher
- Node.js 16 or higher
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Make sure the Maven wrapper is executable (on Unix-like systems):
```bash
chmod +x mvnw
```

3. Run the Spring Boot application:
```bash
./mvnw spring-boot:run
```

Or on Windows:
```bash
mvnw.cmd spring-boot:run
```

The backend will start on `http://localhost:8081`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The frontend will start on `http://localhost:3000`

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `GET /api/users/{id}` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Studios
- `GET /api/studios` - Get all studios
- `GET /api/studios/{id}` - Get studio by ID
- `GET /api/studios/creator/{creatorId}` - Get studios by creator
- `GET /api/studios/category/{category}` - Get studios by category
- `GET /api/studios/search?name={name}` - Search studios by name
- `POST /api/studios` - Create new studio
- `PUT /api/studios/{id}` - Update studio
- `DELETE /api/studios/{id}` - Delete studio

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/recent` - Get recent projects
- `GET /api/projects/{id}` - Get project by ID
- `GET /api/projects/user/{userId}` - Get projects by user
- `GET /api/projects/studio/{studioId}` - Get projects by studio
- `GET /api/projects/search?title={title}` - Search projects by title
- `POST /api/projects` - Create new project
- `PUT /api/projects/{id}` - Update project
- `DELETE /api/projects/{id}` - Delete project

### Meetups
- `GET /api/meetups` - Get all meetups
- `GET /api/meetups/active` - Get active meetups
- `GET /api/meetups/spontaneous` - Get spontaneous meetups
- `GET /api/meetups/{id}` - Get meetup by ID
- `GET /api/meetups/creator/{creatorId}` - Get meetups by creator
- `GET /api/meetups/category/{category}` - Get meetups by category
- `GET /api/meetups/search?title={title}` - Search meetups by title
- `GET /api/meetups/nearby?latitude={lat}&longitude={lng}&radius={radius}` - Get nearby meetups
- `GET /api/meetups/recommended/{userId}` - Get recommended meetups for user
- `POST /api/meetups` - Create new meetup
- `PUT /api/meetups/{id}` - Update meetup
- `DELETE /api/meetups/{id}` - Delete meetup

### Meetup Participation
- `POST /api/meetups/{meetupId}/join?userId={userId}` - Join a meetup
- `POST /api/meetups/{meetupId}/leave?userId={userId}` - Leave a meetup
- `GET /api/meetups/{meetupId}/participants` - Get meetup participants

### Chat
- `GET /api/meetups/{meetupId}/chat` - Get chat messages for meetup
- `POST /api/meetups/{meetupId}/chat` - Send chat message
- `DELETE /api/meetups/chat/{messageId}?userId={userId}` - Delete chat message

## Database

The application uses H2 in-memory database for development. You can access the H2 console at:
`http://localhost:8081/h2-console`

- JDBC URL: `jdbc:h2:mem:testdb`
- Username: `sa`
- Password: (empty)

## Multi-language Support

The application supports both Korean and English languages:

- **Language Detection**: Automatically detects browser language on first visit
- **Language Switching**: Easy language switching via the header menu
- **Persistent Settings**: Language preference is saved in localStorage
- **Complete Translation**: All UI elements, messages, and content are translated

### Supported Languages
- **English (en)**: Default language
- **Korean (ko)**: 한국어 지원

### Language Files
Translation files are located in `frontend/src/i18n.js` and can be easily extended for additional languages.

## Sample Data

The application automatically loads sample data on startup, including:
- 3 sample users
- 3 sample studios
- 6 sample projects

## Project Structure

```
hobbylink-clone/
├── backend/
│   ├── src/main/java/com/hobbylink/
│   │   ├── controller/     # REST controllers
│   │   ├── service/        # Business logic
│   │   ├── repository/     # Data access layer
│   │   ├── model/          # Entity classes
│   │   └── config/         # Configuration classes
│   └── pom.xml
└── frontend/
    ├── src/
    │   ├── components/     # Reusable React components
    │   ├── pages/          # Page components
    │   └── App.js          # Main App component
    └── package.json
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test your changes
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## HTML 미리보기(루트)

프로젝트 최상위 폴더에 디자인 확인용 정적 HTML을 배치했습니다. 브라우저로 파일을 직접 열어 빠르게 확인할 수 있습니다.

- `intro.html` — 인트로 랜딩
- `main.html` — 대시보드 미리보기
- `terms.html` — 이용약관
- `privacy.html` — 개인정보 처리방침

백엔드로 서빙되는 동일 페이지는 다음 경로에서도 접근 가능합니다:
- `http://localhost:8081/intro.html`
- `http://localhost:8081/main.html`
- `http://localhost:8081/terms.html`
- `http://localhost:8081/privacy.html`