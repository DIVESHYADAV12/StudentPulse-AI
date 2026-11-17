from fastapi import APIRouter, HTTPException, status, Depends
from app.models.user import UserCreate, UserLogin, UserResponse, Token
from app.core.security import hash_password, verify_password, create_access_token
from app.core.dependencies import get_current_user
from app.database import find_user_by_email, insert_user, get_or_create_profile, DEMO_PASSWORD_HASH
from datetime import timedelta
from typing import Dict, Any

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate):
    existing_user = await find_user_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists"
        )
    
    hashed_password = hash_password(user_in.password)
    user_record = {
        "email": user_in.email,
        "full_name": user_in.full_name,
        "hashed_password": hashed_password,
        "is_active": True
    }
    
    created_user = await insert_user(user_record)
    
    # Initialize their student profile
    await get_or_create_profile(created_user["id"])
    
    # Generate JWT token
    access_token = create_access_token(data={"sub": created_user["id"], "email": created_user["email"]})
    
    user_response = UserResponse(
        id=created_user["id"],
        email=created_user["email"],
        full_name=created_user["full_name"],
        is_active=created_user["is_active"],
        created_at=created_user["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    email_clean = credentials.email.strip().lower()
    user = await find_user_by_email(email_clean)
    
    # Auto-seed demo account if it doesn't exist
    if not user and email_clean == "student@university.edu":
        demo_record = {
            "email": "student@university.edu",
            "full_name": "Alex Chen (Demo Student)",
            "hashed_password": DEMO_PASSWORD_HASH,
            "is_active": True
        }
        user = await insert_user(demo_record)
        await get_or_create_profile(user["id"])

    if not user or not verify_password(credentials.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = create_access_token(data={"sub": user["id"], "email": user["email"]})
    
    user_response = UserResponse(
        id=user["id"],
        email=user["email"],
        full_name=user["full_name"],
        is_active=user.get("is_active", True),
        created_at=user["created_at"]
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_response)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user["full_name"],
        is_active=current_user.get("is_active", True),
        created_at=current_user["created_at"]
    )
