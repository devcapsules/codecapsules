# CodeCapsule Container Deployment

## 🚀 GitHub Actions Setup

This repository uses GitHub Actions to build and deploy C# and Go Lambda containers on Linux runners, solving the Windows Docker manifest compatibility issues.

### Prerequisites

1. **AWS Credentials**: Add these secrets to your GitHub repository:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`

2. **ECR Repositories**: Already created via Terraform:
   - `codecapsule-csharp-lambda`
   - `codecapsule-go-lambda`

### Setup Instructions

#### 1. Add AWS Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

```
Name: AWS_ACCESS_KEY_ID
Value: [Your AWS Access Key ID]

Name: AWS_SECRET_ACCESS_KEY  
Value: [Your AWS Secret Access Key]
```

#### 2. Initialize Git Repository (if not done)

```bash
git init
git add .
git commit -m "Initial commit with container Lambda functions"
git branch -M main
git remote add origin https://github.com/yourusername/codecapsule.git
git push -u origin main
```

#### 3. Trigger Deployment

The workflow will automatically run when you:
- Push changes to `terraform/containers/**`
- Manually trigger via GitHub Actions tab

### Manual Trigger

You can manually trigger the deployment:
1. Go to **Actions** tab in your GitHub repository
2. Select **Deploy Container Lambda Functions**
3. Click **Run workflow**

### What the Workflow Does

1. **Builds containers on Linux** (solving Windows compatibility issues)
2. **Pushes to ECR** with proper Lambda-compatible manifests
3. **Runs Terraform apply** to deploy Lambda functions
4. **Tests both endpoints** to verify functionality

### Expected Endpoints

After successful deployment:

- **C# Endpoint**: `https://q0qr0uqja7.execute-api.us-east-1.amazonaws.com/dev/execute/csharp`
- **Go Endpoint**: `https://q0qr0uqja7.execute-api.us-east-1.amazonaws.com/dev/execute/go`

### Local Development

For local development, continue using:
- Docker builds for testing
- Terraform for infrastructure changes
- GitHub Actions for production deployments

### Troubleshooting

If the workflow fails:
1. Check **Actions** tab for detailed logs
2. Verify AWS credentials are correct
3. Ensure ECR repositories exist
4. Check Terraform state consistency

## 🎯 Benefits

- ✅ **Linux-native builds** solve manifest compatibility
- ✅ **Automated deployment** on code changes
- ✅ **Consistent environment** across all builds
- ✅ **No more Windows Docker issues**
- ✅ **Production-ready CI/CD pipeline**