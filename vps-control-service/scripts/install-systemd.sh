#!/usr/bin/env bash
set -euo pipefail

# Install script for furniture-vps-control systemd unit
# Run as root or with sudo

if [ "$(id -u)" -ne 0 ]; then
  echo "This script must be run as root or with sudo." >&2
  exit 1
fi

SERVICE_NAME="furniture-vps-control"
UNIT_NAME="${SERVICE_NAME}"
SERVICE_DIR="/opt/furniture-control"
UNIT_SRC="./systemd/${UNIT_NAME}.service"
UNIT_DST="/etc/systemd/system/${UNIT_NAME}.service"
ENV_FILE="/etc/furniture-control.env"
LOG_DIR="/var/log/furniture-control"
SITES_DIR="/srv/sites"
STAGING_DIR="/srv/deploy-staging"
USER="${SERVICE_NAME}"

echo "==> Creating system user '${USER}' (no login, no home)"
id -u "${USER}" &>/dev/null || useradd --system --no-create-home --shell /usr/sbin/nologin "${USER}"

echo "==> Creating service directory: ${SERVICE_DIR}"
mkdir -p "${SERVICE_DIR}"
cp -r src package.json "${SERVICE_DIR}/"
chown -R "${USER}:${USER}" "${SERVICE_DIR}"

echo "==> Creating log directory: ${LOG_DIR}"
mkdir -p "${LOG_DIR}"
chown "${USER}:${USER}" "${LOG_DIR}"

echo "==> Creating sites directory: ${SITES_DIR}"
mkdir -p "${SITES_DIR}"
chown "${USER}:${USER}" "${SITES_DIR}"

echo "==> Creating staging directory: ${STAGING_DIR}"
mkdir -p "${STAGING_DIR}"
chown "${USER}:${USER}" "${STAGING_DIR}"

echo "==> Copying systemd unit"
cp "${UNIT_SRC}" "${UNIT_DST}"
chmod 644 "${UNIT_DST}"

if [ -f "${ENV_FILE}" ]; then
  echo "==> WARNING: ${ENV_FILE} already exists. Skipping to avoid overwrite."
  echo "    Set VPS_CONTROL_TOKEN manually before starting the service."
else
  echo "==> Creating environment file: ${ENV_FILE}"
  cp ./examples/furniture-vps-control.env.example "${ENV_FILE}"
  chmod 600 "${ENV_FILE}"
  chown "${USER}:${USER}" "${ENV_FILE}"
  echo ""
  echo "IMPORTANT: Edit ${ENV_FILE} and set VPS_CONTROL_TOKEN to a secure random value."
fi

echo "==> Reloading systemd daemon"
systemctl daemon-reload

echo ""
echo "===== Next steps ====="
echo "1. Edit ${ENV_FILE} and set VPS_CONTROL_TOKEN"
echo "2. Enable the service: systemctl enable ${SERVICE_NAME}"
echo "3. Start the service:  systemctl start ${SERVICE_NAME}"
echo "4. Check status:       systemctl status ${SERVICE_NAME}"
echo "5. View logs:          journalctl -u ${SERVICE_NAME} -f"
echo ""
echo "===== sudoers guidance ====="
echo "If reload requires root, add this line with visudo:"
echo ""
echo "  ${USER} ALL=(root) NOPASSWD: /bin/systemctl reload nginx, /bin/systemctl reload caddy, /bin/systemctl is-active nginx, /bin/systemctl is-active caddy, /bin/systemctl is-active furniture-vps-control"
echo ""
echo "Verify systemctl path on your server:"
echo "  command -v systemctl"
echo "===== Done ====="
