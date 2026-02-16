# Simple script to stop the queue worker
$EC2_IP = "18.232.38.134"
$KEY_FILE = "codecapsule-key-fixed.pem"

Write-Host "Stopping CodeCapsule Queue Worker..." -ForegroundColor Yellow

# Check if key file exists
if (Test-Path $KEY_FILE) {
    # Stop the worker
    Write-Host "Stopping worker service..." -ForegroundColor Red
    ssh -o StrictHostKeyChecking=no -i $KEY_FILE ubuntu@$EC2_IP "sudo systemctl stop codecapsule-worker"
    
    Start-Sleep -Seconds 2
    
    # Check status
    Write-Host "Checking status..." -ForegroundColor Cyan
    $status = ssh -o StrictHostKeyChecking=no -i $KEY_FILE ubuntu@$EC2_IP "sudo systemctl is-active codecapsule-worker"
    Write-Host "Worker status: $status" -ForegroundColor Green
    
    # Show logs
    Write-Host "Recent logs:" -ForegroundColor Cyan
    ssh -o StrictHostKeyChecking=no -i $KEY_FILE ubuntu@$EC2_IP "sudo journalctl -u codecapsule-worker -n 5 --no-pager"
} else {
    Write-Host "Key file not found: $KEY_FILE" -ForegroundColor Red
}