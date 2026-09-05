import { isAuthenticated, getCurrentUser, logout } from "./services/auth-service.js";
import { getApplications, pendingCount } from "./admin-data.js";

const $ = (id) => document.getElementById(id);

function requireAdmin() {
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return false;
  }
  if (String(getCurrentUser()?.role || "USER").toUpperCase() !== "ADMIN") {
    window.location.href = "dashboard.html";
    return false;
  }
  return true;
}

function stageBadge(stage) {
  const s = String(stage || "").toLowerCase();
  const cls = /complet|approv|verif|resolv/.test(s) ? "status-verified"
    : /reject|fail/.test(s) ? "status-rejected"
    : /submit|review|pending|open|document|escalat|change/.test(s) ? "status-pending" : "status-neutral";
  return `<span class="status-badge ${cls}">${stage}</span>`;
}

function docsCell(app) {
  const total = app.docs.length;
  const verified = app.docs.filter((d) => d.status === "Verified").length;
  return `<span class="text-sm font-semibold ${verified < total ? "text-[#EA580C]" : "text-[#16A34A]"}">${verified}/${total}</span>`;
}

function priorityCell(p) {
  const cls = p === "Urgent" ? "text-error font-bold" : p === "High" ? "text-[#EA580C] font-bold" : "text-secondary";
  return `<span class="text-sm ${cls}">${p}</span>`;
}

function getFiltered() {
  const q = (($("app-search") || {}).value || "").trim().toLowerCase();
  const status = $("f-status") ? $("f-status").value : "all";
  const service = $("f-service") ? $("f-service").value : "all";
  const priority = $("f-priority") ? $("f-priority").value : "all";
  const date = $("f-date") ? $("f-date").value : "";
  const dept = $("f-dept") ? $("f-dept").value : "all";
  return getApplications().filter((a) => {
    if (status !== "all" && a.stage !== status) return false;
    if (service !== "all" && a.service !== service) return false;
    if (priority !== "all" && a.priority !== priority) return false;
    if (dept !== "all" && a.department !== dept) return false;
    if (date && a.iso !== date) return false;
    if (!q) return true;
    return a.id.toLowerCase().includes(q) || a.citizen.toLowerCase().includes(q) ||
      String(a.ulpin || "").toLowerCase().includes(q) || String(a.service || "").toLowerCase().includes(q);
  });
}

function fillFilterOptions() {
  const apps = getApplications();
  const svc = $("f-service");
  if (svc && svc.options.length <= 1) {
    [...new Set(apps.map((a) => a.service))].forEach((s) => {
      const o = document.createElement("option");
      o.textContent = s;
      svc.appendChild(o);
    });
  }
  const dept = $("f-dept");
  if (dept && dept.options.length <= 1) {
    [...new Set(apps.map((a) => a.department))].forEach((s) => {
      const o = document.createElement("option");
      o.textContent = s;
      dept.appendChild(o);
    });
  }
}

function renderSummaries() {
  const apps = getApplications();
  if ($("sum-pending")) $("sum-pending").textContent = apps.filter((a) => a.stage === "Pending Review").length;
  if ($("sum-docs")) $("sum-docs").textContent = apps.reduce((n, a) => n + a.docs.filter((d) => d.status === "Pending Verification").length, 0);
  if ($("sum-info")) $("sum-info").textContent = apps.filter((a) => ["Documents Required", "Correction Required"].includes(a.stage)).length;
  const isos = apps.map((a) => a.iso).filter(Boolean).sort();
  const latest = isos.length ? new Date(isos[isos.length - 1]) : null;
  if ($("sum-recent")) {
    $("sum-recent").textContent = latest
      ? apps.filter((a) => a.iso && (latest - new Date(a.iso)) / 86400000 <= 7).length
      : apps.length;
  }
}

function renderTable() {
  const list = getFiltered();
  if ($("apps-count")) $("apps-count").textContent = `Showing ${list.length} application${list.length === 1 ? "" : "s"}`;
  const empty = $("empty-state");
  const tb = $("apps-tbody");
  const cards = $("apps-cards");
  if (!list.length) {
    if (tb) tb.innerHTML = "";
    if (cards) cards.innerHTML = "";
    if (empty) empty.classList.remove("hidden");
    return;
  }
  if (empty) empty.classList.add("hidden");
  if (tb) {
    tb.innerHTML = list.map((a) => `
      <tr class="border-b border-outline-variant/30 hover:bg-surface-container-high transition">
        <td class="px-6 py-4 font-mono text-sm font-semibold text-primary whitespace-nowrap">${a.id}</td>
        <td class="px-6 py-4 text-sm font-semibold text-on-surface">${a.citizen}</td>
        <td class="px-6 py-4 text-sm text-secondary">${a.service}</td>
        <td class="px-6 py-4 text-sm font-mono text-secondary whitespace-nowrap">${a.ulpin}</td>
        <td class="px-6 py-4 text-sm text-secondary whitespace-nowrap">${a.submitted}</td>
        <td class="px-6 py-4">${stageBadge(a.stage)}</td>
        <td class="px-6 py-4 whitespace-nowrap">${docsCell(a)}</td>
        <td class="px-6 py-4">${priorityCell(a.priority)}</td>
        <td class="px-6 py-4 text-right">
          <button class="app-review text-primary hover:underline text-sm font-semibold" data-id="${a.id}">Review</button>
        </td>
      </tr>`).join("");
  }
  if (cards) {
    cards.innerHTML = list.map((a) => `
      <div class="bg-white rounded-lg border border-outline-variant/40 shadow-sm p-4">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0"><p class="font-mono font-bold text-primary text-sm">${a.id}</p>
          <p class="font-semibold text-on-surface text-sm truncate">${a.citizen} • ${a.service}</p></div>
          ${stageBadge(a.stage)}
        </div>
        <p class="text-xs text-secondary mt-1">${a.ulpin} • ${a.submitted} • Docs ${a.docs.filter((d) => d.status === "Verified").length}/${a.docs.length} • ${a.priority}</p>
        <button class="app-review mt-3 w-full px-3 py-2 rounded-md bg-primary text-white text-sm font-semibold" data-id="${a.id}">Review</button>
      </div>`).join("");
  }
  document.querySelectorAll(".app-review").forEach((b) =>
    b.addEventListener("click", () => {
      window.location.href = "application-review.html?id=" + encodeURIComponent(b.getAttribute("data-id"));
    }));
}

function setupSession() {
  const user = getCurrentUser() || {};
  if ($("top-nav-username")) $("top-nav-username").textContent = user.username || "Officer";
  if ($("top-nav-role-badge")) $("top-nav-role-badge").textContent = user.role || "ADMIN";
  // Admin sidebar header stays static: "Admin Portal" / "ADMIN • Verified Profile".
  const badge = $("pending-count-badge");
  if (badge) badge.textContent = pendingCount();
  const doLogout = () => logout("login.html");
  if ($("btn-topnav-logout")) $("btn-topnav-logout").addEventListener("click", doLogout);
  if ($("btn-sidebar-logout")) $("btn-sidebar-logout").addEventListener("click", doLogout);
}

function init() {
  if (!requireAdmin()) return;
  setupSession();
  fillFilterOptions();
  renderSummaries();
  renderTable();
  if ($("app-search")) $("app-search").addEventListener("input", renderTable);
  ["f-status", "f-service", "f-priority", "f-date", "f-dept"].forEach((id) => {
    const el = $(id);
    if (el) el.addEventListener("change", renderTable);
  });
  if ($("btn-clear-filters")) $("btn-clear-filters").addEventListener("click", () => {
    if ($("app-search")) $("app-search").value = "";
    ["f-status", "f-service", "f-priority", "f-dept"].forEach((id) => {
      const el = $(id);
      if (el) el.value = "all";
    });
    if ($("f-date")) $("f-date").value = "";
    renderTable();
  });
}

document.addEventListener("DOMContentLoaded", init);

export { getFiltered };
