from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.db.session import Base

class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)
    name= Column(String, unique=True, index=True,nullable=False)
    location = Column(String, nullable=True)
    users = relationship("User", back_populates="branch")

