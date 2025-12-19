from fastapi import FastAPI
from app.db.base import Base
from app.db.session import engine

#Creates all tables when app in running for the first time
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Decathlon Shifter")

@app.get("/")
async def read_root():
    return {"message": "Welcome to Decathlon Shifter!"}
