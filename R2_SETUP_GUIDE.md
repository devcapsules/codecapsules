# Cloudflare R2 Setup Guide

## Step 1: Create Cloudflare Account & R2 Bucket

### 1.1 Login to Cloudflare Dashboard
- Go to https://dash.cloudflare.com/
- Login or create account

### 1.2 Enable R2 Storage
- Go to R2 Object Storage in left sidebar
- Click "Create bucket"
- Bucket name: `devcapsules-cdn` 
- Region: Choose closest to your users (e.g., `auto` for global)
- Click "Create bucket"

## Step 2: Generate API Credentials

### 2.1 Create API Token
- Go to "Manage R2 API tokens" in R2 dashboard
- Click "Create API token"  
- Token name: `devcapsules-cdn-access`
- Permissions: `Object Read and Write`
- Bucket: `devcapsules-cdn`
- Click "Create API token" 
- **Copy and save the token immediately** (won't be shown again)

### 2.2 Get Account ID
- Go to your Cloudflare dashboard
- Right sidebar shows "Account ID"
- Copy this value


## Step 3: Configure Environment Variables

Update your `.env` file with real credentials:

```env
# Cloudflare R2 Storage (Phase 2 - CDN)  
CLOUDFLARE_ACCOUNT_ID=your_account_id_here
CLOUDFLARE_R2_ACCESS_KEY=your_access_key_here  
CLOUDFLARE_R2_SECRET_KEY=your_secret_key_here
CLOUDFLARE_R2_BUCKET=devcapsules-cdn
```

## Step 4: Test Upload

Run this command to test:
```bash
node test-r2-upload.js
```

## Step 5: Set Up Custom Domain (Optional)

### 5.1 Connect Custom Domain
- In R2 bucket settings
- Go to "Custom Domains" tab
- Add domain: `cdn.devcapsules.com`
- Follow DNS setup instructions

### 5.2 Update Widget URLs
Once domain is active, capsules will be available at:
`https://cdn.devcapsules.com/capsules/{id}.json`

## Troubleshooting

### Common Issues:
1. **403 Forbidden**: Check API token permissions
2. **404 Not Found**: Verify bucket name and account ID  
3. **CORS Errors**: Add CORS policy in R2 bucket settings

### CORS Policy for R2 Bucket:
```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

## Cost Estimate

R2 Pricing (as of 2024):
- Storage: $0.015 per GB-month
- Requests: $0.36 per million requests
- Data transfer: FREE egress

For 1000 capsules (~1MB each):
- Storage cost: ~$0.015/month
- Very cost effective for CDN use case!