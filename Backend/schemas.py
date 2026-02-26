# schemas.py
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserOut(BaseModel):
    id: int
    email: EmailStr
    name: Optional[str] = None
    created_at: Optional[datetime] = None
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ContentOut(BaseModel):
    id: int
    slug: str
    title: str
    description: Optional[str]
    file_path: Optional[str]
    class Config:
        orm_mode = True

class ProgressIn(BaseModel):
    content_id: int
    status: str

class ProgressOut(BaseModel):
    id: int
    user_id: int
    content_id: int
    status: str
    timestamp: datetime
    class Config:
        orm_mode = True

class QuizSubmitItem(BaseModel):
    quiz_id: int
    selected_option: str

class QuizSubmitIn(BaseModel):
    answers: List[QuizSubmitItem]
