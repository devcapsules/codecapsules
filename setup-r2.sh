#!/bin/bash
# R2 Setup Script using Cloudflare CLI
# Run this after enabling R2 in your Cloudflare dashboard

echo "🚀 Setting up Cloudflare R2 for CodeCapsules CDN..."

# 1. Create the bucket
echo "1️⃣ Creating R2 bucket..."
wrangler r2 bucket create devcapsules-cdn

if [ $? -eq 0 ]; then
    echo "✅ Bucket created successfully"
else
    echo "❌ Bucket creation failed"
    echo "💡 Make sure R2 is enabled in your Cloudflare dashboard"
    exit 1
fi

# 2. List buckets to confirm
echo "2️⃣ Confirming bucket exists..."
wrangler r2 bucket list

# 3. Set up CORS policy for the bucket
echo "3️⃣ Setting up CORS policy..."
cat > cors-policy.json << 'EOF'
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3600
  }
]
EOF

# Note: CORS setup might need to be done through dashboard
echo "📝 CORS policy created in cors-policy.json"
echo "⚠️  You may need to apply this manually in the R2 dashboard"

# 4. Test upload a sample file
echo "4️⃣ Testing upload capability..."
echo '{"test": "Hello from R2", "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'"}' > test-capsule.json

wrangler r2 object put devcapsules-cdn/capsules/test-capsule.json --file test-capsule.json --content-type application/json

if [ $? -eq 0 ]; then
    echo "✅ Test upload successful"
    
    # 5. Test download
    echo "5️⃣ Testing download..."
    wrangler r2 object get devcapsules-cdn/capsules/test-capsule.json --file downloaded-test.json
    
    if [ $? -eq 0 ]; then
        echo "✅ Test download successful"
        echo "📄 Contents:"
        cat downloaded-test.json
        rm downloaded-test.json test-capsule.json
    else
        echo "⚠️  Download test failed"
    fi
    
    # Clean up test file
    wrangler r2 object delete devcapsules-cdn/capsules/test-capsule.json
    
else
    echo "❌ Test upload failed"
fi

# 6. Get account information for .env setup
echo ""
echo "6️⃣ Getting account information for .env setup..."
echo "Account ID:"
wrangler whoami | grep "Account ID"

echo ""
echo "🎉 R2 setup completed!"
echo ""
echo "📝 Next steps:"
echo "   1. Get your Account ID from above"
echo "   2. Create API token in Cloudflare dashboard:"
echo "      - Go to 'Manage R2 API tokens'"
echo "      - Create token with Object Read/Write permissions"
echo "   3. Update your .env file with:"
echo "      CLOUDFLARE_ACCOUNT_ID=your_account_id"
echo "      CLOUDFLARE_R2_ACCESS_KEY=your_access_key"  
echo "      CLOUDFLARE_R2_SECRET_KEY=your_secret_key"
echo "      CLOUDFLARE_R2_BUCKET=devcapsules-cdn"
echo ""
echo "   4. Run: node test-r2-upload.js"

rm -f cors-policy.json