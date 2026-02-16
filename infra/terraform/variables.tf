variable "subscription_id" {
  description = "Azure subscription ID"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the existing resource group"
  type        = string
  default     = "codecapsule-rg"
}

variable "vm_sku" {
  description = "VM size for VMSS instances"
  type        = string
  default     = "Standard_B2as_v2"
}

variable "instance_count" {
  description = "Initial number of VMSS instances"
  type        = number
  default     = 1
}

variable "max_instances" {
  description = "Maximum autoscale instances"
  type        = number
  default     = 5
}

variable "admin_username" {
  description = "SSH admin username"
  type        = string
  default     = "azureuser"
}

variable "ssh_public_key" {
  description = "SSH public key for VM access"
  type        = string
  sensitive   = true
}

variable "cloud_init_path" {
  description = "Path to the rendered cloud-init YAML file"
  type        = string
  default     = "C:/temp/cloud-init-rendered.yaml"
}
