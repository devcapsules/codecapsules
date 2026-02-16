# R2 Setup Script for Windows PowerShell
# Run this after enabling R2 in your Cloudflare dashboard

Write-Host "🚀 Setting up Cloudflare R2 for CodeCapsules CDN..." -ForegroundColor Green

# 1. Create the bucket
Write-Host "1️⃣ Creating R2 bucket..." -ForegroundColor Yellow
$createResult = wrangler r2 bucket create devcapsules-cdn 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Bucket created successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Bucket creation failed" -ForegroundColor Red
    Write-Host "💡 Make sure R2 is enabled in your Cloudflare dashboard" -ForegroundColor Blue
    Write-Host "   Go to: https://dash.cloudflare.com/ -> R2 Object Storage" -ForegroundColor Blue
    exit 1
}

# 2. List buckets to confirm
Write-Host "2️⃣ Confirming bucket exists..." -ForegroundColor Yellow
wrangler r2 bucket list

# 3. Set up CORS policy for the bucket
Write-Host "3️⃣ Creating CORS policy..." -ForegroundColor Yellow
$corsPolicy = @'
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
'@

$corsPolicy | Out-File -FilePath "cors-policy.json" -Encoding utf8
Write-Host "📝 CORS policy created in cors-policy.json" -ForegroundColor Blue
Write-Host "⚠️  You may need to apply this manually in the R2 dashboard" -ForegroundColor Yellow

# 4. Test upload a sample file
Write-Host "4️⃣ Testing upload capability..." -ForegroundColor Yellow
$testContent = @{
    test = "Hello from R2"
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json

$testContent | Out-File -FilePath "test-capsule.json" -Encoding utf8

wrangler r2 object put devcapsules-cdn/capsules/test-capsule.json --file test-capsule.json --content-type application/json

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Test upload successful" -ForegroundColor Green
    
    # 5. Test download
    Write-Host "5️⃣ Testing download..." -ForegroundColor Yellow
    wrangler r2 object get devcapsules-cdn/capsules/test-capsule.json --file downloaded-test.json
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Test download successful" -ForegroundColor Green
        Write-Host "📄 Contents:" -ForegroundColor Blue
        Get-Content downloaded-test.json
        Remove-Item downloaded-test.json, test-capsule.json -Force
    } else {
        Write-Host "⚠️  Download test failed" -ForegroundColor Yellow
    }
    
    # Clean up test file
    wrangler r2 object delete devcapsules-cdn/capsules/test-capsule.json
    
} else {
    Write-Host "❌ Test upload failed" -ForegroundColor Red
}

# 6. Get account information for .env setup
Write-Host ""
Write-Host "6️⃣ Getting account information for .env setup..." -ForegroundColor Yellow
Write-Host "Account information:" -ForegroundColor Blue
wrangler whoami

Write-Host ""
Write-Host "🎉 R2 setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Blue
Write-Host "   1. Note your Account ID from above"
Write-Host "   2. Create API token in Cloudflare dashboard:"
Write-Host "      - Go to: https://dash.cloudflare.com/ -> R2 Object Storage"
Write-Host "      - Click 'Manage R2 API tokens'"
Write-Host "      - Create token with Object Read/Write permissions"
Write-Host "   3. Update your .env file with real values:"
Write-Host "      CLOUDFLARE_ACCOUNT_ID=your_account_id_from_above"
Write-Host "      CLOUDFLARE_R2_ACCESS_KEY=your_access_key_from_token"
Write-Host "      CLOUDFLARE_R2_SECRET_KEY=your_secret_key_from_token"
Write-Host "      CLOUDFLARE_R2_BUCKET=devcapsules-cdn"
Write-Host ""
Write-Host "   4. Test with: node test-r2-upload.js" -ForegroundColor Green

# Cleanup
if (Test-Path "cors-policy.json") { Remove-Item "cors-policy.json" -Force }