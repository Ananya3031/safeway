
# SafeWay — Web Geo-Alert (Ready-made)

This is a ready-made, single-page **Web App** you can use for hackathons or demos.
It includes:
- Interactive map (Leaflet + OpenStreetMap)
- Admin panel to add/remove unsafe zones (click on map or enter lat,lng)
- Geofencing: automatic alerts when user gets close to unsafe zones
- Alarm sound + vibration + modal alert + SOS call button
- Data stored in browser `localStorage` (no backend required)

## How to use
1. Unzip and open `index.html` in a modern browser (Chrome/Edge/Firefox). For GPS features, open on a mobile device (or grant location permission on desktop).
2. Click on the map anywhere to add an unsafe zone (or use the admin inputs: name + lat,lng).
3. Adjust alert radius (meters) from the header input. Default is 150m.
4. Press **Use My Location** to center the map on you.
5. Move physically (or simulate location using browser devtools) — when you enter a zone, an alert modal appears and the alarm plays.

## Files
- `index.html` — main UI
- `styles.css` — styling
- `app.js` — main application logic
- `alarm.mp3` — short alarm sound placeholder (replace with better sound if needed)

## Customization & Deployment
- To persist zones server-side, replace `localStorage` logic with your backend API.
- To generate an installable PWA or mobile app, wrap with Capacitor or build a small React app.

## Notes
- Browser must allow geolocation. On desktop, you can simulate coordinates via DevTools (Sensors in Chrome).
- For emergency calling (SOS), mobile devices will open phone dialer with number 112 when SOS pressed.

---
Good luck with your hackathon! If you want, I can:
- Add Polkadot on-chain storage for reports
- Build a React/Next frontend
- Package as Android APK (Flutter/Capacitor)
