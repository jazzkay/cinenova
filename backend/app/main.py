from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import get_settings
from .database import engine, Base
from .routers import auth, movies, users, recommendations

settings = get_settings()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CineNova API",
    description="Netflix-grade movie recommendation platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(movies.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(recommendations.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok", "service": "CineNova API"}
