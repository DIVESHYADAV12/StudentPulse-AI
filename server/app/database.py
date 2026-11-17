from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
from typing import Dict, Any, Optional, List
import logging
import uuid
from datetime import datetime

logger = logging.getLogger("studentpulse.database")

class Database:
    client: AsyncIOMotorClient = None
    db = None
    is_connected: bool = False

db_instance = Database()

# Pre-seeded demo account hash for password 'password123'
DEMO_PASSWORD_HASH = "$2b$12$u9.vTiLQOxGNybKUB3wMMe4OkgCgtj.3n1DPNbH/Y3rc88Bh9LYMq"

# In-memory storage fallback for offline / pre-MongoDB setup development
memory_store: Dict[str, Dict[str, Any]] = {
    "users": {
        "demo-student-id": {
            "id": "demo-student-id",
            "email": "student@university.edu",
            "full_name": "Alex Chen (Demo Student)",
            "hashed_password": DEMO_PASSWORD_HASH,
            "is_active": True,
            "created_at": datetime.utcnow()
        }
    },
    "student_profiles": {
        "demo-student-id": {
            "id": "demo-profile-id",
            "user_id": "demo-student-id",
            "education": {
                "university": "State University",
                "degree": "B.Tech Computer Science",
                "grad_year": 2026,
                "cgpa": 3.8
            },
            "skills": [
                {"name": "Python", "category": "languages", "proficiency": "intermediate"},
                {"name": "JavaScript", "category": "languages", "proficiency": "intermediate"},
                {"name": "React", "category": "frameworks", "proficiency": "intermediate"},
                {"name": "FastAPI", "category": "frameworks", "proficiency": "beginner"},
                {"name": "SQL", "category": "databases", "proficiency": "beginner"}
            ],
            "projects": [
                {
                    "id": "demo-proj-1",
                    "title": "Student Career Readiness Platform",
                    "description": "Built full-stack companion with FastAPI and React to benchmark skills.",
                    "tech_stack": ["React", "FastAPI", "Tailwind CSS"],
                    "github_url": "https://github.com/alexchen/career-pulse",
                    "live_url": "http://localhost:5173"
                }
            ],
            "target_roles": ["Full-Stack Developer", "Backend Developer"],
            "github_username": "alexchen",
            "readiness_score": 42.5,
            "updated_at": datetime.utcnow()
        }
    },
    "role_benchmarks": {},
    "skill_analyses": {},
    "mock_interviews": {},
    "action_plans": {},
    "chat_sessions": {}
}

async def connect_to_mongo():
    logger.info("Connecting to MongoDB...")
    try:
        if "username:password@" in settings.MONGODB_URI:
            logger.info("Placeholder MongoDB URI detected in .env. Running in in-memory developer fallback mode.")
            db_instance.is_connected = False
            return

        db_instance.client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            serverSelectionTimeoutMS=3000
        )
        db_instance.db = db_instance.client[settings.MONGODB_DB_NAME]
        await db_instance.client.admin.command('ping')
        db_instance.is_connected = True
        logger.info(f"Successfully connected to MongoDB: {settings.MONGODB_DB_NAME}")
        
        # Ensure demo user exists in MongoDB as well
        existing_demo = await db_instance.db["users"].find_one({"email": "student@university.edu"})
        if not existing_demo:
            demo_user = memory_store["users"]["demo-student-id"].copy()
            del demo_user["id"]
            res = await db_instance.db["users"].insert_one(demo_user)
            demo_profile = memory_store["student_profiles"]["demo-student-id"].copy()
            demo_profile["user_id"] = str(res.inserted_id)
            del demo_profile["id"]
            await db_instance.db["student_profiles"].insert_one(demo_profile)
            logger.info("Seeded demo user into MongoDB Atlas.")

    except Exception as e:
        db_instance.is_connected = False
        logger.warning(f"Could not connect to MongoDB Atlas ({e}). Running in developer in-memory fallback mode.")

async def close_mongo_connection():
    if db_instance.client:
        db_instance.client.close()
        logger.info("MongoDB connection closed.")

def is_db_connected() -> bool:
    return db_instance.is_connected

# Universal CRUD Helpers with Automatic Fallback

async def find_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    if is_db_connected():
        user = await db_instance.db["users"].find_one({"email": email.lower()})
        if user:
            user["id"] = str(user.pop("_id"))
        return user
    
    # Fallback
    for u in memory_store["users"].values():
        if u["email"].lower() == email.lower():
            return u
    return None

async def find_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    if is_db_connected():
        from bson import ObjectId
        try:
            user = await db_instance.db["users"].find_one({"_id": ObjectId(user_id)})
            if user:
                user["id"] = str(user.pop("_id"))
            return user
        except Exception:
            return None
    return memory_store["users"].get(user_id)

async def insert_user(user_data: Dict[str, Any]) -> Dict[str, Any]:
    user_data["email"] = user_data["email"].lower()
    user_data["created_at"] = datetime.utcnow()
    
    if is_db_connected():
        result = await db_instance.db["users"].insert_one(user_data)
        user_data["id"] = str(result.inserted_id)
        if "_id" in user_data:
            del user_data["_id"]
        return user_data
    
    # Fallback
    user_id = str(uuid.uuid4())
    user_data["id"] = user_id
    memory_store["users"][user_id] = user_data
    return user_data

async def get_or_create_profile(user_id: str) -> Dict[str, Any]:
    if is_db_connected():
        profile = await db_instance.db["student_profiles"].find_one({"user_id": user_id})
        if profile:
            profile["id"] = str(profile.pop("_id"))
            return profile
        
        # Create default
        new_profile = {
            "user_id": user_id,
            "education": {"university": "State University", "degree": "Computer Science", "grad_year": 2026, "cgpa": 3.8},
            "skills": [
                {"name": "Python", "category": "languages", "proficiency": "intermediate"},
                {"name": "JavaScript", "category": "languages", "proficiency": "intermediate"},
                {"name": "React", "category": "frameworks", "proficiency": "intermediate"}
            ],
            "projects": [],
            "target_roles": ["Full-Stack Developer"],
            "github_username": None,
            "readiness_score": 38.0,
            "updated_at": datetime.utcnow()
        }
        res = await db_instance.db["student_profiles"].insert_one(new_profile)
        new_profile["id"] = str(res.inserted_id)
        if "_id" in new_profile:
            del new_profile["_id"]
        return new_profile

    # Fallback
    if user_id in memory_store["student_profiles"]:
        return memory_store["student_profiles"][user_id]

    default_profile = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "education": {"university": "State University", "degree": "Computer Science", "grad_year": 2026, "cgpa": 3.8},
        "skills": [
            {"name": "Python", "category": "languages", "proficiency": "intermediate"},
            {"name": "JavaScript", "category": "languages", "proficiency": "intermediate"},
            {"name": "React", "category": "frameworks", "proficiency": "intermediate"}
        ],
        "projects": [],
        "target_roles": ["Full-Stack Developer"],
        "github_username": None,
        "readiness_score": 38.0,
        "updated_at": datetime.utcnow()
    }
    memory_store["student_profiles"][user_id] = default_profile
    return default_profile

async def update_profile(user_id: str, update_dict: Dict[str, Any]) -> Dict[str, Any]:
    update_dict["updated_at"] = datetime.utcnow()
    
    if is_db_connected():
        await db_instance.db["student_profiles"].update_one(
            {"user_id": user_id},
            {"$set": update_dict},
            upsert=True
        )
        return await get_or_create_profile(user_id)

    # Fallback
    profile = await get_or_create_profile(user_id)
    profile.update(update_dict)
    memory_store["student_profiles"][user_id] = profile
    return profile
