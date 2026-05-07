// ============================================================
//  STATE
// ============================================================
let graph = null;
const crit = { dist: false, time: false, price: false };

// Leaflet map instance
let leafletMap = null;
let routeLayerGroup = null;
let markerLayerGroup = null;

// ============================================================
//  DOM REFS
// ============================================================
const srcInput = document.getElementById('src-input');
const dstInput = document.getElementById('dst-input');
const srcDropdown = document.getElementById('src-dropdown');
const dstDropdown = document.getElementById('dst-dropdown');
const srcClear = document.getElementById('src-clear');
const dstClear = document.getElementById('dst-clear');
const srcWrap = document.getElementById('src-ac-wrap');
const dstWrap = document.getElementById('dst-ac-wrap');
const goBtn   = document.getElementById('go-btn');
const swapBtn = document.getElementById('swap-btn');
const errBox  = document.getElementById('err-box');
const loadBox = document.getElementById('load-box');
const results = document.getElementById('results');
const timeline= document.getElementById('timeline');
const resBadge= document.getElementById('result-badge');
const sDist   = document.getElementById('s-dist');
const sTime   = document.getElementById('s-time');
const sPrice  = document.getElementById('s-price');
const mapHint = document.getElementById('map-hint');

// ============================================================
//  INIT
// ============================================================
(async () => {
  showLoad('กำลังโหลดข้อมูล…', 'Loading weight_data.json');
  try {
    initMap();
    graph = await loadGraph();
    setupAutocomplete();
    bindEvents();
    hideLoad();
  } catch (err) {
    hideLoad();
    showErr('⚠️ ' + err.message);
  }
})();

// ============================================================
//  LEAFLET MAP INIT
// ============================================================
function initMap() {
  // Initialize Leaflet map centered on Thailand
  leafletMap = L.map('leaflet-map', {
    center: [13.0, 101.0],
    zoom: 6,
    minZoom: 5,
    maxZoom: 14,
    zoomControl: true,
  });

  // Dark CartoDB basemap
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(leafletMap);

  // Fetch and add Thailand province boundaries (GeoJSON)
  fetch('https://raw.githubusercontent.com/apisit/thailand.json/master/thailand.json')
    .then(r => r.json())
    .then(geoData => {
      L.geoJSON(geoData, {
        style: {
          fillColor: 'rgba(139, 92, 246, 0.06)',
          fillOpacity: 1,
          color: 'rgba(167, 139, 250, 0.25)',
          weight: 0.8,
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties && feature.properties.name) {
            layer.bindTooltip(feature.properties.name, {
              sticky: true,
              className: 'leaflet-prov-tooltip',
              direction: 'auto'
            });
          }
        }
      }).addTo(leafletMap);
    })
    .catch(() => {
      // If GeoJSON fails (CORS or network), still works without boundaries
      console.warn('Could not load Thailand GeoJSON boundaries');
    });

  // Create layer groups for routes and markers
  routeLayerGroup = L.layerGroup().addTo(leafletMap);
  markerLayerGroup = L.layerGroup().addTo(leafletMap);

  // Add province markers
  drawProvinceMarkers();
}

// ============================================================
//  PROVINCE MARKERS
// ============================================================
function drawProvinceMarkers() {
  if (!leafletMap) return;
  for (const [name, coord] of Object.entries(PROVINCE_COORDS)) {
    const [lat, lng] = coord;
    const circleMarker = L.circleMarker([lat, lng], {
      radius: 4,
      fillColor: '#1e293b',
      color: 'rgba(167, 139, 250, 0.4)',
      weight: 1,
      fillOpacity: 0.7,
    });
    const code = PROVINCE_CODES[name] || '?';
    circleMarker.bindTooltip(`${name} (${code})`, {
      sticky: true,
      className: 'leaflet-prov-tooltip',
      direction: 'auto'
    });
    circleMarker.addTo(markerLayerGroup);
    // Store reference for later use
    circleMarker._provinceName = name;
  }
}

// ============================================================
//  AUTOCOMPLETE
// ============================================================
let availableProvinces = [];

function setupAutocomplete() {
  const srcSet = new Set();
  const dstSet = new Set();
  for (const v of graph.vertices()) {
    const nbrs = graph.neighbors(v);
    if (nbrs.length > 0) srcSet.add(v);
    for (const e of nbrs) dstSet.add(e.destination);
  }
  
  // Combine all valid provinces for searching
  const allProvs = new Set([...srcSet, ...dstSet]);
  availableProvinces = [...allProvs].sort().map(name => ({
    name,
    code: PROVINCE_CODES[name] || ''
  }));

  initAC(srcInput, srcDropdown, srcClear, srcWrap);
  initAC(dstInput, dstDropdown, dstClear, dstWrap);
  
  // Hide dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!srcWrap.contains(e.target)) srcDropdown.classList.remove('open');
    if (!dstWrap.contains(e.target)) dstDropdown.classList.remove('open');
  });
}

function initAC(input, dropdown, clearBtn, wrap) {
  input.addEventListener('input', () => {
    const val = input.value.trim().toLowerCase();
    wrap.classList.toggle('has-value', val.length > 0);
    input.dataset.value = ''; // clear actual selection on type
    validate();
    
    if (!val) {
      dropdown.classList.remove('open');
      return;
    }
    
    // Search
    const matches = availableProvinces.filter(p => 
      p.name.toLowerCase().includes(val) || 
      p.code.toLowerCase().includes(val)
    );
    
    renderDropdown(matches, val, input, dropdown, wrap);
  });
  
  input.addEventListener('focus', () => {
    if (input.value) {
      // Trigger search again to show dropdown
      input.dispatchEvent(new Event('input'));
    }
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    input.dataset.value = '';
    wrap.classList.remove('has-value');
    dropdown.classList.remove('open');
    validate();
    input.focus();
  });
}

function renderDropdown(matches, query, input, dropdown, wrap) {
  dropdown.innerHTML = '';
  if (matches.length === 0) {
    dropdown.innerHTML = `<div class="ac-empty">ไม่พบจังหวัดที่ค้นหา<br/><span>ลองพิมพ์ชื่อเต็ม หรือรหัสย่อ (เช่น กทม, BKK)</span></div>`;
  } else {
    matches.forEach(m => {
      const item = document.createElement('div');
      item.className = 'ac-item';
      
      // Highlight match
      const nameRegex = new RegExp(`(${query})`, 'gi');
      const codeRegex = new RegExp(`(${query})`, 'gi');
      const hName = m.name.replace(nameRegex, '<mark>$1</mark>');
      const hCode = m.code ? m.code.replace(codeRegex, '<mark>$1</mark>') : '';
      
      item.innerHTML = `
        <span class="ac-item-name">${hName}</span>
        ${hCode ? `<span class="ac-item-code">${hCode}</span>` : ''}
      `;
      
      item.addEventListener('click', () => {
        input.value = m.name;
        input.dataset.value = m.name;
        wrap.classList.add('has-value');
        dropdown.classList.remove('open');
        validate();
      });
      
      dropdown.appendChild(item);
    });
  }
  dropdown.classList.add('open');
}

// ============================================================
//  EVENTS
// ============================================================
function bindEvents() {
  document.querySelectorAll('.crit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.key;
      crit[k] = !crit[k];
      btn.classList.toggle('on', crit[k]);
      validate();
    });
  });

  goBtn.addEventListener('click', findRoute);

  swapBtn.addEventListener('click', () => {
    // Swap text values
    const tVal = srcInput.value;
    srcInput.value = dstInput.value;
    dstInput.value = tVal;
    
    // Swap actual selected values
    const tData = srcInput.dataset.value || '';
    srcInput.dataset.value = dstInput.dataset.value || '';
    dstInput.dataset.value = tData;
    
    // Update clear button visibility
    srcWrap.classList.toggle('has-value', srcInput.value.length > 0);
    dstWrap.classList.toggle('has-value', dstInput.value.length > 0);
    
    validate();
  });
}

function validate() {
  const src = srcInput.dataset.value;
  const dst = dstInput.dataset.value;
  const ok = src && dst && (crit.dist || crit.time || crit.price);
  goBtn.disabled = !ok;
}

// ============================================================
//  FIND ROUTE
// ============================================================
async function findRoute() {
  const src = srcInput.dataset.value;
  const dst = dstInput.dataset.value;
  if (!src || !dst) return;
  if (src === dst) { showErr('⚠️ ต้นทางและปลายทางต้องเป็นคนละจังหวัด'); return; }
  hideErr();
  results.style.display = 'none';
  showLoad('กำลังคำนวณเส้นทาง…', "Running Dijkstra's Algorithm");
  clearMapRoutes();

  await new Promise(r => setTimeout(r, 60));

  const res = dijkstra(graph, src, dst, crit.dist, crit.time, crit.price);
  hideLoad();

  if (!res) { showErr(`❌ ไม่พบเส้นทาง "${src}" → "${dst}"`); return; }

  renderResults(res, src, dst);
  await renderMapRoute(res.path, res.edges);
}

// ============================================================
//  RENDER RESULTS
// ============================================================
function renderResults({ path, edges }) {
  let td = 0, tt = 0, tp = 0;
  for (const e of edges) { td += e.distance; tt += e.time; tp += e.price; }

  sDist.textContent = td.toFixed(1);
  sTime.textContent = fmtTime(tt);
  sPrice.textContent = Math.round(tp).toLocaleString();

  const labels = [];
  if (crit.dist) labels.push('📏 ระยะทาง');
  if (crit.time) labels.push('⏱️ เวลา');
  if (crit.price) labels.push('💰 ราคา');
  resBadge.textContent = labels.join(' · ');

  timeline.innerHTML = '';
  path.forEach((node, i) => {
    const isStart = i === 0, isEnd = i === path.length - 1;
    const edge = edges[i];
    const code = PROVINCE_CODES[node] || '';
    const dotCls = isStart ? 'start' : isEnd ? 'end' : '';

    let edgeHTML = '';
    if (edge) {
      const ts = getTS(edge.transport);
      edgeHTML = `
        <div class="edge-row">
          <span class="tbadge ${ts.cls}">${ts.emoji} ${ts.label}</span>
          <div class="edge-stats">
            <span class="estat">📏 <strong>${edge.distance.toFixed(0)} km</strong></span>
            <span class="estat">⏱️ <strong>${edge.time.toFixed(0)} min</strong></span>
            <span class="estat">💰 <strong>฿${Math.round(edge.price).toLocaleString()}</strong></span>
          </div>
        </div>`;
    }

    const item = document.createElement('div');
    item.className = 'tl-item';
    item.style.animationDelay = `${i * 55}ms`;
    item.innerHTML = `
      <div class="tl-track">
        <div class="tl-dot ${dotCls}"></div>
        ${!isEnd ? '<div class="tl-line"></div>' : ''}
      </div>
      <div class="tl-body">
        <div class="tl-name">
          <span>${node}</span>
          ${code ? `<span class="tl-code">${code}</span>` : ''}
        </div>
        ${edgeHTML}
      </div>`;
    timeline.appendChild(item);
  });

  results.style.display = 'block';
  setTimeout(() => results.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 100);
}

function fmtTime(m) {
  if (m < 60) return m.toFixed(0);
  const h = Math.floor(m / 60), mm = Math.round(m % 60);
  return mm ? `${h}h ${mm}m` : `${h}h`;
}

// ============================================================
//  MAP ROUTE RENDERING (Leaflet)
// ============================================================
function clearMapRoutes() {
  if (routeLayerGroup) routeLayerGroup.clearLayers();
}

async function renderMapRoute(path, edges) {
  if (!path || path.length < 1 || !leafletMap) return;

  mapHint.textContent = `${path.length} จังหวัด · ${path.length - 1} เส้นทาง`;

  const routeBounds = [];

  for (let i = 0; i < path.length - 1; i++) {
    const fromName = path[i];
    const toName   = path[i + 1];
    const edge     = edges[i];
    const fromCoord = PROVINCE_COORDS[fromName];
    const toCoord   = PROVINCE_COORDS[toName];
    if (!fromCoord || !toCoord) continue;

    const transport = edge ? edge.transport || '' : '';
    const isAir = transport.includes('เครื่องบิน');

    routeBounds.push([fromCoord[0], fromCoord[1]]);
    routeBounds.push([toCoord[0], toCoord[1]]);

    if (isAir) {
      // ✈️ AIRPLANE: Draw animated great-circle arc
      await drawAirArc(fromCoord, toCoord, i);
    } else {
      // 🚌/🚗 GROUND: Try OSRM for actual road path
      await drawRoadRoute(fromCoord, toCoord, transport, i);
    }
  }

  // Draw markers for each node in path
  path.forEach((name, i) => {
    const coord = PROVINCE_COORDS[name];
    if (!coord) return;

    const isStart = i === 0;
    const isEnd   = i === path.length - 1;
    const color   = isStart ? '#34d399' : isEnd ? '#f87171' : '#a78bfa';
    const radius  = isStart || isEnd ? 10 : 7;
    const label   = isStart ? '🟢' : isEnd ? '🔴' : '';
    const code    = PROVINCE_CODES[name] || '';

    // Outer glow
    L.circleMarker([coord[0], coord[1]], {
      radius: radius + 5,
      fillColor: color,
      color: 'transparent',
      fillOpacity: 0.18,
    }).addTo(routeLayerGroup);

    // Main marker
    const marker = L.circleMarker([coord[0], coord[1]], {
      radius: radius,
      fillColor: color,
      color: '#07090f',
      weight: 2,
      fillOpacity: 1,
    });
    marker.bindTooltip(
      `${label} ${name}${code ? ` (${code})` : ''}`,
      { permanent: isStart || isEnd, className: 'leaflet-route-tooltip', direction: 'top' }
    );
    marker.addTo(routeLayerGroup);
  });

  // Fit map to route bounds
  if (routeBounds.length > 0) {
    leafletMap.fitBounds(L.latLngBounds(routeBounds), { padding: [60, 60] });
  }
}

// ============================================================
//  AIRPLANE: Animated Arc using Bezier curve points
// ============================================================
async function drawAirArc(fromCoord, toCoord, index) {
  const [lat1, lng1] = fromCoord;
  const [lat2, lng2] = toCoord;

  // Generate smooth arc points (quadratic bezier in lat/lng space)
  const arcPoints = generateArc([lat1, lng1], [lat2, lng2], 60);

  // Airplane trail (wide amber glow)
  const glowLine = L.polyline(arcPoints, {
    color: 'rgba(251,191,36,0.15)',
    weight: 12,
    lineCap: 'round',
    lineJoin: 'round',
    smoothFactor: 1,
  });
  glowLine.addTo(routeLayerGroup);

  // Main dashed arc line
  const arcLine = L.polyline(arcPoints, {
    color: '#f59e0b',
    weight: 2.5,
    opacity: 0.9,
    dashArray: '8, 5',
    lineCap: 'round',
    lineJoin: 'round',
    smoothFactor: 1,
  });
  arcLine.addTo(routeLayerGroup);

  // Small airplane icon at midpoint
  const mid = arcPoints[Math.floor(arcPoints.length / 2)];
  const airIcon = L.divIcon({
    className: '',
    html: `<div style="font-size:18px;filter:drop-shadow(0 0 6px #f59e0b);transform:translate(-50%,-50%)">✈️</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
  L.marker(mid, { icon: airIcon }).addTo(routeLayerGroup);
}

// Generate arc (bezier) between two lat/lng points
function generateArc([lat1, lng1], [lat2, lng2], numPoints = 60) {
  const points = [];
  // Control point: perpendicular offset from midpoint
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;
  // Push control point upward (toward equator offset) for nice arc
  const dlat = lat2 - lat1, dlng = lng2 - lng1;
  const dist = Math.sqrt(dlat * dlat + dlng * dlng);
  const perp = dist * 0.35; // arc height factor
  // Perpendicular direction (rotate 90°)
  const cpLat = midLat - dlng / dist * perp;
  const cpLng = midLng + dlat / dist * perp;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const mt = 1 - t;
    const lat = mt * mt * lat1 + 2 * mt * t * cpLat + t * t * lat2;
    const lng = mt * mt * lng1 + 2 * mt * t * cpLng + t * t * lng2;
    points.push([lat, lng]);
  }
  return points;
}

// ============================================================
//  GROUND TRANSPORT: OSRM Road Routing
// ============================================================
const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

async function drawRoadRoute(fromCoord, toCoord, transport, index) {
  const [lat1, lng1] = fromCoord;
  const [lat2, lng2] = toCoord;
  const isTrain = transport.includes('รถไฟ');
  const isBoat  = transport.includes('เรือ');

  // For boat, draw dashed arc (similar to air but different color)
  if (isBoat) {
    const arcPoints = generateArc([lat1, lng1], [lat2, lng2], 50);
    L.polyline(arcPoints, {
      color: '#06b6d4',
      weight: 2.5,
      opacity: 0.85,
      dashArray: '10, 6',
    }).addTo(routeLayerGroup);
    const mid = arcPoints[Math.floor(arcPoints.length / 2)];
    const icon = L.divIcon({ className:'', html:`<div style="font-size:16px;transform:translate(-50%,-50%)">⛴️</div>`, iconSize:[20,20], iconAnchor:[10,10] });
    L.marker(mid, { icon }).addTo(routeLayerGroup);
    return;
  }

  // For train, also use OSRM (approximate rail corridors follow roads mostly)
  // Color differs
  const color = isTrain ? '#818cf8' : '#38bdf8';
  const glowColor = isTrain ? 'rgba(129,140,248,0.12)' : 'rgba(56,189,248,0.12)';

  try {
    const url = `${OSRM_BASE}/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) throw new Error('OSRM error');
    const data = await res.json();

    if (data.code !== 'Ok' || !data.routes[0]) throw new Error('No route');

    const coords = data.routes[0].geometry.coordinates.map(([lng, lat]) => [lat, lng]);

    // Glow layer
    L.polyline(coords, {
      color: glowColor,
      weight: 14,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(routeLayerGroup);

    // Main road line
    L.polyline(coords, {
      color: color,
      weight: 3.5,
      opacity: 0.9,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(routeLayerGroup);

    // Transport icon at midpoint
    const mid = coords[Math.floor(coords.length / 2)];
    const emoji = isTrain ? '🚆' : transport.includes('รถบัส') ? '🚌' : '🚗';
    const icon = L.divIcon({
      className: '',
      html: `<div style="font-size:15px;filter:drop-shadow(0 0 4px ${color});background:rgba(0,0,0,0.6);border-radius:50%;padding:2px;transform:translate(-50%,-50%)">${emoji}</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
    L.marker(mid, { icon }).addTo(routeLayerGroup);

  } catch (e) {
    // Fallback: straight line if OSRM fails
    drawStraightFallback([lat1, lng1], [lat2, lng2], color);
  }
}

function drawStraightFallback([lat1, lng1], [lat2, lng2], color) {
  L.polyline([[lat1, lng1], [lat2, lng2]], {
    color: color,
    weight: 3,
    opacity: 0.75,
    dashArray: '6, 4',
  }).addTo(routeLayerGroup);
}

// ============================================================
//  UTILS
// ============================================================
function showErr(msg) {
  errBox.textContent = msg;
  errBox.style.display = 'block';
}
function hideErr() {
  errBox.style.display = 'none';
  errBox.textContent = '';
}
function showLoad(title, sub) {
  loadBox.style.display = 'flex';
  loadBox.querySelector('.load-title').textContent = title;
  loadBox.querySelector('.load-sub').textContent = sub;
}
function hideLoad() { loadBox.style.display = 'none'; }
