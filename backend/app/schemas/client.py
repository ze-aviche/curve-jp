from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime


class ClientCreate(BaseModel):
    company_name: str
    industry: str
    contact_name: str
    contact_email: EmailStr
    contact_phone: Optional[str] = None
    agent_count: Optional[int] = None
    platform: Optional[str] = None
    crm: Optional[List[str]] = []
    wfm: Optional[List[str]] = []
    channels: Optional[List[str]] = []
    pain_points: Optional[List[str]] = []
    budget_range: Optional[str] = None
    notes: Optional[str] = None


class ClientOut(BaseModel):
    id: str
    company_name: str
    industry: str
    contact_name: str
    contact_email: str
    agent_count: Optional[int]
    platform: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AuditOut(BaseModel):
    id: str
    client_id: str
    status: str
    overall_score: Optional[int]
    total_gaps: Optional[int]
    critical_gaps: Optional[int]
    estimated_annual_savings_low: Optional[float]
    estimated_annual_savings_high: Optional[float]
    started_at: datetime

    class Config:
        from_attributes = True


class DataCollectionStatus(BaseModel):
    audit_id: str
    completion_percentage: int
    platform_api_status: str
    ivr_config_status: str
    call_volume_data_status: str
    recordings_status: str
    recordings_count: int
    transcripts_status: str
    stakeholder_interviews_status: str
    qa_reports_status: str
    wfm_data_status: str

    class Config:
        from_attributes = True


class GapOut(BaseModel):
    id: str
    feature_name: str
    category: str
    severity: str
    current_state: Optional[str]
    ideal_state: Optional[str]
    business_impact: Optional[str]
    fix_difficulty: Optional[str]
    implementation_timeline_weeks: Optional[int]
    estimated_annual_roi: Optional[float]

    class Config:
        from_attributes = True
