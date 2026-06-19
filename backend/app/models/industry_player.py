from sqlalchemy import Column, String, Boolean
import uuid
from app.core.database import Base


class IndustryPlayer(Base):
    __tablename__ = "industry_players"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False, unique=True, index=True)
    category = Column(String(100), nullable=False)
    tier = Column(String(50))  # enterprise, mid-market, smb, api, developer
    is_supported = Column(Boolean, default=True)  # whether we have platform integration
    logo_url = Column(String(500))
    website = Column(String(500))
    api_docs_url = Column(String(500))
    notes = Column(String(1000))
