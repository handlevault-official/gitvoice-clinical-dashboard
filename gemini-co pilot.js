async function processGitVoiceAudio(audioBlob) {
    const formData = new FormData();
    formData.append("file", audioBlob, "nursing_note.webm");

    try {
        const response = await fetch("http://127.0.0.1:8000/api/upload-audio", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();
        
        updateStatus("✅ Clinical SOAP Note generated! 🩺✨", "text-emerald-600 font-semibold");
        
        // Ipakita ang SOAP Note sa Dashboard
        const resultSection = document.getElementById("resultSection");
        const soapOutput = document.getElementById("soapOutput");
        
        soapOutput.innerText = data.soap_note;
        resultSection.classList.remove("hidden");
        
    } catch (error) {
        console.error("Failed to send audio to backend:", error);
        updateStatus("⚠️ Error: Make sure FastAPI server & GEMINI_API_KEY are active.", "text-amber-600");
    }
}

function copyChart() {
    const text = document.getElementById("soapOutput").innerText;
    navigator.clipboard.writeText(text);
    updateStatus("📋 Copied SOAP Note to clipboard!", "text-blue-600");
}
