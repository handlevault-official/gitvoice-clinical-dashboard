from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os

app = FastAPI(title="GitVoice Backend", version="1.0.0")

# Enable CORS para maka-connect ang frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "GitVoice Co-Pilot Backend is running 🚀"}

@app.post("/api/upload-audio")
async def upload_audio(file: UploadFile = File(...)):
    # Dito sasalo ng audio file (.webm) mula sa MediaRecorder
    file_location = f"temp_{file.filename}"
    
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
        
    # TODO: Ipasa sa Gemini AI para sa clinical transcription at summarization
    
    return {
        "message": "Audio successfully received by GitVoice Backend!",
        "filename": file.filename
    }
