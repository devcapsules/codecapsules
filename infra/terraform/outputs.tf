output "vmss_id" {
  description = "Resource ID of the VMSS"
  value       = azurerm_linux_virtual_machine_scale_set.piston.id
}

output "vmss_name" {
  description = "Name of the VMSS"
  value       = azurerm_linux_virtual_machine_scale_set.piston.name
}

output "vmss_unique_id" {
  description = "Unique ID of the VMSS"
  value       = azurerm_linux_virtual_machine_scale_set.piston.unique_id
}
