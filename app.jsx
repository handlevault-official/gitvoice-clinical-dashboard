import React, { useState } from 'react';
import Logo from './Logo';

export default function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("Click 'Start Clinical Voice Session' to begin transcribing patient notes...");

  const handleToggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setTranscript("Listening... Speak clearly into your microphone for clinical transcription and AI analysis.");
    } else {
      setTranscript("Session paused. AI summary is ready for review.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* 1. Header with Logo */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <Logo />
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
            System Online
          </span>
        </div>
      </header>

      {/* 2. Main Dashboard Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Voice Recording & Active Session (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-2">Clinical Voice Assistant</h2>
            <p className="text-sm text-slate-500 mb-6">Real-time voice-to-text processing powered by Gemini AI for clinical documentation.</p>
            
            {/* Control Button */}
            <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 mb-6">
              <button 
                onClick={handleToggleRecording}
                className={`px-6 py-3 rounded-xl font-medium text-white shadow-md transition-all flex items-center gap-2 ${
                  isRecording 
                    ? 'bg-rose-500 hover:bg-rose-600 animate-pulse' 
                    : 'bg-sky-500 hover:bg-sky-600'
                }`}
              >
                {isRecording ? 'Stop Recording' : 'Start Clinical Voice Session'}
              </button>
              <span className="text-xs text-slate-400 mt-2">
                {isRecording ? 'Recording in progress...' : 'Click to start voice input'}
              </span>
            </div>

            {/* Live Transcript Box */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Live Transcript / Notes</label>
              <div className="w-full h-36 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 overflow-y-auto">
                {transcript}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Project Details Card */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-base mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
              Project Details
            </h3>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-medium text-slate-500">Status</span>
                <span className="text-emerald-600 font-medium">Production Ready</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-medium text-slate-500">Tech Stack</span>
                <span className="text-slate-800">React, Tailwind, Gemini</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-medium text-slate-500">Version</span>
                <span className="text-slate-800">v1.0.0</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-medium text-slate-500">Node Env</span>
                <span className="text-slate-800">v20</span>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 text-center text-xs text-slate-400">
        GitVoice Clinical Dashboard • Deployed on Netlify (Free Tier)
      </footer>

    </div>
  );
}
