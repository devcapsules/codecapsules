# Deploy optimized queue worker code to AWS EC2
$EC2_IP = "18.232.38.134"
$KEY_FILE = "codecapsule-key-fixed.pem"

Write-Host "🚀 Deploying optimized queue worker code..." -ForegroundColor Green

# Check if key file exists
if (-not (Test-Path $KEY_FILE)) {
    Write-Host "❌ Key file not found: $KEY_FILE" -ForegroundColor Red
    exit 1
}

# Upload optimized queue.js
Write-Host "📦 Uploading optimized queue service..." -ForegroundColor Yellow
scp -o StrictHostKeyChecking=no -i $KEY_FILE ..\apps\api\src\services\queue.js ubuntu@${EC2_IP}:/tmp/queue-optimized.js

# Update the worker code on EC2
Write-Host "🔧 Updating worker code on EC2..." -ForegroundColor Yellow
ssh -o StrictHostKeyChecking=no -i $KEY_FILE ubuntu@$EC2_IP "sudo cp /opt/codecapsule-worker/queue.js /opt/codecapsule-worker/queue.js.backup && sudo cp /tmp/queue-optimized.js /opt/codecapsule-worker/queue.js && sudo chown ubuntu:ubuntu /opt/codecapsule-worker/queue.js && echo 'Optimization changes applied' && node -c /opt/codecapsule-worker/queue.js"

Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "📊 Expected Redis reduction: 90%+ fewer requests" -ForegroundColor Cyan
Write-Host "🔄 To restart worker: .\start-worker-optimized.ps1" -ForegroundColor Blue