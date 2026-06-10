# CineNova 🎬

A Netflix-grade movie recommendation platform powered by a hybrid AI engine. Built with Next.js 15, FastAPI, and PostgreSQL.

![Tech Stack](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)

---

## Features

- **Hybrid AI Recommendation Engine** — combines content-based filtering (TF-IDF + cosine similarity), collaborative filtering, quiz-based preference matching, and popularity signals to surface movies users actually want to watch
- **Personalised For You Page** — recommendations grouped by reason with match scores, refreshable on demand
- **Taste Quiz** — onboarding flow that captures mood, language, genre preferences, and favourite titles to cold-start the engine
- **Watchlist & Watch History** — saved list and automatic history tracking feed directly into the recommendation pipeline
- **JWT Authentication** — secure register/login with bcrypt password hashing and 7-day token expiry
- **TMDB Integration** — real-time movie discovery, posters, ratings, and metadata via The Movie Database API
- **Redis Caching** — TMDB API responses cached to reduce latency and stay within rate limits
- **Responsive UI** — Netflix-style dark interface built with Tailwind CSS v4, shadcn/ui, and Framer Motion

---

## How the Recommendation Engine Works

The engine runs four signals and blends them into a single ranked list:

| Signal | Weight | Method |
|---|---|---|
| Content Match | 35% | TF-IDF on genres, cast, keywords + cosine similarity against watched/saved movies |
| Quiz Preferences | 25% | Maps mood/language/genre answers to TMDB `/discover` queries for new movies |
| Community Taste | 25% | User-user collaborative filtering on rating patterns |
| Popularity | 15% | TMDB vote average + vote count normalised score |

New movies are actively fetched from TMDB `/discover`, `/similar`, and `/recommendations` endpoints so results are never limited to what's already in the database.

---

## Tech Stack

**Frontend**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- shadcn/ui + Radix UI
- Framer Motion
- TanStack Query
- Zustand

**Backend**
- FastAPI
- SQLAlchemy ORM
- Pydantic v2
- Python-Jose (JWT)
- bcrypt
- scikit-learn + numpy + pandas (recommendation engine)
- httpx (async TMDB client)

**Infrastructure**
- PostgreSQL (primary database)
- Redis (API response cache)
- Docker Compose (local orchestration)

---

## Project Structure

```
cinenova/
├── frontend/               # Next.js 15 app
│   ├── src/
│   │   ├── app/            # App Router pages
│   │   ├── components/     # Reusable UI components
│   │   ├── lib/            # API client, utilities
│   │   └── store/          # Zustand state stores
│   └── next.config.ts
│
├── backend/                # FastAPI app
│   ├── app/
│   │   ├── routers/        # API route handlers
│   │   ├── services/       # Business logic (recommendation engine)
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── auth.py         # JWT + bcrypt auth
│   │   └── main.py         # App entry point + CORS
│   ├── requirements.txt
│   └── Dockerfile
│
└── docker-compose.yml      # PostgreSQL + Redis
```

---

## Running Locally

**Prerequisites:** Python 3.12, Node.js 18+, Docker Desktop

### 1. Start the database and cache

```bash
docker compose up -d
```

### 2. Set up the backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://cinenova:cinenova@127.0.0.1:5433/cinenova
REDIS_URL=redis://127.0.0.1:6379/0
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
TMDB_API_KEY=your_tmdb_api_key
TMDB_BASE_URL=https://api.themoviedb.org/3
TMDB_IMAGE_BASE_URL=https://image.tmdb.org/t/p
FRONTEND_URL=http://localhost:3000
```

Start the API:

```bash
uvicorn app.main:app --reload --port 8000
```

### 3. Set up the frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Start the dev server:

```bash
npm run dev
```

Open **http://localhost:3000**

---

## API Reference

Interactive docs available at `http://localhost:8000/docs` when the backend is running.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Create account |
| POST | `/api/v1/auth/login` | Get JWT token |
| GET | `/api/v1/movies/` | Browse movies |
| GET | `/api/v1/movies/{id}` | Movie detail |
| GET | `/api/v1/recommendations/` | AI recommendations |
| POST | `/api/v1/users/me/watchlist` | Add to watchlist |
| GET | `/api/v1/users/me/watch-history` | Watch history |
| PUT | `/api/v1/users/me/quiz` | Save quiz answers |

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `SECRET_KEY` | JWT signing secret (use a long random string) |
| `TMDB_API_KEY` | API key from themoviedb.org |
| `FRONTEND_URL` | Frontend origin for CORS |

---

## License

MIT
