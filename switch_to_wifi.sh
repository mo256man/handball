#!/bin/bash
set -euo pipefail

if [ "$EUID" -ne 0 ]; then
  echo "This script must be run as root" >&2
  exit 1
fi

# --- Configuration (edit these values directly) ---
# Wireless interface used for Wi-Fi client mode
INTERFACE="wlan0"
# Uplink interface used previously for NAT (leave empty if none)
UPLINK=""
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

if [ -n "$UPLINK" ]; then
  echo "Removing iptables NAT rules (uplink: $UPLINK)"
  iptables -t nat -D POSTROUTING -o "$UPLINK" -j MASQUERADE 2>/dev/null || true
  iptables -D FORWARD -i "$UPLINK" -o "$INTERFACE" -m state --state RELATED,ESTABLISHED -j ACCEPT 2>/dev/null || true
  iptables -D FORWARD -i "$INTERFACE" -o "$UPLINK" -j ACCEPT 2>/dev/null || true
else
  echo "No UPLINK specified — skipping iptables cleanup"
fi

echo "Restoring IP forwarding to original state"
if [ -f /etc/handball_ip_forward.backup ]; then
  ORIGINAL_FORWARD=$(cat /etc/handball_ip_forward.backup)
  sysctl -w net.ipv4.ip_forward=$ORIGINAL_FORWARD
  rm /etc/handball_ip_forward.backup
else
  sysctl -w net.ipv4.ip_forward=0
fi

echo "Switch to Wi-Fi mode completed. You may need to reboot or run 'sudo wpa_cli -i $INTERFACE reconfigure' to reconnect to networks."

exit 0
