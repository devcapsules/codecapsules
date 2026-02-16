###############################################################################
# CodeCapsule – Azure VMSS (Piston Bridge) via Terraform
#
# This config creates ONLY the VMSS + autoscale. All networking resources
# (VNet, Subnet, NSG, LB, Public IP) already exist and are referenced as
# data sources.
###############################################################################

terraform {
  required_version = ">= 1.5"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id
}

# ─── Data Sources (existing networking resources) ─────────────────────────────

data "azurerm_resource_group" "rg" {
  name = var.resource_group_name
}

data "azurerm_subnet" "piston" {
  name                 = "piston-subnet"
  virtual_network_name = "codecapsule-vnet"
  resource_group_name  = var.resource_group_name
}

data "azurerm_lb" "piston" {
  name                = "codecapsule-pistonLB"
  resource_group_name = var.resource_group_name
}

data "azurerm_lb_backend_address_pool" "piston" {
  name            = "codecapsule-pistonLBBEPool"
  loadbalancer_id = data.azurerm_lb.piston.id
}

data "azurerm_network_security_group" "piston" {
  name                = "codecapsule-pistonNSG"
  resource_group_name = var.resource_group_name
}

# ─── VMSS ─────────────────────────────────────────────────────────────────────

resource "azurerm_linux_virtual_machine_scale_set" "piston" {
  name                = "codecapsule-piston"
  location            = data.azurerm_resource_group.rg.location
  resource_group_name = var.resource_group_name

  sku       = var.vm_sku
  instances = var.instance_count

  admin_username = var.admin_username

  admin_ssh_key {
    username   = var.admin_username
    public_key = var.ssh_public_key
  }

  custom_data = filebase64(var.cloud_init_path)

  source_image_reference {
    publisher = "Canonical"
    offer     = "ubuntu-24_04-lts"
    sku       = "server"
    version   = "latest"
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
    disk_size_gb         = 30
  }

  network_interface {
    name    = "piston-nic"
    primary = true

    network_security_group_id = data.azurerm_network_security_group.piston.id

    ip_configuration {
      name                                   = "internal"
      primary                                = true
      subnet_id                              = data.azurerm_subnet.piston.id
      load_balancer_backend_address_pool_ids = [data.azurerm_lb_backend_address_pool.piston.id]
    }
  }

  upgrade_mode = "Manual"

  # Ensure instances are spread across fault domains
  platform_fault_domain_count = 1
  single_placement_group      = false

  tags = {
    project     = "codecapsule"
    component   = "piston-bridge"
    managed_by  = "terraform"
  }
}

# ─── Autoscale ────────────────────────────────────────────────────────────────

resource "azurerm_monitor_autoscale_setting" "piston" {
  name                = "piston-autoscale"
  resource_group_name = var.resource_group_name
  location            = data.azurerm_resource_group.rg.location
  target_resource_id  = azurerm_linux_virtual_machine_scale_set.piston.id

  profile {
    name = "default"

    capacity {
      default = var.instance_count
      minimum = 1
      maximum = var.max_instances
    }

    rule {
      metric_trigger {
        metric_name        = "Percentage CPU"
        metric_resource_id = azurerm_linux_virtual_machine_scale_set.piston.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "GreaterThan"
        threshold          = 70
      }
      scale_action {
        direction = "Increase"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }

    rule {
      metric_trigger {
        metric_name        = "Percentage CPU"
        metric_resource_id = azurerm_linux_virtual_machine_scale_set.piston.id
        time_grain         = "PT1M"
        statistic          = "Average"
        time_window        = "PT5M"
        time_aggregation   = "Average"
        operator           = "LessThan"
        threshold          = 30
      }
      scale_action {
        direction = "Decrease"
        type      = "ChangeCount"
        value     = "1"
        cooldown  = "PT5M"
      }
    }
  }
}
