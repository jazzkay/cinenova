"""
Enhanced Hybrid Recommendation Engine
======================================
Sources used to build recommendations:
  1. Quiz answers   — mood, language, genres, favourite movies
  2. Watch history  — movies the user has watched
  3. Watchlist      — movies the user saved (expressed interest)
  4. Ratings        — how the user scored movies (higher = stronger signal)

Scoring formula:
  final = 0.35 * content_score
        + 0.25 * quiz_match_score
        + 0.25 * collaborative_score
        + 0.15 * popularity_score
"""

import asyncio
import numpy as np
from typing import List, Dict, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
from ..models import Movie, Rating, WatchHistory, Watchlist, User
from ..services import tmdb as tmdb_service

# ── TMDB lookup tables ────────────────────────────────────────────────────────

GENRE_NAME_TO_ID: Dict[str, int] = {
    "action": 28, "adventure": 12, "animation": 16, "comedy": 35,
    "crime": 80, "documentary": 99, "drama": 18, "family": 10751,
    "fantasy": 14, "history": 36, "horror": 27, "music": 10402,
    "mystery": 9648, "romance": 10749, "sci-fi": 878, "science fiction": 878,
    "thriller": 53, "war": 10752, "western": 37,
}

MOOD_TO_GENRES: Dict[str, List[int]] = {
    "excited":    [28, 12, 878],    # Action, Adventure, Sci-Fi
    "happy":      [35, 16, 10751],  # Comedy, Animation, Family
    "emotional":  [18, 10749],      # Drama, Romance
    "scared":     [27, 53],         # Horror, Thriller
    "thoughtful": [9648, 99, 18],   # Mystery, Documentary, Drama
}

LANGUAGE_CODE: Dict[str, Optional[str]] = {
    "english": "en", "hindi": "hi", "telugu": "te",
    "tamil": "ta", "korean": "ko", "japanese": "ja", "any": None,
}


# ── User profile builder ──────────────────────────────────────────────────────

def _build_user_profile(user: User, db: Session) -> Dict:
    """Extract every signal we have about this user into one dict."""
    quiz = user.quiz_answers or {}

    # Genre IDs from quiz
    mood_genres = MOOD_TO_GENRES.get((quiz.get("mood") or "").lower(), [])
    quiz_genre_ids: List[int] = list(mood_genres)
    for g in quiz.get("genres") or []:
        gid = GENRE_NAME_TO_ID.get(g.lower())
        if gid and gid not in quiz_genre_ids:
            quiz_genre_ids.append(gid)

    # Language from quiz
    lang_code = LANGUAGE_CODE.get((quiz.get("language") or "any").lower())

    # Favourite movie titles from quiz (for search-based seeding)
    fav_titles: List[str] = quiz.get("favorite_movies") or []

    # DB seed IDs from watch history + watchlist + ratings
    watched_movie_ids  = {wh.movie_id for wh in user.watch_history}
    watchlist_movie_ids = {wl.movie_id for wl in user.watchlist}
    rated_movie_ids    = {r.movie_id: r.score for r in user.ratings}

    seed_db_ids = list(watched_movie_ids | watchlist_movie_ids | set(rated_movie_ids))

    # Seed movies from DB
    seed_movies = db.query(Movie).filter(Movie.id.in_(seed_db_ids)).all() if seed_db_ids else []
    seed_tmdb_ids = [m.tmdb_id for m in seed_movies]

    # Collect genre IDs from seed movies to enrich quiz genres
    for m in seed_movies:
        for g in (m.genres or []):
            gid = g.get("id") if isinstance(g, dict) else None
            if gid and gid not in quiz_genre_ids:
                quiz_genre_ids.append(gid)

    # Top-rated seed tmdb_ids (score >= 4) — strongest content signal
    top_rated_tmdb: List[int] = []
    for r in user.ratings:
        if r.score >= 4:
            m = db.query(Movie).filter(Movie.id == r.movie_id).first()
            if m:
                top_rated_tmdb.append(m.tmdb_id)

    return {
        "quiz_genre_ids": quiz_genre_ids[:5],   # top 5 genre signals
        "lang_code": lang_code,
        "fav_titles": fav_titles,
        "seed_tmdb_ids": seed_tmdb_ids,
        "top_rated_tmdb": top_rated_tmdb,
        "watched_tmdb_ids": set(seed_tmdb_ids),
    }


# ── TMDB discovery ────────────────────────────────────────────────────────────

async def _fetch_tmdb_candidates(profile: Dict) -> List[Dict]:
    """
    Actively fetch new movies from TMDB that match the user's profile.
    Returns raw TMDB movie dicts (not DB objects).
    """
    tasks = []

    # 1. Discover by quiz genres + language (2 pages → up to 40 movies)
    if profile["quiz_genre_ids"]:
        genre_str = ",".join(str(g) for g in profile["quiz_genre_ids"][:3])
        tasks.append(tmdb_service._get("/discover/movie", {
            "with_genres": genre_str,
            "sort_by": "vote_average.desc",
            "vote_count.gte": 100,
            "page": 1,
            **({"with_original_language": profile["lang_code"]} if profile["lang_code"] else {}),
        }))
        tasks.append(tmdb_service._get("/discover/movie", {
            "with_genres": genre_str,
            "sort_by": "popularity.desc",
            "page": 2,
            **({"with_original_language": profile["lang_code"]} if profile["lang_code"] else {}),
        }))

    # 2. TMDB "similar" for top-rated seed movies (up to 3 seeds)
    for tmdb_id in profile["top_rated_tmdb"][:3]:
        tasks.append(tmdb_service._get(f"/movie/{tmdb_id}/similar", {"page": 1}))
        tasks.append(tmdb_service._get(f"/movie/{tmdb_id}/recommendations", {"page": 1}))

    # 3. Search for favourite movie titles from quiz, get similar movies
    for title in profile["fav_titles"][:3]:
        tasks.append(tmdb_service._get("/search/movie", {"query": title, "page": 1}))

    # 4. Fallback: trending if no strong signal
    if not tasks:
        tasks.append(tmdb_service._get("/trending/movie/week", {"page": 1}))
        tasks.append(tmdb_service._get("/movie/top_rated", {"page": 1}))

    results = await asyncio.gather(*tasks, return_exceptions=True)

    seen: set = set()
    movies: List[Dict] = []
    for res in results:
        if isinstance(res, Exception):
            continue
        for m in res.get("results", []):
            mid = m.get("id")
            if mid and mid not in seen and mid not in profile["watched_tmdb_ids"]:
                seen.add(mid)
                movies.append(m)

    return movies


def _ensure_movies_in_db(raw_movies: List[Dict], db: Session) -> List[Movie]:
    """Upsert TMDB raw movie dicts into the Movie table, return Movie objects."""
    result: List[Movie] = []
    for m in raw_movies:
        tmdb_id = m.get("id")
        if not tmdb_id:
            continue
        movie = db.query(Movie).filter(Movie.tmdb_id == tmdb_id).first()
        if not movie:
            genre_objects = [{"id": g["id"], "name": g["name"]}
                             for g in m.get("genres") or []
                             if isinstance(g, dict)]
            if not genre_objects:
                genre_objects = [{"id": gid, "name": str(gid)}
                                 for gid in m.get("genre_ids", [])]
            movie = Movie(
                tmdb_id=tmdb_id,
                title=m.get("title") or m.get("name") or "",
                overview=m.get("overview", ""),
                poster_path=m.get("poster_path"),
                backdrop_path=m.get("backdrop_path"),
                vote_average=m.get("vote_average", 0.0),
                vote_count=m.get("vote_count", 0),
                popularity=m.get("popularity", 0.0),
                release_date=m.get("release_date"),
                genres=genre_objects,
                languages=[m.get("original_language")] if m.get("original_language") else [],
            )
            db.add(movie)
        result.append(movie)
    try:
        db.flush()
    except Exception:
        db.rollback()
    return result


# ── Scoring ───────────────────────────────────────────────────────────────────

def _build_soup(movie: Movie) -> str:
    genres = " ".join(
        (g.get("name", "") if isinstance(g, dict) else str(g))
        for g in (movie.genres or [])
    )
    cast = " ".join(
        (c.get("name", "") if isinstance(c, dict) else "")
        for c in (movie.cast or [])[:5]
    )
    return f"{genres} {genres} {cast} {movie.overview or ''}"


def _content_scores(seed_tmdb_ids: List[int], candidates: List[Movie]) -> Dict[int, float]:
    if not seed_tmdb_ids or not candidates:
        return {}
    soups = [_build_soup(m) for m in candidates]
    try:
        tfidf = TfidfVectorizer(stop_words="english", max_features=8000)
        matrix = tfidf.fit_transform(soups)
    except ValueError:
        return {}

    seed_indices = [i for i, m in enumerate(candidates) if m.tmdb_id in set(seed_tmdb_ids)]
    if not seed_indices:
        return {}

    seed_vec = matrix[seed_indices].mean(axis=0)
    scores = cosine_similarity(seed_vec, matrix).flatten()
    return {candidates[i].tmdb_id: float(scores[i]) for i in range(len(candidates))}


def _quiz_match_scores(profile: Dict, candidates: List[Movie]) -> Dict[int, float]:
    """Score each candidate by how many of its genres overlap with the user's quiz genres."""
    wanted = set(profile["quiz_genre_ids"])
    lang = profile["lang_code"]
    scores: Dict[int, float] = {}
    for m in candidates:
        movie_genre_ids = {
            (g.get("id") if isinstance(g, dict) else None)
            for g in (m.genres or [])
        }
        overlap = len(wanted & movie_genre_ids)
        score = overlap / max(len(wanted), 1)

        # Bonus if language matches
        if lang:
            movie_langs = m.languages or []
            if lang in movie_langs or any(lang in str(l) for l in movie_langs):
                score = min(1.0, score + 0.3)

        scores[m.tmdb_id] = score
    return scores


def _collaborative_scores(user_id: int, candidate_tmdb_ids: List[int], db: Session) -> Dict[int, float]:
    all_ratings = db.query(Rating).all()
    if not all_ratings:
        return {}

    users = list({r.user_id for r in all_ratings})
    movies = list({r.movie_id for r in all_ratings})
    if user_id not in users or len(users) < 2:
        return {}

    u_idx = {u: i for i, u in enumerate(users)}
    m_idx = {m: i for i, m in enumerate(movies)}
    matrix = np.zeros((len(users), len(movies)))
    for r in all_ratings:
        matrix[u_idx[r.user_id]][m_idx[r.movie_id]] = r.score

    user_vec = matrix[u_idx[user_id]].reshape(1, -1)
    sim = cosine_similarity(user_vec, matrix).flatten()
    sim[u_idx[user_id]] = 0
    weighted = sim @ matrix
    sim_sum = np.abs(sim).sum() or 1
    predicted = weighted / sim_sum

    movie_objs = db.query(Movie).filter(Movie.id.in_(movies)).all()
    mid_to_tmdb = {m.id: m.tmdb_id for m in movie_objs}
    candidate_set = set(candidate_tmdb_ids)

    return {
        mid_to_tmdb[mid]: float(predicted[idx])
        for mid, idx in m_idx.items()
        if mid in mid_to_tmdb and mid_to_tmdb[mid] in candidate_set
    }


def _normalize(scores: Dict[int, float], key: int) -> float:
    if not scores:
        return 0.0
    vals = list(scores.values())
    min_v, max_v = min(vals), max(vals)
    v = scores.get(key, 0.0)
    if max_v == min_v:
        return 0.5
    return (v - min_v) / (max_v - min_v)


def _hybrid(
    content: Dict[int, float],
    quiz: Dict[int, float],
    collab: Dict[int, float],
    popularity: Dict[int, float],
) -> Dict[int, float]:
    all_ids = set(content) | set(quiz) | set(collab) | set(popularity)
    return {
        tid: round(
            0.35 * content.get(tid, 0.0)
            + 0.25 * quiz.get(tid, 0.0)
            + 0.25 * _normalize(collab, tid)
            + 0.15 * _normalize(popularity, tid),
            6,
        )
        for tid in all_ids
    }


def _reason(content: Dict, quiz: Dict, collab: Dict, tid: int) -> str:
    c = content.get(tid, 0)
    q = quiz.get(tid, 0)
    cl = collab.get(tid, 0)
    if c > 0.25 and c >= q:
        return "Similar to movies you love"
    if q > 0.4:
        return "Matches your quiz preferences"
    if cl > 0:
        return "Fans with your taste loved this"
    return "Trending & highly rated"


# ── Public entry point ────────────────────────────────────────────────────────

async def get_recommendations(user: User, db: Session, limit: int = 40) -> List[Dict]:
    profile = _build_user_profile(user, db)

    # 1. Fetch fresh candidates from TMDB (new movies the user hasn't seen)
    raw_tmdb = await _fetch_tmdb_candidates(profile)

    # 2. Upsert into DB so we can score them
    tmdb_candidates = _ensure_movies_in_db(raw_tmdb, db)

    # 3. Also pull top DB movies as additional candidates (for collaborative)
    db_candidates = (
        db.query(Movie)
        .filter(Movie.tmdb_id.notin_(profile["watched_tmdb_ids"]))
        .order_by(Movie.popularity.desc())
        .limit(300)
        .all()
    )

    # Merge, deduplicate
    all_seen_tmdb: set = set()
    candidates: List[Movie] = []
    for m in tmdb_candidates + db_candidates:
        if m.tmdb_id not in all_seen_tmdb and m.tmdb_id not in profile["watched_tmdb_ids"]:
            all_seen_tmdb.add(m.tmdb_id)
            candidates.append(m)

    if not candidates:
        return []

    candidate_tmdb_ids = [m.tmdb_id for m in candidates]
    popularity_map = {m.tmdb_id: m.popularity for m in candidates}

    # 4. Score
    content  = _content_scores(profile["seed_tmdb_ids"], candidates)
    quiz_sc  = _quiz_match_scores(profile, candidates)
    collab   = _collaborative_scores(user.id, candidate_tmdb_ids, db)
    final    = _hybrid(content, quiz_sc, collab, popularity_map)

    # 5. Sort and return top results
    sorted_ids = sorted(final, key=lambda x: final[x], reverse=True)[:limit]
    tmdb_to_movie = {m.tmdb_id: m for m in candidates}

    return [
        {
            "movie": tmdb_to_movie[tid],
            "score": final[tid],
            "reason": _reason(content, quiz_sc, collab, tid),
        }
        for tid in sorted_ids
        if tid in tmdb_to_movie
    ]
