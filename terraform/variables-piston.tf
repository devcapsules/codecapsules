# Variables for EC2 Piston execution environment

variable "piston_instance_type" {
  description = "EC2 instance type for Piston execution server"
  type        = string
  default     = "t3.medium"  # Recommended for production, t3.small for testing
  
  validation {
    condition = can(regex("^t3\\.|^t2\\.|^c5\\.|^m5\\.", var.piston_instance_type))
    error_message = "Instance type should be from t3, t2, c5, or m5 families for optimal performance."
  }
}

variable "key_pair_name" {
  description = "Name of the AWS key pair for SSH access"
  type        = string
  default     = "codecapsule-key"
  
  validation {
    condition     = length(var.key_pair_name) > 0
    error_message = "Key pair name cannot be empty."
  }
}

variable "upstash_redis_url" {
  description = "Upstash Redis URL for job queue"
  type        = string
  sensitive   = true
  default     = "https://placeholder.upstash.io"
  
  validation {
    condition     = can(regex("^https://", var.upstash_redis_url))
    error_message = "Upstash Redis URL must start with https://."
  }
}

variable "upstash_redis_token" {
  description = "Upstash Redis token for authentication"
  type        = string
  sensitive   = true
  default     = "placeholder-token"
  
  validation {
    condition     = length(var.upstash_redis_token) > 10
    error_message = "Upstash Redis token must be provided."
  }
}

variable "enable_auto_scaling" {
  description = "Enable auto scaling group for high availability"
  type        = bool
  default     = true
}

variable "min_instances" {
  description = "Minimum number of instances in auto scaling group"
  type        = number
  default     = 1
  
  validation {
    condition     = var.min_instances >= 1 && var.min_instances <= 5
    error_message = "Minimum instances must be between 1 and 5."
  }
}

variable "max_instances" {
  description = "Maximum number of instances in auto scaling group"
  type        = number
  default     = 3
  
  validation {
    condition     = var.max_instances >= 1 && var.max_instances <= 10
    error_message = "Maximum instances must be between 1 and 10."
  }
}

variable "allowed_ssh_cidr" {
  description = "CIDR block allowed for SSH access"
  type        = string
  default     = "0.0.0.0/0"  # Restrict this in production
  
  validation {
    condition     = can(cidrhost(var.allowed_ssh_cidr, 0))
    error_message = "Must be a valid CIDR block."
  }
}