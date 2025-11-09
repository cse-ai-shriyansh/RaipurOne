# Install all dependencies script for Windows

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Installing Telegram Bot System" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
$nodeVersion = node --version 2>&1
if ($?) {
    Write-Host "✅ Node.js $nodeVersion found" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js not found! Please install from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check if MongoDB is installed
Write-Host ""
Write-Host "Checking MongoDB..." -ForegroundColor Yellow
$mongoVersion = mongosh --version 2>&1
if ($?) {
    Write-Host "✅ MongoDB $mongoVersion found" -ForegroundColor Green
} else {
    Write-Host "⚠️  MongoDB not found. Please install from https://www.mongodb.com/try/download/community" -ForegroundColor Yellow
}

# Install backend dependencies
Write-Host ""
Write-Host "Installing Backend Dependencies..." -ForegroundColor Yellow
Push-Location "bot-backend"
npm install
if ($?) {
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# Install frontend dependencies
Write-Host ""
Write-Host "Installing Frontend Dependencies..." -ForegroundColor Yellow
Push-Location "dashboard-frontend"
npm install
if ($?) {
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to install frontend dependencies" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location

# Create .env files if they don't exist
Write-Host ""
Write-Host "Creating .env files..." -ForegroundColor Yellow

if (-not (Test-Path "bot-backend\.env")) {
    Copy-Item "bot-backend\.env.example" "bot-backend\.env"
    Write-Host "✅ Created bot-backend\.env (UPDATE WITH YOUR TELEGRAM BOT TOKEN!)" -ForegroundColor Green
} else {
    Write-Host "ℹ️  bot-backend\.env already exists" -ForegroundColor Cyan
}

if (-not (Test-Path "dashboard-frontend\.env")) {
    @"
REACT_APP_API_URL=http://localhost:3001/api
"@ | Out-File "dashboard-frontend\.env" -Encoding UTF8
    Write-Host "✅ Created dashboard-frontend\.env" -ForegroundColor Green
} else {
    Write-Host "ℹ️  dashboard-frontend\.env already exists" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Installation Complete! 🎉" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Get your Telegram bot token from @BotFather" -ForegroundColor White
Write-Host "2. Update bot-backend\.env with your token" -ForegroundColor White
Write-Host "3. Ensure MongoDB is running (mongosh)" -ForegroundColor White
Write-Host "4. Open 2 PowerShell terminals and run:" -ForegroundColor White
Write-Host "   Terminal 1: cd bot-backend && npm start" -ForegroundColor Cyan
Write-Host "   Terminal 2: cd dashboard-frontend && npm start" -ForegroundColor Cyan
Write-Host "5. Test the bot in Telegram with /start" -ForegroundColor White
Write-Host ""
