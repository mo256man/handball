#!/bin/bash
set -euo pipefail

if [ "$EUID" -ne 0 ]; then
  echo "This script must be run as root" >&2
  exit 1
fi

# --- Configuration (edit these values directly) ---
# Wireless interface to use for AP
INTERFACE="wlan0"
# SSID for the AP (max 32 bytes)
SSID="HandballAP"
# WPA2 passphrase (8-63 characters)
PASSWD="handballpass"
# Uplink interface which provides internet (for NAT)
# Leave empty to disable internet sharing/NAT
UPLINK=""
# -----------------------------------------------

DHCPD_CONF=/etc/dhcpcd.conf
DNSMASQ_CONF=/etc/dnsmasq.conf
HOSTAPD_CONF=/etc/hostapd/hostapd.conf
DEFAULT_HOSTAPD=/etc/default/hostapd
BACKUP_DIR=/etc/handball_backup_$(date +%s)

echo "Creating backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
cp -a "$DHCPD_CONF" "$BACKUP_DIR/dhcpcd.conf" 2>/dev/null || true
cp -a "$DNSMASQ_CONF" "$BACKUP_DIR/dnsmasq.conf" 2>/dev/null || true
cp -a "$HOSTAPD_CONF" "$BACKUP_DIR/hostapd.conf" 2>/dev/null || true
cp -a "$DEFAULT_HOSTAPD" "$BACKUP_DIR/default_hostapd" 2>/dev/null || true

echo "Configuring static IP for $INTERFACE"
if ! grep -q "# HANDBALL AP CONFIG START" "$DHCPD_CONF" 2>/dev/null; then
  cat >> "$DHCPD_CONF" <<EOF

# HANDBALL AP CONFIG START
interface $INTERFACE
static ip_address=192.168.4.1/24
nohook wpa_supplicant
# HANDBALL AP CONFIG END

EOF
fi

echo "Configuring $DNSMASQ_CONF"
cp -a "$DNSMASQ_CONF" "$BACKUP_DIR/dnsmasq.conf" 2>/dev/null || true
cat > "$DNSMASQ_CONF.handball_temp" <<EOF
# handball dnsmasq config
interface=$INTERFACE
dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h
EOF
mv "$DNSMASQ_CONF.handball_temp" "$DNSMASQ_CONF"

echo "Writing $HOSTAPD_CONF"
mkdir -p /etc/hostapd
cat > "$HOSTAPD_CONF" <<EOF
interface=$INTERFACE
driver=nl80211
ssid=$SSID
hw_mode=g
channel=6
wmm_enabled=1
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=$PASSWD
wpa_key_mgmt=WPA-PSK
rsn_pairwise=CCMP
EOF

echo "Pointing $DEFAULT_HOSTAPD to $HOSTAPD_CONF"
if [ -f "$DEFAULT_HOSTAPD" ]; then
  sed -i.bak -E "s|^#?DAEMON_CONF=.*|DAEMON_CONF=\"$HOSTAPD_CONF\"|" "$DEFAULT_HOSTAPD" || echo "DAEMON_CONF=\"$HOSTAPD_CONF\"" >> "$DEFAULT_HOSTAPD"
else
  echo "DAEMON_CONF=\"$HOSTAPD_CONF\"" > "$DEFAULT_HOSTAPD"
fi

echo "Enable IPv4 forwarding and save original state"
GET_FORWARD=$(sysctl -n net.ipv4.ip_forward 2>/dev/null || echo 0)
echo "$GET_FORWARD" > /etc/handball_ip_forward.backup
sysctl -w net.ipv4.ip_forward=1

if [ -n "$UPLINK" ]; then
  echo "Setting up NAT (uplink: $UPLINK)"
  iptables -t nat -A POSTROUTING -o "$UPLINK" -j MASQUERADE || true
  iptables -A FORWARD -i "$UPLINK" -o "$INTERFACE" -m state --state RELATED,ESTABLISHED -j ACCEPT || true
  iptables -A FORWARD -i "$INTERFACE" -o "$UPLINK" -j ACCEPT || true
  iptables-save > /etc/iptables.ipv4.nat || true
else
  echo "No UPLINK specified — skipping NAT/iptables setup"
fi

echo "Stopping wpa_supplicant and restarting dhcpcd"
systemctl stop wpa_supplicant.service 2>/dev/null || true
systemctl restart dhcpcd.service || true

echo "Enabling and starting hostapd and dnsmasq"
systemctl unmask hostapd.service 2>/dev/null || true
systemctl enable hostapd.service dnsmasq.service || true
systemctl restart hostapd.service dnsmasq.service || true

echo "AP mode started"
echo "SSID: $SSID"
echo "AP IP: 192.168.4.1"

echo "If your uplink isn't $UPLINK, re-run and adjust UPLINK variable at top of this script."

exit 0
