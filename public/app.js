/* NagarAI Dashboard App Frontend Logic */

let map;
let markersLayer;
let allClusters = [];
let activeCategoryFilter = "all";

// Color mapping for categories
const CATEGORY_COLORS = {
  open_manhole: "#ef4444",
  pothole: "#f97316",
  waterlogging: "#06b6d4",
  garbage: "#10b981",
  streetlight: "#eab308",
  other: "#a855f7"
};

document.addEventListener("DOMContentLoaded", () => {
  initMap();
  initEventListeners();
  fetchClusters();
});

function initMap() {
  // Center map on Connaught Place, New Delhi
  map = L.map("map").setView([28.6315, 77.2167], 13);

  // Dark CartoDB Tile Layer
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "&copy; OpenStreetMap &copy; CARTO",
    maxZoom: 19
  }).addTo(map);

  markersLayer = L.layerGroup().addTo(map);

  // Map Click Handler: Set form coordinates on click
  map.on("click", (e) => {
    const lat = e.latlng.lat.toFixed(4);
    const lon = e.latlng.lng.toFixed(4);
    document.getElementById("formLat").value = lat;
    document.getElementById("formLon").value = lon;
    openSubmitModal();
  });
}

function initEventListeners() {
  // Navigation & Toolbar Buttons
  document.getElementById("btnOpenSubmitModal").addEventListener("click", openSubmitModal);
  document.getElementById("btnCloseSubmitModal").addEventListener("click", closeSubmitModal);
  document.getElementById("btnCancelSubmit").addEventListener("click", closeSubmitModal);

  document.getElementById("btnCloseDetailModal").addEventListener("click", closeDetailModal);

  document.getElementById("btnSeedData").addEventListener("click", async () => {
    await fetch("/api/seed", { method: "POST" });
    fetchClusters();
  });

  document.getElementById("btnResetDB").addEventListener("click", async () => {
    if (confirm("Are you sure you want to delete all complaint clusters and start fresh?")) {
      await fetch("/api/reset", { method: "POST" });
      fetchClusters();
    }
  });

  // Category Filter Chips
  document.querySelectorAll(".filter-chip").forEach(chip => {
    chip.addEventListener("click", (e) => {
      document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
      e.target.classList.add("active");
      activeCategoryFilter = e.target.dataset.cat;
      renderDashboard();
    });
  });

  // Complaint Submission Form Handler
  document.getElementById("complaintForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btnSubmitForm");
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing Engine...';

    const formData = new FormData();
    const rawText = document.getElementById("formRawText").value.trim();
    const audioFile = document.getElementById("formAudioFile").files[0];
    const imageFile = document.getElementById("formImageFile").files[0];

    if (rawText) formData.append("raw_text", rawText);
    if (audioFile) formData.append("audio_file", audioFile);
    if (imageFile) formData.append("image_file", imageFile);

    formData.append("latitude", document.getElementById("formLat").value);
    formData.append("longitude", document.getElementById("formLon").value);
    formData.append("is_sensitive_location", document.getElementById("formSensitive").checked);

    try {
      const res = await fetch("/api/complaint/submit", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Run Engine & Deduplicate';
      closeSubmitModal();
      document.getElementById("complaintForm").reset();

      fetchClusters();
      if (data.cluster) {
        showClusterDetails(data.cluster.cluster_id);
      }
    } catch (err) {
      alert("Submission Error: " + err.message);
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Run Engine & Deduplicate';
    }
  });
}

async function fetchClusters() {
  try {
    const res = await fetch("/api/clusters");
    const data = await res.json();
    allClusters = data.clusters || [];
    renderDashboard();
  } catch (err) {
    console.error("Error fetching clusters:", err);
  }
}

function renderDashboard() {
  markersLayer.clearLayers();
  const listEl = document.getElementById("clusterCardsList");
  listEl.innerHTML = "";

  // Filter clusters by category
  const filtered = allClusters.filter(c => {
    if (activeCategoryFilter === "all") return true;
    return c.category === activeCategoryFilter;
  });

  // Calculate System Stats
  const totalClusters = allClusters.length;
  const totalCitizens = allClusters.reduce((sum, c) => sum + (c.affected_citizens || 1), 0);
  const reductionPercent = totalCitizens > 0 ? ((1 - (totalClusters / totalCitizens)) * 100).toFixed(0) : "0";

  document.getElementById("statClusters").textContent = totalClusters;
  document.getElementById("statCitizens").textContent = totalCitizens;
  document.getElementById("statReduction").textContent = reductionPercent + "%";

  if (filtered.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center; padding: 40px 20px; color: var(--text-muted);">
        <i class="fa-solid fa-folder-open" style="font-size: 32px; margin-bottom: 12px; display:block;"></i>
        <p style="font-weight: 600;">No Complaints Found</p>
        <p style="font-size:12px;">Submit a custom complaint or click "Seed Samples"</p>
      </div>`;
    return;
  }

  filtered.forEach((cluster, idx) => {
    // 1. Add Map Marker
    const color = CATEGORY_COLORS[cluster.category] || CATEGORY_COLORS.other;
    const customIcon = L.divIcon({
      className: "custom-map-pin",
      html: `<div style="background-color:${color}; width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow:0 0 10px ${color}"></div>`,
      iconSize: [16, 16]
    });

    const marker = L.marker([cluster.latitude, cluster.longitude], { icon: customIcon }).addTo(markersLayer);
    
    marker.bindPopup(`
      <div style="font-family:Inter; color:#0f172a; padding:4px;">
        <h4 style="margin:0 0 4px; font-size:13px; font-weight:700;">${cluster.summary}</h4>
        <p style="margin:0; font-size:11px;">Category: <b>${cluster.category}</b></p>
        <p style="margin:2px 0 0; font-size:11px;">Priority: <b style="color:${color}">${cluster.priority_score.toFixed(1)} / 100</b></p>
      </div>
    `);

    // 2. Render Queue Card
    const card = document.createElement("div");
    card.className = "cluster-card";
    const priorityClass = cluster.priority_score >= 80 ? "high" : (cluster.priority_score >= 50 ? "medium" : "low");

    card.innerHTML = `
      <div class="card-top">
        <span class="cat-badge ${cluster.category}">${cluster.category.replace('_', ' ')}</span>
        <span class="priority-tag ${priorityClass}">${cluster.priority_score.toFixed(1)}</span>
      </div>
      <div class="card-title">${cluster.summary}</div>
      <div class="card-meta">
        <div class="card-meta-item"><i class="fa-solid fa-users"></i> ${cluster.affected_citizens} Citizens</div>
        <div class="card-meta-item"><i class="fa-solid fa-building-user"></i> ${cluster.assigned_department || 'Municipal Services'}</div>
        <div class="card-meta-item"><i class="fa-solid fa-clock"></i> SLA: ${cluster.sla_hours || 24}h</div>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <select class="status-select" onclick="event.stopPropagation()" onchange="updateClusterStatus('${cluster.cluster_id}', this.value)">
          <option value="SUBMITTED" ${cluster.status === 'SUBMITTED' ? 'selected' : ''}>SUBMITTED</option>
          <option value="IN_PROGRESS" ${cluster.status === 'IN_PROGRESS' ? 'selected' : ''}>IN PROGRESS</option>
          <option value="RESOLVED" ${cluster.status === 'RESOLVED' ? 'selected' : ''}>RESOLVED</option>
        </select>
        <button class="btn btn-outline" style="padding:4px 8px; font-size:11px;" onclick="event.stopPropagation(); showClusterDetails('${cluster.cluster_id}')">
          Details <i class="fa-solid fa-chevron-right"></i>
        </button>
      </div>
    `;

    card.addEventListener("click", () => {
      map.flyTo([cluster.latitude, cluster.longitude], 15);
      marker.openPopup();
    });

    listEl.appendChild(card);
  });
}

async function updateClusterStatus(clusterId, newStatus) {
  try {
    await fetch(`/api/cluster/${clusterId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });
    fetchClusters();
  } catch (err) {
    alert("Failed to update status: " + err.message);
  }
}

function showClusterDetails(clusterId) {
  const cluster = allClusters.find(c => c.cluster_id === clusterId);
  if (!cluster) return;

  const modal = document.getElementById("detailModal");
  document.getElementById("modalDetailTitle").innerHTML = `<i class="fa-solid fa-folder-open"></i> Cluster Inspector: ${cluster.cluster_id}`;
  
  const body = document.getElementById("modalDetailBody");
  body.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:16px;">
      
      <div style="background:#0f172a; padding:14px; border-radius:10px; border:1px solid #334155;">
        <h4 style="color:#94a3b8; font-size:12px; margin-bottom:4px;">AUTO-GENERATED DESCRIPTION</h4>
        <p style="font-size:15px; font-weight:600; color:#10b981;">"${cluster.summary}"</p>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:13px;">
        <div><b>Category:</b> <span class="cat-badge ${cluster.category}">${cluster.category}</span></div>
        <div><b>Severity Rating:</b> ${cluster.severity} / 5</div>
        <div><b>Priority Score:</b> <b style="color:#ef4444;">${cluster.priority_score.toFixed(2)} / 100</b></div>
        <div><b>Affected Citizens:</b> ${cluster.affected_citizens}</div>
        <div><b>Assigned Dept:</b> ${cluster.assigned_department || 'Municipal Services'}</div>
        <div><b>SLA Resolution Time:</b> ${cluster.sla_hours} Hours</div>
        <div><b>GPS Location:</b> (${cluster.latitude.toFixed(4)}, ${cluster.longitude.toFixed(4)})</div>
        <div><b>Sensitive Location:</b> ${cluster.is_sensitive_location ? 'YES' : 'NO'}</div>
      </div>

      <div style="background:#0f172a; padding:14px; border-radius:10px; border:1px solid #334155;">
        <h4 style="color:#94a3b8; font-size:12px; margin-bottom:8px;">PRIORITY SCORE MATHEMATICAL CALCULATION</h4>
        <pre style="font-family:monospace; font-size:11px; color:#cbd5e1; white-space:pre-wrap;">
Base Severity Score   : ${cluster.severity} × 15.0 = ${(cluster.severity*15).toFixed(1)} pts
Citizen Count Boost   : min(${cluster.affected_citizens} × 5.0, 40.0) = ${Math.min(cluster.affected_citizens*5, 40).toFixed(1)} pts
Location Weight       : ${cluster.is_sensitive_location ? '20.0 (Sensitive)' : '10.0 (Normal)'}
Final Priority Score  : ${cluster.priority_score.toFixed(2)} / 100
        </pre>
      </div>

      <div>
        <h4 style="font-size:13px; font-weight:700; margin-bottom:8px;">Merged Citizen Reports (${cluster.reports.length})</h4>
        <div style="display:flex; flex-direction:column; gap:8px; max-height:180px; overflow-y:auto;">
          ${cluster.reports.map((r, i) => `
            <div style="background:#0f172a; padding:10px; border-radius:6px; font-size:12px;">
              <b>[Report #${i+1}] ${r.report_id}</b>
              <p style="margin-top:4px; color:#cbd5e1;">"${r.raw_text}"</p>
            </div>
          `).join('')}
        </div>
      </div>

    </div>
  `;

  modal.classList.add("active");
}

function openSubmitModal() {
  document.getElementById("submitModal").classList.add("active");
}

function closeSubmitModal() {
  document.getElementById("submitModal").classList.remove("active");
}

function closeDetailModal() {
  document.getElementById("detailModal").classList.remove("active");
}
