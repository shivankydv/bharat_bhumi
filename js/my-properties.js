import { authService } from "./services/auth-service.js";
import { api } from "./services/api.js";

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

function renderStats(properties) {
  const total = properties.length;
  const verified = properties.filter(p => p.status === "verified").length;
  const underReview = properties.filter(p => p.status === "under_review").length;
  const pending = properties.filter(p => p.status === "pending").length;

  if (STATS_TOTAL) STATS_TOTAL.textContent = total;
  if (STATS_VERIFIED) STATS_VERIFIED.textContent = verified;
  if (STATS_UNDER_REVIEW) STATS_UNDER_REVIEW.textContent = underReview;
  if (STATS_PENDING) STATS_PENDING.textContent = pending;
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
      const statusClass =
        p.status === "verified"
          ? "status-verified"
          : p.status === "under_review"
            ? "status-under-review"
            : "status-pending";

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
            <span class="status-badge ${statusClass}">${p.status}</span>
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
      const statusClass =
        p.status === "verified"
          ? "status-verified"
          : p.status === "under_review"
            ? "status-under-review"
            : "status-pending";

      return `
        <div class="property-card bg-white rounded-lg border border-outline-variant/40 shadow-sm p-4 hover:shadow-md transition-shadow cursor-pointer" onclick="openPropertyDetail(${idx})">
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
            <span class="status-badge ${statusClass}">${p.status}</span>
            <span>${p.area || "—"} | ${p.type}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function openPropertyDetail(ulpinOrIdx) {
  let properties = JSON.parse(localStorage.getItem("myPropertiesDemoData")) || [];

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
        <p class="font-semibold ${p.status === "verified" ? "text-16A34A" : p.status === "under_review" ? "text-EA580C" : "text-6366F1"} status-badge ${p.status === "verified" ? "status-verified" : p.status === "under_review" ? "status-under-review" : "status-pending"}">${p.status}</p>
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
  const typeValue = typeFilter.value;

  return properties.filter(p => {
    const matchesSearch =
      p.ulpin.toLowerCase().includes(searchTerm) ||
      (p.location && p.location.toLowerCase().includes(searchTerm)) ||
      (p.type && p.type.toLowerCase().includes(searchTerm));

    const matchesStatus = statusValue === "all" || p.status === statusValue;
    const matchesType = typeValue === "all" || p.type === typeValue;

    return matchesSearch && matchesStatus && matchesType;
  });
}

function renderPropertyCount(properties) {
  if (propertyCount) {
    propertyCount.textContent = `Showing ${properties.length} properties`;
  }
}

async function loadProperties() {
  if (!authService.isAuthenticated()) {
    window.location.href = "index.html";
    return;
  }

  let properties;

  try {
    const response = await api.get("/api/v1/parcels");
    properties = response.data || [];
  } catch (error) {
    console.warn("API fallback to demo data:", error.message);
    properties = getDemoProperties();
  }

  renderStats(properties);
  renderPropertiesTable(properties);
  renderPropertiesCards(properties);
  renderPropertyCount(properties);

  // Add event listeners after rendering
  setupEventListeners(properties);
}

function getDemoProperties() {
  return [
    {
      ulpin: "ULP-892-441-A",
      type: "Agricultural",
      location: "Sangli, Maharashtra",
      area: "2.5 ha",
      status: "verified",
      lastUpdated: "2024-03-15",
      ownerName: "Rajesh Kumar",
    },
    {
      ulpin: "ULP-110-398-B",
      type: "Residential",
      location: "Pune, Maharashtra",
      area: "1200 sq ft",
      status: "verified",
      lastUpdated: "2024-02-28",
      ownerName: "Priya Sharma",
    },
    {
      ulpin: "Pending-ID-777-C",
      type: "Commercial",
      location: "Mumbai, Maharashtra",
      area: "5000 sq ft",
      status: "under_review",
      lastUpdated: "2024-01-20",
      ownerName: "Amit Patel",
    },
  ];
}

function setupEventListeners() {
  // Search
  if (propertySearch) {
    propertySearch.addEventListener("input", () => {
      const filtered = applyFilters(
        JSON.parse(localStorage.getItem("myPropertiesDemoData")) || []
      );
      renderPropertiesTable(filtered);
      renderPropertiesCards(filtered);
      renderPropertyCount(filtered);
    });
  }

  // Status filter
  if (statusFilter) {
    statusFilter.addEventListener("change", () => {
      const filtered = applyFilters(
        JSON.parse(localStorage.getItem("myPropertiesDemoData")) || []
      );
      renderPropertiesTable(filtered);
      renderPropertiesCards(filtered);
      renderPropertyCount(filtered);
    });
  }

  // Type filter
  if (typeFilter) {
    typeFilter.addEventListener("change", () => {
      const filtered = applyFilters(
        JSON.parse(localStorage.getItem("myPropertiesDemoData")) || []
      );
      renderPropertiesTable(filtered);
      renderPropertiesCards(filtered);
      renderPropertyCount(filtered);
    });
  }

  // Clear filters
  if (btnClearFilters) {
    btnClearFilters.addEventListener("click", () => {
      propertySearch.value = "";
      statusFilter.value = "all";
      typeFilter.value = "all";

      const props = JSON.parse(
        localStorage.getItem("myPropertiesDemoData") || "[]"
      );
      renderPropertiesTable(props);
      renderPropertiesCards(props);
      renderPropertyCount(props);
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

  // View detail from table rows
  document.querySelectorAll(".view-detail-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const ulpin = btn.getAttribute("data-ulpin");
      openPropertyDetail(ulpin);
    });
  });

  // Add property button
  const addBtn = document.getElementById("btn-add-property");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      openPropertyDetail(null);
    });
  }
}

export { loadProperties, openPropertyDetail, closePropertyDetail };