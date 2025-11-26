@echo off
echo Setting up GitHub repository for CryptoQuant Trading Platform...
echo.
echo Please create a new repository on GitHub first:
echo 1. Go to https://github.com/new
echo 2. Name it: cryptoquant-trading-platform
echo 3. Set it as Public
echo 4. Don't initialize with README
echo 5. Click "Create repository"
echo.
echo After creating the repository, copy the repository URL (HTTPS)
echo It should look like: https://github.com/YOUR_USERNAME/cryptoquant-trading-platform.git
echo.
set /p REPO_URL="Enter the repository URL: "

echo Adding remote origin...
git remote add origin %REPO_URL%

echo Pushing to GitHub...
git push -u origin master

echo Done! Repository setup complete.
pause