# Waking Up - Standing Detection App

A web application that uses MediaPipe Pose detection to monitor when a child stands up and wears their uniform.

## Features

- **Sequential Detection System:**
  - Phase 1: Standing detection (5 seconds continuous)
  - Phase 2: Uniform detection (5 seconds continuous, only after standing is complete)
  
- **Parent-Child Dashboard System:**
  - Child dashboard with real-time camera feed and detection
  - Parent dashboard to monitor children's activity and check status
  
- **Authentication:**
  - Separate login for parents and children
  - Children linked to parents via father's name
  
- **Real-time Notifications:**
  - Parents receive notifications when checks are complete
  - Visual checkmarks showing completion status

## Technology Stack

- HTML, CSS, JavaScript
- MediaPipe Pose for pose detection
- LocalStorage for data persistence
- No backend required - runs entirely in the browser

## Setup

1. Clone the repository
2. Open `index.html` in a browser or use a local server:
   ```bash
   python -m http.server 8000
   ```
3. Navigate to `http://localhost:8000`

## Configuration

Edit `js/config.js` to:
- Change video stream URL (for ESP32-CAM)
- Adjust standing detection thresholds
- Configure clothing color detection (default: black)

## Usage

1. **Registration:**
   - Parents register first
   - Children register and link to parent using father's name

2. **Child Dashboard:**
   - Log in as child
   - Stand up for 5 seconds (timer shown)
   - Wear black top for 5 seconds (timer shown)
   - Camera stops after both checks complete

3. **Parent Dashboard:**
   - Log in as parent
   - View children's check status
   - See notifications and records

## Project Structure

```
├── index.html              # Entry point (redirects to login)
├── login.html              # Login page
├── register.html           # Registration page
├── child-dashboard.html    # Child's detection dashboard
├── parent-dashboard.html   # Parent's monitoring dashboard
├── styles.css              # Main styles
├── auth-styles.css         # Authentication page styles
├── dashboard-styles.css    # Dashboard styles
└── js/
    ├── auth.js             # Authentication logic
    ├── auth-pages.js       # Login/register page logic
    ├── child-dashboard.js  # Child dashboard controller
    ├── parent-dashboard.js # Parent dashboard controller
    ├── pose-detector.js    # MediaPipe Pose integration
    ├── standing-detector.js # Standing detection logic
    ├── clothing-detector.js # Clothing color detection
    ├── ui-controller.js    # UI updates
    ├── records.js           # Records and notifications
    └── config.js           # Configuration settings
```

## Branches

- `main` - Main branch
- `working-version` - Current working version with sequential checks

