# 🎙️ GitVoice
> *Enterprise-grade, voice-powered clinical dashboard built for nurses.*

![GitVoice Dashboard Preview](gitvoice-preview.png)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20Me-rose?style=for-the-badge&logo=ko-fi)](https://ko-fi.com/handlevaultofficial)
[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-%E2%99%A5_GitHub-ea4aaa?style=for-the-badge&logo=githubsponsors&logoColor=white)](https://github.com/sponsors/handdlevault-official)

---

## 💡 About GitVoice
**GitVoice** is an innovative healthcare software solution designed to eliminate manual documentation fatigue in hospital wards. By leveraging browser speech recognition, modular core logic (`core.js`), and smart AI co-pilots (`gemini-copilot.js`), GitVoice transforms spoken nursing notes into structured, instant medical records. 

*Talk less, care more. 🩺✨*

---

## ✨ Core Features
- **Universal Voice Dictation:** Powered by native browser speech recognition for real-time live subtitles and seamless, plugin-free clinical voice logging across all desktop, tablet, and mobile devices.
- **Modular Core Logic (`core.js`):** Clean separation of clinical templates (SOAP, DAR, SBAR, I-PASS), vital signs auto-parsing, and text normalization.
- **Persistent Local Storage (`storage-manager.js`):** Ensures patient notes and logs remain securely saved in the browser across shifts and page reloads.
- **GitVoice Co-Pilot:** Intelligent assistant architecture built to process voice commands, clinical notes, and medical workflows in real-time.
- **Secure & Version-Controlled:** Built under strict standards with full open-source MIT compliance.

---

## 🛠️ Tech Stack
* **Frontend:** HTML5, Tailwind CSS, Modern JavaScript
* **Core Logic & Storage:** `core.js`, `storage-manager.js`
* **AI & Voice Processing:** Gemini AI Copilot Integration (`gemini-copilot.js`) & Web Speech API
* **Backend (Optional):** Python, FastAPI, Uvicorn, Pydub
* **Versioning & Organization:** Managed under `handdlevault-official`

---

## 📂 Project Structure
```text
GitVoice/
│
├── index.html            # Main mobile-responsive clinical dashboard UI
├── core.js               # Clinical data parsing, vitals & templates core logic
├── storage-manager.js    # LocalStorage handler for persistent charts
├── gemini-copilot.js     # AI co-pilot logic & processing fallback
├── main.py               # FastAPI backend server (Python)
├── requirements.txt      # Python dependencies
├── .gitignore            # Audio recordings & temp file filters
└── LICENSE               # MIT Open Source License

🚀 Quick Start Guide
1. Clone the Repository
git clone https://github.com/handdlevault-official/handdlevault-official-GitVoice.git
cd handdlevault-official-GitVoice

2. Run the Frontend
Simply open index.html in any modern web browser (Google Chrome recommended) to access the dashboard interface and test the voice recording features.

3. Set Up the Backend (Optional - Python/FastAPI)

# Install required dependencies
pip install -r requirements.txt

# Run the backend server
uvicorn main:app --reload

📄 License
Distributed under the MIT License. See the LICENSE file for more information.
Managed by handdlevault-official 🚀


Kopyahin mo lang iyan at i-update sa iyong `README.md` sa GitHub repository para maging malinis, propesyonal, at sakto sa ating code files ang buong pahina!
