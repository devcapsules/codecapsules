# EC2 + Piston + gVisor Execution Engine
# Replaces the 6 Lambda functions with a secure, scalable execution environment

# Data source for latest Ubuntu AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical Ubuntu

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Security Group for Piston execution server
resource "aws_security_group" "piston_sg" {
  name_prefix = "codecapsule-piston-"
  description = "Security group for Piston code execution server"
  
  # SSH access for management
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.allowed_ssh_cidr]
    description = "SSH access"
  }

  # No inbound access to Piston port (2000) - only localhost access
  # This is intentional for security - worker runs locally
  
  # All outbound traffic (for updates, package installs)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = {
    Name        = "codecapsule-piston-sg"
    Project     = "CodeCapsule"
    Component   = "ExecutionEngine"
    Environment = var.environment
  }
}

# IAM role for EC2 instance
resource "aws_iam_role" "piston_role" {
  name = "codecapsule-piston-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name    = "codecapsule-piston-role"
    Project = "CodeCapsule"
  }
}

# IAM instance profile
resource "aws_iam_instance_profile" "piston_profile" {
  name = "codecapsule-piston-profile"
  role = aws_iam_role.piston_role.name
}

# User Data script for EC2 instance setup
locals {
  user_data = base64encode(templatefile("${path.module}/user-data/simple-setup.sh", {}))
}

# EC2 Instance for Piston execution
resource "aws_instance" "piston_server" {
  ami                     = data.aws_ami.ubuntu.id
  instance_type          = var.piston_instance_type
  key_name               = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.piston_sg.id]
  iam_instance_profile   = aws_iam_instance_profile.piston_profile.name
  
  user_data                   = local.user_data
  user_data_replace_on_change = true

  # Enable detailed monitoring
  monitoring = true

  # Root volume configuration
  root_block_device {
    volume_type = "gp3"
    volume_size = 20
    encrypted   = true
    
    tags = {
      Name = "codecapsule-piston-root"
    }
  }

  tags = {
    Name        = "codecapsule-piston-server"
    Project     = "CodeCapsule"
    Component   = "ExecutionEngine"
    Environment = var.environment
    Purpose     = "Code execution with Docker + gVisor + Piston"
  }
}

# Auto Scaling Group for high availability (optional)
resource "aws_launch_template" "piston_template" {
  name_prefix   = "codecapsule-piston-"
  description   = "Launch template for Piston execution servers"
  image_id      = data.aws_ami.ubuntu.id
  instance_type = var.piston_instance_type
  key_name      = var.key_pair_name
  
  vpc_security_group_ids = [aws_security_group.piston_sg.id]
  
  iam_instance_profile {
    name = aws_iam_instance_profile.piston_profile.name
  }
  
  user_data = local.user_data
  
  monitoring {
    enabled = true
  }

  block_device_mappings {
    device_name = "/dev/sda1"
    ebs {
      volume_type = "gp3"
      volume_size = 20
      encrypted   = true
    }
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "codecapsule-piston-asg"
      Project     = "CodeCapsule"
      Component   = "ExecutionEngine"
      Environment = var.environment
    }
  }

  tags = {
    Name = "codecapsule-piston-template"
  }
}

# Auto Scaling Group (start with 1 instance, can scale to 3)
resource "aws_autoscaling_group" "piston_asg" {
  name                = "codecapsule-piston-asg"
  vpc_zone_identifier = data.aws_subnets.default.ids
  target_group_arns   = []
  health_check_type   = "EC2"
  health_check_grace_period = 300

  min_size         = 1
  max_size         = 3
  desired_capacity = 1

  launch_template {
    id      = aws_launch_template.piston_template.id
    version = "$Latest"
  }

  # Instance refresh configuration
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key                 = "Name"
    value               = "codecapsule-piston-asg"
    propagate_at_launch = false
  }

  tag {
    key                 = "Project"
    value               = "CodeCapsule"
    propagate_at_launch = true
  }
}

# Data source for default VPC subnets (excluding us-east-1e)
data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
  filter {
    name   = "availability-zone"
    values = ["us-east-1a", "us-east-1b", "us-east-1c", "us-east-1d", "us-east-1f"]
  }
}

data "aws_vpc" "default" {
  default = true
}