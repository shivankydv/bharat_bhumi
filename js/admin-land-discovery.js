import { isAuthenticated, getCurrentUser, logout, requirePortal } from "./services/auth-service.js";
import { getAllRequests } from "./land-discovery-data.js";
import { pendingCount } from "./admin-data.js";

const $ = (id) => document.getElementById(id);

function stageBadge(stage) {
  const s = String(stage || "").toLowerCase();
  const cls = /resolv|verif|match|located/.test(s) ? "status-verified"
    : /reject|fail|no record/.test(s) ? "status-rejected"
    : /submit|review|search|pending|required/.test(s) ? "status-pending" : "status-neutral";
  return `<span class="status-badge ${cls}">${stage}</span>`;
}

function possibleOwner(r) {
  return (r.clues && r.clues.ownerName) || ((r.claim || {}).owners) || "—";
}

function knownLocation(r) {
  const c = r.clues || {};
  return [c.village, c.district].filter(Boolean).join(", ") || c.location || "—";
}

function fillOptions(id, values) {
  const sel = $(id);
  if (!sel || sel.options.length > 1) return;
  [...new Set(values.filter(Boolean))].sort().forEach((v) => {
    const o = document.createElement("option");
    o.textContent = v;
    sel.appendChild(o);
  });
}

function getFiltered() {
  const q = (($("ldr-search") || {}).value || "").trim().toLowerCase();
  const stage = $("ldr-stage") ? $("ldr-stage").value : "all";
  const district = $("ldr-district") ? $("ldr-district").value : "all";
  const landType = $("ldr-landtype") ? $("ldr-landtype").value : "all";
  const priority = $("ldr-priority") ? $("ldr-priority").value : "all";
  const assignee = $("ldr-assignee") ? $("ldr-assignee").value : "all";
  return getAllRequests().filter((r) => {
    if (stage !== "all" && r.stage !== stage) return false;
    if (district !== "all" && ((r.clues || {}).district || "") !== district) return false;
    if (landType !== "all" && ((r.clues || {}).landType || "") !== landType) return false;
    if (priority !== "all" && r.priority !== priority) return false;
    if (assignee !== "all" && (r.assignee || "Unassigned") !== assignee) return false;
    if (!q) return true;
    return r.id.toLowerCase().includes(q) || String(r.citizen || "").toLowerCase().includes(q) ||
      possibleOwner(r).toLowerCase().includes(q) || knownLocation(r).toLowerCase().includes(q);
  });
}

function render() {
  const all = getAllRequests();
  fillOptions("ldr-district", all.map((r) => (r.clues || {}).district));
  fillOptions("ldr-assignee", all.map((r) => r.assignee || "Unassigned"));
  if ($("ldr-total")) $("ldr-total").textContent = all.length;
  if ($("ldr-pending")) $("ldr-pending").textContent = all.filter((r) => ["Submitted", "Under Review"].includes(r.stage)).length;
  if ($("ldr-searching")) $("ldr-searching").textContent = all.filter((r) => r.stage === "Record Search").length;
  if ($("ldr-info")) $("ldr-info").textContent = all.filter((r) => r.stage === "Additional Information Required").length;
  if ($("ldr-matches")) $("ldr-matches").textContent = all.filter((r) => r.stage === "Possible Match Found").length;
  if ($("ldr-resolved")) $("ldr-resolved").textContent = all.filter((r) => r.stage === "Resolved").length;

  const list = getFiltered();
  if ($("ldr-count")) $("ldr-count").textContent = `Showing ${list.length} request${list.length === 1 ? "" : "s"}`;
  const empty = $("empty-state");
  const row = (r) => `
    <tr class="border-b border-outline-variant/30 hover:bg-surface-container-high transition">
      <td class="px-6 py-4 font-mono text-sm font-semibold text-primary whitespace-nowrap">${r.id}</td>
      <td class="px-6 py-4 text-sm font-semibold text-on-surface">${r.citizen}</td>
      <td class="px-6 py-4 text-sm text-secondary">${possibleOwner(r)}</td>
      <td class="px-6 py-4 text-sm text-secondary">${knownLocation(r)}</td>
      <td class="px-6 py-4 text-sm text-secondary">${(r.clues && r.clues.landType) || "—"}</td>
      <td class="px-6 py-4 text-sm text-secondary whitespace-nowrap">${r.submitted}</td>
      <td class="px-6 py-4">${stageBadge(r.stage)}</td>
      <td class="px-6 py-4 text-sm ${r.priority === "High" ? "text-error font-bold" : "text-secondary"}">${r.priority}</td>
      <td class="px-6 py-4 text-sm text-secondary">${r.assignee || "Unassigned"}</td>
      <td class="px-6 py-4 text-right">
        <button class="ldr-open text-primary hover:underline text-sm font-semibold" data-id="${r.id}">Review</button>
      </td>
    </tr>`;
  const tb = $("ldr-tbody");
  if (tb) tb.innerHTML = list.map(row).join("");
  const cards = $("ldr-cards");
  if (cards) {
    cards.innerHTML = list.map((r) => `
      <div class="bg-white rounded-lg border border-outline-variant/40 shadow-sm p-4">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0"><p class="font-mono font-bold text-primary text-sm">${r.id}</p>
          <p class="font-semibold text-on-surface text-sm truncate">${r.citizen} • ${possibleOwner(r)}</p></div>
          ${stageBadge(r.stage)}
        </div>
        <p class="text-xs text-secondary mt-1">${knownLocation(r)} • ${r.submitted} • ${r.assignee || "Unassigned"}</p>
        <button class="ldr-open mt-3 w-full px-3 py-2 rounded-md bg-primary text-white text-sm font-semibold" data-id="${r.id}">Review</button>
      </div>`).join("");
  }
  if (empty) empty.classList.toggle("hidden", list.length > 0);
  document.querySelectorAll(".ldr-open").forEach((b) =>
    b.addEventListener("click", () => {
      window.location.href = "admin-ldr-review.html?id=" + encodeURIComponent(b.getAttribute("data-id"));
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
  if ($("ldr-search")) $("ldr-search").addEventListener("input", render);
  ["ldr-stage", "ldr-district", "ldr-landtype", "ldr-priority", "ldr-assignee"].forEach((id) => {
    const el = $(id);
    if (el) el.addEventListener("change", render);
  });
  if ($("btn-clear-filters")) $("btn-clear-filters").addEventListener("click", () => {
    if ($("ldr-search")) $("ldr-search").value = "";
    ["ldr-stage", "ldr-district", "ldr-landtype", "ldr-priority", "ldr-assignee"].forEach((id) => {
      const el = $(id);
      if (el) el.value = "all";
    });
    render();
  });
}

document.addEventListener("DOMContentLoaded", init);

export { getFiltered };
