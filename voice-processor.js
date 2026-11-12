// GitVoice Universal Audio Recorder (MediaRecorder API + Tailwind UI States)
let mediaRecorder;
let audioChunks = [];

async function startGitVoiceRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            updateStatus("Audio captured! Sending to GitVoice Co-Pilot... ⏳", "text-blue-600");
            
            // Optional: Mag-create ng mini audio player para ma-play back
            showAudioPlayback(audioUrl);
            
            // Ipasa sa ating Gemini Copilot backend
            processGitVoiceAudio(audioBlob);
        };

        mediaRecorder.start();
        
        // Update UI & Tailwind Classes
        updateStatus("🔴 Recording active... Speak clinical notes now.", "text-red-600 font-bold");
        
        const startBtn = document.getElementById("startBtn");
        const stopBtn = document.getElementById("stopBtn");
        
        startBtn.disabled = true;
        startBtn.className = "w-full bg-slate-200 text-slate-400 font-semibold py-3 px-4 rounded-xl cursor-not-allowed transition duration-200 flex items-center justify-center gap-2";
        
        stopBtn.disabled = false;
        stopBtn.className = "w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md cursor-pointer transition duration-200 flex items-center justify-center gap-2";

    } catch (error) {
        console.error("Microphone access error:", error);
        updateStatus("❌ Mic error: Please allow microphone access.", "text-red-600");
    }
}

function stopGitVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        
        // Reset Tailwind Classes
        const startBtn = document.getElementById("startBtn");
        const stopBtn = document.getElementById("stopBtn");
        
        startBtn.disabled = false;
        startBtn.className = "w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-xl shadow-md cursor-pointer transition duration-200 flex items-center justify-center gap-2";
        
        stopBtn.disabled = true;
        stopBtn.className = "w-full bg-slate-200 text-slate-400 font-semibold py-3 px-4 rounded-xl cursor-not-allowed transition duration-200";
    }
}

function updateStatus(message, colorClass = "text-slate-600") {
    const indicator = document.getElementById("statusIndicator");
    indicator.innerText = `Status: ${message}`;
    indicator.className = `mt-6 text-xs font-medium ${colorClass} bg-white p-3 rounded-lg border border-slate-200 shadow-sm`;
}

function showAudioPlayback(url) {
    let playerContainer = document.getElementById("audioPlayerContainer");
    if (!playerContainer) {
        playerContainer = document.createElement("div");
        playerContainer.id = "audioPlayerContainer";
        playerContainer.className = "mt-4";
        document.getElementById("statusIndicator").after(playerContainer);
    }
    playerContainer.innerHTML = `<audio controls src="${url}" class="w-full h-8 rounded-lg"></audio>`;
}
