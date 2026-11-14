# ASTRA — Immersive Astronaut Vision System

A NASA Space Apps Challenge project: an immersive, first-person astronaut helmet HUD
for health monitoring during long-duration space missions.

## Features

- **ENTER ASTRONAUT VISION** — full-screen immersive helmet HUD over live camera
- **Live camera** via `navigator.mediaDevices.getUserMedia()` (rear camera default on mobile)
- Camera **switch**, **on/off**, **fullscreen**, **brightness**, **sound** controls
- **Health Scan** with animated scanning sequence
- **AI Health Intelligence** risk engine (simulated demo data, clearly labelled)
- **AI Medical Copilot** chat interface
- **Future Health Simulator** (7-day scenarios)
- **Emergency Mode** with onboard guidance
- **Fallback** screen if camera permission is denied
- **Demo mode** if no camera is present
- Responsive for mobile, tablet and desktop

## ⚠️ Medical Data Disclaimer

A browser camera **cannot** measure SpO2, blood pressure, radiation, bone density,
or immune function. All health readings in ASTRA are **SIMULATED DEMO DATA**
unless a real hardware/API integration is added in the future.

## Run locally

```bash
npm install
npm run dev
