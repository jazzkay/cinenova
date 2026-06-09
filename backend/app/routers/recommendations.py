from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..auth import get_current_user
from ..models import User
from ..services.recommendation import get_recommendations

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


@router.get("/")
def recommendations(
    limit: int = 20,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    results = get_recommendations(user, db, limit=limit)
    return [
        {
            "tmdb_id": r["movie"].tmdb_id,
            "title": r["movie"].title,
            "poster_path": r["movie"].poster_path,
            "vote_average": r["movie"].vote_average,
            "score": r["score"],
            "reason": r["reason"],
        }
        for r in results
    ]
