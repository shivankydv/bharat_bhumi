import { isAuthenticated, getCurrentUser, logout } from "./services/auth-service.js";
import { WORKFLOW_STAGES, CROSS_DEPT_FLOW, DEPT_OVERVIEW, DEPARTMENTS, REVIEW_QUEUE, pendingApplications, pendingCount } from "./admin-data.js";

const $ = (id) => document.getElementById(id);

function toast(msg) {
  const el = $("admin-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 2600);
}

function stageBadge(stage) {
  const s = String(stage || "").toLowerCase();
  const cls = /complet|approv|verif|resolv|clos/.test(s) ? "status-verified"
    : /reject|fail/.test(s) ? "status-rejected"
    : /submit|review|pending|open|document/.test(s) ? "status-pending" : "status-neutral";
  return `<span class="status-badge ${cls}">${stage}</span>`;
}

function renderWorkflow() {
  const box = $("workflow-strip");
  if (!box) return;
  box.innerHTML = WORKFLOW_STAGES.map((s, i) =>
    `${i ? '<span class="material-symbols-outlined text-secondary text-[18px]">chevron_right</span>' : ""}
     <span class="text-sm font-bold px-3 py-1.5 rounded-full ${i <= 1 ? "bg-primary text-white" : i === 4 ? "bg-green-600 text-white" : "bg-surface-container-high text-on-surface"}">${s}</span>`
  ).join("");
}

function renderOverview() {
  const box = $("dept-overview");
  if (!box) return;
  box.innerHTML = DEPT_OVERVIEW.map((d) => `
    <div class="bg-white rounded-xl border border-outline-variant/40 shadow-sm p-5 flex items-center gap-4">
      <div class="w-12 h-12 rounded-lg bg-primary-fixed/30 text-primary flex items-center justify-center flex-shrink-0">
        <span class="material-symbols-outlined text-2xl">${d.icon}</span>
      </div>
      <div>
        <p class="font-bold text-on-surface">${d.dept}</p>
        <p class="text-sm text-secondary">${d.records} • ${d.pending}</p>
      </div>
    </div>`).join("");
}

function renderQueue() {
  const list = REVIEW_QUEUE;
  if ($("queue-count")) $("queue-count").textContent = `${list.length} items awaiting officer action`;
  const row = (q) => `
    <tr class="border-b border-outline-variant/30 hover:bg-surface-container-high transition">
      <td class="px-6 py-4 font-mono text-sm font-semibold text-primary whitespace-nowrap">${q.id}</td>
      <td class="px-6 py-4 text-sm text-secondary">${q.kind}</td>
      <td class="px-6 py-4 text-sm font-semibold text-on-surface">${q.title}</td>
      <td class="px-6 py-4 text-sm font-mono text-secondary whitespace-nowrap">${q.ulpin}</td>
      <td class="px-6 py-4">${stageBadge(q.stage)}</td>
      <td class="px-6 py-4 text-sm ${q.priority === "High" ? "text-error font-bold" : "text-secondary"}">${q.priority}</td>
      <td class="px-6 py-4 text-right">
        <button class="queue-review text-primary hover:underline text-sm font-semibold" data-ulpin="${q.ulpin}">Review</button>
      </td>
    </tr>`;
  const card = (q) => `
    <div class="bg-white rounded-lg border border-outline-variant/40 shadow-sm p-4">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0"><p class="font-mono font-bold text-primary text-sm">${q.id}</p>
        <p class="font-semibold text-on-surface text-sm truncate">${q.title}</p></div>
        ${stageBadge(q.stage)}
      </div>
      <p class="text-xs text-secondary mt-1">${q.kind} • ${q.ulpin} • ${q.received}</p>
      <button class="queue-review mt-3 w-full px-3 py-2 rounded-md bg-primary text-white text-sm font-semibold" data-ulpin="${q.ulpin}">Review</button>
    </div>`;
  const tb = $("queue-tbody");
  if (tb) tb.innerHTML = list.map(row).join("");
  const cards = $("queue-cards");
  if (cards) cards.innerHTML = list.map(card).join("");
  document.querySelectorAll(".queue-review").forEach((b) =>
    b.addEventListener("click", () => {
      window.location.href = "admin-property.html?ulpin=" + encodeURIComponent(b.getAttribute("data-ulpin"));
    }));
}

function renderPendingCard() {
  const list = pendingApplications();
  if ($("dash-pending-count")) $("dash-pending-count").textContent = pendingCount();
  const tb = $("dash-recent-tbody");
  if (!tb) return;
  tb.innerHTML = list.slice(0, 4).map((a) => `
    <tr class="border-b border-outline-variant/30 hover:bg-surface-container-high transition">
      <td class="px-6 py-3 font-mono text-sm font-semibold text-primary whitespace-nowrap">${a.id}</td>
      <td class="px-6 py-3 text-sm font-semibold text-on-surface">${a.citizen}</td>
      <td class="px-6 py-3 text-sm text-secondary">${a.service}</td>
      <td class="px-6 py-3">${stageBadge(a.stage)}</td>
      <td class="px-6 py-3 text-right">
        <button class="dash-review text-primary hover:underline text-sm font-semibold" data-id="${a.id}">Review</button>
      </td>
    </tr>`).join("");
  tb.querySelectorAll(".dash-review").forEach((b) =>
    b.addEventListener("click", () => {
      window.location.href = "application-review.html?id=" + encodeURIComponent(b.getAttribute("data-id"));
    }));
}

function renderDepartments() {
  const mk = (d) => `
    <article class="bg-white rounded-xl border border-outline-variant/40 shadow-sm p-5">
      <p class="text-xs font-bold text-secondary uppercase tracking-wide">${d.name}</p>
      <h3 class="font-bold text-primary mt-0.5">${d.summary}</h3>
      <p class="text-sm text-secondary mt-1">${d.desc}</p>
      <div class="mt-3 flex flex-wrap gap-1.5">
        ${d.fields.map((f) => `<span class="text-xs px-2 py-1 rounded-full bg-surface-container-high text-on-surface-variant">${f}</span>`).join("")}
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        ${d.actions.map((a) => `<button class="dept-action px-3 py-1.5 rounded-md border border-outline-variant text-xs font-semibold text-primary hover:bg-surface-container-low transition" data-dept="${d.name}" data-action-name="${a}">${a}</button>`).join("")}
      </div>
    </article>`;
  const prim = $("dept-primary");
  if (prim) prim.innerHTML = DEPARTMENTS.filter((d) => d.primary).map(mk).join("");
  const sec = $("dept-secondary");
  if (sec) sec.innerHTML = DEPARTMENTS.filter((d) => !d.primary).map(mk).join("");
  document.querySelectorAll(".dept-action").forEach((b) =>
    b.addEventListener("click", () => {
      const a = b.getAttribute("data-action-name");
      if (/GIS/i.test(a)) {
        window.location.href = "gis-explorer.html";
        return;
      }
      toast(`${a} — ${b.getAttribute("data-dept")} (demo).`);
    }));
}

function renderCrossFlow() {
  const box = $("cross-flow");
  if (!box) return;
  box.innerHTML = CROSS_DEPT_FLOW.map((s, i) => `
    <div class="flex items-center gap-3">
      <div class="flex flex-col items-center">
        <div class="w-9 h-9 rounded-full ${i === CROSS_DEPT_FLOW.length - 1 ? "bg-green-600 text-white" : "bg-primary text-white"} flex items-center justify-center flex-shrink-0">
          <span class="material-symbols-outlined text-[18px]">${s.icon}</span>
        </div>
        ${i < CROSS_DEPT_FLOW.length - 1 ? '<div class="w-0.5 h-4 bg-outline-variant"></div>' : ""}
      </div>
      <p class="text-sm font-semibold text-on-surface pb-${i < CROSS_DEPT_FLOW.length - 1 ? "4" : "0"}">${i + 1}. ${s.label}</p>
    </div>`).join("");
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

// Frontend role guard: ADMIN-only pages. The backend still enforces
// authorization on every endpoint; this only routes the UI correctly.
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

function init() {
  if (!requireAdmin()) {
    return;
  }
  setupSession();
  renderWorkflow();
  renderOverview();
  renderQueue();
  renderPendingCard();
  renderDepartments();
  renderCrossFlow();
}

document.addEventListener("DOMContentLoaded", init);

export { renderQueue };
