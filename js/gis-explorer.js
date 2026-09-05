import { isAuthenticated, getCurrentUser, logout, requireAuth } from "./services/auth-service.js";

/* Demo parcel data (no GIS backend endpoint exists — do not invent API calls). */
const DEMO_PARCELS = [
  {
    ulpin: "IN-MH-789-456-123",
    localId: "S.No 145/2",
    owner: "Ramesh Kumar",
    share: "Sole Owner (100%)",
    landUse: "Agricultural",
    area: "2.4 Hectares",
    landClass: "Agricultural Class II",
    irrigation: "Canal Fed",
    taxPaid: true,
    taxLabel: "Property Tax Paid (FY 23-24)",
    disputes: false,
    status: "Verified Record",
    locality: "Vasant Vihar, New Delhi",
    polygon: [[28.5725, 77.1485], [28.5745, 77.1585], [28.5665, 77.1635], [28.5615, 77.1535]]
  },
  {
    ulpin: "IN-DL-102-334-008",
    localId: "S.No 88/1",
    owner: "Sunita Devi",
    share: "Sole Owner (100%)",
    landUse: "Residential",
    area: "0.12 Hectares",
    landClass: "Residential Class I",
    irrigation: "Not Applicable",
    taxPaid: true,
    taxLabel: "Property Tax Paid (FY 23-24)",
    disputes: false,
    status: "Verified Record",
    locality: "Naraina, New Delhi",
    polygon: [[28.5925, 77.1355], [28.5945, 77.1445], [28.5885, 77.1465], [28.5865, 77.1375]]
  },
  {
    ulpin: "IN-DL-455-901-211",
    localId: "S.No 210/4",
    owner: "Amit Patel",
    share: "Joint Owner (50%)",
    landUse: "Commercial",
    area: "0.45 Hectares",
    landClass: "Commercial Class I",
    irrigation: "Not Applicable",
    taxPaid: false,
    taxLabel: "Property Tax Due (FY 23-24)",
    disputes: true,
    status: "Under Review",
    locality: "Kirti Nagar, New Delhi",
    polygon: [[28.5885, 77.1495], [28.5915, 77.1575], [28.5855, 77.1605], [28.5835, 77.1515]]
  },
  {
    ulpin: "IN-DL-207-118-540",
    localId: "S.No 63/7",
    owner: "Priya Sharma",
    share: "Sole Owner (100%)",
    landUse: "Agricultural",
    area: "1.8 Hectares",
    landClass: "Agricultural Class III",
    irrigation: "Tube Well",
    taxPaid: true,
    taxLabel: "Property Tax Paid (FY 23-24)",
    disputes: false,
    status: "Verified Record",
    locality: "Mahipalpur, New Delhi",
    polygon: [[28.5565, 77.1455], [28.5595, 77.1545], [28.5525, 77.1575], [28.5505, 77.1485]]
  },
  {
    ulpin: "IN-DL-310-622-077",
    localId: "S.No 301/2",
    owner: "Rajesh Kumar",
    share: "Sole Owner (100%)",
    landUse: "Industrial",
    area: "0.9 Hectares",
    landClass: "Industrial Class II",
    irrigation: "Not Applicable",
    taxPaid: true,
    taxLabel: "Property Tax Paid (FY 23-24)",
    disputes: false,
    status: "Verified Record",
    locality: "Mayapuri, New Delhi",
    polygon: [[28.5965, 77.1285], [28.5995, 77.1365], [28.5935, 77.1385], [28.5915, 77.1305]]
  }
];

const LAND_USE_FILTERS = ["Agricultural", "Residential", "Commercial", "Industrial"];

let map = null;
let parcelLayer = null;
let roadsLayer = null;
let satelliteLayer = null;
let streetLayer = null;
let satelliteOn = false;
let polygonByUlpin = {};
let selectedUlpin = DEMO_PARCELS[0].ulpin;

const $ = (id) => document.getElementById(id);

function toast(msg) {
  const el = $("gis-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 2600);
}

function getActiveLandUses() {
  return LAND_USE_FILTERS.filter((lu) => {
    const cb = document.querySelector(`input[data-landuse="${lu}"]`);
    return cb ? cb.checked : true;
  });
}

function getFilteredParcels() {
  const q = (($("gis-search") || {}).value || "").trim().toLowerCase();
  const uses = getActiveLandUses();
  return DEMO_PARCELS.filter((p) => {
    if (!uses.includes(p.landUse)) return false;
    if (!q) return true;
    return (
      p.ulpin.toLowerCase().includes(q) ||
      p.owner.toLowerCase().includes(q) ||
      p.locality.toLowerCase().includes(q) ||
      p.localId.toLowerCase().includes(q)
    );
  });
}

function styleForParcel(ulpin) {
  const selected = ulpin === selectedUlpin;
  return {
    color: selected ? "#002f6c" : "#001b44",
    weight: selected ? 3 : 1,
    fillColor: "#002f6c",
    fillOpacity: selected ? 0.22 : 0.1
  };
}

function renderResults(list) {
  const box = $("parcel-results");
  const count = $("result-count");
  if (count) count.textContent = `${list.length} parcel${list.length === 1 ? "" : "s"} found`;
  if (!box) return;
  if (!list.length) {
    box.innerHTML = `<p class="text-sm text-secondary px-1 py-2">No parcels match the current search/filters.</p>`;
    return;
  }
  box.innerHTML = list
    .map(
      (p) => `
    <button data-ulpin="${p.ulpin}" class="parcel-result w-full text-left px-3 py-2.5 rounded-lg border transition ${
      p.ulpin === selectedUlpin
        ? "border-primary bg-primary-fixed/30"
        : "border-outline-variant/60 hover:bg-surface-container-high"
    }">
      <span class="block text-sm font-bold text-primary truncate">${p.ulpin}</span>
      <span class="block text-xs text-secondary truncate">${p.owner} • ${p.locality}</span>
      <span class="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
        p.status === "Verified Record" ? "bg-green-100/60 text-green-700" : "bg-orange-100/70 text-orange-700"
      }">${p.status} • ${p.landUse}</span>
    </button>`
    )
    .join("");
  box.querySelectorAll(".parcel-result").forEach((btn) => {
    btn.addEventListener("click", () => selectParcel(btn.getAttribute("data-ulpin"), true));
  });
}

function drawParcels() {
  if (!map || !parcelLayer) return;
  parcelLayer.clearLayers();
  polygonByUlpin = {};
  const list = getFilteredParcels();
  list.forEach((p) => {
    const poly = window.L.polygon(p.polygon, styleForParcel(p.ulpin));
    poly.on("click", () => selectParcel(p.ulpin, false));
    poly.bindTooltip(`${p.ulpin} • ${p.landUse}`, { sticky: true });
    poly.addTo(parcelLayer);
    polygonByUlpin[p.ulpin] = poly;
  });
  const showParcels = $("layer-parcels") ? $("layer-parcels").checked : true;
  if (showParcels && !map.hasLayer(parcelLayer)) parcelLayer.addTo(map);
  if (!showParcels && map.hasLayer(parcelLayer)) map.removeLayer(parcelLayer);
}

function selectParcel(ulpin, fly) {
  const parcel = DEMO_PARCELS.find((p) => p.ulpin === ulpin);
  if (!parcel) return;
  selectedUlpin = ulpin;
  renderDetails(parcel);
  renderResults(getFilteredParcels());
  Object.entries(polygonByUlpin).forEach(([u, poly]) => poly.setStyle(styleForParcel(u)));
  if (fly && map && polygonByUlpin[ulpin]) {
    map.flyToBounds(polygonByUlpin[ulpin].getBounds().pad(0.6), { duration: 0.6 });
  }
}

function renderDetails(p) {
  if ($("pd-status")) $("pd-status").innerHTML = `<span class="material-symbols-outlined text-[14px]">check_circle</span> ${p.status}`;
  if ($("pd-ulpin")) $("pd-ulpin").textContent = p.ulpin;
  if ($("pd-localid")) $("pd-localid").textContent = p.localId;
  if ($("pd-owner-name")) $("pd-owner-name").textContent = p.owner;
  if ($("pd-owner-share")) $("pd-owner-share").textContent = p.share;
  if ($("pd-initial")) $("pd-initial").textContent = (p.owner || "R").trim().charAt(0).toUpperCase();
  if ($("pd-area")) $("pd-area").textContent = p.area;
  if ($("pd-class")) $("pd-class").textContent = p.landClass;
  if ($("pd-irrigation")) $("pd-irrigation").textContent = p.irrigation;
  if ($("pd-locality")) $("pd-locality").textContent = p.locality;
  if ($("pd-tax")) $("pd-tax").textContent = p.taxLabel;
  if ($("pd-disputes")) $("pd-disputes").textContent = p.disputes ? "Active Dispute Recorded" : "No Active Disputes";
  const panel = $("parcel-panel");
  if (panel) panel.classList.remove("hidden");
}

function downloadRoR() {
  const p = DEMO_PARCELS.find((x) => x.ulpin === selectedUlpin);
  if (!p) return;
  const lines = [
    "BHARAT BHUMI - RECORD OF RIGHTS (DEMO)",
    "======================================",
    `ULPIN: ${p.ulpin}`,
    `Local ID: ${p.localId}`,
    `Locality: ${p.locality}`,
    `Owner: ${p.owner} (${p.share})`,
    `Land Use: ${p.landUse}`,
    `Total Area: ${p.area}`,
    `Land Class: ${p.landClass}`,
    `Irrigation: ${p.irrigation}`,
    `Tax: ${p.taxLabel}`,
    `Disputes: ${p.disputes ? "Active Dispute Recorded" : "No Active Disputes"}`,
    `Status: ${p.status}`,
    "",
    "Note: Demo record generated locally for SIH 2026 frontend demonstration."
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `RoR_${p.ulpin.replace(/[^A-Za-z0-9]+/g, "_")}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(`RoR downloaded for ${p.ulpin} (demo)`);
}

function initMap() {
  if (!window.L || ! $("gis-map")) return;
  map = window.L.map("gis-map", { zoomControl: false }).setView([28.575, 77.152], 13);
  streetLayer = window.L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);
  satelliteLayer = window.L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { maxZoom: 19, attribution: "Imagery &copy; Esri" }
  );
  parcelLayer = window.L.layerGroup().addTo(map);
  roadsLayer = window.L.layerGroup();
  [
    [[28.5965, 77.1265], [28.5885, 77.1425], [28.5765, 77.1565], [28.5625, 77.1645]],
    [[28.5855, 77.1285], [28.5815, 77.1455], [28.5725, 77.1615]],
    [[28.5995, 77.1435], [28.5865, 77.1505], [28.5705, 77.1475], [28.5535, 77.1525]]
  ].forEach((pts) => window.L.polyline(pts, { color: "#5c5f61", weight: 2, dashArray: "6 4" }).addTo(roadsLayer));
  roadsLayer.addTo(map);
  drawParcels();
}

function setupControls() {
  if ($("btn-zoom-in")) $("btn-zoom-in").addEventListener("click", () => map && map.zoomIn());
  if ($("btn-zoom-out")) $("btn-zoom-out").addEventListener("click", () => map && map.zoomOut());
  if ($("btn-satellite")) $("btn-satellite").addEventListener("click", () => {
    if (!map) return;
    satelliteOn = !satelliteOn;
    if (satelliteOn) {
      if (map.hasLayer(streetLayer)) map.removeLayer(streetLayer);
      satelliteLayer.addTo(map);
      if (map.hasLayer(roadsLayer)) map.removeLayer(roadsLayer);
      if (map.hasLayer(parcelLayer)) { map.removeLayer(parcelLayer); parcelLayer.addTo(map); }
    } else {
      if (map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer);
      streetLayer.addTo(map);
      if ($("layer-roads") && $("layer-roads").checked) roadsLayer.addTo(map);
    }
    toast(satelliteOn ? "Satellite view on" : "Street view on");
  });
  if ($("btn-locate")) $("btn-locate").addEventListener("click", () => {
    if (!map) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => map.flyTo([pos.coords.latitude, pos.coords.longitude], 15, { duration: 0.8 }),
        () => { map.flyTo([28.575, 77.152], 13, { duration: 0.8 }); toast("Location unavailable — showing New Delhi (demo)"); },
        { timeout: 6000 }
      );
    } else {
      map.flyTo([28.575, 77.152], 13, { duration: 0.8 });
    }
  });
}

function setupFilters() {
  if ($("gis-search")) $("gis-search").addEventListener("input", () => {
    renderResults(getFilteredParcels());
    drawParcels();
  });
  document.querySelectorAll('input[data-landuse]').forEach((cb) => {
    cb.addEventListener("change", () => {
      const list = getFilteredParcels();
      renderResults(list);
      drawParcels();
      if (list.length && !list.some((p) => p.ulpin === selectedUlpin)) selectParcel(list[0].ulpin, false);
    });
  });
  if ($("layer-parcels")) $("layer-parcels").addEventListener("change", drawParcels);
  if ($("layer-roads")) $("layer-roads").addEventListener("change", (e) => {
    if (!map) return;
    if (e.target.checked) roadsLayer.addTo(map);
    else if (map.hasLayer(roadsLayer)) map.removeLayer(roadsLayer);
  });
  if ($("layer-topo")) $("layer-topo").addEventListener("change", (e) => {
    const grid = $("map-grid");
    if (grid) grid.classList.toggle("hidden", !e.target.checked);
  });
  if ($("btn-clear-gis")) $("btn-clear-gis").addEventListener("click", () => {
    if ($("gis-search")) $("gis-search").value = "";
    document.querySelectorAll('input[data-landuse]').forEach((cb) => { cb.checked = true; });
    renderResults(getFilteredParcels());
    drawParcels();
  });
}

function setupActions() {
  if ($("btn-download-ror")) $("btn-download-ror").addEventListener("click", downloadRoR);
  if ($("btn-action")) $("btn-action").addEventListener("click", () => {
    toast(`Action started for ${selectedUlpin}: Apply for Mutation (demo)`);
  });
  const closeBtn = $("btn-close-details");
  if (closeBtn) closeBtn.addEventListener("click", () => {
    const panel = $("parcel-panel");
    if (panel && window.innerWidth < 1024) panel.classList.add("hidden");
    else toast("Select a parcel on the map to update details");
  });
}

function setupSession() {
  const user = getCurrentUser() || {};
  const name = user.username || "Citizen";
  const role = user.role || "USER";
  if ($("top-nav-username")) $("top-nav-username").textContent = name;
  if ($("top-nav-role-badge")) $("top-nav-role-badge").textContent = role;
  // Sidebar portal header stays static: "Citizen Portal" / "USER • Verified Profile".
  const doLogout = () => logout("login.html");
  if ($("btn-topnav-logout")) $("btn-topnav-logout").addEventListener("click", doLogout);
  if ($("btn-sidebar-logout")) $("btn-sidebar-logout").addEventListener("click", doLogout);
}

function init() {
  // Shared by both portals (admin "Open in GIS" links here): auth only, no role routing.
  if (!requireAuth()) {
    return;
  }
  setupSession();
  initMap();
  setupControls();
  setupFilters();
  setupActions();
  renderResults(getFilteredParcels());
  selectParcel(selectedUlpin, false);
}

document.addEventListener("DOMContentLoaded", init);
