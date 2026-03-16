from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import cv, health, import_center, integrations, onboarding

app = FastAPI(
    title="TECHub CV Aggregator",
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
app.include_router(cv.router, tags=["CV"])
app.include_router(integrations.router, tags=["Integrations"])
app.include_router(import_center.router, tags=["Import"])
app.include_router(onboarding.router, tags=["Onboarding"])


@app.get("/")
async def root():
    return {"service": "cv-aggregator", "version": "0.0.1"}
