#!/bin/bash

# CodeCapsule Piston Server Setup - Minimal Installer
# This downloads and runs the full setup

set -e

# Update system and install base requirements  
apt-get update -y
apt-get install -y curl wget git

# Download full setup script
wget -O /tmp/piston-full-setup.sh https://raw.githubusercontent.com/your-username/codecapsule/main/terraform/user-data/piston-setup.sh

# Make executable and run
chmod +x /tmp/piston-full-setup.sh
/tmp/piston-full-setup.sh

# Log completion
echo "$(date): CodeCapsule setup completed" >> /var/log/codecapsule-setup.log