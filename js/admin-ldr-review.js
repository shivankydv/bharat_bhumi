import { isAuthenticated, getCurrentUser, logout, requirePortal } from "./services/auth-service.js";
import {
  getRequest, saveRequestPatch, prependRequestHistory, findMatches,
  LDR_WORKFLOW, nowStamp
} from "./land-discovery-data.js";
import { pendingCount } from "./admin-data.js";
import { PROPERTIES_360 } from "./admin-data.js";
import { DEMO_PROPERTIES } from "./demo-data.js";

const $ = (id) => document.getElementById(id);

const ACTIONS = [
  ["start-search", "Start Record Search", "travel_explore", ""],
  ["assign-dept", "Assign Department", "person_add", ""],
  ["search-records", "Search Land Records", "manage_search", ""],
  ["add-details", "Add Land Record Details", "post_add", ""],
  ["request-info", "Request More Information", "upload_file", ""],
  ["send-survey", "Send for Survey", "map", ""],
  ["verify-ownership", "Verify Ownership", "verified_user", "primary"],
  ["reject-claim", "Reject Claim", "cancel", "danger"],
  ["resolve", "Resolve Request", "task_alt", "success"],
  ["history", "View History", "history", ""],
  ["close", "Close Request", "close", ""]
];

const RESOLUTIONS = [
  "Verified Record Located",
  "Record Located — Further Legal Verification Required",
  "No Matching Record Found",
  "Insufficient Information",
  "Claim Referred to Legal/Dispute Authority"
];

const state = { id: null, req: null, pendingOp: null, matchCtx: null };

function toast(msg, isError) {
  const el = $("ldr-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle("bg-error", Boolean(isError));
  el.classList.toggle("bg-primary", !isError);
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 2600);
}

function stageBadge(stage) {
  const s = String(stage || "").toLowerCase();
  const cls = /resolv|verif|match|located/.test(s) ? "status-verified"
    : /reject|fail|no record|closed/.test(s) ? "status-rejected"
    : /submit|review|record|search|pending|required|officer/.test(s) ? "status-pending" : "status-neutral";
  return `<span class="status-badge ${cls}">${stage}</span>`;
}

function dl(rows) {
  return `<dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">` + rows.map(([k, v]) =>
    `<div class="rounded-lg border border-outline-variant/50 bg-surface-container-low p-3">
       <dt class="text-label-sm font-semibold text-on-surface-variant">${k}</dt>
       <dd class="font-medium text-on-surface mt-0.5">${v || "—"}</dd>
     </div>`).join("") + `</dl>`;
}

function markedMatches() {
  return (state.req.matches || []).filter((m) => m.status === "marked");
}

function dismissedUlpins() {
  return new Set((state.req.matches || []).filter((m) => m.status === "dismissed").map((m) => m.ulpin));
}

function renderHeader() {
  const r = state.req;
  if ($("ldr-id")) $("ldr-id").textContent = r.id;
  if ($("ldr-stage")) $("ldr-stage").innerHTML = stageBadge(r.stage);
  if ($("ldr-dept")) $("ldr-dept").textContent = r.department;
  if ($("ldr-priority")) $("ldr-priority").textContent = r.priority;
}

function renderSections() {
  const r = state.req;
  const idn = r.identity || {};
  if ($("ldr-applicant")) {
    $("ldr-applicant").innerHTML = dl([
      ["FULL NAME", idn.name || r.citizen], ["USERNAME", idn.username || r.username || "—"],
      ["EMAIL", idn.email || r.email || "—"], ["MOBILE", idn.mobile ? `+91 ${idn.mobile}` : (r.mobile ? `+91 ${r.mobile}` : "—")]
    ]);
  }
  const c = r.clues || {};
  if ($("ldr-clues")) {
    $("ldr-clues").innerHTML = dl([
      ["DISTRICT", c.district], ["VILLAGE / LOCALITY", c.village], ["TEHSIL / TALUKA", c.tehsil],
      ["APPROXIMATE LOCATION", c.location], ["KNOWN OWNER", c.ownerName],
      ["OLD SURVEY / PLOT", c.oldSurvey], ["PERIOD", c.period], ["LAND TYPE", c.landType]
    ]);
  }
  const k = r.claim || {};
  if ($("ldr-claim")) {
    $("ldr-claim").innerHTML = dl([
      ["CLAIM TYPE", k.type], ["KNOWN OWNERS", k.owners], ["ELDER NAME", k.elder],
      ["YEAR", k.year], ["AREA", k.area], ["LANDMARKS", k.landmarks]
    ]) + (k.extra ? `<div class="mt-3 rounded-lg border border-outline-variant/50 bg-surface-container-low p-3 text-sm"><p class="text-label-sm font-semibold text-on-surface-variant">ANYTHING ELSE REMEMBERED</p><p class="mt-0.5">${k.extra}</p></div>` : "");
  }
  if ($("ldr-docs")) {
    const docs = r.docs || [];
    $("ldr-docs").innerHTML = docs.length ? `<ul class="flex flex-col gap-2">` + docs.map((d) => `
      <li class="flex items-center gap-2 text-sm rounded-lg border border-outline-variant/50 p-3">
        <span class="material-symbols-outlined text-primary">description</span>
        <span class="font-medium">${d.name}</span>
        <span class="text-secondary">${d.file ? ` — ${d.file}` : " — no file attached"}</span>
      </li>`).join("") + `</ul>`
      : `<p class="text-sm text-secondary">No documents provided — the citizen selected “I don't have any documents”, which is allowed.</p>`;
  }
}

function indicator(label, state_) {
  const icon = state_ === "match" ? "check_circle" : state_ === "partial" ? "schedule" : "cancel";
  const color = state_ === "match" ? "#16A34A" : state_ === "partial" ? "#EA580C" : "#747781";
  const text = state_ === "match" ? "✓" : state_ === "partial" ? "Partial Match" : "—";
  return `<span class="inline-flex items-center gap-1 text-xs font-semibold" style="color:${color}"><span class="material-symbols-outlined text-[16px]">${icon}</span>${label}: ${text}</span>`;
}

function renderMatches() {
  const box = $("ldr-matches");
  if (!box) return;
  const dismissed = dismissedUlpins();
  const results = findMatches(state.req).filter((m) => !dismissed.has(m.ulpin));
  if (!results.length) {
    box.innerHTML = `<p class="text-sm text-secondary">No potential matches from the current clues. Run “Search Land Records” after more information arrives, or mark “No Record Found”.</p>`;
    return;
  }
  box.innerHTML = results.map((m, i) => {
    const marked = markedMatches().some((x) => x.ulpin === m.ulpin);
    return `
    <div class="rounded-xl border ${marked ? "border-green-500" : "border-outline-variant/50"} p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <h3 class="font-bold text-on-surface">Potential Match #${i + 1}</h3>
        ${marked ? `<span class="status-badge status-verified">MARKED — REQUIRES AUTHORITY VERIFICATION</span>`
          : `<span class="status-badge status-pending">POTENTIAL MATCH — REQUIRES AUTHORITY VERIFICATION</span>`}
      </div>
      <dl class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        <div><dt class="text-label-sm font-semibold text-on-surface-variant">ULPIN</dt><dd class="font-mono font-bold text-primary">${m.ulpin}</dd></div>
        <div><dt class="text-label-sm font-semibold text-on-surface-variant">VILLAGE</dt><dd>${m.village || "—"}</dd></div>
        <div><dt class="text-label-sm font-semibold text-on-surface-variant">RECORDED OWNER</dt><dd>${m.owner || "—"}</dd></div>
        <div><dt class="text-label-sm font-semibold text-on-surface-variant">LAND TYPE / AREA</dt><dd>${m.landType || "—"} • ${m.area || "—"}</dd></div>
      </dl>
      <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        ${indicator("Location Match", m.indicators.location)}
        ${indicator("Owner Name Similar", m.indicators.owner)}
        ${indicator("Land Area", m.indicators.area)}
        ${indicator("Historical Record Available", m.indicators.history ? "match" : "none")}
      </div>
      <div class="mt-3 flex flex-wrap gap-2">
        <button class="match-360 px-3 py-1.5 rounded-md border border-outline-variant text-xs font-semibold text-primary" data-ulpin="${m.ulpin}">View Property 360°</button>
        <a href="gis-explorer.html" class="px-3 py-1.5 rounded-md border border-outline-variant text-xs font-semibold text-primary">View GIS</a>
        ${marked ? `<button class="match-reject px-3 py-1.5 rounded-md border border-error/60 text-error text-xs font-semibold" data-ulpin="${m.ulpin}">Reject Match</button>`
          : `<button class="match-mark px-3 py-1.5 rounded-md bg-primary text-white text-xs font-semibold" data-ulpin="${m.ulpin}">Mark as Match</button>`}
      </div>
    </div>`;
  }).join("");
  box.querySelectorAll(".match-360").forEach((b) =>
    b.addEventListener("click", () => {
      window.location.href = "admin-property.html?ulpin=" + encodeURIComponent(b.getAttribute("data-ulpin"));
    }));
  box.querySelectorAll(".match-mark").forEach((b) =>
    b.addEventListener("click", () => markMatch(b.getAttribute("data-ulpin"))));
  box.querySelectorAll(".match-reject").forEach((b) =>
    b.addEventListener("click", () => rejectMatch(b.getAttribute("data-ulpin"))));
}

function renderWorkflow() {
  const box = $("ldr-workflow");
  if (!box) return;
  const steps = ["Submitted", "Under Review", "Record Search", "Possible Match Found", "Officer Verification", "Resolved"];
  const order = { "Submitted": 0, "Under Review": 1, "Record Search": 2, "Possible Match Found": 3, "Additional Information Required": 3, "Officer Verification": 4, "No Record Found": 5, "Resolved": 5, "Rejected": 5, "Under Search": 2, "Potential Match": 3, "Verification Required": 4, "Verified Match": 4 };
  const idx = order[state.req.stage] ?? 0;
  box.innerHTML = `
    <div class="flex flex-wrap items-center gap-2 mb-3">` + steps.map((s, i) =>
      `${i ? '<span class="material-symbols-outlined text-secondary text-[18px]">chevron_right</span>' : ""}
       <span class="text-xs font-bold px-2.5 py-1 rounded-full ${i === idx ? "bg-primary text-white" : i < idx ? "bg-green-600 text-white" : "bg-surface-container-high text-on-surface"}">${s}</span>`
    ).join("") + `    </div>
    <ol class="flex flex-col gap-1">${LDR_WORKFLOW.map((s, i) => `<li class="text-sm text-secondary flex gap-2"><span class="font-bold text-primary">${i + 1}.</span>${s}</li>`).join("")}</ol>`;
}

function sharedDetailsHtml(d) {
  if (!d) return "";
  const row = (l, v) => `<div><dt class="text-label-sm font-semibold text-on-surface-variant">${l}</dt><dd class="font-medium">${v || "—"}</dd></div>`;
  return `
    <div class="mt-3 rounded-xl border-2 border-green-500/50 bg-green-50/50 p-4">
      <p class="font-bold text-[#15803d]">Details shared with citizen — possible match, NOT confirmed ownership</p>
      <dl class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        ${row("ULPIN", `<span class="font-mono font-bold text-primary">${d.ulpin}</span>`)}
        ${row("SURVEY NO", d.survey)}${row("RECORDED OWNER", d.owner)}${row("AREA", d.area)}
        ${row("VILLAGE", d.village)}${row("DISTRICT", d.district)}
        ${row("LAND CLASSIFICATION", d.classification)}${row("MATCH CONFIDENCE", d.confidence)}
      </dl>
      ${d.notes ? `<p class="text-sm mt-2"><span class="font-semibold">Officer note:</span> ${d.notes}</p>` : ""}
    </div>`;
}

function renderResolution() {
  const panel = $("resolution-panel");
  if (!panel) return;
  const r = state.req.resolution;
  const shared = sharedDetailsHtml(state.req.discovered);
  if (!r && !state.req.discovered) {
    panel.classList.add("hidden");
    return;
  }
  panel.classList.remove("hidden");
  let verified = "";
  if (r && r.outcome === "Verified Record Located" && r.ulpin) {
    const rec360 = PROPERTIES_360.find((p) => p.ulpin === r.ulpin);
    const demo = DEMO_PROPERTIES.find((p) => p.ulpin === r.ulpin);
    verified = `<dl class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
      <div><dt class="text-label-sm font-semibold text-on-surface-variant">VERIFIED ULPIN</dt><dd class="font-mono font-bold text-primary">${r.ulpin}</dd></div>
      <div><dt class="text-label-sm font-semibold text-on-surface-variant">SURVEY NUMBER</dt><dd>${rec360 ? rec360.survey.surveyNo : "—"}</dd></div>
      <div><dt class="text-label-sm font-semibold text-on-surface-variant">PARCEL LOCATION</dt><dd>${demo ? demo.location : (rec360 ? rec360.property.address : "—")}</dd></div>
      <div><dt class="text-label-sm font-semibold text-on-surface-variant">AREA</dt><dd>${demo ? demo.area : (rec360 ? rec360.property.area : "—")}</dd></div>
      <div><dt class="text-label-sm font-semibold text-on-surface-variant">RECORDED OWNER</dt><dd>${rec360 ? rec360.revenue.owner : (demo ? demo.ownerName : "—")}</dd></div>
      <div><dt class="text-label-sm font-semibold text-on-surface-variant">LAND CLASSIFICATION</dt><dd>${rec360 ? rec360.revenue.landClass : (demo ? demo.type : "—")}</dd></div>
    </dl>
    <p class="mt-2 text-xs text-secondary">Ownership information shown here is based on verified authority records.</p>`;
  }
  if ($("ldr-resolution")) {
    $("ldr-resolution").innerHTML = `
      ${r ? `<p class="text-sm"><span class="font-semibold">Outcome:</span> ${r.outcome}</p>
      <p class="text-sm mt-1"><span class="font-semibold">Notes:</span> ${r.notes || "—"}</p>
      <p class="text-xs text-secondary mt-1">Resolved ${r.time || ""}</p>${verified}` : ""}
      ${!r ? sharedDetailsHtml(state.req.discovered) : ""}`;
  }
  const nr = $("norecord-panel");
  if (nr) nr.classList.add("hidden");
}

function renderNoRecord() {
  const nr = $("norecord-panel");
  if (!nr) return;
  nr.classList.toggle("hidden", state.req.stage !== "No Record Found");
}

function renderTimeline() {
  const box = $("ldr-timeline");
  if (!box) return;
  box.innerHTML = (state.req.history || []).map((h) => `
    <div class="flex gap-3">
      <div class="flex flex-col items-center">
        <div class="w-2.5 h-2.5 rounded-full bg-primary mt-1.5 flex-shrink-0"></div>
        <div class="w-0.5 flex-1 bg-outline-variant/60"></div>
      </div>
      <div class="pb-4">
        <p class="text-xs font-semibold text-secondary">${h.time}</p>
        <p class="text-sm text-on-surface">${h.text}</p>
      </div>
    </div>`).join("");
}

function renderActions() {
  const box = $("ldr-actions");
  if (!box) return;
  const extra = `<button data-op="view-gis" class="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-outline-variant text-sm font-semibold hover:bg-surface-container-high transition">
      <span class="material-symbols-outlined text-[18px]">map</span>View GIS</button>`;
  box.innerHTML = ACTIONS.map(([op, label, icon, tone]) => `
    <button data-op="${op}" class="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-semibold transition
      ${tone === "primary" ? "bg-primary text-white border-primary hover:bg-primary-container"
      : tone === "danger" ? "border-error/60 text-error hover:bg-red-50"
      : tone === "success" ? "bg-green-600 text-white border-green-600 hover:opacity-90"
      : "border-outline-variant text-on-surface hover:bg-surface-container-high"}">
      <span class="material-symbols-outlined text-[18px]">${icon}</span>${label}
    </button>`).join("") + extra;
  box.querySelectorAll("[data-op]").forEach((b) =>
    b.addEventListener("click", () => openAction(b.getAttribute("data-op"))));
  const gis = box.querySelector('[data-op="view-gis"]');
  if (gis) gis.addEventListener("click", () => {
    window.location.href = "gis-explorer.html";
  });
}

function rerender() {
  renderHeader();
  renderSections();
  renderMatches();
  renderWorkflow();
  renderResolution();
  renderNoRecord();
  renderTimeline();
  renderActions();
}

function commit(patch, activityText) {
  saveRequestPatch(state.id, patch);
  const user = getCurrentUser() || {};
  prependRequestHistory(state.id, { time: nowStamp(), text: `${activityText} (by ${user.username || "Admin"})` });
  state.req = getRequest(state.id);
  rerender();
}

function markMatch(ulpin) {
  const matches = [...(state.req.matches || []).filter((m) => m.ulpin !== ulpin), { ulpin, status: "marked" }];
  commit({ matches, stage: "Potential Match" }, `Marked ${ulpin} as a potential match — requires authority verification`);
  toast("Marked as potential match. Ownership is NOT confirmed (demo).");
}

function rejectMatch(ulpin) {
  const matches = [...(state.req.matches || []).filter((m) => m.ulpin !== ulpin), { ulpin, status: "dismissed" }];
  commit({ matches }, `Dismissed potential match ${ulpin}`);
  toast("Match dismissed (demo).");
}

/* ---------- generic action modal ---------- */

function openAction(op) {
  state.pendingOp = op;
  state.matchCtx = null;
  if (op === "history") {
    const t = $("ldr-timeline");
    if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
    toast("Full request history is shown below (demo).");
    return;
  }
  const titles = {
    "start-search": ["Start Record Search", "Begin the authority record search for this request."],
    "assign-dept": ["Assign Department", "Route this request to the responsible department."],
    "add-details": ["Add Land Record Details", "Enter the discovered record. It is sent to the citizen as a clearly-labelled possible match — never as confirmed ownership."],
    "request-info": ["Request More Information", "Tell the citizen exactly what is needed."],
    "send-survey": ["Send for Survey", "Request field/GIS survey assistance for this request."],
    "verify-ownership": ["Verify Ownership", "Authority verification only. A potential match never confirms ownership by itself."],
    "reject-claim": ["Reject Claim", "Reject with a recorded reason. The citizen is notified."],
    "resolve": ["Resolve Request", "Close the loop with a recorded outcome."],
    "close": ["Close Request", "Close without further verification. A closing note is required."]
  };
  const [title, desc] = titles[op] || ["Officer Action", ""];
  if ($("act-title")) $("act-title").textContent = `${title} — ${state.id}`;
  if ($("act-desc")) $("act-desc").textContent = desc;
  const dyn = $("act-dynamic");
  const confirmBtn = $("btn-act-confirm");
  if (confirmBtn) {
    confirmBtn.textContent = "Confirm";
    confirmBtn.disabled = false;
    confirmBtn.classList.remove("opacity-50", "cursor-not-allowed");
  }
  setActErr("");
  if (!dyn) return;

  const inputWrap = $("action-input-wrap");
  const inputLabel = $("action-input-label");
  const input = $("action-input");
  if (input) input.value = "";
  const showInput = (label) => {
    if (inputWrap) inputWrap.classList.remove("hidden");
    if (inputLabel) inputLabel.textContent = label;
  };
  const hideInput = () => {
    if (inputWrap) inputWrap.classList.add("hidden");
  };

  if (op === "assign-dept") {
    dyn.innerHTML = `<label class="block text-label-sm font-semibold text-on-surface-variant mb-1">DEPARTMENT *</label>
      <select id="act-dept" class="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-lg text-base cursor-pointer">
        ${["Revenue", "Survey / GIS", "Registration", "Municipal / ULB", "Planning", "Legal"].map((d) => `<option ${d === state.req.department ? "selected" : ""}>${d}</option>`).join("")}
      </select>`;
    hideInput();
  } else if (op === "add-details") {
    const d = state.req.discovered || {};
    const f = (id, label, v, ph) => `<div><label class="block text-label-sm font-semibold text-on-surface-variant mb-1">${label}</label>
      <input id="${id}" type="text" value="${(v || "").replace(/"/g, "&quot;")}" placeholder="${ph || ""}" class="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm"></div>`;
    dyn.innerHTML = `<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      ${f("dd-ulpin", "ULPIN *", d.ulpin, "ULP-892-441-A")}${f("dd-survey", "SURVEY NUMBER", d.survey, "42/7")}
      ${f("dd-owner", "RECORD OWNER *", d.owner, "Ram Prasad Yadav")}${f("dd-area", "LAND AREA", d.area, "2.4 Hectares")}
      ${f("dd-class", "LAND CLASSIFICATION", d.classification, "Agricultural")}${f("dd-village", "VILLAGE", d.village, "North Village")}
      ${f("dd-tehsil", "TEHSIL", d.tehsil, "Tehsil North")}${f("dd-district", "DISTRICT", d.district, "District A")}
      ${f("dd-location", "PARCEL LOCATION", d.location, "")}${f("dd-status", "RECORD STATUS", d.status, "Active record")}
      </div>
      <div class="mt-3"><label class="block text-label-sm font-semibold text-on-surface-variant mb-1">MATCH CONFIDENCE *</label>
      <select id="dd-confidence" class="w-full px-3 py-2 bg-white border border-outline-variant rounded-lg text-sm cursor-pointer">
        ${["High", "Medium", "Low"].map((c) => `<option ${d.confidence === c ? "selected" : ""}>${c}</option>`).join("")}
      </select></div>
      <div class="mt-3"><label class="block text-label-sm font-semibold text-on-surface-variant mb-1">OFFICER NOTE</label>
      <textarea id="dd-notes" rows="2" placeholder="Possible match found based on owner name, village and approximate land location."
        class="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm">${d.notes || ""}</textarea></div>`;
    hideInput();
    if (confirmBtn) confirmBtn.textContent = "Send Details to Citizen";
  } else if (op === "request-info") {
    dyn.innerHTML = "";
    showInput("WHAT INFORMATION IS REQUIRED? *");
    if (input) input.placeholder = "e.g. Please provide the village name or approximate location of the land.";
  } else if (op === "verify-ownership") {
    dyn.innerHTML = `<div class="rounded-lg bg-[#fdf3c7]/60 border border-[#e6a800]/50 p-3 text-sm">
      <p class="font-bold text-[#936b00]">Authority action</p>
      <p class="text-on-surface-variant mt-1">Only the authorized authority can confirm ownership after verifying evidence. This demo records the decision — it never transfers ownership automatically.</p></div>`;
    showInput("VERIFICATION NOTE *");
    if (input) input.placeholder = "Basis of verification...";
  } else if (op === "reject-claim") {
    dyn.innerHTML = "";
    showInput("REJECTION REASON *");
    if (input) input.placeholder = "e.g. Claim contradicts verified RoR...";
  } else if (op === "resolve") {
    if (!["Officer Verification", "Possible Match Found", "No Record Found", "Rejected", "Verified Match", "Approved"].includes(state.req.stage)) {
      dyn.innerHTML = `<p class="text-sm font-semibold text-[#936b00]">Resolve after officer verification, a no-record finding, or a rejection. Current stage: ${state.req.stage}.</p>`;
      hideInput();
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.classList.add("opacity-50", "cursor-not-allowed");
      }
    } else {
      dyn.innerHTML = `<label class="block text-label-sm font-semibold text-on-surface-variant mb-1">RESOLUTION *</label>
        <select id="act-resolution" class="w-full px-4 py-2.5 bg-white border border-outline-variant rounded-lg text-base cursor-pointer">
          <option>Verified Record Located</option><option>Record Located — Further Legal Verification Required</option>
          <option>No Matching Record Found</option><option>Insufficient Information</option><option>Claim Referred to Legal/Dispute Authority</option>
        </select>`;
      state.resolutionEl = dyn.querySelector("#act-resolution");
      showInput("RESOLUTION NOTES *");
      if (input) input.placeholder = "";
    }
  } else {
    dyn.innerHTML = `<p class="text-sm text-secondary">Confirm to record this action on the timeline.</p>`;
    hideInput();
  }
  const m = $("act-modal");
  if (m) { m.classList.remove("hidden"); m.classList.add("flex"); }
}

function setActErr(msg) {
  const el = $("act-error");
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
  const m = $("act-modal");
  if (m) { m.classList.add("hidden"); m.classList.remove("flex"); }
  state.pendingOp = null;
}

function val(id) {
  const el = $(id);
  return el ? el.value.trim() : "";
}

function markedUlpins() {
  return (state.req.matches || []).filter((m) => m.status === "marked").map((m) => m.ulpin);
}

function confirmAction() {
  const op = state.pendingOp;
  if (op === "start-search") {
    commit({ stage: "Record Search" }, "Record search started by Admin");
  } else if (op === "assign-dept") {
    const dept = val("act-dept") || state.req.department;
    commit({ department: dept }, `Assigned to ${dept} department`);
  } else if (op === "request-info") {
    if (!val("action-input")) {
      setActErr("Describe the information required.");
      return;
    }
    commit({ stage: "Additional Information Required" }, `More information requested by Admin — ${val("action-input")}`);
  } else if (op === "add-details") {
    const ulpin = val("dd-ulpin");
    const owner = val("dd-owner");
    if (!ulpin || !owner) {
      setActErr("ULPIN and record owner are required.");
      return;
    }
    const discovered = {
      ulpin, survey: val("dd-survey"), owner,
      area: val("dd-area"), classification: val("dd-class"), village: val("dd-village"),
      tehsil: val("dd-tehsil"), district: val("dd-district"), location: val("dd-location"),
      status: val("dd-status"), notes: val("dd-notes"), confidence: val("dd-confidence") || "Medium",
      time: nowStamp()
    };
    commit({ discovered, stage: "Possible Match Found" }, `Possible land record details sent to citizen (${ulpin}) — requires authority verification`);
  } else if (op === "send-survey") {
    commit({ stage: "Officer Verification" }, "Sent for field/GIS survey assistance");
  } else if (op === "verify-ownership") {
    if (!val("action-input")) {
      setActErr("A verification note is required.");
      return;
    }
    commit({ stage: "Officer Verification" }, `Ownership verified by authority — ${val("action-input")}`);
  } else if (op === "reject-claim") {
    if (!val("action-input")) {
      setActErr("A reason is required to reject.");
      return;
    }
    commit({ stage: "Rejected", resolution: { outcome: "Rejected", notes: val("action-input"), time: nowStamp() } }, `Claim rejected by Admin — ${val("action-input")}`);
  } else if (op === "resolve") {
    if (!["Officer Verification", "Possible Match Found", "No Record Found", "Rejected", "Verified Match", "Approved"].includes(state.req.stage)) return;
    if (!val("action-input")) {
      setActErr("Resolution notes are required.");
      return;
    }
    // NOTE: read via the stored element reference (captured at build time),
    // not by ID lookup, so the decision can never silently fall back.
    const resEl = state.resolutionEl && state.resolutionEl.isConnected
      ? state.resolutionEl
      : document.querySelector("#act-dynamic #act-resolution");
    const decision = (resEl && resEl.value ? resEl.value.trim() : "") || val("action-resolution") || "Other";
    const marked = markedUlpins();
    const disc = state.req.discovered;
    commit(
      { stage: "Resolved", resolution: { outcome: decision, notes: val("action-input"), time: nowStamp(), ulpin: marked[0] || (disc && disc.ulpin) || null } },
      `Request resolved by Admin (${decision}) — ${val("action-input")}`
    );
  } else if (op === "close") {
    if (!val("action-input")) {
      setActErr("A closing note is required.");
      return;
    }
    commit(
      { stage: "Resolved", resolution: { outcome: "Closed", notes: val("action-input"), time: nowStamp(), ulpin: null } },
      `Request closed by Admin — ${val("action-input")}`
    );
  } else if (op === "no-record") {
    commit({ stage: "No Record Found" }, "No matching land record identified with available information");
  } else {
    return;
  }
  closeAction();
  toast("Action recorded (demo).");
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
  if (!requirePortal("admin")) {
    return;
  }
  let id = null;
  try {
    id = new URLSearchParams(window.location.search).get("id");
  } catch { /* ignore */ }
  state.id = id;
  state.req = id ? getRequest(id) : null;
  setupSession();
  if (!state.req) {
    if ($("review-missing")) $("review-missing").classList.remove("hidden");
    if ($("review-content")) $("review-content").classList.add("hidden");
    return;
  }
  rerender();

  if ($("btn-no-match")) $("btn-no-match").addEventListener("click", () => {
    state.pendingOp = "no-record";
    if ($("act-title")) $("act-title").textContent = `Mark No Record Found — ${state.id}`;
    if ($("act-desc")) $("act-desc").textContent = "Confirm that no matching record was identified. The request stays open with next steps.";
    if ($("act-dynamic")) $("act-dynamic").innerHTML = "";
    setActErr("");
    const m = $("act-modal");
    if (m) { m.classList.remove("hidden"); m.classList.add("flex"); }
  });
  if ($("act-close")) $("act-close").addEventListener("click", closeAction);
  if ($("act-cancel")) $("act-cancel").addEventListener("click", closeAction);
  if ($("btn-act-confirm")) $("btn-act-confirm").addEventListener("click", confirmAction);
  const am = $("act-modal");
  if (am) am.addEventListener("click", (e) => { if (e.target === am) closeAction(); });

  if ($("btn-nr-info")) $("btn-nr-info").addEventListener("click", () => openAction("request-info"));
  if ($("btn-nr-survey")) $("btn-nr-survey").addEventListener("click", () => openAction("send-survey"));
  if ($("btn-nr-history")) $("btn-nr-history").addEventListener("click", () => {
    const t = $("ldr-timeline");
    if (t) t.scrollIntoView({ behavior: "smooth" });
  });
  if ($("btn-nr-support")) $("btn-nr-support").addEventListener("click", () => {
    toast("Support request noted — helpdesk will contact the officer (demo).");
  });
}

document.addEventListener("DOMContentLoaded", init);

export { openAction, confirmAction, markMatch };
