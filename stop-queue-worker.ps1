# Stop CodeCapsule Queue Worker to fix Redis overuse
# This will immediately stop the Redis request flood

Write-Host "🔴 Stopping CodeCapsule Queue Worker to prevent Redis overuse..." -ForegroundColor Red

$EC2_IP = "18.232.38.134"
$KEY_FILE = "codecapsule-key-fixed.pem"

# Check if key file exists
if (-not (Test-Path $KEY_FILE)) {
    Write-Host "❌ Key file not found: $KEY_FILE" -ForegroundColor Red
    Write-Host "   Make sure you're in the terraform directory" -ForegroundColor Yellow
    exit 1
}

# Check if worker is currently running
Write-Host "📋 Checking current worker status..." -ForegroundColor Yellow
try {
    $status = ssh -o StrictHostKeyChecking=no -i $KEY_FILE ubuntu@$EC2_IP "sudo systemctl is-active codecapsule-worker" 2>$null
    Write-Host "Current status: $status" -ForegroundColor Cyan
    
    if ($status -eq "active") {
        Write-Host "⚠️  Queue Worker is currently ACTIVE - consuming Redis requests!" -ForegroundColor Red
        
        # Stop the worker service
        Write-Host "🛑 Stopping queue worker service..." -ForegroundColor Yellow
        ssh -o StrictHostKeyChecking=no -i $KEY_FILE ubuntu@$EC2_IP "sudo systemctl stop codecapsule-worker"
        
        # Verify it stopped
        Start-Sleep -Seconds 2
        $new_status = ssh -o StrictHostKeyChecking=no -i $KEY_FILE ubuntu@$EC2_IP "sudo systemctl is-active codecapsule-worker" 2>$null
        
        if ($new_status -eq "inactive") {
            Write-Host "✅ Queue Worker successfully stopped!" -ForegroundColor Green
            Write-Host "📉 Redis usage should drop dramatically within minutes" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to stop worker - status: $new_status" -ForegroundColor Red
        }
    } elseif ($status -eq "inactive") {
        Write-Host "✅ Queue Worker is already stopped" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Unknown worker status: $status" -ForegroundColor Yellow
    }
    
    # Show current worker logs (last 10 lines)
    Write-Host "`n📄 Recent worker logs:" -ForegroundColor Cyan
    ssh -o StrictHostKeyChecking=no -i $KEY_FILE ubuntu@$EC2_IP "sudo journalctl -u codecapsule-worker -n 10 --no-pager"
    
} catch {
    Write-Host "❌ Error connecting to EC2 instance: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🔧 To restart worker later (after optimization): ./start-queue-worker.ps1" -ForegroundColor Blue