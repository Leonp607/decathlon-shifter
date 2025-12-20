from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings



SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL


#Bridge between python and sqlite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

#sessionmaker instance to create database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#The class that all other models will inherit from (all Tables will be subclasses of this class)
Base = declarative_base()