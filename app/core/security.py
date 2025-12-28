import bcrypt
from datetime import datetime, timedelta
from jose import jwt
from typing import Any, Union
from app.core.config import settings


SECRET_KEY = settings.SECRET_KEY
ALGORITHM = settings.ALGORITHM

# Function to hash password using bcrypt
# bcrypt is the modern standard for password hashing
# It automatically handles salt generation and is secure
def get_password_hash(password: str) -> str:
    # Convert password to bytes (bcrypt requires bytes)
    password_bytes = password.encode('utf-8')
    # Generate salt and hash the password
    # bcrypt.gensalt() generates a random salt
    # bcrypt.hashpw() hashes the password with the salt
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password_bytes, salt)
    # Return as string (decode bytes to string for storage)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Convert both password and hash to bytes
    password_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    # bcrypt.checkpw() safely compares password with hash
    # It handles timing attacks automatically
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def create_access_token(subject: Union[str,Any], expires_delta: timedelta =None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)

    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode,SECRET_KEY,algorithm=ALGORITHM)
    return encoded_jwt





