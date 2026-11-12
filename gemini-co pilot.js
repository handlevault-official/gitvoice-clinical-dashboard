// ==========================================
// GitVoice Gemini Co-Pilot Integration
// ==========================================

// Function para sa AI-powered o backend-connected audio processing (kapag may FastAPI server)
async function processGitVoiceAudio(audioBlob) {
    const formData = new FormData();
    formData.append("file", audioBlob, "nursing_note.webm");

    try {
        const response = await fetch("http://127.0.0.1:8000/api/upload-audio", {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server offline`);
        }

        const data = await response.json();
        displayCopilotResult(data.soap_note, "✅ AI Clinical Note generated successfully! 🩺✨");
        
    } catch (error) {
        console.warn("Backend not active, using core logic & browser simulation fallback:", error);
        
        // Simulation fallback gamit ang core.js functions kung offline ang Python server
        setTimeout(() => {
            const simulatedText = "Patient resting comfortably. Vital signs stable. SBP 120, DBP 80, HR 72, RR 16, Temp 36.5 C, SpO2 98%.";
            
            // Gamitin ang parseVitals at normalizeDictation mula sa core.js
            const vitals = parseVitals(simulatedText);
            const tpl = APP_CONFIG.templates.find(t => t.id === currentTemplateId) || APP_CONFIG.templates[1];
            
            const noteData = {
                tplName: tpl.name,
                created: Date.now(),
                patient: "Ward Bed 302",
                author: "Staff Nurse",
                role: "Nurse",
                vitals: vitals,
                fields: {
                    s: "Patient verbalized feeling well, resting in bed.",
                    o: "Vitals stable as recorded.",
                    a: "Stable clinical condition.",
                    p: "Continue routine ward monitoring."
                }
            };

            const formatted = formatNote(noteData, tpl, { unit: "C", tempUnit: "C" });
            displayCopilotResult(formatted, "✅ AI Simulation Note generated via Core! 🩺✨");
        }, 1000);
    }
}

function displayCopilotResult(noteText, statusMessage) {
    if (typeof updateStatus === 'function') {
        updateStatus(statusMessage, "text-emerald-600 font-semibold");
    }
    
    const resultSection = document.getElementById("resultSection");
    const soapOutput = document.getElementById("soapOutput");
    
    if (soapOutput) {
        if (soapOutput.tagName === "TEXTAREA") {
            soapOutput.value = noteText;
        } else {
            soapOutput.textContent = noteText;
        }
        resultSection.classList.remove("hidden");
    }
}
