# 1. Siguraduhing nasa loob ka ng project folder mo
cd GitVoice

# 2. I-initialize ang git kung hindi pa nagagawa
git init

# 3. I-add ang lahat ng files (index.html, voice-processor.js, gemini-copilot.js, main.py, requirements.txt, at .gitignore)
git add .

# 4. I-commit ang buong codebase na may kasamang Gemini AI at Tailwind setup
git commit -m "feat: complete GitVoice clinical dashboard, MediaRecorder, and FastAPI Gemini co-pilot"

# 5. Ayusin ang branch para maging main
git branch -M main

# 6. I-link ang repository papunta sa iyong official GitHub account
git remote add origin https://github.com/handdlevault.official/GitVoice.git

# 7. I-push na nang diretso sa iyong account!
git push -u origin main
