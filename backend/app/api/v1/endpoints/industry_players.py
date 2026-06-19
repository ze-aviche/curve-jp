from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from app.core.database import get_db
from app.models.industry_player import IndustryPlayer

router = APIRouter(prefix="/industry-players", tags=["industry-players"])


class PlayerOut(BaseModel):
    id: str
    name: str
    category: str
    tier: Optional[str]
    is_supported: bool

    class Config:
        from_attributes = True


@router.get("/", response_model=List[PlayerOut])
async def list_players(
    category: Optional[str] = None,
    tier: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    q = select(IndustryPlayer).order_by(IndustryPlayer.category, IndustryPlayer.name)
    if category:
        q = q.where(IndustryPlayer.category == category)
    if tier:
        q = q.where(IndustryPlayer.tier == tier)
    result = await db.execute(q)
    return result.scalars().all()


@router.get("/categories")
async def list_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(IndustryPlayer.category).distinct())
    return [r[0] for r in result.all()]
