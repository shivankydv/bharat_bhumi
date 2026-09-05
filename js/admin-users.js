import { getCurrentUser, logout, requirePortal } from "./services/auth-service.js";
import { ADMIN_USERS, pendingCount } from "./admin-data.js";

const $ = (id) => document.getElementById(id);

function badge(text, cls) {
  return `<span class="status-badge ${cls}">${text}</span>`;
}

function getFiltered() {
  const q = (($("user-search") || {}).value || "").trim().toLowerCase();
  const role = $("f-role") ? $("f-role").value : "all";
  return ADMIN_USERS.filter((u) => {
    if (role !== "all" && u.role !== role) return false;
    if (!q) return true;
    return u.name.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
  });
}

function render() {
  const list = getFiltered();
  if ($("users-count")) $("users-count").textContent = `Showing ${list.length} user${list.length === 1 ? "" : "s"}`;
  const empty = $("empty-state");
  const row = (u) => `
    <tr class="border-b border-outline-variant/30 hover:bg-surface-container-high transition">
      <td class="px-6 py-4 text-sm font-semibold text-on-surface">${u.name}</td>
      <td class="px-6 py-4 text-sm font-mono text-primary">${u.username}</td>
      <td class="px-6 py-4">${badge(u.role, u.role === "ADMIN" ? "status-pending" : "status-neutral")}</td>
      <td class="px-6 py-4 text-sm text-secondary">${u.email}</td>
      <td class="px-6 py-4">${badge(u.verified, u.verified === "Verified" ? "status-verified" : "status-pending")}</td>
      <td class="px-6 py-4 text-sm text-secondary whitespace-nowrap">${u.lastLogin}</td>
      <td class="px-6 py-4">${badge(u.status, u.status === "Active" ? "status-verified" : "status-rejected")}</td>
    </tr>`;
  const tb = $("users-tbody");
  if (tb) tb.innerHTML = list.map(row).join("");
  const cards = $("users-cards");
  if (cards) {
    cards.innerHTML = list.map((u) => `
      <div class="bg-white rounded-lg border border-outline-variant/40 shadow-sm p-4">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0"><p class="font-bold text-on-surface text-sm">${u.name}</p>
          <p class="text-xs font-mono text-secondary">@${u.username} • ${u.email}</p></div>
          ${badge(u.status, u.status === "Active" ? "status-verified" : "status-rejected")}
        </div>
        <p class="text-xs text-secondary mt-1">${u.role} • ${u.verified} • Last login ${u.lastLogin}</p>
      </div>`).join("");
  }
  if (empty) empty.classList.toggle("hidden", list.length > 0);
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
  if ($("user-search")) $("user-search").addEventListener("input", render);
  if ($("f-role")) $("f-role").addEventListener("change", render);
  if ($("btn-clear-filters")) $("btn-clear-filters").addEventListener("click", () => {
    if ($("user-search")) $("user-search").value = "";
    if ($("f-role")) $("f-role").value = "all";
    render();
  });
}

document.addEventListener("DOMContentLoaded", init);

export { getFiltered };
