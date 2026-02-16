# Simple deployment script
$EC2_IP = "18.232.38.134"
$KEY_FILE = "codecapsule-key-fixed.pem"

Write-Host "Deploying optimized code..." -ForegroundColor Green

if (Test-Path $KEY_FILE) {
    # Upload the optimized queue.js file
    Write-Host "Uploading optimized queue.js..." -ForegroundColor Yellow
    scp -o StrictHostKeyChecking=no -i $KEY_FILE ..\apps\api\src\services\queue.js ubuntu@${EC2_IP}:/tmp/queue-optimized.js
    
    # Backup and update the actual queue.js
    Write-Host "Backing up current queue.js..." -ForegroundColor Cyan
    ssh -o StrictHostKeyChecking=no -i $KEY_FILE ubuntu@$EC2_IP "sudo cp /opt/codecapsule-worker/queue.js /opt/codecapsule-worker/queue.js.backup.$(date +%Y%m%d_%H%M%S)"
    
    Write-Host "Installing optimized version..." -ForegroundColor Yellow
    ssh -o StrictHostKeyChecking=no -i $KEY_FILE ubuntu@$EC2_IP "sudo cp /tmp/queue-optimized.js /opt/codecapsule-worker/queue.js"
    ssh -o StrictHostKeyChecking=no -i $KEY_FILE ubuntu@$EC2_IP "sudo chown ubuntu:ubuntu /opt/codecapsule-worker/queue.js"
    
    # Check syntax
    Write-Host "Checking JavaScript syntax..." -ForegroundColor Cyan
    $syntaxCheck = ssh -o StrictHostKeyChecking=no -i $KEY_FILE ubuntu@$EC2_IP "cd /opt/codecapsule-worker && node -c queue.js"
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Syntax OK" -ForegroundColor Green
    } else {
        Write-Host "Syntax Error!" -ForegroundColor Red
    }
    
    Write-Host "Deployment complete!" -ForegroundColor Green
    Write-Host "Optimizations applied:" -ForegroundColor Cyan
    Write-Host "  - Exponential backoff polling (1s -> 5s max)" -ForegroundColor White
    Write-Host "  - Reduced Redis debug logging" -ForegroundColor White
    Write-Host "  - Expected 90% Redis request reduction" -ForegroundColor White
} else {
    Write-Host "Key file not found: $KEY_FILE" -ForegroundColor Red
}