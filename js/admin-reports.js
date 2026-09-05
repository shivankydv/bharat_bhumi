import { getCurrentUser, logout, requirePortal } from "./services/auth-service.js";
import { getApplications, ADMIN_DASH_STATS, DEPT_OVERVIEW, pendingCount } from "./admin-data.js";

const $ = (id) => document.getElementById(id);

function renderStats() {
  const box = $("report-stats");
  if (!box) return;
  box.innerHTML = ADMIN_DASH_STATS.map((s) => `
    <div class="bg-white rounded-xl border border-outline-variant/40 shadow-sm p-5 flex items-center gap-4">
      <div class="w-12 h-12 rounded-lg bg-primary-fixed/30 text-primary flex items-center justify-center flex-shrink-0">
        <span class="material-symbols-outlined text-2xl">${s.icon}</span>
      </div>
      <div><p class="text-label-sm font-semibold text-on-surface-variant">${s.label}</p>
      <p class="text-2xl font-bold text-on-surface">${s.value}</p></div>
    </div>`).join("");
}

function renderStageBars() {
  const box = $("report-stages");
  if (!box) return;
  const counts = {};
  getApplications().forEach((a) => {
    counts[a.stage] = (counts[a.stage] || 0) + 1;
  });
  const max = Math.max(1, ...Object.values(counts));
  box.innerHTML = Object.entries(counts).map(([stage, n]) => `
    <div>
      <div class="flex justify-between text-sm mb-1">
        <span class="font-semibold text-on-surface">${stage}</span>
        <span class="text-secondary">${n}</span>
      </div>
      <div class="w-full bg-surface-variant rounded-full h-2.5">
        <div class="bg-primary h-2.5 rounded-full" style="width:${Math.round((n / max) * 100)}%"></div>
      </div>
    </div>`).join("");
}

function renderDeptTable() {
  const tb = $("report-dept-tbody");
  if (!tb) return;
  tb.innerHTML = DEPT_OVERVIEW.map((d) => `
    <tr class="border-b border-outline-variant/30">
      <td class="px-6 py-3 text-sm font-semibold text-on-surface">${d.dept}</td>
      <td class="px-6 py-3 text-sm text-secondary">${d.records}</td>
      <td class="px-6 py-3 text-sm text-[#EA580C] font-semibold">${d.pending}</td>
    </tr>`).join("");
}

function renderDecisions() {
  const box = $("report-decisions");
  if (!box) return;
  const apps = getApplications();
  const approved = apps.filter((a) => ["Approved", "Resolved", "Completed"].includes(a.stage)).length;
  const rejected = apps.filter((a) => a.stage === "Rejected").length;
  const inProgress = apps.length - approved - rejected;
  const total = Math.max(1, apps.length);
  const row = (label, n, color) => `
    <div class="flex items-center gap-3">
      <span class="w-3 h-3 rounded-full flex-shrink-0" style="background:${color}"></span>
      <span class="text-sm font-semibold flex-1">${label}</span>
      <span class="text-sm text-secondary">${n} (${Math.round((n / total) * 100)}%)</span>
    </div>`;
  box.innerHTML = row("Approved / Resolved", approved, "#16A34A") + row("In progress", inProgress, "#EA580C") + row("Rejected", rejected, "#BA1A1A") +
    `<p class="text-xs text-secondary mt-2">Demo figures computed from the current demo application set.</p>`;
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
  renderStats();
  renderStageBars();
  renderDeptTable();
  renderDecisions();
}

document.addEventListener("DOMContentLoaded", init);
