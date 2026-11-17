from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.database import connect_to_mongo, close_mongo_connection, db_instance, is_db_connected
from app.routes import auth, profile, skill_gap, dashboard, action_plan, interview, mentor
import logging

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("studentpulse")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("Starting StudentPulse AI Backend...")
    await connect_to_mongo()
    yield
    # Shutdown
    logger.info("Shutting down StudentPulse AI Backend...")
    await close_mongo_connection()

app = FastAPI(
    title="StudentPulse AI API",
    description="Your AI-Powered Career Readiness Companion API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include All Routers
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(skill_gap.router)
app.include_router(dashboard.router)
app.include_router(action_plan.router)
app.include_router(interview.router)
app.include_router(mentor.router)

@app.get("/")
async def root():
    return {
        "message": "Welcome to StudentPulse AI API",
        "version": "1.0.0",
        "status": "online",
        "docs_url": "/docs"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "database_connected": is_db_connected(),
        "gemini_api_configured": bool(settings.GEMINI_API_KEY),
        "environment": settings.ENVIRONMENT
    }
