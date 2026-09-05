import { getCurrentUser, logout, requirePortal } from "./services/auth-service.js";
import {
  getGrievances, getGrievanceOverrides, saveGrievancePatch, pendingCount, OFFICER_ROSTER, nowStamp
} from "./admin-data.js";

const $ = (id) => document.getElementById(id);

function merged() {
  const ov = getGrievanceOverrides();
  return getGrievances().map((g) => ({ ...g, ...(ov[g.ref] || {}) }));
}

function badge(text, cls) {
  return `<span class="status-badge ${cls}">${text}</span>`;
}

function statusBadge(s) {
  const cls = s === "Resolved" ? "status-verified" : s === "Open" ? "status-rejected" : "status-pending";
  return badge(s, cls);
}

function priBadge(p) {
  return badge(p, p === "High" ? "status-rejected" : p === "Medium" ? "status-pending" : "status-neutral");
}

function getFiltered() {
  const q = (($("gr-search") || {}).value || "").trim().toLowerCase();
  const status = $("f-status") ? $("f-status").value : "all";
  return merged().filter((g) => {
    if (status !== "all" && g.status !== status) return false;
    if (!q) return true;
    return g.ref.toLowerCase().includes(q) || g.citizen.toLowerCase().includes(q) ||
      g.subject.toLowerCase().includes(q);
  });
}

function render() {
  const list = getFiltered();
  if ($("gr-count")) $("gr-count").textContent = `Showing ${list.length} case${list.length === 1 ? "" : "s"}`;
  const empty = $("empty-state");
  const row = (g) => `
    <tr class="border-b border-outline-variant/30 hover:bg-surface-container-high transition">
      <td class="px-6 py-4 font-mono text-sm font-semibold text-primary whitespace-nowrap">${g.ref}</td>
      <td class="px-6 py-4 text-sm font-semibold text-on-surface">${g.citizen}</td>
      <td class="px-6 py-4 text-sm text-secondary">${g.subject}</td>
      <td class="px-6 py-4 text-sm text-secondary">${g.department}</td>
      <td class="px-6 py-4 text-sm text-secondary whitespace-nowrap">${g.date}</td>
      <td class="px-6 py-4">${priBadge(g.priority)}</td>
      <td class="px-6 py-4">${statusBadge(g.status)}</td>
      <td class="px-6 py-4 text-sm text-secondary">${g.officer}</td>
      <td class="px-6 py-4 text-right whitespace-nowrap">
        <button class="gr-view text-primary hover:underline text-sm font-semibold" data-ref="${g.ref}">View</button>
      </td>
    </tr>`;
  const tb = $("gr-tbody");
  if (tb) tb.innerHTML = list.map(row).join("");
  const cards = $("gr-cards");
  if (cards) {
    cards.innerHTML = list.map((g) => `
      <div class="bg-white rounded-lg border border-outline-variant/40 shadow-sm p-4">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0"><p class="font-mono font-bold text-primary text-sm">${g.ref}</p>
          <p class="font-semibold text-on-surface text-sm truncate">${g.subject}</p></div>
          ${statusBadge(g.status)}
        </div>
        <p class="text-xs text-secondary mt-1">${g.citizen} • ${g.department} • ${g.date} • ${g.officer}</p>
        <button class="gr-view mt-3 w-full px-3 py-2 rounded-md bg-primary text-white text-sm font-semibold" data-ref="${g.ref}">View</button>
      </div>`).join("");
  }
  if (empty) empty.classList.toggle("hidden", list.length > 0);
  document.querySelectorAll(".gr-view").forEach((b) =>
    b.addEventListener("click", () => openDetails(b.getAttribute("data-ref"))));
}

function openDetails(ref) {
  const g = merged().find((x) => x.ref === ref);
  if (!g) return;
  if ($("gr-title")) $("gr-title").textContent = g.ref;
  if ($("gr-body")) {
    $("gr-body").innerHTML = `
      <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div><dt class="text-label-sm font-semibold text-on-surface-variant">CITIZEN</dt><dd class="font-medium">${g.citizen}</dd></div>
        <div><dt class="text-label-sm font-semibold text-on-surface-variant">DEPARTMENT</dt><dd>${g.department}</dd></div>
        <div class="sm:col-span-2"><dt class="text-label-sm font-semibold text-on-surface-variant">SUBJECT</dt><dd class="font-medium">${g.subject}</dd></div>
        <div><dt class="text-label-sm font-semibold text-on-surface-variant">DATE / PRIORITY</dt><dd>${g.date} • ${g.priority}</dd></div>
        <div><dt class="text-label-sm font-semibold text-on-surface-variant">STATUS</dt><dd class="mt-1">${statusBadge(g.status)}</dd></div>
        <div class="sm:col-span-2"><dt class="text-label-sm font-semibold text-on-surface-variant">ASSIGNED OFFICER</dt><dd>${g.officer}</dd></div>
      </dl>
      <div class="mt-4">
        <label for="gr-assign" class="block text-label-sm font-semibold text-on-surface-variant mb-1">REASSIGN OFFICER</label>
        <select id="gr-assign" class="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-lg text-base cursor-pointer">
          ${OFFICER_ROSTER.map((o) => `<option ${o === g.officer ? "selected" : ""}>${o}</option>`).join("")}
        </select>
      </div>`;
  }
  const m = $("gr-modal");
  if (m) {
    m.classList.remove("hidden");
    m.classList.add("flex");
    m.dataset.ref = ref;
  }
}

function closeDetails() {
  const m = $("gr-modal");
  if (m) { m.classList.add("hidden"); m.classList.remove("flex"); }
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
  if ($("gr-search")) $("gr-search").addEventListener("input", render);
  if ($("f-status")) $("f-status").addEventListener("change", render);
  if ($("btn-clear-filters")) $("btn-clear-filters").addEventListener("click", () => {
    if ($("gr-search")) $("gr-search").value = "";
    if ($("f-status")) $("f-status").value = "all";
    render();
  });
  if ($("gr-close")) $("gr-close").addEventListener("click", closeDetails);
  if ($("gr-close-btn")) $("gr-close-btn").addEventListener("click", closeDetails);
  if ($("btn-gr-ack")) $("btn-gr-ack").addEventListener("click", () => {
    const m = $("gr-modal");
    const ref = m ? m.dataset.ref : null;
    if (!ref) return;
    saveGrievancePatch(ref, { status: "In Progress" });
    render();
    closeDetails();
    toast(`Grievance ${ref} acknowledged (demo).`);
  });
  if ($("btn-gr-assign")) $("btn-gr-assign").addEventListener("click", () => {
    const m = $("gr-modal");
    const ref = m ? m.dataset.ref : null;
    const sel = $("gr-assign");
    if (!ref || !sel) return;
    saveGrievancePatch(ref, { officer: sel.value, status: "In Progress" });
    render();
    closeDetails();
    toast(`Assigned to ${sel.value} (demo).`);
  });
  if ($("btn-gr-resolve")) $("btn-gr-resolve").addEventListener("click", () => {
    const m = $("gr-modal");
    const ref = m ? m.dataset.ref : null;
    if (!ref) return;
    saveGrievancePatch(ref, { status: "Resolved", resolvedAt: nowStamp() });
    render();
    closeDetails();
    toast(`Grievance ${ref} resolved (demo).`);
  });
  const gm = $("gr-modal");
  if (gm) gm.addEventListener("click", (e) => { if (e.target === gm) closeDetails(); });
}

document.addEventListener("DOMContentLoaded", init);

export { getFiltered };
