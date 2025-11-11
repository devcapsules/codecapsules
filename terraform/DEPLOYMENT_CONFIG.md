# 🔧 CodeCapsule Deployment Configuration Guide

## Step 1: Configure Supabase Credentials

You need to fill in your Supabase credentials in `terraform.tfvars`. Here's where to find them:

### 🔍 Finding Your Supabase Credentials

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project** (or create a new one if needed)
3. **Navigate to Settings → API**

### 📝 Required Values:

```hcl
# Project URL (from Settings → API)
supabase_url = "https://YOUR_PROJECT_ID.supabase.co"

# Service Role Key (from Settings → API → service_role key)
supabase_service_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_SERVICE_KEY_HERE"

# Database credentials (from Settings → Database)
db_host = "db.YOUR_PROJECT_ID.supabase.co"
db_password = "YOUR_DATABASE_PASSWORD"
```

### 🔐 Database Setup (Optional but Recommended)

For better security, create a read-only user for the SQL judge:

```sql
-- Connect to your Supabase SQL Editor and run:
CREATE USER readonly_user WITH PASSWORD 'secure_readonly_password';
GRANT CONNECT ON DATABASE postgres TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;
```

Then update your `terraform.tfvars`:
```hcl
db_user = "readonly_user"
db_password = "secure_readonly_password"
```

## Step 2: AWS Credentials

Make sure your AWS CLI is configured:

```powershell
# Check if AWS is configured
aws sts get-caller-identity

# If not configured, run:
aws configure
```

You'll need:
- **AWS Access Key ID**
- **AWS Secret Access Key** 
- **Default region** (e.g., us-east-1)

## Step 3: Deploy Infrastructure

Once configured, deploy using:

```powershell
# Option 1: Use the deployment script (recommended)
.\deploy.ps1

# Option 2: Manual deployment
terraform apply
```

## 🚀 Quick Test After Deployment

The deployment will provide API endpoints. Test them with:

```powershell
# Health check
curl https://YOUR_API_GATEWAY_URL/health

# Python execution test
curl -X POST https://YOUR_API_GATEWAY_URL/execute/python `
  -H "Content-Type: application/json" `
  -d '{"code":"print(\"Hello CodeCapsule!\")"}'
```

## 💡 Tips

- **Start with development environment** (`environment = "dev"`)
- **Use lower resource limits** for testing (already configured)
- **Enable force_destroy** for easy cleanup during development
- **Monitor CloudWatch logs** for debugging

## 🔧 Troubleshooting

- **Invalid credentials**: Double-check Supabase URL and service key
- **Database connection issues**: Verify database password and host
- **AWS permissions**: Ensure your AWS user has Lambda, API Gateway, and IAM permissions
- **Terraform errors**: Run `terraform validate` to check configuration

## 📊 Expected Costs

Development usage should cost **less than $1/month** with:
- Minimal Lambda executions
- Short log retention (7 days)
- No API caching
- Development-level throttling

Ready to deploy your serverless Judge0 replacement! 🎉