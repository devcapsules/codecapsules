# CodeCapsule EC2 Launch Script
# This script helps you create the EC2 instance for secure code execution

param(
    [Parameter(Mandatory=$false)]
    [string]$InstanceType = "t3.small",
    
    [Parameter(Mandatory=$false)]
    [string]$KeyPairName = "codecapsule-key",
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us-east-1"
)

Write-Host "🚀 Setting up CodeCapsule EC2 Instance" -ForegroundColor Green
Write-Host "Instance Type: $InstanceType" -ForegroundColor Cyan
Write-Host "Region: $Region" -ForegroundColor Cyan

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install: https://aws.amazon.com/cli/" -ForegroundColor Red
    exit 1
}

# Get the latest Ubuntu 22.04 LTS AMI ID
Write-Host "🔍 Finding latest Ubuntu 22.04 LTS AMI..." -ForegroundColor Yellow

$amiId = aws ec2 describe-images `
    --region $Region `
    --owners 099720109477 `
    --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" `
              "Name=state,Values=available" `
    --query "Images | sort_by(@, &CreationDate) | [-1].ImageId" `
    --output text

Write-Host "📀 Using AMI: $amiId" -ForegroundColor Cyan

# Create security group
Write-Host "🔒 Creating security group..." -ForegroundColor Yellow

$securityGroupName = "codecapsule-execution-sg"
$vpcId = aws ec2 describe-vpcs --region $Region --filters "Name=isDefault,Values=true" --query "Vpcs[0].VpcId" --output text

try {
    $securityGroupId = aws ec2 create-security-group `
        --region $Region `
        --group-name $securityGroupName `
        --description "Security group for CodeCapsule execution server" `
        --vpc-id $vpcId `
        --query "GroupId" --output text
    
    Write-Host "✅ Created security group: $securityGroupId" -ForegroundColor Green
} catch {
    # Security group might already exist
    $securityGroupId = aws ec2 describe-security-groups `
        --region $Region `
        --group-names $securityGroupName `
        --query "SecurityGroups[0].GroupId" --output text
    
    Write-Host "✅ Using existing security group: $securityGroupId" -ForegroundColor Green
}

# Add SSH rule to security group (if not exists)
try {
    aws ec2 authorize-security-group-ingress `
        --region $Region `
        --group-id $securityGroupId `
        --protocol tcp --port 22 --cidr 0.0.0.0/0
    
    Write-Host "✅ Added SSH access rule" -ForegroundColor Green
} catch {
    Write-Host "ℹ️ SSH rule already exists" -ForegroundColor Yellow
}

# Read user data script
$userDataPath = ".\ec2-user-data.sh"
if (-not (Test-Path $userDataPath)) {
    Write-Host "❌ User data script not found: $userDataPath" -ForegroundColor Red
    exit 1
}

$userData = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((Get-Content $userDataPath -Raw)))

# Launch EC2 instance
Write-Host "🚀 Launching EC2 instance..." -ForegroundColor Yellow

$instanceId = aws ec2 run-instances `
    --region $Region `
    --image-id $amiId `
    --count 1 `
    --instance-type $InstanceType `
    --key-name $KeyPairName `
    --security-group-ids $securityGroupId `
    --user-data $userData `
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=CodeCapsule-Execution},{Key=Project,Value=CodeCapsule},{Key=Environment,Value=Production}]" `
    --query "Instances[0].InstanceId" --output text

if ($instanceId) {
    Write-Host "✅ Instance launched: $instanceId" -ForegroundColor Green
    
    # Wait for instance to be running
    Write-Host "⏳ Waiting for instance to be running..." -ForegroundColor Yellow
    aws ec2 wait instance-running --region $Region --instance-ids $instanceId
    
    # Get public IP
    $publicIp = aws ec2 describe-instances `
        --region $Region `
        --instance-ids $instanceId `
        --query "Reservations[0].Instances[0].PublicIpAddress" --output text
    
    Write-Host ""
    Write-Host "🎉 EC2 Instance Ready!" -ForegroundColor Green
    Write-Host "Instance ID: $instanceId" -ForegroundColor Cyan
    Write-Host "Public IP: $publicIp" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Wait 2-3 minutes for setup to complete"
    Write-Host "2. SSH to instance: ssh -i $KeyPairName.pem ubuntu@$publicIp"
    Write-Host "3. Test Piston: ./test-piston.sh"
    Write-Host "4. Check status: ./check-status.sh"
    Write-Host ""
    Write-Host "🔧 To proceed to Phase 2 (Worker Setup):" -ForegroundColor Yellow
    Write-Host "ssh -i $KeyPairName.pem ubuntu@$publicIp" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to launch instance" -ForegroundColor Red
    exit 1
}