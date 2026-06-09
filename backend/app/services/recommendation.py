"""
Hybrid recommendation engine:
  final_score = 0.4 * content_score + 0.4 * collaborative_score + 0.2 * popularity_score
"""
import numpy as np
from typing import List, Dict, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
from ..models import Movie, Rating, WatchHistory, User


# ---------- Content-based filtering ----------

def build_movie_soup(movie: Movie) -> str:
    genres = " ".join(g.get("name", "") for g in (movie.genres or []))
    cast = " ".join(c.get("name", "") for c in (movie.cast or [])[:5])
    overview = movie.overview or ""
    return f"{genres} {cast} {overview}"


def compute_content_scores(
    seed_tmdb_ids: List[int],
    candidates: List[Movie],
) -> Dict[int, float]:
    if not seed_tmdb_ids or not candidates:
        return {}

    all_movies = candidates
    soups = [build_movie_soup(m) for m in all_movies]

    tfidf = TfidfVectorizer(stop_words="english", max_features=5000)
    matrix = tfidf.fit_transform(soups)

    seed_indices = [
        i for i, m in enumerate(all_movies) if m.tmdb_id in seed_tmdb_ids
    ]
    if not seed_indices:
        return {}

    seed_vector = matrix[seed_indices].mean(axis=0)
    scores = cosine_similarity(seed_vector, matrix).flatten()

    return {all_movies[i].tmdb_id: float(scores[i]) for i in range(len(all_movies))}


# ---------- Collaborative filtering ----------

def compute_collaborative_scores(
    user_id: int,
    candidate_tmdb_ids: List[int],
    db: Session,
) -> Dict[int, float]:
    all_ratings = db.query(Rating).all()
    if not all_ratings:
        return {}

    # Build user-movie matrix
    users = list({r.user_id for r in all_ratings})
    movies = list({r.movie_id for r in all_ratings})

    if user_id not in users or len(users) < 2:
        return {}

    u_idx = {u: i for i, u in enumerate(users)}
    m_idx = {m: i for i, m in enumerate(movies)}

    matrix = np.zeros((len(users), len(movies)))
    for r in all_ratings:
        matrix[u_idx[r.user_id]][m_idx[r.movie_id]] = r.score

    # Cosine similarity between users
    user_vec = matrix[u_idx[user_id]].reshape(1, -1)
    sim = cosine_similarity(user_vec, matrix).flatten()
    sim[u_idx[user_id]] = 0  # exclude self

    # Weighted average rating per movie
    weighted = sim @ matrix
    sim_sum = np.abs(sim).sum() or 1
    predicted = weighted / sim_sum

    # Map back to tmdb_ids via db movie ids
    movie_objs = db.query(Movie).filter(Movie.id.in_(movies)).all()
    mid_to_tmdb = {m.id: m.tmdb_id for m in movie_objs}

    scores: Dict[int, float] = {}
    for mid, idx in m_idx.items():
        tmdb_id = mid_to_tmdb.get(mid)
        if tmdb_id and tmdb_id in candidate_tmdb_ids:
            scores[tmdb_id] = float(predicted[idx])

    return scores


# ---------- Hybrid ----------

def hybrid_scores(
    content: Dict[int, float],
    collaborative: Dict[int, float],
    popularity: Dict[int, float],
    w_content: float = 0.4,
    w_collab: float = 0.4,
    w_pop: float = 0.2,
) -> Dict[int, float]:
    all_ids = set(content) | set(collaborative) | set(popularity)
    result = {}
    for tid in all_ids:
        score = (
            w_content * content.get(tid, 0.0)
            + w_collab * _normalize(collaborative, tid)
            + w_pop * _normalize(popularity, tid)
        )
        result[tid] = round(score, 6)
    return result


def _normalize(scores: Dict[int, float], key: int) -> float:
    if not scores:
        return 0.0
    min_v, max_v = min(scores.values()), max(scores.values())
    v = scores.get(key, 0.0)
    if max_v == min_v:
        return 0.5
    return (v - min_v) / (max_v - min_v)


def get_recommendations(
    user: User,
    db: Session,
    limit: int = 20,
) -> List[Dict]:
    # Seed movies from watch history + ratings
    watched_ids = [wh.movie_id for wh in user.watch_history]
    rated_ids = [r.movie_id for r in user.ratings]
    seed_db_ids = list(set(watched_ids + rated_ids))

    seed_movies = db.query(Movie).filter(Movie.id.in_(seed_db_ids)).all() if seed_db_ids else []
    seed_tmdb_ids = [m.tmdb_id for m in seed_movies]

    # Get candidate pool (exclude already seen)
    candidates = (
        db.query(Movie)
        .filter(Movie.tmdb_id.notin_(seed_tmdb_ids) if seed_tmdb_ids else True)
        .order_by(Movie.popularity.desc())
        .limit(500)
        .all()
    )

    if not candidates:
        return []

    candidate_tmdb_ids = [m.tmdb_id for m in candidates]
    popularity_map = {m.tmdb_id: m.popularity for m in candidates}

    content = compute_content_scores(seed_tmdb_ids, candidates) if seed_tmdb_ids else {}
    collab = compute_collaborative_scores(user.id, candidate_tmdb_ids, db)
    final = hybrid_scores(content, collab, popularity_map)

    sorted_ids = sorted(final, key=lambda x: final[x], reverse=True)[:limit]
    tmdb_to_movie = {m.tmdb_id: m for m in candidates}

    return [
        {"movie": tmdb_to_movie[tid], "score": final[tid], "reason": _reason(content, collab, tid)}
        for tid in sorted_ids
        if tid in tmdb_to_movie
    ]


def _reason(content: dict, collab: dict, tid: int) -> str:
    if content.get(tid, 0) > 0.3:
        return "Similar to movies you love"
    if collab.get(tid, 0) > 0:
        return "Fans with your taste loved this"
    return "Trending & highly rated"
