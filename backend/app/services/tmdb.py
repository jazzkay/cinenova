import httpx
import json
from typing import Optional
import redis as redis_lib
from ..config import get_settings

settings = get_settings()
_redis = redis_lib.from_url(settings.redis_url, decode_responses=True)

CACHE_TTL = 3600  # 1 hour


async def _get(path: str, params: dict = None) -> dict:
    cache_key = f"tmdb:{path}:{json.dumps(params or {}, sort_keys=True)}"
    cached = _redis.get(cache_key)
    if cached:
        return json.loads(cached)

    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.tmdb_base_url}{path}",
            params={"api_key": settings.tmdb_api_key, **(params or {})},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

    _redis.setex(cache_key, CACHE_TTL, json.dumps(data))
    return data


def image_url(path: Optional[str], size: str = "w500") -> Optional[str]:
    if not path:
        return None
    return f"{settings.tmdb_image_base_url}/{size}{path}"


async def get_trending(media_type: str = "movie", time_window: str = "week", page: int = 1) -> dict:
    return await _get(f"/trending/{media_type}/{time_window}", {"page": page})


async def get_popular(page: int = 1) -> dict:
    return await _get("/movie/popular", {"page": page})


async def get_top_rated(page: int = 1) -> dict:
    return await _get("/movie/top_rated", {"page": page})


async def get_by_genre(genre_id: int, page: int = 1, language: str = None) -> dict:
    params = {"with_genres": genre_id, "page": page, "sort_by": "popularity.desc"}
    if language:
        params["with_original_language"] = language
    return await _get("/discover/movie", params)


async def get_movie_detail(tmdb_id: int) -> dict:
    return await _get(f"/movie/{tmdb_id}", {"append_to_response": "credits,videos,similar"})


async def search_movies(query: str, page: int = 1) -> dict:
    return await _get("/search/movie", {"query": query, "page": page})


async def get_movie_videos(tmdb_id: int) -> dict:
    return await _get(f"/movie/{tmdb_id}/videos")


async def get_genres() -> dict:
    return await _get("/genre/movie/list")


async def get_now_playing(page: int = 1) -> dict:
    return await _get("/movie/now_playing", {"page": page})


async def get_upcoming(page: int = 1) -> dict:
    return await _get("/movie/upcoming", {"page": page})


def extract_trailer_key(videos_data: dict) -> Optional[str]:
    results = videos_data.get("results", [])
    for v in results:
        if v.get("type") == "Trailer" and v.get("site") == "YouTube":
            return v["key"]
    for v in results:
        if v.get("site") == "YouTube":
            return v["key"]
    return None
