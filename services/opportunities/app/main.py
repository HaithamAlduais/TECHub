from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import gap_analysis, health, opportunities

app = FastAPI(
    title="TECHub Opportunities",
    version="0.0.1",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["Health"])
app.include_router(opportunities.router, tags=["Opportunities"])
app.include_router(gap_analysis.router, tags=["Gap Analysis"])


@app.get("/")
async def root():
    return {"service": "opportunities", "version": "0.0.1"}
