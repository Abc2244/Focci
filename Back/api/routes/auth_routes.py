import datetime
import os
from bson import ObjectId
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
import jwt

from config.database import mongodb
from models.user import User

router = APIRouter(prefix="/auth", tags=["authentication"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login/")

# Función auxiliar para serializar documentos de MongoDB
def serialize_mongo_document(doc):
    doc["_id"] = str(doc["_id"])
    return doc

@router.post("/register/")
async def register_user(user: User):
    user_collection = mongodb.get_collection("users")
    if await user_collection.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="El email ya está registrado.")
    hashed_password = pwd_context.hash(user.password)
    new_user = {"username": user.username, "email": user.email, "password": hashed_password}
    user_id = await user_collection.insert_one(new_user)
    return {"message": "Usuario registrado", "user_id": str(user_id.inserted_id)}

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@router.post("/login/")
async def login_user(user: UserLogin):
    user_collection = mongodb.get_collection("users")
    user_record = await user_collection.find_one({"email": user.email})
    if not user_record or not pwd_context.verify(user.password, user_record["password"]):
        raise HTTPException(status_code=400, detail="Email o contraseña incorrectos.")
    token = jwt.encode(
        {
            "user_id": str(user_record["_id"]),
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
        },
        os.getenv("SECRET_KEY", "fallback_key"),
        algorithm="HS256"
    )
    return {"access_token": token, "token_type": "bearer"}

@router.get("/me/")
async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, os.getenv("SECRET_KEY", "fallback_key"), algorithms=["HS256"])
        user_id = payload.get("user_id")
        user = await mongodb.get_collection("users").find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return serialize_mongo_document(user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.DecodeError:
        raise HTTPException(status_code=401, detail="Token inválido")
