from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..auth import get_optional_user
from ..models import Movie, User
from ..services import tmdb

router = APIRouter(prefix="/movies", tags=["movies"])

GENRE_IDS = {
    "action": 28, "adventure": 12, "animation": 16, "comedy": 35,
    "crime": 80, "documentary": 99, "drama": 18, "family": 10751,
    "fantasy": 14, "history": 36, "horror": 27, "music": 10402,
    "mystery": 9648, "romance": 10749, "scifi": 878, "thriller": 53,
    "war": 10752, "western": 37,
}

LANG_CODES = {
    "hindi": "hi", "telugu": "te", "tamil": "ta",
    "korean": "ko", "japanese": "ja", "french": "fr",
    "spanish": "es",
}


@router.get("/trending")
async def trending(page: int = 1):
    return await tmdb.get_trending(page=page)


@router.get("/popular")
async def popular(page: int = 1):
    return await tmdb.get_popular(page=page)


@router.get("/top-rated")
async def top_rated(page: int = 1):
    return await tmdb.get_top_rated(page=page)


@router.get("/now-playing")
async def now_playing(page: int = 1):
    return await tmdb.get_now_playing(page=page)


@router.get("/upcoming")
async def upcoming(page: int = 1):
    return await tmdb.get_upcoming(page=page)


@router.get("/genre/{genre_name}")
async def by_genre(genre_name: str, page: int = 1, language: Optional[str] = None):
    genre_id = GENRE_IDS.get(genre_name.lower())
    if not genre_id:
        raise HTTPException(404, f"Genre '{genre_name}' not found")
    lang_code = LANG_CODES.get(language.lower()) if language else None
    return await tmdb.get_by_genre(genre_id, page=page, language=lang_code)


@router.get("/search")
async def search(q: str = Query(min_length=1), page: int = 1):
    return await tmdb.search_movies(q, page=page)


@router.get("/{tmdb_id}")
async def movie_detail(tmdb_id: int):
    data = await tmdb.get_movie_detail(tmdb_id)
    trailer_key = tmdb.extract_trailer_key(data.get("videos", {}))
    data["trailer_key"] = trailer_key
    return data
