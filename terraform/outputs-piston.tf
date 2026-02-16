# Outputs for Piston execution infrastructure

output "piston_server_info" {
  description = "Information about the Piston execution server"
  value = {
    instance_id       = aws_instance.piston_server.id
    public_ip         = aws_instance.piston_server.public_ip
    private_ip        = aws_instance.piston_server.private_ip
    instance_type     = aws_instance.piston_server.instance_type
    availability_zone = aws_instance.piston_server.availability_zone
    security_group_id = aws_security_group.piston_sg.id
  }
}

output "piston_connection_info" {
  description = "Connection information for the Piston server"
  value = {
    ssh_command = "ssh -i ${var.key_pair_name}.pem ubuntu@${aws_instance.piston_server.public_ip}"
    health_check_url = "http://${aws_instance.piston_server.public_ip}:2000/api/v2/runtimes"
    worker_logs = "ssh -i ${var.key_pair_name}.pem ubuntu@${aws_instance.piston_server.public_ip} 'sudo -u ubuntu pm2 logs codecapsule-worker'"
  }
}

output "piston_auto_scaling_info" {
  description = "Auto scaling group information"
  value = {
    asg_name           = aws_autoscaling_group.piston_asg.name
    asg_arn            = aws_autoscaling_group.piston_asg.arn
    launch_template_id = aws_launch_template.piston_template.id
    min_size          = aws_autoscaling_group.piston_asg.min_size
    max_size          = aws_autoscaling_group.piston_asg.max_size
    desired_capacity  = aws_autoscaling_group.piston_asg.desired_capacity
  }
}

output "piston_security_info" {
  description = "Security configuration details"
  value = {
    security_group_id   = aws_security_group.piston_sg.id
    iam_role_arn       = aws_iam_role.piston_role.arn
    instance_profile   = aws_iam_instance_profile.piston_profile.name
    gvisor_enabled     = true
    network_isolation  = true
  }
}

output "piston_monitoring_commands" {
  description = "Useful commands for monitoring the Piston infrastructure"
  value = {
    health_check = "bash /home/ubuntu/health-check.sh"
    worker_status = "sudo -u ubuntu pm2 status"
    docker_status = "docker ps"
    piston_logs = "docker logs piston"
    worker_logs = "sudo -u ubuntu pm2 logs codecapsule-worker"
    system_stats = "htop"
  }
}

output "deployment_summary" {
  description = "Summary of the deployed infrastructure"
  value = {
    infrastructure = "EC2 + Docker + gVisor + Piston + Worker"
    cost_estimate = "$20-40/month for t3.medium"
    security_features = ["gVisor sandboxing", "Network isolation", "No public Piston access", "Auto-scaling"]
    languages_supported = ["Python", "JavaScript", "TypeScript", "Java", "C++", "C", "C#", "Go", "PHP", "Ruby", "Rust"]
    queue_system = "Redis (Upstash)"
    real_time_updates = "Supabase"
  }
}

# Sensitive outputs (hidden by default)
output "configuration_status" {
  description = "Configuration status and next steps"
  sensitive   = true
  value = {
    redis_configured    = length(var.upstash_redis_url) > 0
    supabase_configured = length(var.supabase_url) > 0
    worker_enabled     = true
    auto_scaling      = var.enable_auto_scaling
    next_steps = [
      "1. SSH into server and run health check",
      "2. Update API endpoints to use Redis queue",
      "3. Test with sample execution",
      "4. Monitor worker logs for issues",
      "5. Set up CloudWatch alerts"
    ]
  }
}