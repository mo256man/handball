#!/bin/bash
set -euo pipefail

if [ "$EUID" -ne 0 ]; then
  echo "This script must be run as root" >&2
  exit 1
fi

# --- Configuration (edit these values directly) ---
# Wireless interface used for Wi-Fi client mode
INTERFACE="wlan0"
# -----------------------------------------------

DHCPD_CONF=/etc/dhcpcd.conf
BACKUP_DIR_PREFIX=/etc/handball_backup_

echo "Stopping AP services"
systemctl stop hostapd.service dnsmasq.service 2>/dev/null || true
systemctl disable hostapd.service dnsmasq.service 2>/dev/null || true

LATEST_BACKUP=$(ls -td ${BACKUP_DIR_PREFIX}* 2>/dev/null | head -n1 || true)
if [ -n "$LATEST_BACKUP" ] && [ -f "$LATEST_BACKUP/dhcpcd.conf" ]; then
  echo "Restoring dhcpcd.conf from $LATEST_BACKUP"
  cp -a "$LATEST_BACKUP/dhcpcd.conf" "$DHCPD_CONF"
else
  echo "Removing HANDBALL AP block from $DHCPD_CONF if present"
  sed -i '/# HANDBALL AP CONFIG START/,/# HANDBALL AP CONFIG END/d' "$DHCPD_CONF" || true
fi

echo "Restarting dhcpcd and wpa_supplicant"
systemctl restart dhcpcd.service || true
systemctl start wpa_supplicant.service 2>/dev/null || true

echo "Wi-Fi client mode restored"
echo ""
echo "Run 'sudo wpa_cli -i $INTERFACE reconfigure' to reconnect to Wi-Fi networks"
echo "Or reboot the system with 'sudo reboot'"

exit 0