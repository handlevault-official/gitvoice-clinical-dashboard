import os
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from google import genai

# I-load ang GEMINI_API_KEY mula sa .env file
load_dotenv()

app = FastAPI(title="GitVoice Clinical Co-Pilot API", version="1.0.0")

# Enable CORS para maka-connect ang index.html
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini Client
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

CLINICAL_PROMPT = """
You are GitVoice, an expert clinical nursing assistant. 
Listen carefully to the nurse's spoken audio note and convert it into a concise, accurate, and professional hospital SOAP Note.

Format the output cleanly as follows:
- **Patient / Room:** (Extract if mentioned, otherwise "Not specified")
- **S (Subjective):** Patient's reported symptoms or complaints.
- **O (Objective):** Vital signs, physical observations, and medications administered.
- **A (Assessment):** Clinical status or nursing assessment.
- **P (Plan):** Next steps, monitoring, or follow-up actions.

Keep medical terminology accurate and concise for 3 AM ward charting.
"""

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "GitVoice Clinical Co-Pilot",
        "gemini_configured": bool(api_key)
    }

@app.post("/api/upload-audio")
async def process_clinical_audio(file: UploadFile = File(...)):
    if not client:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY is missing in .env file.")

    temp_filename = f"temp_{file.filename}"
    
    try:
        # 1. I-save pansamantala ang audio mula sa browser
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # 2. I-upload ang audio file sa Gemini Files API
        uploaded_audio = client.files.upload(file=temp_filename)

        # 3. Ipasa sa Gemini 2.5 Flash para i-transcribe at gawing SOAP Note
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[uploaded_audio, CLINICAL_PROMPT]
        )

        # 4. Linisin ang temporary file sa Gemini at sa local folder
        client.files.delete(name=uploaded_audio.name)
        
        return {
            "status": "success",
            "soap_note": response.text
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        # Siguraduhing mabubura ang local temp audio file (Privacy & Clean Repo)
        if os.path.exists(temp_filename):
            os.remove(temp_filename)
