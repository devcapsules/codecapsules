# Start optimized queue worker
$EC2_IP = "18.232.38.134"
$KEY_FILE = "codecapsule-key-fixed.pem"

Write-Host "Starting optimized queue worker..." -ForegroundColor Green

if (Test-Path $KEY_FILE) {
    # Start the optimized worker
    Write-Host "Starting worker service with optimized code..." -ForegroundColor Yellow
    ssh -o StrictHostKeyChecking=no -i $KEY_FILE ubuntu@$EC2_IP "sudo systemctl start codecapsule-worker"
    
    Start-Sleep -Seconds 3
    
    # Check status
    $status = ssh -o StrictHostKeyChecking=no -i $KEY_FILE ubuntu@$EC2_IP "sudo systemctl is-active codecapsule-worker"
    Write-Host "Worker status: $status" -ForegroundColor Green
    
    if ($status -eq "active") {
        Write-Host "Optimized worker is running!" -ForegroundColor Green
        Write-Host "Redis optimizations are now active" -ForegroundColor Cyan
        
        # Show recent logs
        Write-Host "Recent logs (showing optimized behavior):" -ForegroundColor Cyan
        ssh -o StrictHostKeyChecking=no -i $KEY_FILE ubuntu@$EC2_IP "sudo journalctl -u codecapsule-worker -n 10 --no-pager"
    } else {
        Write-Host "Failed to start optimized worker" -ForegroundColor Red
        # Show error logs
        ssh -o StrictHostKeyChecking=no -i $KEY_FILE ubuntu@$EC2_IP "sudo journalctl -u codecapsule-worker -n 5 --no-pager"
    }
} else {
    Write-Host "Key file not found: $KEY_FILE" -ForegroundColor Red
}