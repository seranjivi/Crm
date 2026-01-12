from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import sys

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Add backend directory to path for imports
sys.path.insert(0, str(ROOT_DIR))

# Import database functions (don't initialize yet)
from database import init_db, check_db_connection

from routers import auth, users, users_new, clients, partners, leads, leads_new, opportunities, opportunity_collections, sows, activities, settings, dashboard, employee_performance, action_items, sales_activities, forecasts, master

# Create the main app
app = FastAPI(title="Sightspectrum CRM", version="1.0.0")

# Database will be initialized on first request, not at import time

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with /api prefix
app.include_router(auth.router, prefix="/api")
app.include_router(users.router, prefix="/api")
app.include_router(users_new.router, prefix="/api")
app.include_router(clients.router, prefix="/api")
app.include_router(leads_new.router, prefix="/api")
app.include_router(partners.router, prefix="/api")  # Renamed from vendors
app.include_router(opportunities.router, prefix="/api")
app.include_router(opportunity_collections.router, prefix="/api")
app.include_router(action_items.router, prefix="/api")  # NEW
app.include_router(sales_activities.router, prefix="/api")  # NEW
app.include_router(forecasts.router, prefix="/api")  # NEW
app.include_router(sows.router, prefix="/api")
app.include_router(activities.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(employee_performance.router, prefix="/api")
app.include_router(master.router, prefix="/api")  # NEW

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    try:
        init_db()
        db_healthy = await check_db_connection()
        if db_healthy:
            logger.info("Application startup complete - Database connected")
        else:
            logger.warning("Application started but database connection failed")
    except Exception as e:
        logger.error(f"Startup error: {str(e)}")
        # Don't fail startup, let health checks handle it

@app.get("/api")
async def root():
    return {"message": "Sightspectrum CRM API", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    """Basic health check - always returns healthy if app is running"""
    return {"status": "healthy", "service": "api"}

@app.get("/api/health/ready")
async def readiness_check():
    """Readiness check - verifies database connectivity"""
    db_healthy = await check_db_connection()
    if db_healthy:
        return {"status": "ready", "database": "connected"}
    else:
        return {"status": "not_ready", "database": "disconnected"}