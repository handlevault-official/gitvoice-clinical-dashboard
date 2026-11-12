# 1. Initialize Git sa project folder mo
git init

# 2. I-add lahat ng files (Walang .gitignore, saksakan ng bilis!)
git add .

# 3. I-commit ang buong GitVoice setup
git commit -m "feat: initialize GitVoice clinical dashboard and co-pilot engine"

# 4. I-link sa iyong official GitHub repository
git branch -M main
git remote add origin https://github.com/handdlevault.official/GitVoice.git

# 5. Push na sa repo!
git push -u origin main
