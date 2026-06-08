# 🎯 Online Quiz Application
**By Priyanshu Shukla — KIIT CSE**

Full-stack quiz platform built with Spring Boot + JWT + MySQL + Docker + HTML/CSS/JS.

---

## 📁 Project Structure

```
quiz-app/
├── backend/                         # Spring Boot Application
│   ├── src/main/java/com/quiz/
│   │   ├── OnlineQuizApplication.java
│   │   ├── config/
│   │   │   ├── SecurityConfig.java       # Spring Security + CORS
│   │   │   └── GlobalExceptionHandler.java
│   │   ├── controller/
│   │   │   ├── AuthController.java       # API 1-2
│   │   │   ├── QuizController.java       # API 3-8
│   │   │   ├── QuestionController.java   # API 9-12
│   │   │   └── ResultController.java     # Submit + Results
│   │   ├── dto/                          # Request/Response DTOs
│   │   ├── entity/                       # JPA Entities (4 tables)
│   │   │   ├── User.java
│   │   │   ├── Quiz.java
│   │   │   ├── Question.java
│   │   │   └── Result.java
│   │   ├── repository/                   # Spring Data JPA Repos
│   │   ├── security/
│   │   │   ├── JwtUtil.java              # JWT generation + validation
│   │   │   ├── JwtAuthFilter.java        # JWT request filter
│   │   │   └── CustomUserDetailsService.java
│   │   └── service/                      # Business logic
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/                         # HTML/CSS/JS Frontend
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js
│
├── docker-compose.yml
├── QuizApp_Postman_Collection.json
└── README.md
```

---

## 🛠️ Tech Stack

| Layer       | Technology                              |
|-------------|----------------------------------------|
| Backend     | Java 17, Spring Boot 3.2               |
| Security    | Spring Security, JWT (jjwt 0.11.5)     |
| ORM         | Spring Data JPA, Hibernate             |
| Database    | MySQL 8.0                              |
| Build       | Maven                                  |
| Container   | Docker, Docker Compose                 |
| Frontend    | HTML5, CSS3, Vanilla JavaScript        |
| API Testing | Postman                                |

---

## 🗄️ Database Schema (4 Tables)

```sql
users      → id, username, email, password, role (ADMIN/USER), created_at
quizzes    → id, title, description, category, time_limit_minutes, created_by (FK), created_at
questions  → id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks, quiz_id (FK)
results    → id, user_id (FK), quiz_id (FK), score, total_marks, correct_answers, total_questions, percentage, submitted_at
```

---

## 🚀 Setup Instructions

### Option 1: Docker Compose (Recommended)

```bash
# 1. Clone / navigate to project
cd quiz-app

# 2. Start everything (MySQL + Backend)
docker-compose up --build

# 3. Backend runs at: http://localhost:8080
# 4. Open frontend/index.html in browser
```

### Option 2: Manual Setup

#### Prerequisites
- Java 17+
- Maven 3.6+
- MySQL 8.0 running locally

#### Step 1: Create MySQL Database
```sql
CREATE DATABASE quiz_db;
```

#### Step 2: Configure application.properties
Edit `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/quiz_db?createDatabaseIfNotExist=true&useSSL=false
spring.datasource.username=root
spring.datasource.password=YOUR_MYSQL_PASSWORD
```

#### Step 3: Run Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

#### Step 4: Open Frontend
Open `frontend/index.html` in your browser.
> For best results, use VS Code Live Server extension.

---

## 📡 REST API Reference (12 APIs)

### Authentication
| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 1 | POST | `/api/auth/register` | Public | Register new user |
| 2 | POST | `/api/auth/login` | Public | Login, get JWT |

### Quizzes
| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 3 | POST | `/api/quizzes/create` | ADMIN | Create quiz |
| 4 | GET | `/api/quizzes/all` | Public | Get all quizzes |
| 5 | GET | `/api/quizzes/{id}` | Public | Get quiz by ID |
| 6 | GET | `/api/quizzes/category/{cat}` | Public | Filter by category |
| 7 | PUT | `/api/quizzes/update/{id}` | ADMIN | Update quiz |
| 8 | DELETE | `/api/quizzes/delete/{id}` | ADMIN | Delete quiz |

### Questions
| # | Method | Endpoint | Auth | Description |
|---|--------|----------|------|-------------|
| 9 | POST | `/api/questions/add` | ADMIN | Add question |
| 10 | GET | `/api/questions/quiz/{id}` | USER | Get questions |
| 11 | PUT | `/api/questions/update/{id}` | ADMIN | Update question |
| 12 | DELETE | `/api/questions/delete/{id}` | ADMIN | Delete question |

### Results
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/results/submit` | USER | Submit quiz answers |
| GET | `/api/results/my` | USER | My results |
| GET | `/api/results/{id}` | USER | Result by ID |
| GET | `/api/results/quiz/{id}` | ADMIN | All results for quiz |

---

## 🔑 Creating an Admin Account

By default, all registered users get role `USER`. To create an Admin:

**Option A — SQL:**
```sql
UPDATE users SET role = 'ADMIN' WHERE username = 'priyanshu';
```

**Option B — Change code temporarily:**
In `AuthService.java`, line:
```java
.role(User.Role.USER)
```
Change to `ADMIN` for first registration, then revert.

---

## 🎯 Quiz Categories
- 🔬 SCIENCE
- 📐 MATHEMATICS
- 🏛️ HISTORY
- 💻 TECHNOLOGY
- ⚽ SPORTS

---

## 🧪 Testing with Postman

1. Import `QuizApp_Postman_Collection.json` into Postman
2. Register or login → copy the `token` from response
3. Set `TOKEN` collection variable to your JWT
4. Test all 12 APIs

---

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all
docker-compose down

# Stop and remove volumes (fresh DB)
docker-compose down -v
```

---

## ✅ Features Implemented

- [x] JWT Authentication (login/register)
- [x] Role-Based Access Control (ADMIN / USER)
- [x] 12 REST APIs
- [x] 4 MySQL tables with relational schema
- [x] Real-time quiz timer
- [x] Automatic scoring & grade calculation
- [x] Score history
- [x] 5 quiz categories
- [x] Dockerized deployment
- [x] CORS configuration
- [x] Global exception handling
- [x] Input validation
- [x] Admin panel (create quiz, add questions, delete)

---

*Built as part of Java Full Stack Development — Code For Success (Jul–Nov 2024)*
