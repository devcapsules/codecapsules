# Deploy Queue Worker to EC2 Instance
# This PowerShell script copies the queue worker to the EC2 instance

param(
    [string]$InstanceIP = "44.222.105.71",
    [string]$KeyPath = "codecapsule-key.pem"
)

Write-Host "🚀 Deploying CodeCapsule Queue Worker to EC2..." -ForegroundColor Green

# Check if key file exists
if (!(Test-Path $KeyPath)) {
    Write-Host "❌ SSH key not found: $KeyPath" -ForegroundColor Red
    Write-Host "Please place your codecapsule-key.pem in the current directory" -ForegroundColor Yellow
    exit 1
}

# Create local deployment package
Write-Host "📦 Creating deployment package..." -ForegroundColor Blue

$tempDir = "deploy-package-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Copy deployment script
Copy-Item "terraform\user-data\deploy-queue-worker.sh" "$tempDir\" -Force

Write-Host "✅ Package created: $tempDir" -ForegroundColor Green

# Upload to EC2
Write-Host "📤 Uploading to EC2 instance..." -ForegroundColor Blue

# Fix permissions on key file
icacls $KeyPath /inheritance:r
icacls $KeyPath /grant:r "$($env:USERNAME):R"

try {
    # Copy deployment script
    scp -i $KeyPath -o StrictHostKeyChecking=no `
        "$tempDir\deploy-queue-worker.sh" `
        ubuntu@${InstanceIP}:/tmp/

    Write-Host "✅ Files uploaded successfully" -ForegroundColor Green

    # Execute deployment
    Write-Host "🔧 Running deployment on EC2..." -ForegroundColor Blue
    
    ssh -i $KeyPath -o StrictHostKeyChecking=no ubuntu@$InstanceIP @"
        chmod +x /tmp/deploy-queue-worker.sh && 
        sudo /tmp/deploy-queue-worker.sh
"@

    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Queue worker deployed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Next steps:" -ForegroundColor Yellow
        Write-Host "1. Update credentials in /opt/codecapsule-worker/.env" -ForegroundColor White
        Write-Host "2. Start the service: sudo systemctl start codecapsule-worker" -ForegroundColor White
        Write-Host "3. Check status: sudo systemctl status codecapsule-worker" -ForegroundColor White
        Write-Host ""
        Write-Host "🔗 Connect to EC2 to configure credentials:" -ForegroundColor Yellow
        Write-Host "ssh -i $KeyPath ubuntu@$InstanceIP" -ForegroundColor White
    } else {
        Write-Host "❌ Deployment failed" -ForegroundColor Red
    }

} catch {
    Write-Host "❌ Error during deployment: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    # Cleanup
    Remove-Item -Recurse -Force $tempDir
    Write-Host "🧹 Cleanup completed" -ForegroundColor Blue
}

Write-Host ""
Write-Host "🎉 Deployment process complete!" -ForegroundColor Green