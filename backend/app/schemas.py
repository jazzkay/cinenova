from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime


# Auth
class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None


# User
class UserOut(BaseModel):
    id: int
    name: str
    email: str
    avatar_url: Optional[str]
    quiz_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True


class QuizAnswers(BaseModel):
    mood: str
    language: str
    genres: List[str]
    favorite_movies: List[str]


# Movie
class MovieCard(BaseModel):
    id: int
    tmdb_id: int
    title: str
    poster_path: Optional[str]
    backdrop_path: Optional[str]
    vote_average: float
    release_date: Optional[str]
    genres: List[Any]

    class Config:
        from_attributes = True


class MovieDetail(MovieCard):
    overview: Optional[str]
    tagline: Optional[str]
    runtime: Optional[int]
    cast: List[Any]
    crew: List[Any]
    trailer_key: Optional[str]
    imdb_rating: Optional[float]
    awards: Optional[str]
    languages: List[Any]
    popularity: float
    vote_count: int


# Ratings
class RatingCreate(BaseModel):
    movie_id: int
    score: float = Field(ge=0.5, le=5.0)


class RatingOut(BaseModel):
    id: int
    movie_id: int
    score: float
    created_at: datetime

    class Config:
        from_attributes = True


# Recommendation
class RecommendationOut(BaseModel):
    movie: MovieCard
    score: float
    reason: Optional[str]


# Pagination
class PaginatedMovies(BaseModel):
    results: List[MovieCard]
    page: int
    total_pages: int
    total_results: int
