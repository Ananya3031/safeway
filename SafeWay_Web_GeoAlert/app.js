
// SafeWay — app.js (Geo-Alert Web)
// Stores unsafe zones in localStorage, shows them on a Leaflet map,
// watches user position, and alerts when entering geofenced zones.

const STORAGE_KEY = 'safeway_unsafe_zones_v1';
const map = L.map('map').setView([20.5937,78.9629],5);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

let markers = [];
let circles = [];
let unsafeZones = loadZones();
let watchId = null;
let alertedZones = new Set(); // avoid repeated alerts per zone until leave/re-enter

const alarm = document.getElementById('alarmSound');
const modal = document.getElementById('alertModal');
const alertText = document.getElementById('alertText');
const dismissAlert = document.getElementById('dismissAlert');
const sosBtn = document.getElementById('sosBtn');
const radiusInput = document.getElementById('radiusInput');

function loadZones(){
  try{
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch(e){ return []; }
}

function saveZones(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(unsafeZones));
}

// Render zones list in panel
function renderZones(){
  const list = document.getElementById('zonesList');
  list.innerHTML = '';
  unsafeZones.forEach((z, idx) => {
    const li = document.createElement('li');
    const txt = document.createElement('div');
    txt.innerHTML = `<strong>${z.name||'Zone '+(idx+1)}</strong><br><small>${z.lat.toFixed(5)}, ${z.lng.toFixed(5)}</small>`;
    const actions = document.createElement('div');
    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.onclick = ()=>{ unsafeZones.splice(idx,1); saveZones(); drawZones(); renderZones(); };
    actions.appendChild(del);
    li.appendChild(txt);
    li.appendChild(actions);
    list.appendChild(li);
  });
}

// Draw zones on map
function drawZones(){
  // remove old
  markers.forEach(m=>map.removeLayer(m)); markers=[];
  circles.forEach(c=>map.removeLayer(c)); circles=[];

  unsafeZones.forEach(z=>{
    const m = L.marker([z.lat,z.lng]).addTo(map).bindPopup(z.name || 'Unsafe zone');
    const c = L.circle([z.lat,z.lng], {radius: z.radius || parseInt(radiusInput.value) || 150, color:'red', fillOpacity:0.12}).addTo(map);
    markers.push(m); circles.push(c);
  });
}

// Add zone programmatically
function addZone(name, lat, lng, radius){
  unsafeZones.push({name, lat, lng, radius: radius || parseInt(radiusInput.value) || 150});
  saveZones();
  drawZones();
  renderZones();
}

// Map click to add zone
map.on('click', function(e){
  const name = prompt('Enter zone name (optional)');
  if(name === null) return;
  addZone(name || 'Zone', e.latlng.lat, e.latlng.lng);
});

// Load existing
drawZones();
renderZones();

// UI bindings
document.getElementById('addBtn').addEventListener('click', ()=>{
  const name = document.getElementById('name').value || 'Zone';
  const coords = document.getElementById('coords').value.trim();
  if(!coords) { alert('Enter lat,lng or click on map'); return; }
  const parts = coords.split(',');
  if(parts.length !== 2){ alert('Use format: lat,lng'); return; }
  const lat = parseFloat(parts[0]), lng = parseFloat(parts[1]);
  if(isNaN(lat) || isNaN(lng)){ alert('Invalid coordinates'); return; }
  addZone(name, lat, lng);
  document.getElementById('coords').value = '';
  document.getElementById('name').value = '';
});

document.getElementById('showUnsafe').addEventListener('click', ()=>{
  if(unsafeZones.length===0) return alert('No zones added yet.');
  map.fitBounds(unsafeZones.map(z=>[z.lat,z.lng]));
});

document.getElementById('clearBtn').addEventListener('click', ()=>{
  if(!confirm('Clear all unsafe zones?')) return;
  unsafeZones = [];
  saveZones();
  drawZones();
  renderZones();
});

document.getElementById('locateBtn').addEventListener('click', ()=>{
  if(!navigator.geolocation) return alert('Geolocation not supported.');
  navigator.geolocation.getCurrentPosition(pos=>{
    map.setView([pos.coords.latitude, pos.coords.longitude], 16);
  }, err=>{ alert('Location error: '+err.message); });
});

dismissAlert.addEventListener('click', ()=>{ hideAlert(); });
sosBtn.addEventListener('click', ()=>{
  // If user is on mobile, this will attempt to open the dialer
  window.location.href = 'tel:112';
});

// Geofence check
function getDistance(lat1, lon1, lat2, lon2){
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function showAlert(zone, distance){
  if(alertedZones.has(zone.name)) return; // already alerted for this zone until re-entry
  alertedZones.add(zone.name);
  alertText.innerHTML = `<strong>${zone.name}</strong><br>Distance: ${Math.round(distance)} m<br>Recommended: Avoid area or take precautions.`;
  modal.classList.remove('hidden');
  try{ alarm.play().catch(()=>{}); } catch(e) {}
  // Vibrate if supported
  if(navigator.vibrate){ navigator.vibrate([200,100,200]); }
}

// hide alert
function hideAlert(){
  modal.classList.add('hidden');
  try{ alarm.pause(); alarm.currentTime = 0; } catch(e) {}
}

// watch user position and check zones
function startWatch(){
  if(!navigator.geolocation) return alert('Geolocation not supported.');
  if(watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = navigator.geolocation.watchPosition(pos=>{
    const uLat = pos.coords.latitude, uLng = pos.coords.longitude;
    // check each zone
    unsafeZones.forEach(z=>{
      const d = getDistance(uLat,uLng,z.lat,z.lng);
      const threshold = z.radius || parseInt(radiusInput.value) || 150;
      if(d <= threshold){
        showAlert(z,d);
      } else {
        // if user moved away from zone, allow future alerts again
        if(alertedZones.has(z.name) && d > threshold + 30){
          alertedZones.delete(z.name);
        }
      }
    });
  }, err=>{ console.error('watch error', err); }, { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 });
}

// Start watching immediately for convenience
startWatch();
