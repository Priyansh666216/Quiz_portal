# 🎯 Quiz Portal

A full-stack online quiz application built with **Spring Boot** (backend), **Vanilla JS** (frontend), and a separate **Node.js code execution microservice**. Supports JWT-based authentication, role-based access control (Admin / User), PDF email reports on quiz submission, and real-time code execution for programming questions.

---

## 📁 Project Structure

```
Quiz_Portal/
├── backend/                  # Spring Boot REST API
│   ├── src/main/java/com/quiz/
│   │   ├── config/           # Security config, global exception handler
│   │   ├── controller/       # Auth, Quiz, Question, Result controllers
│   │   ├── dto/              # Request / Response DTOs
│   │   ├── entity/           # JPA entities: User, Quiz, Question, Result
│   │   ├── repository/       # Spring Data JPA repositories
│   │   ├── security/         # JWT filter, JwtUtil, UserDetailsService
│   │   └── service/          # Business logic: Auth, Quiz, Question, Result, Email
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── Dockerfile
│   └── pom.xml
├── frontend/
│   ├── index.html            # Single-page UI
│   ├── app.js                # Vanilla JS frontend logic
│   ├── css/style.css
│   └── dsa.json              # DSA / TCS NQT question bank
├── code-runner/              # Node.js code execution microservice
│   ├── index.js
│   └── package.json
├── docker-compose.yml        # Local full-stack setup
├── render.yaml               # Render deployment config
└── QuizApp_Postman_Collection.json
```

---

## ✨ Features

- **JWT Authentication** — Register & login with token-based auth
- **Role-based Access** — `ADMIN` can create/edit/delete quizzes & questions; `USER` can take quizzes
- **Quiz Management** — Create quizzes by category, fetch all or by category/ID
- **Question Management** — Add MCQ questions to quizzes; answers hidden from regular users
- **Quiz Submission & Scoring** — Submit answers, auto-score, store results
- **PDF Email Reports** — On quiz completion, a PDF score report is generated (iText) and emailed via Gmail SMTP
- **Code Execution** — Microservice executes user-submitted code (Python, Java, C++, C, Go) with a 10-second timeout
- **DSA / TCS NQT Question Bank** — Pre-loaded `dsa.json` for exam-prep categories

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot 3.2, Spring Security, Spring Data JPA |
| Auth | JWT (jjwt 0.11.5) |
| Database | MySQL 8 (Aiven cloud / local Docker) |
| Email | Spring Mail + Gmail SMTP |
| PDF | iText 5.5.13 |
| Frontend | Vanilla HTML/CSS/JS |
| Code Runner | Node.js 18+, Express 4 |
| Containerization | Docker, Docker Compose |
| Deployment | Render (backend + code runner), Aiven MySQL |

---

## ⚙️ Environment Variables

### Backend (`backend/`)

| Variable | Description |
|---|---|
| `SPRING_DATASOURCE_URL` | MySQL JDBC URL e.g. `jdbc:mysql://host:3306/quiz_db?...` |
| `SPRING_DATASOURCE_USERNAME` | DB username |
| `SPRING_DATASOURCE_PASSWORD` | DB password |
| `APP_JWT_SECRET` | 256-bit+ secret key for JWT signing |
| `APP_JWT_EXPIRATION` | Token expiry in ms (default: `86400000` = 24h) |
| `APP_CORS_ALLOWED_ORIGINS` | Frontend URL(s) allowed for CORS |
| `SPRING_MAIL_USERNAME` | Gmail address for sending reports |
| `SPRING_MAIL_PASSWORD` | Gmail App Password (not account password) |
| `PORT` | Server port (default: `8080`) |

### Code Runner (`code-runner/`)

| Variable | Description |
|---|---|
| `PORT` | Port to listen on (default: `3000`) |
| `NODE_ENV` | Set to `production` on Render |

---

## 🚀 Running Locally

### Option 1 — Docker Compose (recommended)

```bash
git clone <repo-url>
cd Quiz_Portal

# Start MySQL + Spring Boot backend together
docker-compose up --build
```

The backend starts on `http://localhost:8080`.  
> Note: The `docker-compose.yml` does not include the frontend or code-runner; serve those separately.

### Option 2 — Manual

**Prerequisites:** Java 17, Maven, MySQL 8, Node.js 18+

```bash
# 1. Create DB
mysql -u root -p -e "CREATE DATABASE quiz_db;"

# 2. Set env vars (or export them)
export SPRING_DATASOURCE_URL="jdbc:mysql://localhost:3306/quiz_db?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true"
export SPRING_DATASOURCE_USERNAME=root
export SPRING_DATASOURCE_PASSWORD=yourpassword
export APP_JWT_SECRET=myVerySecretKeyForJWTTokenGenerationThatIsAtLeast256BitsLong
export APP_CORS_ALLOWED_ORIGINS=http://localhost:5500
export SPRING_MAIL_USERNAME=you@gmail.com
export SPRING_MAIL_PASSWORD=your_app_password

# 3. Build & run backend
cd backend
mvn clean package -DskipTests
java -jar target/online-quiz-app-1.0.0.jar

# 4. Run code runner
cd ../code-runner
npm install
npm start

# 5. Serve frontend (e.g. with VS Code Live Server or any static server)
cd ../frontend
npx serve .
```

---

## ☁️ Deploying to Render

### Backend (Web Service — Docker)
1. Create a new **Web Service** on Render, point to `backend/` with Docker runtime.
2. Add all required environment variables from the table above.
3. Render will build using the multi-stage `Dockerfile` (Maven build → JRE Alpine runtime).

### Code Runner (Web Service — Node)
The `render.yaml` at the repo root auto-configures this service:
```yaml
# render.yaml
services:
  - type: web
    name: quizmaster-code-runner
    runtime: node
    rootDir: code-runner
    buildCommand: npm install
    startCommand: npm start
```
Push to your Render-connected repo and the code runner deploys automatically.

> **Note:** Both services use Render's free tier and will sleep after 15 minutes of inactivity. Expect a ~30-second cold start.

### Frontend
Host `frontend/` on any static host (Netlify, GitHub Pages, Render Static Site, etc.). Update `APP_CORS_ALLOWED_ORIGINS` in your backend env to match the deployed frontend URL.

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, returns JWT |

### Quizzes
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/quizzes/create` | ADMIN | Create a quiz |
| GET | `/api/quizzes/all` | Public | Get all quizzes |
| GET | `/api/quizzes/{id}` | Public | Get quiz by ID |
| GET | `/api/quizzes/category/{category}` | Public | Get quizzes by category |
| PUT | `/api/quizzes/update/{id}` | ADMIN | Update quiz |
| DELETE | `/api/quizzes/delete/{id}` | ADMIN | Delete quiz |

### Questions
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/questions/add` | ADMIN | Add question to a quiz |
| GET | `/api/questions/quiz/{quizId}` | Auth | Get questions (answers hidden for USER) |
| PUT | `/api/questions/update/{id}` | ADMIN | Update question |
| DELETE | `/api/questions/delete/{id}` | ADMIN | Delete question |

### Results
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/results/submit` | Auth | Submit quiz answers, receive score + PDF email |
| GET | `/api/results/my` | Auth | Get current user's results |
| GET | `/api/results/{id}` | Auth | Get result by ID |
| GET | `/api/results/quiz/{quizId}` | ADMIN | Get all results for a quiz |

### Code Runner
| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/api/execute` | Execute code snippet |

**Execute payload:**
```json
{
  "language": "python",
  "code": "print('Hello World')",
  "input": ""
}
```
Supported languages: `python`, `java`, `cpp`, `c`, `go`. Execution is time-limited to **10 seconds**.

---

## 🔐 Authentication

All protected endpoints require a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

The token is returned from `/api/auth/login` and is valid for 24 hours by default.

---

## 📬 Email & PDF Reports

When a user submits a quiz, the backend:
1. Scores the submission and saves the result.
2. Generates a PDF report using **iText 5** containing the score, quiz name, and answer breakdown.
3. Emails the PDF to the user via **Gmail SMTP** (TLS on port 587).

To enable this, generate a [Gmail App Password](https://myaccount.google.com/apppasswords) and set it as `SPRING_MAIL_PASSWORD`.

---

## 🧪 Testing with Postman

Import `QuizApp_Postman_Collection.json` into Postman to get pre-built requests for all endpoints. Set the `{{baseUrl}}` collection variable to your backend URL (e.g. `http://localhost:8080`).

---

## 📊 Database Schema

Tables auto-created by Hibernate (`ddl-auto=update`):

- **users** — id, username, email, password (BCrypt), role
- **quizzes** — id, title, description, category, time_limit
- **questions** — id, quiz_id (FK), question_text, option_a/b/c/d, correct_answer, explanation
- **results** — id, user_id (FK), quiz_id (FK), score, total, submitted_at

---

## 📝 Notes

- The `dsa.json` file contains pre-built DSA and TCS NQT style questions that can be bulk-imported into the portal.
- Connection pool is tuned for Render's free tier (max 5 connections, idle timeout 5 min).
- CORS must be configured via `APP_CORS_ALLOWED_ORIGINS` to match your frontend's origin exactly.
- The code runner executes code **directly on the host** — do not expose it publicly without sandboxing (Docker, seccomp, etc.) in a production environment.
