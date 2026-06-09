from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List
from ..database import get_db
from ..auth import get_current_user
from ..models import User, WatchHistory, Rating, Watchlist, Movie
from ..schemas import QuizAnswers, RatingCreate, RatingOut, UserOut
from ..services import tmdb

router = APIRouter(prefix="/users", tags=["users"])


@router.post("/quiz")
def submit_quiz(answers: QuizAnswers, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    user.quiz_answers = answers.model_dump()
    user.quiz_completed = True
    db.commit()
    return {"message": "Quiz saved", "quiz_completed": True}


@router.get("/me/watch-history")
def watch_history(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [
        {"movie_id": wh.movie_id, "watched_at": wh.watched_at}
        for wh in user.watch_history
    ]


@router.post("/me/watch-history/{tmdb_id}", status_code=201)
async def add_to_history(tmdb_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    movie = db.query(Movie).filter(Movie.tmdb_id == tmdb_id).first()
    if not movie:
        data = await tmdb.get_movie_detail(tmdb_id)
        movie = Movie(
            tmdb_id=tmdb_id,
            title=data.get("title", ""),
            poster_path=data.get("poster_path"),
            backdrop_path=data.get("backdrop_path"),
            overview=data.get("overview"),
            vote_average=data.get("vote_average", 0),
            release_date=data.get("release_date"),
            genres=data.get("genres", []),
            popularity=data.get("popularity", 0),
            vote_count=data.get("vote_count", 0),
            runtime=data.get("runtime"),
            cast=data.get("credits", {}).get("cast", [])[:10],
            crew=data.get("credits", {}).get("crew", [])[:5],
        )
        db.add(movie)
        db.flush()

    try:
        wh = WatchHistory(user_id=user.id, movie_id=movie.id)
        db.add(wh)
        db.commit()
    except IntegrityError:
        db.rollback()
    return {"message": "Added to watch history"}


@router.post("/me/ratings", response_model=RatingOut, status_code=201)
async def rate_movie(payload: RatingCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    movie = db.query(Movie).filter(Movie.tmdb_id == payload.movie_id).first()
    if not movie:
        raise HTTPException(404, "Movie not found. Add to watch history first.")

    existing = db.query(Rating).filter(Rating.user_id == user.id, Rating.movie_id == movie.id).first()
    if existing:
        existing.score = payload.score
        db.commit()
        db.refresh(existing)
        return existing

    rating = Rating(user_id=user.id, movie_id=movie.id, score=payload.score)
    db.add(rating)
    db.commit()
    db.refresh(rating)
    return rating


@router.get("/me/ratings", response_model=List[RatingOut])
def my_ratings(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return user.ratings


@router.post("/me/watchlist/{tmdb_id}", status_code=201)
async def add_watchlist(tmdb_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    movie = db.query(Movie).filter(Movie.tmdb_id == tmdb_id).first()
    if not movie:
        data = await tmdb.get_movie_detail(tmdb_id)
        movie = Movie(
            tmdb_id=tmdb_id,
            title=data.get("title", ""),
            poster_path=data.get("poster_path"),
            backdrop_path=data.get("backdrop_path"),
            vote_average=data.get("vote_average", 0),
            release_date=data.get("release_date"),
            genres=data.get("genres", []),
            popularity=data.get("popularity", 0),
            vote_count=data.get("vote_count", 0),
        )
        db.add(movie)
        db.flush()

    try:
        wl = Watchlist(user_id=user.id, movie_id=movie.id)
        db.add(wl)
        db.commit()
    except IntegrityError:
        db.rollback()
    return {"message": "Added to watchlist"}


@router.delete("/me/watchlist/{tmdb_id}")
def remove_watchlist(tmdb_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    movie = db.query(Movie).filter(Movie.tmdb_id == tmdb_id).first()
    if not movie:
        raise HTTPException(404, "Movie not in watchlist")
    db.query(Watchlist).filter(Watchlist.user_id == user.id, Watchlist.movie_id == movie.id).delete()
    db.commit()
    return {"message": "Removed from watchlist"}


@router.get("/me/watchlist")
def my_watchlist(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return [
        {"movie_id": wl.movie_id, "added_at": wl.added_at}
        for wl in user.watchlist
    ]
