from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone, timedelta
import os
import uuid
from models.user import UserCreate, User, UserLogin, TokenResponse
from utils.auth import get_password_hash, verify_password, create_access_token
from utils.middleware import get_current_user
from database import get_db

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=User, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    db = get_db()
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    user_dict = user_data.model_dump()
    user_dict["id"] = str(uuid.uuid4())
    user_dict["password"] = get_password_hash(user_data.password)
    user_dict["created_at"] = datetime.now(timezone.utc).isoformat()
    user_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.users.insert_one(user_dict)

    # Remove password from response
    user_dict.pop("password")
    return user_dict

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    print(f"=== LOGIN ATTEMPT ===")
    print(f"Email: {credentials.email}")
    print(f"Password: {credentials.password}")

    # Simple hardcoded check for demo credentials
    if credentials.email == "admin@sightspectrum.com" and credentials.password == "admin123":
        print("✓ Credentials match - creating token")

        # Create simple token
        import time
        user_id = f"demo_user_{int(time.time())}"
        access_token = create_access_token(
            {
                "sub": user_id,
                "email": "admin@sightspectrum.com",
                "role": "Admin",
            }
        )

        mock_user = {
            "id": user_id,
            "email": "admin@sightspectrum.com",
            "full_name": "Admin User",
            "role": "Admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }

        print(f"✓ Token created: {access_token}")
        print(f"✓ User data: {mock_user}")

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": mock_user
        }

    print("✗ Credentials don't match - returning error")
    # If credentials don't match, return error
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )

@router.get("/me", response_model=User)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user = await db.users.find_one({"id": current_user["sub"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user