from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.models.client import Client, Audit, DataCollection, Gap, AuditStatus
from app.schemas.client import ClientCreate, ClientOut, AuditOut, DataCollectionStatus, GapOut

router = APIRouter(prefix="/clients", tags=["clients"])


@router.post("/", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
async def create_client(data: ClientCreate, db: AsyncSession = Depends(get_db)):
    client = Client(**data.model_dump())
    db.add(client)
    await db.commit()
    await db.refresh(client)
    # Auto-create audit and data collection records
    audit = Audit(client_id=client.id, status=AuditStatus.pending)
    db.add(audit)
    await db.flush()
    dc = DataCollection(audit_id=audit.id)
    db.add(dc)
    await db.commit()
    return client


@router.get("/", response_model=List[ClientOut])
async def list_clients(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Client).order_by(Client.created_at.desc()))
    return result.scalars().all()


@router.get("/{client_id}", response_model=ClientOut)
async def get_client(client_id: str, db: AsyncSession = Depends(get_db)):
    client = await db.get(Client, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.get("/{client_id}/audit", response_model=AuditOut)
async def get_client_audit(client_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Audit).where(Audit.client_id == client_id).order_by(Audit.created_at.desc()).limit(1)
    )
    audit = result.scalar_one_or_none()
    if not audit:
        raise HTTPException(status_code=404, detail="No audit found for this client")
    return audit


@router.get("/{client_id}/data-collection", response_model=DataCollectionStatus)
async def get_data_collection(client_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(DataCollection)
        .join(Audit, Audit.id == DataCollection.audit_id)
        .where(Audit.client_id == client_id)
        .limit(1)
    )
    dc = result.scalar_one_or_none()
    if not dc:
        raise HTTPException(status_code=404, detail="No data collection record found")
    return dc


@router.get("/{client_id}/gaps", response_model=List[GapOut])
async def get_client_gaps(client_id: str, severity: str = None, db: AsyncSession = Depends(get_db)):
    q = (
        select(Gap)
        .join(Audit, Audit.id == Gap.audit_id)
        .where(Audit.client_id == client_id)
    )
    if severity:
        q = q.where(Gap.severity == severity)
    result = await db.execute(q.order_by(Gap.estimated_annual_roi.desc()))
    return result.scalars().all()
