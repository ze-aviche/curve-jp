"""
Seed script: Industry Players
Run with: python -m migrations.seed_industry_players
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from app.core.config import settings
from app.models.industry_player import IndustryPlayer
from app.core.database import Base

INDUSTRY_PLAYERS = [
    # ─── Cloud Contact Center Platforms ───────────────────────────────────
    ("Genesys Cloud CX", "Cloud Platform", "enterprise", True, "https://www.genesys.com"),
    ("Amazon Connect", "Cloud Platform", "enterprise", True, "https://aws.amazon.com/connect"),
    ("Five9", "Cloud Platform", "mid-market", True, "https://www.five9.com"),
    ("NICE CXone", "Cloud Platform", "enterprise", True, "https://www.nice.com/cxone"),
    ("Talkdesk", "Cloud Platform", "mid-market", True, "https://www.talkdesk.com"),
    ("Twilio Flex", "Cloud Platform", "developer", True, "https://www.twilio.com/flex"),
    ("8x8 Contact Center", "Cloud Platform", "mid-market", False, "https://www.8x8.com"),
    ("RingCentral Contact Center", "Cloud Platform", "mid-market", False, "https://www.ringcentral.com"),
    ("Dialpad Contact Center", "Cloud Platform", "smb", False, "https://www.dialpad.com"),
    ("Vonage Contact Center", "Cloud Platform", "mid-market", False, "https://www.vonage.com"),
    ("Avaya OneCloud CCaaS", "Cloud Platform", "enterprise", False, "https://www.avaya.com"),
    ("Cisco Webex Contact Center", "Cloud Platform", "enterprise", False, "https://www.cisco.com"),
    ("Salesforce Service Cloud Voice", "Cloud Platform", "enterprise", True, "https://www.salesforce.com"),
    ("Microsoft Dynamics 365 CC", "Cloud Platform", "enterprise", False, "https://www.microsoft.com"),
    ("Zendesk Talk", "Cloud Platform", "smb", False, "https://www.zendesk.com"),
    ("Freshdesk Contact Center", "Cloud Platform", "smb", False, "https://www.freshdesk.com"),
    ("Aircall", "Cloud Platform", "smb", False, "https://www.aircall.io"),
    ("CloudTalk", "Cloud Platform", "smb", False, "https://www.cloudtalk.io"),
    ("JustCall", "Cloud Platform", "smb", False, "https://www.justcall.io"),
    ("LiveAgent", "Cloud Platform", "smb", False, "https://www.liveagent.com"),
    ("Nextiva", "Cloud Platform", "smb", False, "https://www.nextiva.com"),
    ("GoTo Contact", "Cloud Platform", "smb", False, "https://www.goto.com"),
    ("3CX", "Cloud Platform", "smb", False, "https://www.3cx.com"),
    ("Zoom Contact Center", "Cloud Platform", "mid-market", False, "https://www.zoom.us"),
    ("Bandwidth", "Cloud Platform", "developer", False, "https://www.bandwidth.com"),

    # ─── On-Premise / Hybrid ─────────────────────────────────────────────
    ("Genesys PureConnect", "On-Premise", "enterprise", True, "https://www.genesys.com"),
    ("Avaya Aura", "On-Premise", "enterprise", False, "https://www.avaya.com"),
    ("Cisco Unified Contact Center Enterprise", "On-Premise", "enterprise", False, "https://www.cisco.com"),
    ("Cisco Unified Contact Center Express", "On-Premise", "mid-market", False, "https://www.cisco.com"),
    ("Mitel MiContact Center", "On-Premise", "mid-market", False, "https://www.mitel.com"),
    ("Enghouse Interactive", "On-Premise", "mid-market", False, "https://www.enghouseinteractive.com"),
    ("Aspect Unified IP", "On-Premise", "enterprise", False, "https://www.aspect.com"),

    # ─── Speech AI & Transcription ────────────────────────────────────────
    ("Deepgram", "Speech AI", "api", True, "https://www.deepgram.com"),
    ("AssemblyAI", "Speech AI", "api", True, "https://www.assemblyai.com"),
    ("Nuance Communications", "Speech AI", "enterprise", False, "https://www.nuance.com"),
    ("Google CCAI (Dialogflow CX)", "Speech AI", "enterprise", True, "https://cloud.google.com/dialogflow"),
    ("Amazon Transcribe", "Speech AI", "api", True, "https://aws.amazon.com/transcribe"),
    ("Microsoft Azure Speech", "Speech AI", "api", False, "https://azure.microsoft.com/en-us/services/cognitive-services/speech-services"),
    ("Speechmatics", "Speech AI", "api", False, "https://www.speechmatics.com"),
    ("Rev.ai", "Speech AI", "api", False, "https://www.rev.ai"),

    # ─── Conversational AI / Virtual Agents ──────────────────────────────
    ("IBM Watson Assistant", "Conversational AI", "enterprise", False, "https://www.ibm.com/products/watson-assistant"),
    ("LivePerson Conversational Cloud", "Conversational AI", "enterprise", False, "https://www.liveperson.com"),
    ("Kore.ai", "Conversational AI", "mid-market", False, "https://www.kore.ai"),
    ("Yellow.ai", "Conversational AI", "mid-market", False, "https://www.yellow.ai"),
    ("Avaamo", "Conversational AI", "enterprise", False, "https://www.avaamo.ai"),
    ("Cognigy", "Conversational AI", "enterprise", False, "https://www.cognigy.com"),

    # ─── Analytics & Quality Management ──────────────────────────────────
    ("Verint Systems", "Analytics", "enterprise", False, "https://www.verint.com"),
    ("Calabrio", "Analytics", "mid-market", False, "https://www.calabrio.com"),
    ("NICE Enlighten AI", "Analytics", "enterprise", False, "https://www.nice.com"),
    ("Observe.AI", "Analytics", "mid-market", True, "https://www.observe.ai"),
    ("Level AI", "Analytics", "mid-market", False, "https://www.thelevel.ai"),
    ("Tethr", "Analytics", "mid-market", False, "https://www.tethr.com"),
    ("MaestroQA", "Analytics", "mid-market", False, "https://www.maestroqa.com"),
    ("EvaluAgent", "Analytics", "smb", False, "https://www.evaluagent.com"),
    ("Qualtrics XM", "Analytics", "enterprise", False, "https://www.qualtrics.com"),
    ("Medallia", "Analytics", "enterprise", False, "https://www.medallia.com"),

    # ─── Real-Time AI Coaching ────────────────────────────────────────────
    ("Cogito", "Real-Time AI", "enterprise", False, "https://www.cogitocorp.com"),
    ("Balto", "Real-Time AI", "mid-market", False, "https://www.balto.ai"),
    ("Cresta", "Real-Time AI", "enterprise", False, "https://www.cresta.com"),
    ("Assembled", "Real-Time AI", "mid-market", False, "https://www.assembled.com"),

    # ─── Workforce Management ─────────────────────────────────────────────
    ("NICE IEX WFM", "Workforce Management", "enterprise", False, "https://www.nice.com"),
    ("Verint WFM", "Workforce Management", "enterprise", False, "https://www.verint.com"),
    ("Calabrio WFM", "Workforce Management", "mid-market", False, "https://www.calabrio.com"),
    ("Aspect Workforce", "Workforce Management", "mid-market", False, "https://www.aspect.com"),
    ("Genesys WFM", "Workforce Management", "enterprise", True, "https://www.genesys.com"),
    ("NICE WFM (formerly IEX)", "Workforce Management", "enterprise", False, "https://www.nice.com"),
    ("Injixo", "Workforce Management", "mid-market", False, "https://www.injixo.com"),
    ("Playvs / Tymeshift", "Workforce Management", "smb", False, "https://www.tymeshift.com"),

    # ─── CRM ─────────────────────────────────────────────────────────────
    ("Salesforce Service Cloud", "CRM", "enterprise", True, "https://www.salesforce.com"),
    ("HubSpot Service Hub", "CRM", "mid-market", True, "https://www.hubspot.com"),
    ("Zendesk Support", "CRM", "mid-market", True, "https://www.zendesk.com"),
    ("ServiceNow CSM", "CRM", "enterprise", False, "https://www.servicenow.com"),
    ("Microsoft Dynamics 365 CS", "CRM", "enterprise", False, "https://www.microsoft.com"),
    ("Freshservice", "CRM", "smb", False, "https://www.freshservice.com"),
    ("Zoho CRM", "CRM", "smb", False, "https://www.zoho.com"),
    ("Oracle Service Cloud", "CRM", "enterprise", False, "https://www.oracle.com"),

    # ─── Omnichannel / CX Platforms ───────────────────────────────────────
    ("Sprinklr", "CX Platform", "enterprise", False, "https://www.sprinklr.com"),
    ("Khoros", "CX Platform", "enterprise", False, "https://khoros.com"),
    ("Gladly", "CX Platform", "mid-market", False, "https://www.gladly.com"),
    ("Kustomer", "CX Platform", "mid-market", False, "https://www.kustomer.com"),

    # ─── Fraud & Identity ─────────────────────────────────────────────────
    ("Nuance Gatekeeper", "Fraud & Identity", "enterprise", False, "https://www.nuance.com"),
    ("Pindrop", "Fraud & Identity", "enterprise", False, "https://www.pindrop.com"),
    ("Verint Voice Biometrics", "Fraud & Identity", "enterprise", False, "https://www.verint.com"),
    ("Aware", "Fraud & Identity", "enterprise", False, "https://www.aware.com"),
]


async def seed():
    engine = create_async_engine(settings.DATABASE_URL, echo=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        for name, category, tier, is_supported, website in INDUSTRY_PLAYERS:
            player = IndustryPlayer(
                name=name,
                category=category,
                tier=tier,
                is_supported=is_supported,
                website=website,
            )
            session.add(player)
        await session.commit()
        print(f"✓ Seeded {len(INDUSTRY_PLAYERS)} industry players")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
