// GitVoice Gemini Co-Pilot Integration
async function processGitVoiceAudio(audioBlob) {
    const formData = new FormData();
    // I-attach ang recorded blob bilang .webm file
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
        console.log("GitVoice Backend Response:", data);
        
        updateStatus("✅ Co-Pilot received and logged clinical note! 🩺✨", "text-emerald-600 font-semibold");
        
    } catch (error) {
        console.error("Failed to send audio to backend:", error);
        updateStatus("⚠️ Offline Mode: Audio recorded locally (Backend not running).", "text-amber-600");
    }
}
