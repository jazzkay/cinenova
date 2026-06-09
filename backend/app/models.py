from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Text,
    ForeignKey, JSON, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=True)
    google_id = Column(String(255), unique=True, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    quiz_completed = Column(Boolean, default=False)
    quiz_answers = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    watch_history = relationship("WatchHistory", back_populates="user", cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="user", cascade="all, delete-orphan")
    watchlist = relationship("Watchlist", back_populates="user", cascade="all, delete-orphan")
    recommendations = relationship("Recommendation", back_populates="user", cascade="all, delete-orphan")


class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    tmdb_id = Column(Integer, unique=True, index=True, nullable=False)
    imdb_id = Column(String(20), nullable=True)
    title = Column(String(500), nullable=False, index=True)
    original_title = Column(String(500), nullable=True)
    overview = Column(Text, nullable=True)
    tagline = Column(String(500), nullable=True)
    poster_path = Column(String(300), nullable=True)
    backdrop_path = Column(String(300), nullable=True)
    release_date = Column(String(20), nullable=True)
    runtime = Column(Integer, nullable=True)
    vote_average = Column(Float, default=0.0)
    vote_count = Column(Integer, default=0)
    popularity = Column(Float, default=0.0)
    genres = Column(JSON, default=list)
    languages = Column(JSON, default=list)
    production_countries = Column(JSON, default=list)
    cast = Column(JSON, default=list)
    crew = Column(JSON, default=list)
    trailer_key = Column(String(50), nullable=True)
    imdb_rating = Column(Float, nullable=True)
    awards = Column(Text, nullable=True)
    tfidf_vector = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    watch_history = relationship("WatchHistory", back_populates="movie")
    ratings = relationship("Rating", back_populates="movie")
    watchlist_entries = relationship("Watchlist", back_populates="movie")


class WatchHistory(Base):
    __tablename__ = "watch_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False)
    watched_at = Column(DateTime(timezone=True), server_default=func.now())
    watch_duration = Column(Integer, nullable=True)

    user = relationship("User", back_populates="watch_history")
    movie = relationship("Movie", back_populates="watch_history")

    __table_args__ = (UniqueConstraint("user_id", "movie_id", name="uq_user_movie_watch"),)


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False)
    score = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="ratings")
    movie = relationship("Movie", back_populates="ratings")

    __table_args__ = (UniqueConstraint("user_id", "movie_id", name="uq_user_movie_rating"),)


class Watchlist(Base):
    __tablename__ = "watchlist"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, ForeignKey("movies.id"), nullable=False)
    added_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="watchlist")
    movie = relationship("Movie", back_populates="watchlist_entries")

    __table_args__ = (UniqueConstraint("user_id", "movie_id", name="uq_user_movie_watchlist"),)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    movie_id = Column(Integer, nullable=False)
    score = Column(Float, nullable=False)
    reason = Column(String(200), nullable=True)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="recommendations")
