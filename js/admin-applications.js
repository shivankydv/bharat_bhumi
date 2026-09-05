import { isAuthenticated, getCurrentUser, logout, requirePortal } from "./services/auth-service.js";
import { getApplications, pendingCount } from "./admin-data.js";

const $ = (id) => document.getElementById(id);

function stageBadge(stage) {
  const s = String(stage || "").toLowerCase();
  const cls = /complet|approv|verif|resolv/.test(s) ? "status-verified"
    : /reject|fail/.test(s) ? "status-rejected"
    : /submit|review|pending|open|document|escalat|change/.test(s) ? "status-pending" : "status-neutral";
  return `<span class="status-badge ${cls}">${stage}</span>`;
}

function getFiltered() {
  const q = (($("app-search") || {}).value || "").trim().toLowerCase();
  const status = $("f-status") ? $("f-status").value : "all";
  const dept = $("f-dept") ? $("f-dept").value : "all";
  return getApplications().filter((a) => {
    if (status !== "all" && a.stage !== status) return false;
    if (dept !== "all" && a.department !== dept) return false;
    if (!q) return true;
    return a.id.toLowerCase().includes(q) || a.citizen.toLowerCase().includes(q) ||
      String(a.ulpin || "").toLowerCase().includes(q) || String(a.service || "").toLowerCase().includes(q);
  });
}

function render() {
  const list = getFiltered();
  if ($("apps-count")) $("apps-count").textContent = `Showing ${list.length} application${list.length === 1 ? "" : "s"}`;
  const empty = $("empty-state");
  const row = (a) => `
    <tr class="border-b border-outline-variant/30 hover:bg-surface-container-high transition">
      <td class="px-6 py-4 font-mono text-sm font-semibold text-primary whitespace-nowrap">${a.id}</td>
      <td class="px-6 py-4 text-sm font-semibold text-on-surface">${a.citizen}</td>
      <td class="px-6 py-4 text-sm text-secondary">${a.service}</td>
      <td class="px-6 py-4 text-sm font-mono text-secondary whitespace-nowrap">${a.ulpin}</td>
      <td class="px-6 py-4 text-sm text-secondary">${a.department}</td>
      <td class="px-6 py-4 text-sm text-secondary whitespace-nowrap">${a.submitted}</td>
      <td class="px-6 py-4">${stageBadge(a.stage)}</td>
      <td class="px-6 py-4 text-sm text-secondary">${a.assignedOfficer || "Unassigned"}</td>
      <td class="px-6 py-4 text-right">
        <button class="app-open text-primary hover:underline text-sm font-semibold" data-id="${a.id}">Review</button>
      </td>
    </tr>`;
  const card = (a) => `
    <div class="bg-white rounded-lg border border-outline-variant/40 shadow-sm p-4">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0"><p class="font-mono font-bold text-primary text-sm">${a.id}</p>
        <p class="font-semibold text-on-surface text-sm truncate">${a.citizen} • ${a.service}</p></div>
        ${stageBadge(a.stage)}
      </div>
      <p class="text-xs text-secondary mt-1">${a.ulpin} • ${a.department} • ${a.submitted}</p>
      <p class="text-xs text-secondary">Officer: ${a.assignedOfficer || "Unassigned"}</p>
      <button class="app-open mt-3 w-full px-3 py-2 rounded-md bg-primary text-white text-sm font-semibold" data-id="${a.id}">Review</button>
    </div>`;
  const tb = $("apps-tbody");
  if (tb) tb.innerHTML = list.map(row).join("");
  const cards = $("apps-cards");
  if (cards) cards.innerHTML = list.map(card).join("");
  if (empty) empty.classList.toggle("hidden", list.length > 0);
  document.querySelectorAll(".app-open").forEach((b) =>
    b.addEventListener("click", () => {
      window.location.href = "application-review.html?id=" + encodeURIComponent(b.getAttribute("data-id"));
    }));
}

function setupSession() {
  const user = getCurrentUser() || {};
  if ($("top-nav-username")) $("top-nav-username").textContent = user.username || "Officer";
  if ($("top-nav-role-badge")) $("top-nav-role-badge").textContent = user.role || "ADMIN";
  const badge = $("pending-count-badge");
  if (badge) badge.textContent = pendingCount();
  const doLogout = () => logout("login.html");
  if ($("btn-topnav-logout")) $("btn-topnav-logout").addEventListener("click", doLogout);
  if ($("btn-sidebar-logout")) $("btn-sidebar-logout").addEventListener("click", doLogout);
}

function init() {
  if (!requirePortal("admin")) return;
  setupSession();
  render();
  if ($("app-search")) $("app-search").addEventListener("input", render);
  ["f-status", "f-dept"].forEach((id) => {
    const el = $(id);
    if (el) el.addEventListener("change", render);
  });
  if ($("btn-clear-filters")) $("btn-clear-filters").addEventListener("click", () => {
    if ($("app-search")) $("app-search").value = "";
    ["f-status", "f-dept"].forEach((id) => {
      const el = $(id);
      if (el) el.value = "all";
    });
    render();
  });
}

document.addEventListener("DOMContentLoaded", init);
