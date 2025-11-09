# Municipal Departments Test Script

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Testing Municipal Departments" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if backend is running
Write-Host "Test 1: Checking backend status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing
    Write-Host "✅ Backend is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend not running. Start it first!" -ForegroundColor Red
    exit 1
}

# Test 2: Create test tickets for each department
Write-Host ""
Write-Host "Test 2: Creating test tickets..." -ForegroundColor Yellow

$testTickets = @(
    @{ query = "Large pothole on Main Street causing vehicle damage"; department = "roadway" },
    @{ query = "Garbage not collected for 3 days, bags piling up"; department = "cleaning" },
    @{ query = "Blocked drain causing flooding in residential area"; department = "drainage" },
    @{ query = "No water supply since morning, entire block affected"; department = "water-supply" }
)

foreach ($ticket in $testTickets) {
    $body = @{
        userId = "TEST_USER_001"
        username = "test_admin"
        firstName = "Test"
        lastName = "Admin"
        query = $ticket.query
        category = "general"
    } | ConvertTo-Json

    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/tickets" `
            -Method Post `
            -ContentType "application/json" `
            -Body $body `
            -UseBasicParsing
        
        $ticketData = ($response.Content | ConvertFrom-Json).data
        Write-Host "✅ Created ticket: $($ticketData.ticketId) - $($ticket.department)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to create ticket for $($ticket.department)" -ForegroundColor Red
    }
}

# Test 3: Analyze all tickets
Write-Host ""
Write-Host "Test 3: Analyzing tickets with Gemini AI..." -ForegroundColor Yellow
Write-Host "⏳ This may take a few seconds..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/analysis/analyze-all" `
        -Method Post `
        -ContentType "application/json" `
        -UseBasicParsing
    
    $result = $response.Content | ConvertFrom-Json
    Write-Host "✅ Analysis complete: $($result.processed) processed, $($result.failed) failed" -ForegroundColor Green
    
    if ($result.processed -gt 0) {
        Write-Host "   Results:" -ForegroundColor Cyan
        foreach ($item in $result.results) {
            if ($item.success) {
                Write-Host "   - $($item.ticketId): $($item.department) ($($item.requestType))" -ForegroundColor White
            }
        }
    }
} catch {
    Write-Host "❌ Analysis failed: $_" -ForegroundColor Red
}

# Test 4: Get department statistics
Write-Host ""
Write-Host "Test 4: Fetching department statistics..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/analysis/departments/stats" -UseBasicParsing
    $stats = ($response.Content | ConvertFrom-Json).data
    
    Write-Host "✅ Statistics retrieved" -ForegroundColor Green
    Write-Host "   Total analyzed tickets: $($stats.total)" -ForegroundColor Cyan
    
    if ($stats.byDepartment.Count -gt 0) {
        Write-Host "   By Department:" -ForegroundColor Cyan
        foreach ($dept in $stats.byDepartment) {
            $icon = switch ($dept._id) {
                "roadway" { "🛣️" }
                "cleaning" { "🧹" }
                "drainage" { "🚰" }
                "water-supply" { "💧" }
                "general" { "📋" }
                default { "📁" }
            }
            Write-Host "   $icon $($dept._id): $($dept.count) tickets" -ForegroundColor White
        }
    }
    
    if ($stats.byRequestType.Count -gt 0) {
        Write-Host "   By Request Type:" -ForegroundColor Cyan
        foreach ($type in $stats.byRequestType) {
            $icon = switch ($type._id) {
                "valid" { "✅" }
                "invalid" { "⚠️" }
                "garbage" { "🗑️" }
                default { "❓" }
            }
            Write-Host "   $icon $($type._id): $($type.count) tickets" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ Failed to get statistics" -ForegroundColor Red
}

# Test 5: Check each department
Write-Host ""
Write-Host "Test 5: Checking individual departments..." -ForegroundColor Yellow

$departments = @("roadway", "cleaning", "drainage", "water-supply", "general")

foreach ($dept in $departments) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001/api/analysis/departments/$dept" -UseBasicParsing
        $tickets = ($response.Content | ConvertFrom-Json).data
        
        $icon = switch ($dept) {
            "roadway" { "🛣️" }
            "cleaning" { "🧹" }
            "drainage" { "🚰" }
            "water-supply" { "💧" }
            "general" { "📋" }
        }
        
        if ($tickets.Count -gt 0) {
            Write-Host "✅ $icon $dept`: $($tickets.Count) tickets" -ForegroundColor Green
        } else {
            Write-Host "ℹ️  $icon $dept`: 0 tickets" -ForegroundColor Cyan
        }
    } catch {
        Write-Host "❌ Failed to check $dept department" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "Testing Complete! 🎉" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start frontend: cd dashboard-frontend && npm start" -ForegroundColor White
Write-Host "2. Open http://localhost:3000" -ForegroundColor White
Write-Host "3. Click 'Departments' tab to view results" -ForegroundColor White
Write-Host "4. Try creating tickets via Telegram bot" -ForegroundColor White
Write-Host ""
