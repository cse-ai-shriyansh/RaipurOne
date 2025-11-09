# YOLOv8 CCTV Detection - Quick Setup
# Run this script to set up the CCTV detection system

Write-Host "🚀 YOLOv8 CCTV Detection Setup" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Check Python
Write-Host "📦 Checking Python installation..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Python not found! Please install Python 3.8+`n" -ForegroundColor Red
    exit 1
}
Write-Host "✅ $pythonVersion`n" -ForegroundColor Green

# Install dependencies
Write-Host "📦 Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies`n" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed`n" -ForegroundColor Green

# Create directories
Write-Host "📁 Creating directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "screenshots" | Out-Null
New-Item -ItemType Directory -Force -Path "models" | Out-Null
Write-Host "✅ Directories created`n" -ForegroundColor Green

# Download YOLOv8 model (will auto-download on first run)
Write-Host "🤖 YOLOv8 model will auto-download on first run" -ForegroundColor Yellow
Write-Host "   Available models:" -ForegroundColor Cyan
Write-Host "   - yolov8n.pt (fastest, ~6MB)" -ForegroundColor White
Write-Host "   - yolov8s.pt (small, ~22MB)" -ForegroundColor White
Write-Host "   - yolov8m.pt (medium, ~52MB)" -ForegroundColor White
Write-Host "   - yolov8l.pt (large, ~87MB)" -ForegroundColor White
Write-Host "   - yolov8x.pt (extra large, BEST ACCURACY, ~131MB)`n" -ForegroundColor White

Write-Host "✅ Setup Complete!`n" -ForegroundColor Green

Write-Host "🎥 To start CCTV detection:" -ForegroundColor Cyan
Write-Host "   python yolov8_detector.py`n" -ForegroundColor White

Write-Host "⚙️ Configuration:" -ForegroundColor Cyan
Write-Host "   - Edit yolov8_detector.py to change model (line 348)" -ForegroundColor White
Write-Host "   - Change camera source (0 for webcam, RTSP URL for IP camera)" -ForegroundColor White
Write-Host "   - Adjust confidence threshold (default: 0.5)`n" -ForegroundColor White

Write-Host "Press any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
