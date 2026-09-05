import { isAuthenticated, logout, requirePortal } from "./services/auth-service.js";
import { DEMO_PROPERTIES } from "./demo-data.js";

const STORE_KEY = "myPropertiesDemoData";

const STATS_TOTAL = document.getElementById("stats-total");
const STATS_VERIFIED = document.getElementById("stats-verified");
const STATS_UNDER_REVIEW = document.getElementById("stats-under-review");
const STATS_PENDING = document.getElementById("stats-pending");

const propertySearch = document.getElementById("property-search");
const statusFilter = document.getElementById("status-filter");
const typeFilter = document.getElementById("type-filter");
const btnClearFilters = document.getElementById("btn-clear-filters");
const propertiesTbody = document.getElementById("properties-tbody");
const propertiesCards = document.getElementById("properties-cards");
const emptyState = document.getElementById("empty-state");
const propertyCount = document.getElementById("property-count");
const btnExport = document.getElementById("btn-export");

const modal = document.getElementById("property-modal");
const modalClose = document.getElementById("modal-close");
const modalCloseBtn = document.getElementById("modal-close-btn");
const modalBody = document.getElementById("modal-body");
const modalTitle = document.getElementById("modal-title");
const modalActionBtn = document.getElementById("modal-action-btn");

let currentProperties = [];

// Dashboard uses "Verified"/"Under Review"; normalize to filter keys.
function statusKey(status) {
  const s = String(status || "").toLowerCase();
  if (s === "verified") return "verified";
  if (s === "under_review" || s === "under review") return "under_review";
  return "pending";
}

function statusLabel(key) {
  if (key === "verified") return "Verified";
  if (key === "under_review") return "Under Review";
  return "Pending";
}

function statusClass(key) {
  if (key === "verified") return "status-verified";
  if (key === "under_review") return "status-under-review";
  return "status-pending";
}

function normalize(p) {
  return { ...p, status: statusKey(p.status) };
}

function renderStats(properties) {
  const total = properties.length;
  const verified = properties.filter(p => p.status === "verified").length;
  const underReview = properties.filter(p => p.status === "under_review").length;
  const pending = properties.filter(p => p.status === "pending").length;

  if (STATS_TOTAL) STATS_TOTAL.textContent = total;
  if (STATS_VERIFIED) STATS_VERIFIED.textContent = verified;
  if (STATS_UNDER_REVIEW) STATS_UNDER_REVIEW.textContent = underReview;
  if (STATS_PENDING) STATS_PENDING.textContent = pending;

  const grid = document.getElementById("stats-grid");
  if (grid) {
    grid.innerHTML = `
      <div class="bg-white rounded-lg border border-outline-variant/40 shadow-sm p-4"><p class="text-label-sm font-semibold text-on-surface-variant">Total Properties</p><p class="text-3xl font-bold text-primary mt-1">${total}</p></div>
      <div class="bg-white rounded-lg border border-outline-variant/40 shadow-sm p-4"><p class="text-label-sm font-semibold text-on-surface-variant">Verified</p><p class="text-3xl font-bold text-[#16A34A] mt-1">${verified}</p></div>
      <div class="bg-white rounded-lg border border-outline-variant/40 shadow-sm p-4"><p class="text-label-sm font-semibold text-on-surface-variant">Under Review</p><p class="text-3xl font-bold text-[#EA580C] mt-1">${underReview}</p></div>
      <div class="bg-white rounded-lg border border-outline-variant/40 shadow-sm p-4"><p class="text-label-sm font-semibold text-on-surface-variant">Pending</p><p class="text-3xl font-bold text-[#6366F1] mt-1">${pending}</p></div>`;
  }
}

function renderPropertiesTable(properties) {
  if (!propertiesTbody) return;

  if (properties.length === 0) {
    propertiesTbody.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  propertiesTbody.innerHTML = properties
    .map((p, idx) => {
      return `
        <tr class="border-b border-outline-variant/30 hover:bg-surface-container-high transition">
          <td class="px-6 py-4 font-medium text-primary truncate" title="${p.ulpin}">
            ${p.ulpin}
          </td>
          <td class="px-6 py-4 text-sm text-secondary">${p.type}</td>
          <td class="px-6 py-4 text-sm text-secondary truncate" title="${p.location || ""}">
            ${p.location || ""}
          </td>
          <td class="px-6 py-4 text-sm text-secondary">${p.area || "—"}</td>
          <td class="px-6 py-4">
            <span class="status-badge ${statusClass(p.status)}">${statusLabel(p.status)}</span>
          </td>
          <td class="px-6 py-4 text-sm text-secondary">${p.lastUpdated || "—"}</td>
          <td class="px-6 py-4 text-right">
            <button
              class="view-detail-btn text-primary hover:text-primary/90 transition"
              data-ulpin="${p.ulpin}"
              title="View Details"
            >
              View
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderPropertiesCards(properties) {
  if (!propertiesCards) return;

  if (properties.length === 0) {
    propertiesCards.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");
  propertiesCards.innerHTML = properties
    .map((p, idx) => {
      return `
        <div class="property-card bg-white rounded-lg border border-outline-variant/40 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer" data-idx="${idx}">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-md bg-primary-fixed/30 flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">domain</span>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-primary truncate" title="${p.ulpin}">
                ${p.ulpin}
              </h3>
              <p class="text-secondary text-sm truncate" title="${p.location || ""}">
                ${p.location || "—"}
              </p>
            </div>
          </div>
          <div class="mt-3 flex items-center gap-2 text-xs text-secondary">
            <span class="status-badge ${statusClass(p.status)}">${statusLabel(p.status)}</span>
            <span>${p.area || "—"} | ${p.type}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || [];
  } catch {
    return [];
  }
}

function openPropertyDetail(ulpinOrIdx) {
  if (ulpinOrIdx === null || ulpinOrIdx === undefined) return;
  let properties = readStore();

  if (typeof ulpinOrIdx === "number") {
    // Index-based access for modal from cards
    const p = properties[ulpinOrIdx];
    if (!p) return;
    ulpinOrIdx = p.ulpin;
  } else {
    // ULPIN from table
    properties = properties.filter(p => p.ulpin === ulpinOrIdx);
    if (properties.length === 0) return;
    properties = [properties[0]];
  }

  const p = properties[0];
  if (!p) return;

  modalTitle.innerHTML = `
    <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">domain</span>
    Property Details
  `;

  modalBody.innerHTML = `
    <div class="space-y-4">
      <div>
        <p class="text-label-sm text-on-surface-variant mb-1">ULPIN / ID</p>
        <p class="font-mono text-primary text-lg">${p.ulpin}</p>
      </div>
      <div>
        <p class="text-label-sm text-on-surface-variant mb-1">Type</p>
        <p class="font-bold text-primary">${p.type}</p>
      </div>
      <div>
        <p class="text-label-sm text-on-surface-variant mb-1">Location</p>
        <p>${p.location || "—"}</p>
      </div>
      <div>
        <p class="text-label-sm text-on-surface-variant mb-1">Area</p>
        <p>${p.area || "—"}</p>
      </div>
      <div>
        <p class="text-label-sm text-on-surface-variant mb-1">Status</p>
        <p><span class="status-badge ${statusClass(p.status)}">${statusLabel(p.status)}</span></p>
      </div>
      <div>
        <p class="text-label-sm text-on-surface-variant mb-1">Last Updated</p>
        <p>${p.lastUpdated || "—"}</p>
      </div>
      <div>
        <p class="text-label-sm text-on-surface-variant mb-1">Owner</p>
        <p>${p.ownerName || "—"}</p>
      </div>
    </div>
  `;

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function closePropertyDetail() {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function applyFilters(properties) {
  const searchTerm = (propertySearch.value || "").toLowerCase();
  const statusValue = statusFilter.value;
  const typeValue = (typeFilter.value || "").toLowerCase();

  return properties.filter(p => {
    const matchesSearch =
      p.ulpin.toLowerCase().includes(searchTerm) ||
      (p.location && p.location.toLowerCase().includes(searchTerm)) ||
      (p.type && p.type.toLowerCase().includes(searchTerm));

    const matchesStatus = statusValue === "all" || p.status === statusValue;
    const matchesType = typeValue === "all" || String(p.type || "").toLowerCase() === typeValue;

    return matchesSearch && matchesStatus && matchesType;
  });
}

function renderPropertyCount(properties) {
  if (propertyCount) {
    propertyCount.textContent = `Showing ${properties.length} properties`;
  }
}

function renderAll(properties) {
  renderStats(properties);
  renderPropertiesTable(properties);
  renderPropertiesCards(properties);
  renderPropertyCount(properties);
  bindDetailButtons();
}

function bindDetailButtons() {
  // View detail from table rows
  document.querySelectorAll(".view-detail-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const ulpin = btn.getAttribute("data-ulpin");
      openPropertyDetail(ulpin);
    });
  });

  // Open detail from mobile cards
  document.querySelectorAll(".property-card[data-idx]").forEach((card) => {
    card.addEventListener("click", () => {
      openPropertyDetail(Number(card.getAttribute("data-idx")));
    });
  });
}

function loadProperties() {
  if (!requirePortal("citizen")) {
    return;
  }

  // SIH DEMO: the Dashboard demo data is the single source of truth here.
  // The backend parcels endpoint currently returns test records
  // (ULPIN-SEARCH-001, USER-TEST-001, ...) with a different field shape,
  // so API data must NOT override the demo list on this page.
  // Backend is untouched; no endpoints added or removed.
  const properties = DEMO_PROPERTIES.map(normalize);

  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(properties));
  } catch (e) {
    console.warn("[My Properties] Failed to persist properties:", e);
  }

  currentProperties = properties;
  renderAll(properties);
}

function setupEventListeners() {
  // Search
  if (propertySearch) {
    propertySearch.addEventListener("input", () => {
      renderAll(applyFilters(currentProperties));
    });
  }

  // Status filter
  if (statusFilter) {
    statusFilter.addEventListener("change", () => {
      renderAll(applyFilters(currentProperties));
    });
  }

  // Type filter
  if (typeFilter) {
    typeFilter.addEventListener("change", () => {
      renderAll(applyFilters(currentProperties));
    });
  }

  // Clear filters
  if (btnClearFilters) {
    btnClearFilters.addEventListener("click", () => {
      propertySearch.value = "";
      statusFilter.value = "all";
      typeFilter.value = "all";
      renderAll(currentProperties);
    });
  }

  // Export (demo): download the visible records as a text summary.
  if (btnExport) {
    btnExport.addEventListener("click", () => {
      const lines = ["BHARAT BHUMI - PROPERTY RECORDS (DEMO)", "=======================================",
        ...applyFilters(currentProperties).map(p => `${p.ulpin} | ${p.type} | ${p.location} | ${p.area} | ${statusLabel(p.status)}`)];
      const blob = new Blob([lines.join("\n")], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "my-properties.txt";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    });
  }

  // Modal close
  if (modalClose) {
    modalClose.addEventListener("click", closePropertyDetail);
  }
  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closePropertyDetail);
  }

  // Close on overlay click
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closePropertyDetail();
      }
    });
  }

  // Add property button
  const addBtn = document.getElementById("btn-add-property");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      window.location.href = "new-application.html";
    });
  }

  const firstBtn = document.getElementById("btn-first-property");
  if (firstBtn) {
    firstBtn.addEventListener("click", () => {
      window.location.href = "new-application.html";
    });
  }

  // Logout
  const doLogout = () => logout("login.html");
  const topLogout = document.getElementById("btn-topnav-logout");
  if (topLogout) topLogout.addEventListener("click", doLogout);
  const sideLogout = document.getElementById("btn-sidebar-logout");
  if (sideLogout) sideLogout.addEventListener("click", doLogout);
}

document.addEventListener("DOMContentLoaded", () => {
  setupEventListeners();
  loadProperties();
});

export { loadProperties, openPropertyDetail, closePropertyDetail };
