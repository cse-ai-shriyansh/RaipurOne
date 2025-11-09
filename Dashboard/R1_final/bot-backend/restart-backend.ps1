# Backend Server Restart Script
# This script safely stops any existing backend process and starts a new one

Write-Host "🔍 Checking for existing backend process on port 3001..." -ForegroundColor Cyan

# Find process using port 3001
$processInfo = netstat -ano | Select-String ":3001" | Select-Object -First 1
if ($processInfo) {
    $processId = ($processInfo -split '\s+')[-1]
    Write-Host "⚠️  Found existing process (PID: $processId)" -ForegroundColor Yellow
    Write-Host "🛑 Stopping old backend process..." -ForegroundColor Yellow
    
    try {
        Stop-Process -Id $processId -Force -ErrorAction Stop
        Write-Host "✅ Old backend stopped successfully" -ForegroundColor Green
        Start-Sleep -Seconds 2
    } catch {
        Write-Host "❌ Could not stop process: $_" -ForegroundColor Red
        Write-Host "💡 You may need to run as Administrator" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✅ No existing backend process found" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Starting backend server..." -ForegroundColor Cyan
Write-Host "📍 Location: $PSScriptRoot" -ForegroundColor Gray
Write-Host ""

# Start the backend
npm start
