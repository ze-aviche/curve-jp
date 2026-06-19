from sqlalchemy import Column, String, Integer, Float, JSON, Enum, ForeignKey, Text, DateTime, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.core.database import Base


class AuditStatus(str, enum.Enum):
    pending = "pending"
    data_collection = "data_collection"
    analysis = "analysis"
    report_ready = "report_ready"
    completed = "completed"


class DataItemStatus(str, enum.Enum):
    pending = "pending"
    partial = "partial"
    done = "done"
    failed = "failed"


class Client(Base):
    __tablename__ = "clients"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    company_name = Column(String(255), nullable=False)
    industry = Column(String(100))
    company_size_revenue = Column(String(50))
    business_model = Column(String(50))
    contact_name = Column(String(255))
    contact_email = Column(String(255), nullable=False, unique=True)
    contact_phone = Column(String(50))
    agent_count = Column(Integer)
    platform = Column(String(100))
    crm = Column(JSON)  # list of CRM tools
    wfm = Column(JSON)  # list of WFM tools
    channels = Column(JSON)  # list of channels
    geography = Column(JSON)
    pain_points = Column(JSON)
    budget_range = Column(String(50))
    preferred_start_date = Column(DateTime)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    audits = relationship("Audit", back_populates="client")
    users = relationship("User", back_populates="client")


class Audit(Base):
    __tablename__ = "audits"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id = Column(String, ForeignKey("clients.id"), nullable=False)
    status = Column(Enum(AuditStatus), default=AuditStatus.pending)
    overall_score = Column(Integer)
    industry_avg_score = Column(Integer, default=55)
    total_gaps = Column(Integer)
    critical_gaps = Column(Integer)
    high_gaps = Column(Integer)
    medium_gaps = Column(Integer)
    low_gaps = Column(Integer)
    estimated_annual_savings_low = Column(Float)
    estimated_annual_savings_high = Column(Float)
    implementation_cost = Column(Float)
    started_at = Column(DateTime, server_default=func.now())
    delivered_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())

    client = relationship("Client", back_populates="audits")
    data_collection = relationship("DataCollection", back_populates="audit", uselist=False)
    gaps = relationship("Gap", back_populates="audit")


class DataCollection(Base):
    __tablename__ = "data_collections"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    audit_id = Column(String, ForeignKey("audits.id"), nullable=False, unique=True)

    # Layer 1: Platform config
    platform_api_status = Column(Enum(DataItemStatus), default=DataItemStatus.pending)
    platform_api_notes = Column(Text)
    ivr_config_status = Column(Enum(DataItemStatus), default=DataItemStatus.pending)
    routing_config_status = Column(Enum(DataItemStatus), default=DataItemStatus.pending)
    integration_map_status = Column(Enum(DataItemStatus), default=DataItemStatus.pending)

    # Layer 2: Operational metrics
    call_volume_data_status = Column(Enum(DataItemStatus), default=DataItemStatus.pending)
    agent_performance_status = Column(Enum(DataItemStatus), default=DataItemStatus.pending)
    csat_data_status = Column(Enum(DataItemStatus), default=DataItemStatus.pending)
    wfm_data_status = Column(Enum(DataItemStatus), default=DataItemStatus.pending)

    # Layer 3: Call recordings
    recordings_status = Column(Enum(DataItemStatus), default=DataItemStatus.pending)
    recordings_count = Column(Integer, default=0)
    transcripts_status = Column(Enum(DataItemStatus), default=DataItemStatus.pending)

    # Layer 4: System logs
    audit_logs_status = Column(Enum(DataItemStatus), default=DataItemStatus.pending)
    compliance_logs_status = Column(Enum(DataItemStatus), default=DataItemStatus.pending)

    # Layer 5: Org context
    stakeholder_interviews_status = Column(Enum(DataItemStatus), default=DataItemStatus.pending)
    org_chart_status = Column(Enum(DataItemStatus), default=DataItemStatus.pending)

    # QA reports
    qa_reports_status = Column(Enum(DataItemStatus), default=DataItemStatus.pending)

    # Files stored in S3
    s3_keys = Column(JSON, default=list)

    updated_at = Column(DateTime, onupdate=func.now())

    audit = relationship("Audit", back_populates="data_collection")

    @property
    def completion_percentage(self) -> int:
        items = [
            self.platform_api_status, self.ivr_config_status, self.routing_config_status,
            self.integration_map_status, self.call_volume_data_status, self.agent_performance_status,
            self.csat_data_status, self.wfm_data_status, self.recordings_status,
            self.transcripts_status, self.audit_logs_status, self.stakeholder_interviews_status,
            self.qa_reports_status,
        ]
        done_count = sum(1 for item in items if item == DataItemStatus.done)
        partial_count = sum(0.5 for item in items if item == DataItemStatus.partial)
        return int(((done_count + partial_count) / len(items)) * 100)


class Gap(Base):
    __tablename__ = "gaps"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    audit_id = Column(String, ForeignKey("audits.id"), nullable=False)
    feature_name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    feature_number = Column(Integer)
    severity = Column(String(20))  # Critical, High, Medium, Low
    current_state = Column(Text)
    ideal_state = Column(Text)
    business_impact = Column(Text)
    fix_difficulty = Column(String(20))  # Easy, Medium, Hard, Very Hard
    implementation_cost_low = Column(Float)
    implementation_cost_high = Column(Float)
    implementation_timeline_weeks = Column(Integer)
    estimated_annual_roi = Column(Float)
    solution_design = Column(Text)
    status = Column(String(20), default="open")  # open, in_progress, resolved

    audit = relationship("Audit", back_populates="gaps")
