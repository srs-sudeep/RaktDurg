#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/raktdurg}"
APP_USER="${APP_USER:-$USER}"

sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

if ! command -v docker >/dev/null 2>&1; then
  sudo install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  sudo chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
  sudo apt-get update
  sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

sudo usermod -aG docker "$APP_USER"
sudo mkdir -p "$APP_DIR/infra/nginx" "$APP_DIR/infra/gce"
sudo chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

cat <<EOF
Bootstrap complete.

Next:
1. Re-login so docker group membership applies.
2. Ensure ports 80/443 are open in the GCE firewall.
3. Create $APP_DIR/infra/.env from infra/.env.production.example.
4. Let GitHub Actions deploy updated compose/nginx files and images.
EOF
