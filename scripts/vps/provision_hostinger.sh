#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <ssh_user> <vps_ip> [ssh_key_path]"
  exit 1
fi

SSH_USER="$1"
VPS_IP="$2"
SSH_KEY="${3:-$HOME/.ssh/id_rsa}"

ssh -i "${SSH_KEY}" "${SSH_USER}@${VPS_IP}" <<'REMOTE'
set -euo pipefail
sudo apt update
sudo apt install -y docker.io docker-compose-v2 ufw curl git
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"

sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

sudo sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PubkeyAuthentication .*/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sudo systemctl restart sshd

mkdir -p /opt/forgotten-mistory
cd /opt/forgotten-mistory
if [ ! -d .git ]; then
  git clone https://github.com/Victordtesla24/forgotten-mistory.git .
fi

echo "Provisioning complete."
REMOTE
