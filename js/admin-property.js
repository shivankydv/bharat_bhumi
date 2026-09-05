import { isAuthenticated, getCurrentUser, logout, requirePortal } from "./services/auth-service.js";
import { WORKFLOW_STAGES, PROPERTIES_360, seedActivities, pendingCount } from "./admin-data.js";

const STORE_KEY = "bb_admin_state";

const $ = (id) => document.getElementById(id);

const TABS = [
  ["property", "Property"],
  ["revenue", "Revenue"],
  ["registration", "Registration"],
  ["municipal", "Municipal"],
  ["survey", "Survey / GIS"],
  ["planning", "Planning"],
  ["legal", "Legal"],
  ["documents", "Documents"],
  ["payments", "Payments"],
  ["applications", "Applications"]
];

const OPS = [
  ["review", "Review", "rate_review", false],
  ["verify", "Verify", "verified", false],
  ["approve", "Approve", "check_circle", false],
  ["reject", "Reject", "cancel", true],
  ["changes", "Request Changes", "edit_note", true],
  ["documents", "Request Documents", "upload_file", true],
  ["assign", "Assign Officer", "person_add", "officer"],
  ["note", "Add Note", "note_add", "note"],
  ["escalate", "Escalate", "priority_high", true],
  ["resolve", "Resolve", "task_alt", true]
];

const state = {
  ulpin: PROPERTIES_360[0].ulpin,
  tab: "property",
  legalOverride: false,
  pendingOp: null
};

function toast(msg, isError) {
  const el = $("admin-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle("bg-error", Boolean(isError));
  el.classList.toggle("bg-primary", !isError);
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 2600);
}

function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveStore(s) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch (e) {
    console.warn("[Admin] Failed to persist state:", e);
  }
}

function findProp() {
  return PROPERTIES_360.find((p) => p.ulpin === state.ulpin) || PROPERTIES_360[0];
}

function getStatus() {
  const s = loadStore();
  return (s.statusByUlp && s.statusByUlp[state.ulpin]) || findProp().status;
}

function setStatus(status) {
  const s = loadStore();
  s.statusByUlp = s.statusByUlp || {};
  s.statusByUlp[state.ulpin] = status;
  saveStore(s);
}

function getActivities() {
  const s = loadStore();
  const extra = (s.activities && s.activities[state.ulpin]) || [];
  return [...extra, ...seedActivities(state.ulpin)];
}

function addActivity(text) {
  const s = loadStore();
  s.activities = s.activities || {};
  const list = s.activities[state.ulpin] || [];
  const time = new Date().toLocaleString("en-IN", { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" });
  list.unshift({ time, text });
  s.activities[state.ulpin] = list;
  saveStore(s);
}

function statusBadge(status) {
  const s = String(status || "").toLowerCase();
  const cls = /complet|approv|verif|resolv/.test(s) ? "status-verified"
    : /reject|fail/.test(s) ? "status-rejected"
    : /submit|review|pending|open|document|escalat|change/.test(s) ? "status-pending" : "status-neutral";
  return `<span class="status-badge ${cls}">${status}</span>`;
}

function stageIndex(status) {
  const s = String(status || "").toLowerCase();
  if (/resolv/.test(s)) return 4;
  if (/reject|change|document|escalat/.test(s)) return 3;
  if (/approv|verif/.test(s)) return 2;
  if (/review/.test(s)) return 1;
  if (/complet|manag|clos/.test(s)) return 5;
  return 0;
}

function dl(rows) {
  return `<dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">` + rows.map(([k, v]) =>
    `<div class="rounded-lg border border-outline-variant/50 bg-surface-container-low p-3">
       <dt class="text-label-sm font-semibold text-on-surface-variant">${k}</dt>
       <dd class="font-medium text-on-surface mt-0.5">${v}</dd>
     </div>`).join("") + `</dl>`;
}

function renderHeader() {
  const sel = $("prop-select");
  if (sel && !sel.options.length) {
    sel.innerHTML = PROPERTIES_360.map((p) => `<option value="${p.ulpin}">${p.ulpin}</option>`).join("");
    try {
      const q = new URLSearchParams(window.location.search).get("ulpin");
      if (q && PROPERTIES_360.some((p) => p.ulpin === q)) state.ulpin = q;
    } catch { /* ignore */ }
    sel.value = state.ulpin;
  } else if (sel) {
    sel.value = state.ulpin;
  }
  if ($("prop-status")) $("prop-status").innerHTML = statusBadge(getStatus());
  const idx = stageIndex(getStatus());
  const wf = $("prop-workflow");
  if (wf) {
    wf.innerHTML = WORKFLOW_STAGES.map((s, i) =>
      `${i ? '<span class="material-symbols-outlined text-secondary text-[18px]">chevron_right</span>' : ""}
       <span class="text-xs font-bold px-2.5 py-1 rounded-full ${i === idx ? "bg-primary text-white" : i < idx ? "bg-green-600 text-white" : "bg-surface-container-high text-on-surface"}">${s}</span>`
    ).join("");
  }
}

function renderTabs() {
  const box = $("prop-tabs");
  if (!box) return;
  box.innerHTML = TABS.map(([id, label]) =>
    `<button data-tab="${id}" class="prop-tab whitespace-nowrap px-3 py-2 rounded-lg text-sm font-semibold transition ${state.tab === id ? "active" : "text-on-surface-variant hover:bg-surface-container-high"}">${label}</button>`
  ).join("");
  box.querySelectorAll("[data-tab]").forEach((b) =>
    b.addEventListener("click", () => selectTab(b.getAttribute("data-tab"))));
}

function selectTab(id) {
  if (!TABS.some(([t]) => t === id)) return;
  state.tab = id;
  renderTabs();
  renderPanel();
}

function maskedLegal() {
  const user = getCurrentUser() || {};
  return (user.role || "USER") !== "ADMIN" && !state.legalOverride;
}

function renderPanel() {
  const panel = $("prop-panel");
  if (!panel) return;
  const p = findProp();
  const t = state.tab;

  if (t === "property") {
    panel.innerHTML = dl([
      ["ULPIN", `<span class="font-mono text-primary">${p.property.ulpin}</span>`],
      ["ADDRESS", p.property.address],
      ["AREA", p.property.area],
      ["LAND TYPE", p.property.landType],
      ["CURRENT STATUS", statusBadge(getStatus())]
    ]);
    return;
  }
  if (t === "revenue") {
    const r = p.revenue;
    panel.innerHTML = dl([
      ["CURRENT OWNER", r.owner], ["PREVIOUS OWNER", r.previousOwner],
      ["TRANSACTION DATE", r.txnDate], ["RECORDED VALUE", r.txnValue],
      ["LAND CLASSIFICATION", r.landClass], ["VILLAGE / DISTRICT / TEHSIL", `${r.village} / ${r.district} / ${r.tehsil}`],
      ["RoR", r.ror], ["MUTATION", r.mutation], ["TAX / REVENUE", r.tax]
    ]) + `<h4 class="mt-4 font-bold text-sm">OWNERSHIP HISTORY</h4>
      <ul class="mt-1 flex flex-col gap-1">${r.history.map((h) => `<li class="text-sm text-secondary flex gap-2"><span class="material-symbols-outlined text-[18px] text-primary">history</span>${h}</li>`).join("")}</ul>`;
    return;
  }
  if (t === "registration") {
    const r = p.registration;
    panel.innerHTML = dl([
      ["REGISTRATION NUMBER", `<span class="font-mono text-primary">${r.regNo}</span>`],
      ["SALE DEED", r.deed], ["REGISTRATION DATE", r.regDate],
      ["BUYER", r.buyer], ["SELLER", r.seller], ["TRANSACTION VALUE", r.txnValue],
      ["DOCUMENT STATUS", r.docStatus], ["REGISTRATION OFFICE", r.office]
    ]);
    return;
  }
  if (t === "municipal") {
    const r = p.municipal;
    panel.innerHTML = dl([
      ["BUILDING PERMISSION", r.permission], ["APPROVED MAP", r.map],
      ["CONSTRUCTION STATUS", r.construction], ["PROPERTY TAX", r.tax],
      ["PERMIT NUMBER", r.permitNo], ["APPROVAL DATE", r.approvalDate]
    ]);
    return;
  }
  if (t === "survey") {
    const r = p.survey;
    panel.innerHTML = dl([
      ["SURVEY NUMBER", r.surveyNo], ["PLOT NUMBER", r.plotNo],
      ["PARCEL BOUNDARY", r.boundary], ["AREA", p.property.area],
      ["COORDINATES", `<span class="font-mono">${r.coords}</span>`],
      ["CADASTRAL REFERENCE", r.cadastral], ["LAND CLASSIFICATION", r.classification],
      ["SURVEY STATUS", r.surveyStatus]
    ]) + `<a href="gis-explorer.html" class="mt-3 inline-flex items-center gap-1 text-primary text-sm font-semibold hover:underline"><span class="material-symbols-outlined text-[18px]">map</span>Open in GIS Explorer</a>`;
    return;
  }
  if (t === "planning") {
    const r = p.planning;
    panel.innerHTML = dl([
      ["ZONING", r.zoning], ["LAND USE", r.landUse],
      ["DEVELOPMENT PERMISSION", r.devPermission], ["LAYOUT APPROVAL", r.layout],
      ["ROAD ALIGNMENT", r.road], ["RESTRICTED ZONE", r.restricted], ["PLANNING APPROVAL", r.approval]
    ]);
    return;
  }
  if (t === "legal") {
    if (maskedLegal()) {
      panel.innerHTML = `
        <div class="rounded-lg border-2 border-error/40 p-5 text-center">
          <span class="material-symbols-outlined text-4xl text-error">lock</span>
          <h4 class="font-bold mt-2">Restricted — Legal role required (demo)</h4>
          <p class="text-sm text-secondary mt-1">Only officers with the Legal access scope may view case details.</p>
          <div class="mt-3 flex gap-2 justify-center">
            <button id="btn-legal-request" class="px-4 py-2 rounded-lg border border-outline-variant text-sm font-semibold">Request access</button>
            <button id="btn-legal-override" class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">View with demo override</button>
          </div>
        </div>`;
      const req = $("btn-legal-request");
      if (req) req.addEventListener("click", () => toast("Access request sent to Legal authority (demo)."));
      const ov = $("btn-legal-override");
      if (ov) ov.addEventListener("click", () => { state.legalOverride = true; renderPanel(); });
      return;
    }
    const cases = p.legal.cases;
    panel.innerHTML = cases.length ? cases.map((c) => `
      <div class="rounded-lg border border-outline-variant/50 p-4 mb-3">
        <div class="flex items-center justify-between gap-2">
          <p class="font-mono font-bold text-primary">${c.id}</p>${statusBadge(c.status)}
        </div>
        <dl class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div><dt class="text-label-sm font-semibold text-on-surface-variant">CASE TYPE</dt><dd>${c.type}</dd></div>
          <div><dt class="text-label-sm font-semibold text-on-surface-variant">AUTHORITY</dt><dd>${c.authority}</dd></div>
          <div><dt class="text-label-sm font-semibold text-on-surface-variant">FILED</dt><dd>${c.filed}</dd></div>
          <div><dt class="text-label-sm font-semibold text-on-surface-variant">CURRENT STATUS</dt><dd>${c.current}</dd></div>
        </dl>
      </div>`).join("")
      : `<p class="text-sm text-secondary">No disputes or cases recorded for this property (demo).</p>`;
    return;
  }
  if (t === "documents") {
    panel.innerHTML = `<ul class="flex flex-col gap-2">` + p.documents.map((d) => `
      <li class="flex items-center gap-2 text-sm rounded-lg border border-outline-variant/50 p-3">
        <span class="material-symbols-outlined text-primary">description</span>
        <span class="font-medium">${d}</span>
      </li>`).join("") + `</ul>`;
    return;
  }
  if (t === "payments") {
    panel.innerHTML = `<ul class="flex flex-col gap-2">` + p.payments.map((d) => `
      <li class="flex items-center gap-2 text-sm rounded-lg border border-outline-variant/50 p-3">
        <span class="material-symbols-outlined text-primary">receipt_long</span>
        <span class="font-medium">${d}</span>
      </li>`).join("") + `</ul>`;
    return;
  }
  if (t === "applications") {
    panel.innerHTML = `<ul class="flex flex-col gap-2">` + p.applications.map((d) => `
      <li class="flex items-center gap-2 text-sm rounded-lg border border-outline-variant/50 p-3">
        <span class="material-symbols-outlined text-primary">assignment</span>
        <span class="font-medium">${d}</span>
      </li>`).join("") + `</ul>`;
  }
}

function renderActions() {
  const box = $("officer-actions");
  if (!box) return;
  box.innerHTML = OPS.map(([op, label, icon, need]) => `
    <button data-op="${op}" class="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-semibold transition
      ${op === "approve" ? "bg-primary text-white border-primary hover:bg-primary-container"
        : op === "reject" ? "border-error/60 text-error hover:bg-red-50"
        : op === "resolve" ? "bg-green-600 text-white border-green-600 hover:opacity-90"
        : "border-outline-variant text-on-surface hover:bg-surface-container-high"}">
      <span class="material-symbols-outlined text-[18px]">${icon}</span>${label}
    </button>`).join("");
  box.querySelectorAll("[data-op]").forEach((b) =>
    b.addEventListener("click", () => openAction(b.getAttribute("data-op"))));
}

function renderActivity() {
  const box = $("activity-list");
  if (!box) return;
  box.innerHTML = getActivities().map((a) => `
    <div class="flex gap-3">
      <div class="flex flex-col items-center">
        <div class="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
        <div class="w-0.5 flex-1 bg-outline-variant/60"></div>
      </div>
      <div class="pb-4">
        <p class="text-xs font-semibold text-secondary">${a.time}</p>
        <p class="text-sm text-on-surface">${a.text}</p>
      </div>
    </div>`).join("");
}

const OP_META = {
  review: { title: "Mark Reviewed", desc: "Record that ownership and records were reviewed.", need: null, status: "Under Review", verb: "reviewed" },
  verify: { title: "Verify Record", desc: "Confirm the records across departments check out.", need: null, status: "Verified", verb: "verified" },
  approve: { title: "Approve", desc: "Approve this case. This is recorded with your officer identity.", need: null, status: "Approved", verb: "approved" },
  reject: { title: "Reject", desc: "Reject with a recorded reason. The citizen is notified.", need: "reason", status: "Rejected", verb: "rejected" },
  changes: { title: "Request Changes", desc: "Send back for correction with instructions.", need: "reason", status: "Changes Requested", verb: "sent back for changes" },
  documents: { title: "Request Documents", desc: "Ask the citizen for additional documents.", need: "reason", status: "Documents Required", verb: "requested documents for" },
  assign: { title: "Assign Officer", desc: "Route this case to a department officer.", need: "officer", status: null, verb: "assigned" },
  note: { title: "Add Internal Note", desc: "Notes are visible to officers only.", need: "note", status: null, verb: "noted on" },
  escalate: { title: "Escalate", desc: "Escalate to a senior officer with justification.", need: "reason", status: "Escalated", verb: "escalated" },
  resolve: { title: "Resolve Case", desc: "Mark the case resolved with a resolution summary. This closes the loop.", need: "reason", status: "Resolved", verb: "resolved" }
};

function openAction(op) {
  const meta = OP_META[op];
  if (!meta) return;
  state.pendingOp = op;
  if ($("action-title")) $("action-title").textContent = `${meta.title} — ${state.ulpin}`;
  if ($("action-desc")) $("action-desc").textContent = meta.desc;
  const officerWrap = $("action-officer-wrap");
  const inputWrap = $("action-input-wrap");
  if (officerWrap) officerWrap.classList.toggle("hidden", meta.need !== "officer");
  if (inputWrap) inputWrap.classList.toggle("hidden", meta.need === "officer" || !meta.need);
  if ($("action-input-label")) {
    $("action-input-label").textContent = meta.need === "note" ? "INTERNAL NOTE *" : "REASON / COMMENT *";
  }
  if ($("action-input")) $("action-input").value = "";
  setErr("");
  const m = $("action-modal");
  if (m) { m.classList.remove("hidden"); m.classList.add("flex"); }
}

function setErr(msg) {
  const el = $("action-error");
  if (!el) return;
  if (!msg) {
    el.classList.add("hidden");
    el.textContent = "";
  } else {
    el.classList.remove("hidden");
    el.textContent = msg;
  }
}

function closeAction() {
  const m = $("action-modal");
  if (m) { m.classList.add("hidden"); m.classList.remove("flex"); }
  state.pendingOp = null;
}

function confirmAction() {
  const op = state.pendingOp;
  const meta = OP_META[op];
  if (!meta) return;
  let detail = "";
  if (meta.need === "officer") {
    detail = $("action-officer") ? $("action-officer").value : "";
    if (!detail) {
      setErr("Select an officer.");
      return;
    }
  } else if (meta.need === "reason" || meta.need === "note") {
    detail = $("action-input") ? $("action-input").value.trim() : "";
    if (!detail) {
      setErr(meta.need === "note" ? "Enter the note." : "A reason is required for this action.");
      return;
    }
  }
  const user = getCurrentUser() || {};
  const who = user.username || "Officer";
  addActivity(`${meta.title} by ${who}${detail ? ` — “${detail}”` : ""}. Case ${meta.verb}.`);
  if (meta.status) setStatus(meta.status);
  closeAction();
  renderHeader();
  renderPanel();
  renderActivity();
  toast(`${meta.title} recorded for ${state.ulpin} (demo).`);
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
  if (!requirePortal("admin")) {
    return;
  }
  setupSession();
  renderHeader();
  renderTabs();
  renderPanel();
  renderActions();
  renderActivity();
  const sel = $("prop-select");
  if (sel) sel.addEventListener("change", () => {
    state.ulpin = sel.value;
    state.tab = "property";
    state.legalOverride = false;
    renderHeader();
    renderTabs();
    renderPanel();
    renderActivity();
  });
  if ($("action-close")) $("action-close").addEventListener("click", closeAction);
  if ($("action-cancel-btn")) $("action-cancel-btn").addEventListener("click", closeAction);
  if ($("btn-action-confirm")) $("btn-action-confirm").addEventListener("click", confirmAction);
  const m = $("action-modal");
  if (m) m.addEventListener("click", (e) => { if (e.target === m) closeAction(); });
}

document.addEventListener("DOMContentLoaded", init);

export { findProp, getStatus, confirmAction, openAction, selectTab };
