import { getCurrentUser, logout, requirePortal } from "./services/auth-service.js";
import { DEMO_PROPERTIES } from "./demo-data.js";
import { ADMIN_EXTRA_PROPERTIES, pendingCount } from "./admin-data.js";

const $ = (id) => document.getElementById(id);

function statusBadge(status) {
  const s = String(status || "").toLowerCase();
  const cls = /verif|complet/.test(s) ? "status-verified"
    : /reject|fail/.test(s) ? "status-rejected"
    : /review|pending|under/.test(s) ? "status-pending" : "status-neutral";
  return `<span class="status-badge ${cls}">${status}</span>`;
}

function allRecords() {
  const shared = DEMO_PROPERTIES.map((p) => ({
    ulpin: p.ulpin, type: p.type, location: p.location, area: p.area,
    status: p.status, owner: p.ownerName || "—", updated: p.lastUpdated || "—", demoOnly: false
  }));
  return [...shared, ...ADMIN_EXTRA_PROPERTIES];
}

function getFiltered() {
  const q = (($("prop-search") || {}).value || "").trim().toLowerCase();
  const status = $("f-status") ? $("f-status").value : "all";
  return allRecords().filter((p) => {
    if (status !== "all" && String(p.status).toLowerCase() !== status) return false;
    if (!q) return true;
    return p.ulpin.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) ||
      String(p.owner || "").toLowerCase().includes(q) || String(p.type || "").toLowerCase().includes(q);
  });
}

function render() {
  const list = getFiltered();
  if ($("props-count")) $("props-count").textContent = `Showing ${list.length} propert${list.length === 1 ? "y" : "ies"}`;
  const empty = $("empty-state");
  const row = (p) => `
    <tr class="border-b border-outline-variant/30 hover:bg-surface-container-high transition">
      <td class="px-6 py-4 font-mono text-sm font-semibold text-primary whitespace-nowrap">${p.ulpin}</td>
      <td class="px-6 py-4 text-sm text-secondary">${p.type}</td>
      <td class="px-6 py-4 text-sm text-secondary">${p.location}</td>
      <td class="px-6 py-4 text-sm text-secondary whitespace-nowrap">${p.area}</td>
      <td class="px-6 py-4 text-sm text-secondary">${p.owner}</td>
      <td class="px-6 py-4">${statusBadge(p.status)}${p.demoOnly ? ' <span class="status-badge status-neutral">DEMO</span>' : ""}</td>
      <td class="px-6 py-4 text-right">
        ${p.demoOnly
          ? `<button class="prop-demo text-secondary hover:text-on-surface text-sm font-semibold" data-ulpin="${p.ulpin}">Info</button>`
          : `<button class="prop-view text-primary hover:underline text-sm font-semibold" data-ulpin="${p.ulpin}">View</button>`}
      </td>
    </tr>`;
  const tb = $("props-tbody");
  if (tb) tb.innerHTML = list.map(row).join("");
  const cards = $("props-cards");
  if (cards) {
    cards.innerHTML = list.map((p) => `
      <div class="bg-white rounded-lg border border-outline-variant/40 shadow-sm p-4">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0"><p class="font-mono font-bold text-primary text-sm">${p.ulpin}</p>
          <p class="text-xs text-secondary truncate">${p.type} • ${p.location}</p></div>
          ${statusBadge(p.status)}
        </div>
        <p class="text-xs text-secondary mt-1">${p.area} • ${p.owner}${p.demoOnly ? " • DEMO record" : ""}</p>
        ${p.demoOnly ? "" : `<button class="prop-view mt-3 w-full px-3 py-2 rounded-md bg-primary text-white text-sm font-semibold" data-ulpin="${p.ulpin}">View</button>`}
      </div>`).join("");
  }
  if (empty) empty.classList.toggle("hidden", list.length > 0);
  document.querySelectorAll(".prop-view").forEach((b) =>
    b.addEventListener("click", () => {
      window.location.href = "admin-property.html?ulpin=" + encodeURIComponent(b.getAttribute("data-ulpin"));
    }));
  document.querySelectorAll(".prop-demo").forEach((b) =>
    b.addEventListener("click", () => toast(`Admin-only demo record ${b.getAttribute("data-ulpin")}. Full 360° view is available for mapped ULPINs.`)));
}

function toast(msg) {
  const el = $("admin-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 2600);
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
  if ($("prop-search")) $("prop-search").addEventListener("input", render);
  if ($("f-status")) $("f-status").addEventListener("change", render);
  if ($("btn-clear-filters")) $("btn-clear-filters").addEventListener("click", () => {
    if ($("prop-search")) $("prop-search").value = "";
    if ($("f-status")) $("f-status").value = "all";
    render();
  });
}

document.addEventListener("DOMContentLoaded", init);

export { getFiltered };
