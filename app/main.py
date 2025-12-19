from fastapi import FastAPI

app = FastAPI(title="Decathlon Shifter")

@app.get("/")
async def read_root():
    return {"message": "Welcome to Decathlon Shifter!"}
