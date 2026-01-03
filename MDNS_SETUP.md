# mDNS Setup Guide - Automatic IP Discovery

This guide explains how to use mDNS (Multicast DNS) for automatic IP address discovery of your ESP32 devices.

## What is mDNS?

mDNS allows devices to be accessed by a hostname (like `esp32-cam.local`) instead of an IP address. This means you don't need to update IP addresses manually when they change!

## ESP32 Firmware Changes

Both ESP32 devices have been updated with mDNS support:

### ESP32-CAM
- **Hostname**: `esp32-cam.local`
- **Access URL**: `http://esp32-cam.local/stream`

### ESP32 Buzzer
- **Hostname**: `esp32-buzzer.local`
- **Access URL**: `http://esp32-buzzer.local/buzzer/off`

## What You Need to Do

### 1. Upload Updated Firmware to ESP32s

**You MUST upload the updated firmware to both ESP32 devices:**

1. **ESP32-CAM** (`firmware/esp32_cam/src/main.cpp`)
   - Open in Arduino IDE or PlatformIO
   - Upload to your ESP32-CAM board
   - Check Serial Monitor - you should see: "mDNS responder started"

2. **ESP32 Buzzer** (`firmware/esp32_buzzer/src/main.cpp`)
   - Open in Arduino IDE or PlatformIO
   - Upload to your ESP32 Dev Board
   - Check Serial Monitor - you should see: "mDNS responder started"

### 2. Verify mDNS is Working

After uploading, test if mDNS works:

1. **On Windows**: Open browser and try:
   - `http://esp32-cam.local/stream`
   - `http://esp32-buzzer.local/status`

2. **If it doesn't work**: You may need to install Bonjour Print Services (Apple's mDNS implementation)
   - Download: https://support.apple.com/kb/DL999
   - Install and restart browser

3. **Alternative**: Use IP address as fallback (see config.js)

### 3. Website Configuration

The website is already configured to use mDNS hostnames:
- `ESP32_CAM_IP: 'esp32-cam.local'`
- `ESP32_BUZZER_IP: 'esp32-buzzer.local'`

**No changes needed** - just refresh your browser after uploading firmware!

## Browser Compatibility

- ✅ **Chrome/Edge**: Works natively
- ✅ **Firefox**: Works natively (may need to enable in settings)
- ⚠️ **Safari**: Works natively on Mac
- ⚠️ **Other browsers**: May need Bonjour service installed

## Troubleshooting

### mDNS Not Working?

1. **Check Serial Monitor**: Look for "mDNS responder started" message
2. **Try IP address**: Temporarily use IP in config.js as fallback
3. **Install Bonjour**: On Windows, install Bonjour Print Services
4. **Check network**: Ensure all devices are on the same Wi-Fi network
5. **Firewall**: Some firewalls block mDNS - try disabling temporarily

### Fallback to IP Address

If mDNS doesn't work, you can use IP addresses directly in `js/config.js`:

```javascript
ESP32_CAM_IP: '192.168.137.141', // Use IP instead
ESP32_BUZZER_IP: '192.168.137.XXX', // Use IP instead
```

## Benefits

✅ **No manual IP updates** - IPs can change, hostnames stay the same  
✅ **Automatic discovery** - Works across network changes  
✅ **Easy to remember** - `esp32-cam.local` vs `192.168.137.141`  
✅ **No cloud needed** - Works entirely on local network  

## Summary

1. ✅ Firmware updated with mDNS support
2. ⚠️ **YOU MUST UPLOAD** updated firmware to both ESP32s
3. ✅ Website configured to use hostnames
4. ✅ Test in browser to verify mDNS works
5. ✅ If needed, install Bonjour service on Windows

After uploading the firmware, your devices will automatically broadcast their hostnames and the website will find them automatically!

