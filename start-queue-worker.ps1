# Start CodeCapsule Queue Worker (after optimization)
# Use this only after deploying the Redis-optimized code

Write-Host "🚀 Starting CodeCapsule Queue Worker..." -ForegroundColor Green

$EC2_IP = "18.232.38.134"
$KEY_FILE = "codecapsule-key-fixed.pem"

# Check current status
Write-Host "📋 Checking current worker status..." -ForegroundColor Yellow
$status = ssh -o StrictHostKeyChecking=no -i $KEY_FILE ubuntu@$EC2_IP "sudo systemctl is-active codecapsule-worker" 2>$null

if ($status -eq "inactive") {
    Write-Host "▶️  Starting queue worker service..." -ForegroundColor Yellow
    ssh -o StrictHostKeyChecking=no -i $KEY_FILE ubuntu@$EC2_IP "sudo systemctl start codecapsule-worker"
    
    # Verify it started
    Start-Sleep -Seconds 3
    $new_status = ssh -o StrictHostKeyChecking=no -i $KEY_FILE ubuntu@$EC2_IP "sudo systemctl is-active codecapsule-worker" 2>$null
    
    if ($new_status -eq "active") {
        Write-Host "✅ Queue Worker successfully started!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to start worker - status: $new_status" -ForegroundColor Red
    }
} elseif ($status -eq "active") {
    Write-Host "✅ Queue Worker is already running" -ForegroundColor Green
} else {
    Write-Host "⚠️  Unknown worker status: $status" -ForegroundColor Yellow
}

# Show live logs for monitoring
Write-Host "`n📄 Live worker logs (Ctrl+C to exit):" -ForegroundColor Cyan
ssh -o StrictHostKeyChecking=no -i $KEY_FILE ubuntu@$EC2_IP "sudo journalctl -u codecapsule-worker -f"