import { isAuthenticated, getCurrentUser, logout, requirePortal } from "./services/auth-service.js";
import {
  getApplication, saveApplicationPatch, prependHistory, pendingCount,
  DOC_TYPES, OFFICER_ROSTER, CHECKLIST_TEMPLATE, nowStamp, PROPERTIES_360
} from "./admin-data.js";

const $ = (id) => document.getElementById(id);

const DEPT_TABS = ["Revenue", "Registration", "Municipal", "Survey / GIS", "Planning", "Legal"];

const ACTIONS = [
  ["assign", "Assign Officer", "person_add", ""],
  ["note", "Add Internal Note", "note_add", ""],
  ["reqdocs", "Request Documents", "upload_file", ""],
  ["correction", "Request Correction", "edit_note", ""],
  ["approve", "Approve Application", "check_circle", "primary"],
  ["reject", "Reject Application", "cancel", "danger"],
  ["escalate", "Escalate", "priority_high", ""],
  ["resolve", "Resolve Application", "task_alt", "success"]
];

const state = {
  id: null,
  app: null,
  deptTab: "Revenue",
  viewingDoc: null,
  pendingOp: null
};

function toast(msg, isError) {
  const el = $("review-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle("bg-error", Boolean(isError));
  el.classList.toggle("bg-primary", !isError);
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 2600);
}

// Admin guard lives in the shared auth service (requirePortal). See init().

function stageBadge(stage) {
  const s = String(stage || "").toLowerCase();
  const cls = /complet|approv|verif|resolv/.test(s) ? "status-verified"
    : /reject|fail/.test(s) ? "status-rejected"
    : /submit|review|pending|open|document|escalat|change/.test(s) ? "status-pending" : "status-neutral";
  return `<span class="status-badge ${cls}">${stage}</span>`;
}

function docBadge(status) {
  const cls = status === "Verified" ? "status-verified"
    : status === "Rejected" ? "status-rejected"
    : status === "Missing" ? "status-neutral" : "status-pending";
  return `<span class="status-badge ${cls}">${status}</span>`;
}

function dl(rows) {
  return `<dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">` + rows.map(([k, v]) =>
    `<div class="rounded-lg border border-outline-variant/50 bg-surface-container-low p-3">
       <dt class="text-label-sm font-semibold text-on-surface-variant">${k}</dt>
       <dd class="font-medium text-on-surface mt-0.5">${v}</dd>
     </div>`).join("") + `</dl>`;
}

function reload() {
  state.app = getApplication(state.id);
}

function renderHeader() {
  const a = state.app;
  if ($("rev-id")) $("rev-id").textContent = a.id;
  if ($("rev-stage")) $("rev-stage").innerHTML = stageBadge(a.stage);
  if ($("rev-assignee")) $("rev-assignee").textContent = a.assignedOfficer || "Unassigned";
  if ($("rev-expected")) $("rev-expected").textContent = a.expectedTime || "—";
}

function renderSections() {
  const a = state.app;
  if ($("rev-applicant")) {
    $("rev-applicant").innerHTML = dl([
      ["FULL NAME", a.citizen], ["USERNAME", a.username || "—"],
      ["EMAIL", a.email || "—"], ["ROLE", a.role || "USER"],
      ["MOBILE", a.mobile ? `+91 ${a.mobile}` : "—"],
      ["APPLICANT ID", a.applicantId || "—"]
    ]);
  }
  if ($("rev-property")) {
    const p = a.property || {};
    $("rev-property").innerHTML = dl([
      ["ULPIN", `<span class="font-mono text-primary">${a.ulpin}</span>`],
      ["PROPERTY TYPE", p.type || "—"], ["ADDRESS", p.address || "—"],
      ["DISTRICT", p.district || "—"], ["TEHSIL", p.tehsil || "—"], ["VILLAGE", p.village || "—"],
      ["AREA", p.area || "—"], ["LAND CLASSIFICATION", p.landClass || "—"]
    ]);
  }
  if ($("rev-appinfo")) {
    $("rev-appinfo").innerHTML = dl([
      ["APPLICATION ID", `<span class="font-mono text-primary">${a.id}</span>`],
      ["SERVICE", a.service], ["DEPARTMENT", a.department],
      ["SUBMISSION DATE", a.submitted], ["CURRENT STAGE", stageBadge(a.stage)],
      ["EXPECTED PROCESSING TIME", a.expectedTime || "—"],
      ["ASSIGNED OFFICER", a.assignedOfficer || "Unassigned"],
      ...(a.resolution ? [["RESOLUTION", `${a.resolution} (${a.resolvedAt || ""})`]] : [])
    ]);
  }
}

function renderDocs() {
  const a = state.app;
  const box = $("rev-docs");
  if (!box) return;
  const verified = a.docs.filter((d) => d.status === "Verified").length;
  if ($("docs-summary")) $("docs-summary").textContent = `${verified}/${a.docs.length} verified`;
  box.innerHTML = a.docs.length ? a.docs.map((d, i) => `
    <div class="rounded-lg border border-outline-variant/50 p-4">
      <div class="flex items-center gap-3">
        <span class="material-symbols-outlined text-primary">description</span>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-on-surface text-sm">${i + 1}. ${d.name}</p>
          <p class="text-xs text-secondary">Type: ${d.type} • Uploaded: ${d.uploaded || "—"}</p>
        </div>
        ${docBadge(d.status)}
      </div>
      <div class="mt-2 flex flex-wrap gap-2">
        <button class="doc-view px-3 py-1.5 rounded-md border border-outline-variant text-xs font-semibold text-primary" data-doc="${i}">View Document</button>
        ${d.status === "Pending Verification" ? `
          <button class="doc-verify px-3 py-1.5 rounded-md bg-primary text-white text-xs font-semibold" data-doc="${i}">Verify</button>
          <button class="doc-reject px-3 py-1.5 rounded-md border border-error/60 text-error text-xs font-semibold" data-doc="${i}">Reject</button>` : ""}
        ${d.status === "Verified" ? `<span class="inline-flex items-center gap-1 text-xs font-semibold text-[#16A34A] px-2 py-1.5"><span class="material-symbols-outlined text-[16px]">check</span>Verified ✓</span>` : ""}
      </div>
    </div>`).join("")
    : `<p class="text-sm text-secondary">No documents submitted with this demo application.</p>`;
  box.querySelectorAll(".doc-view").forEach((b) =>
    b.addEventListener("click", () => openDocPreview(Number(b.getAttribute("data-doc")))));
  box.querySelectorAll(".doc-verify").forEach((b) =>
    b.addEventListener("click", () => verifyDoc(Number(b.getAttribute("data-doc")))));
  box.querySelectorAll(".doc-reject").forEach((b) =>
    b.addEventListener("click", () => openDocReject(Number(b.getAttribute("data-doc")))));
}

function renderChecklist() {
  const a = state.app;
  const box = $("rev-checklist");
  if (!box) return;
  const done = a.checklist.filter(Boolean).length;
  const total = a.checklist.length;
  if ($("check-count")) $("check-count").textContent = `${done} / ${total} completed`;
  if ($("check-bar")) $("check-bar").style.width = total ? `${Math.round((done / total) * 100)}%` : "0%";
  box.innerHTML = CHECKLIST_TEMPLATE.map((label, i) => `
    <label class="flex items-center gap-3 rounded-lg border border-outline-variant/50 px-3 py-2.5 cursor-pointer ${a.checklist[i] ? "bg-green-50/50" : "bg-white"}">
      <input type="checkbox" data-check="${i}" ${a.checklist[i] ? "checked" : ""} class="w-4 h-4 rounded border-outline text-primary focus:ring-primary">
      <span class="text-sm ${a.checklist[i] ? "text-on-surface font-medium" : "text-secondary"}">${a.checklist[i] ? "☑" : "☐"} ${label}</span>
    </label>`).join("");
  box.querySelectorAll("[data-check]").forEach((cb) =>
    cb.addEventListener("change", () => {
      const list = [...state.app.checklist];
      list[Number(cb.getAttribute("data-check"))] = cb.checked;
      savePatch({ checklist: list });
      renderChecklist();
    }));
}

function deptRecord() {
  return PROPERTIES_360.find((p) => p.ulpin === state.app.ulpin) || null;
}

function renderDeptTabs() {
  const box = $("dept-tabs");
  if (!box) return;
  box.innerHTML = DEPT_TABS.map((t) =>
    `<button data-dept="${t}" class="dept-tab whitespace-nowrap px-3 py-2 rounded-lg text-sm font-semibold transition ${state.deptTab === t ? "active" : "text-on-surface-variant hover:bg-surface-container-high"}">${t}</button>`
  ).join("");
  box.querySelectorAll("[data-dept]").forEach((b) =>
    b.addEventListener("click", () => { state.deptTab = b.getAttribute("data-dept"); renderDeptTabs(); renderDeptPanel(); }));
}

function renderDeptPanel() {
  const panel = $("dept-panel");
  if (!panel) return;
  const rec = deptRecord();
  const a = state.app;
  if (!rec) {
    panel.innerHTML = `
      <p class="text-sm text-secondary mb-3">Not available for this demo record.</p>` +
      dl([["ULPIN", `<span class="font-mono text-primary">${a.ulpin}</span>`],
        ["PROPERTY TYPE", (a.property && a.property.type) || "—"],
        ["ADDRESS", (a.property && a.property.address) || "—"],
        ["AREA", (a.property && a.property.area) || "—"]]);
    return;
  }
  const t = state.deptTab;
  if (t === "Revenue") {
    const r = rec.revenue;
    panel.innerHTML = dl([["CURRENT OWNER", r.owner], ["PREVIOUS OWNER", r.previousOwner],
      ["OWNERSHIP HISTORY", r.history.join(" › ")], ["LAND CLASSIFICATION", r.landClass],
      ["RECORDED VALUE", r.txnValue], ["MUTATION STATUS", r.mutation], ["RoR STATUS", r.ror]]);
  } else if (t === "Registration") {
    const r = rec.registration;
    panel.innerHTML = dl([["REGISTRATION NUMBER", r.regNo], ["SALE DEED", r.deed],
      ["BUYER", r.buyer], ["SELLER", r.seller], ["REGISTRATION DATE", r.regDate],
      ["TRANSACTION VALUE", r.txnValue], ["REGISTRATION OFFICE", r.office]]);
  } else if (t === "Municipal") {
    const r = rec.municipal;
    panel.innerHTML = dl([["PROPERTY ID", a.ulpin], ["BUILDING PERMISSION", r.permission],
      ["BUILDING PLAN STATUS", r.map], ["LAND USE", r.permitNo !== "—" ? r.permitNo : r.construction],
      ["PROPERTY TAX", r.tax], ["COMPLETION CERTIFICATE", r.construction]]);
  } else if (t === "Survey / GIS") {
    const r = rec.survey;
    panel.innerHTML = dl([["ULPIN", a.ulpin], ["SURVEY NUMBER", r.surveyNo], ["PLOT NUMBER", r.plotNo],
      ["AREA", rec.property.area], ["PARCEL BOUNDARY", r.boundary], ["COORDINATES", r.coords],
      ["MAP REFERENCE", r.cadastral]]) +
      `<a href="gis-explorer.html" class="mt-3 inline-flex items-center gap-1 text-primary text-sm font-semibold hover:underline"><span class="material-symbols-outlined text-[18px]">map</span>Open in GIS</a>`;
  } else if (t === "Planning") {
    const r = rec.planning;
    panel.innerHTML = dl([["ZONING", r.zoning], ["LAND USE", r.landUse],
      ["DEVELOPMENT PERMISSION", r.devPermission], ["LAYOUT APPROVAL", r.layout]]);
  } else {
    const cases = rec.legal.cases;
    panel.innerHTML = cases.length ? cases.map((c) =>
      `<div class="rounded-lg border border-outline-variant/50 p-3 mb-2 text-sm">
         <p class="font-mono font-bold text-primary">${c.id} ${stageBadge(c.status)}</p>
         <p class="mt-1">${c.type} • ${c.authority} • Filed ${c.filed}</p>
         <p class="text-secondary">${c.current}</p>
       </div>`).join("")
      : `<p class="text-sm text-secondary">No disputes recorded — clear legal status (demo).</p>`;
  }
}

function renderTimeline() {
  const box = $("rev-timeline");
  if (!box) return;
  box.innerHTML = state.app.history.map((h) => `
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

function renderNotes() {
  const box = $("rev-notes");
  if (!box) return;
  const notes = state.app.notes || [];
  box.innerHTML = notes.length ? notes.map((n) => `
    <div class="rounded-lg border-l-4 border-[#e6a800] bg-[#fdf3c7]/40 p-3">
      <p class="text-xs font-bold text-[#936b00]">INTERNAL NOTE • ${n.time} • ${n.author} (officers only)</p>
      <p class="text-sm text-on-surface mt-1">${n.text}</p>
    </div>`).join("")
    : `<p class="text-sm text-secondary">No internal notes yet.</p>`;
}

function renderActions() {
  const box = $("review-actions");
  if (!box) return;
  box.innerHTML = ACTIONS.map(([op, label, icon, tone]) => `
    <button data-op="${op}" class="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-semibold transition
      ${tone === "primary" ? "bg-primary text-white border-primary hover:bg-primary-container"
      : tone === "danger" ? "border-error/60 text-error hover:bg-red-50"
      : tone === "success" ? "bg-green-600 text-white border-green-600 hover:opacity-90"
      : "border-outline-variant text-on-surface hover:bg-surface-container-high"}">
      <span class="material-symbols-outlined text-[18px]">${icon}</span>${label}
    </button>`).join("");
  box.querySelectorAll("[data-op]").forEach((b) =>
    b.addEventListener("click", () => openAction(b.getAttribute("data-op"))));
}

function rerender() {
  renderHeader();
  renderSections();
  renderDocs();
  renderChecklist();
  renderDeptTabs();
  renderDeptPanel();
  renderTimeline();
  renderNotes();
  renderActions();
}

function savePatch(patch) {
  saveApplicationPatch(state.id, patch);
  state.app = getApplication(state.id);
  rerender();
}

/* ---------- Document preview / verify / reject ---------- */

function openDocPreview(i) {
  const d = state.app.docs[i];
  if (!d) return;
  state.viewingDoc = i;
  if ($("doc-title")) $("doc-title").textContent = d.name;
  if ($("doc-body")) {
    $("doc-body").innerHTML = `
      <div class="rounded-lg border border-outline-variant/50 bg-surface-container-low p-8 text-center">
        <span class="material-symbols-outlined text-6xl text-primary">picture_as_pdf</span>
        <p class="mt-2 font-bold text-on-surface">${d.name}</p>
        <p class="mt-1 inline-block text-xs font-bold px-2 py-1 rounded bg-[#fdf3c7] text-[#936b00]">DEMO DOCUMENT — NOT AN OFFICIAL GOVERNMENT DOCUMENT</p>
      </div>
      <dl class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div><dt class="text-label-sm font-semibold text-on-surface-variant">FILE TYPE</dt><dd class="font-medium">${d.type}</dd></div>
        <div><dt class="text-label-sm font-semibold text-on-surface-variant">UPLOADED</dt><dd>${d.uploaded || "—"}</dd></div>
        <div><dt class="text-label-sm font-semibold text-on-surface-variant">STATUS</dt><dd class="mt-1">${docBadge(d.status)}</dd></div>
        <div><dt class="text-label-sm font-semibold text-on-surface-variant">APPLICATION</dt><dd class="font-mono text-primary">${state.app.id}</dd></div>
      </dl>
      <div class="mt-3 rounded-lg bg-primary-fixed/20 border border-primary/20 p-3 text-sm text-on-surface">
        Sample preview: first page shows applicant name, ULPIN ${state.app.ulpin} and attestation block. Full file stays with the issuing department in production.
      </div>`;
  }
  const canAct = d.status === "Pending Verification";
  if ($("doc-verify-btn")) $("doc-verify-btn").classList.toggle("hidden", !canAct);
  if ($("doc-reject-btn")) $("doc-reject-btn").classList.toggle("hidden", !canAct);
  const m = $("doc-modal");
  if (m) { m.classList.remove("hidden"); m.classList.add("flex"); }
}

function closeDocPreview() {
  const m = $("doc-modal");
  if (m) { m.classList.add("hidden"); m.classList.remove("flex"); }
  state.viewingDoc = null;
}

function verifyDoc(i) {
  const docs = state.app.docs.map((d, j) => (j === i ? { ...d, status: "Verified" } : d));
  commit({ docs }, `${docs[i].name} verified by Admin.`);
  closeDocPreview();
  toast("Document verified (demo).");
}

function openDocReject(i) {
  const d = state.app.docs[i];
  if (!d) return;
  state.viewingDoc = i;
  if ($("docreject-name")) $("docreject-name").textContent = d.name;
  if ($("docreject-reason")) $("docreject-reason").value = "";
  setActionErr("docreject-error", "");
  const m = $("docreject-modal");
  if (m) { m.classList.remove("hidden"); m.classList.add("flex"); }
}

function closeDocReject() {
  const m = $("docreject-modal");
  if (m) { m.classList.add("hidden"); m.classList.remove("flex"); }
}

function confirmDocReject() {
  const reason = $("docreject-reason") ? $("docreject-reason").value.trim() : "";
  if (!reason) {
    setActionErr("docreject-error", "A reason is required to reject a document.");
    return;
  }
  const i = state.viewingDoc;
  const docs = state.app.docs.map((d, j) => (j === i ? { ...d, status: "Rejected" } : d));
  commit({ docs }, `${docs[i].name} rejected by Admin — ${reason}.`);
  closeDocReject();
  closeDocPreview();
  toast("Document rejected (demo).");
}

/* ---------- Generic officer action modal ---------- */

const OP_META = {
  assign: { title: "Assign Officer", desc: "Route this application to a department officer.", show: ["officer"], confirm: "Assign" },
  note: { title: "Add Internal Note", desc: "Notes are visible to officers only.", show: ["note"], confirm: "Save Note" },
  reqdocs: { title: "Request Additional Documents", desc: "Select the documents the citizen must upload.", show: ["docs"], confirm: "Send Request" },
  correction: { title: "Request Correction", desc: "Send back a section for correction.", show: ["field", "input:reason"], confirm: "Send Correction Request" },
  approve: { title: "Approve Application", desc: "All required verification checks must be completed before approval.", show: ["approve"], confirm: "Approve" },
  reject: { title: "Reject Application", desc: "Reject with a recorded reason. Possible: Invalid document, Ownership mismatch, Incomplete information, Property details mismatch, Other.", show: ["input:reason"], confirm: "Reject Application" },
  escalate: { title: "Escalate", desc: "Escalate to a senior officer with justification.", show: ["input:reason"], confirm: "Escalate" },
  resolve: { title: "Resolve Application", desc: "Resolve only after the decision workflow is complete.", show: ["resolve", "input:notes"], confirm: "Resolve" }
};

function missingForApproval() {
  const missingDocs = state.app.docs.filter((d) => d.status !== "Verified").map((d) => d.name);
  const missingChecks = CHECKLIST_TEMPLATE.filter((_, i) => !state.app.checklist[i]);
  return { missingDocs, missingChecks };
}

function openAction(op) {
  const meta = OP_META[op];
  if (!meta) return;
  state.pendingOp = op;
  if ($("action-title")) $("action-title").textContent = `${meta.title} — ${state.app.id}`;
  if ($("action-desc")) $("action-desc").textContent = meta.desc;
  ["action-docs-wrap", "action-field-wrap", "action-resolve-wrap", "action-officer-wrap", "action-approve-info"].forEach((id) => {
    const el = $(id);
    if (el) el.classList.add("hidden");
  });
  const inputWrap = $("action-input-wrap");
  const inputLabel = $("action-input-label");
  const input = $("action-input");
  if (input) input.value = "";
  setActionErr("action-error", "");
  const confirmBtn = $("btn-action-confirm");
  if (confirmBtn) {
    confirmBtn.textContent = meta.confirm;
    confirmBtn.disabled = false;
    confirmBtn.classList.remove("opacity-50", "cursor-not-allowed");
  }

  if (op === "assign" && $("action-officer")) {
    $("action-officer-wrap").classList.remove("hidden");
    $("action-officer").innerHTML = OFFICER_ROSTER.map((o) => `<option>${o}</option>`).join("");
    inputWrap.classList.add("hidden");
  } else if (op === "reqdocs") {
    $("action-docs-wrap").classList.remove("hidden");
    $("action-docs-list").innerHTML = DOC_TYPES.map((d) =>
      `<label class="flex items-center gap-2 text-sm rounded-lg border border-outline-variant/50 px-3 py-2 cursor-pointer">
         <input type="checkbox" data-reqdoc="${d}" class="w-4 h-4 rounded border-outline text-primary focus:ring-primary">${d}
       </label>`).join("");
    inputWrap.classList.remove("hidden");
    inputLabel.textContent = "ADDITIONAL MESSAGE";
  } else if (op === "correction") {
    $("action-field-wrap").classList.remove("hidden");
    inputWrap.classList.remove("hidden");
    inputLabel.textContent = "REASON *";
  } else if (op === "resolve") {
    $("action-resolve-wrap").classList.remove("hidden");
    inputWrap.classList.remove("hidden");
    inputLabel.textContent = "RESOLUTION NOTES *";
    if (!["Approved", "Rejected"].includes(state.app.stage) && confirmBtn) {
      $("action-approve-info").classList.remove("hidden");
      $("action-approve-info").innerHTML = `<p class="font-semibold text-[#936b00]">Resolve is available after an Approve or Reject decision. Current stage: ${state.app.stage}.</p>`;
      confirmBtn.disabled = true;
      confirmBtn.classList.add("opacity-50", "cursor-not-allowed");
    }
  } else if (op === "approve") {
    const { missingDocs, missingChecks } = missingForApproval();
    const info = $("action-approve-info");
    info.classList.remove("hidden");
    if (missingDocs.length || missingChecks.length) {
      info.innerHTML = `<p class="font-semibold text-error">Cannot approve yet — missing:</p>
        <ul class="list-disc pl-5 mt-1 text-sm">
          ${missingDocs.map((d) => `<li>Document not verified: ${d}</li>`).join("")}
          ${missingChecks.map((c) => `<li>Checklist incomplete: ${c}</li>`).join("")}
        </ul>`;
      confirmBtn.disabled = true;
      confirmBtn.classList.add("opacity-50", "cursor-not-allowed");
    } else {
      info.innerHTML = `<p class="font-semibold">Are you sure you want to approve this application?</p>
        <p class="text-sm mt-1">Application: <span class="font-mono">${state.app.id}</span> • Service: ${state.app.service}</p>`;
    }
    inputWrap.classList.add("hidden");
  } else if (op === "note") {
    inputWrap.classList.remove("hidden");
    inputLabel.textContent = "INTERNAL NOTE *";
  } else {
    inputWrap.classList.remove("hidden");
    inputLabel.textContent = "REASON / COMMENT *";
  }
  const m = $("action-modal");
  if (m) { m.classList.remove("hidden"); m.classList.add("flex"); }
}

function setActionErr(id, msg) {
  const el = $(id);
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

function checkedReqDocs() {
  return [...document.querySelectorAll("[data-reqdoc]:checked")].map((c) => c.getAttribute("data-reqdoc"));
}

function commit(patch, activityText) {
  saveApplicationPatch(state.id, patch);
  const user = getCurrentUser() || {};
  prependHistory(state.id, { time: nowStamp(), text: `${activityText} (by ${user.username || "Admin"})` });
  state.app = getApplication(state.id);
  rerender();
}

function confirmAction() {
  const op = state.pendingOp;
  const input = $("action-input") ? $("action-input").value.trim() : "";
  const need = (msg) => {
    if (!input) {
      setActionErr("action-error", msg);
      return false;
    }
    return true;
  };
  if (op === "assign") {
    const officer = $("action-officer") ? $("action-officer").value : "";
    commit({ assignedOfficer: officer }, `Application assigned to ${officer}`);
  } else if (op === "note") {
    if (!need("Enter the note.")) return;
    const notes = [...(state.app.notes || []), { time: nowStamp(), author: (getCurrentUser() || {}).username || "Admin", text: input }];
    commit({ notes }, "Internal note added");
  } else if (op === "reqdocs") {
    const docs = checkedReqDocs();
    if (!docs.length) {
      setActionErr("action-error", "Select at least one required document.");
      return;
    }
    commit({ stage: "Documents Required" }, `Additional documents requested by Admin: ${docs.join(", ")}${input ? ` — ${input}` : ""}`);
  } else if (op === "correction") {
    if (!need("Enter the correction reason.")) return;
    const field = $("action-field") ? $("action-field").value : "Other";
    commit({ stage: "Correction Required" }, `Correction requested (${field}) by Admin — ${input}`);
  } else if (op === "approve") {
    const { missingDocs, missingChecks } = missingForApproval();
    if (missingDocs.length || missingChecks.length) return;
    commit({ stage: "Approved" }, "Application approved by Admin");
  } else if (op === "reject") {
    if (!need("A reason is required to reject.")) return;
    commit({ stage: "Rejected", resolution: `Rejected — ${input}`, resolvedAt: nowStamp() }, `Application rejected by Admin — ${input}`);
  } else if (op === "escalate") {
    if (!need("Escalation needs a justification.")) return;
    commit({}, `Escalated by Admin — ${input}`);
  } else if (op === "resolve") {
    if (!["Approved", "Rejected"].includes(state.app.stage)) return;
    if (!need("Resolution notes are required.")) return;
    const decision = $("action-resolution") ? $("action-resolution").value : "Other";
    commit({ stage: "Resolved", resolution: decision, resolvedAt: nowStamp() }, `Application resolved by Admin (${decision}) — ${input}`);
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
  let id = null;
  try {
    id = new URLSearchParams(window.location.search).get("id");
  } catch { /* ignore */ }
  state.id = id;
  state.app = id ? getApplication(id) : null;
  setupSession();
  if (!state.app) {
    if ($("review-missing")) $("review-missing").classList.remove("hidden");
    if ($("review-content")) $("review-content").classList.add("hidden");
    return;
  }
  rerender();

  if ($("doc-close")) $("doc-close").addEventListener("click", closeDocPreview);
  if ($("doc-close-btn")) $("doc-close-btn").addEventListener("click", closeDocPreview);
  if ($("doc-verify-btn")) $("doc-verify-btn").addEventListener("click", () => verifyDoc(state.viewingDoc));
  if ($("doc-reject-btn")) $("doc-reject-btn").addEventListener("click", () => openDocReject(state.viewingDoc));
  if ($("docreject-close")) $("docreject-close").addEventListener("click", closeDocReject);
  if ($("docreject-cancel")) $("docreject-cancel").addEventListener("click", closeDocReject);
  if ($("btn-docreject-confirm")) $("btn-docreject-confirm").addEventListener("click", confirmDocReject);
  const dm = $("doc-modal");
  if (dm) dm.addEventListener("click", (e) => { if (e.target === dm) closeDocPreview(); });
  const rm = $("docreject-modal");
  if (rm) rm.addEventListener("click", (e) => { if (e.target === rm) closeDocReject(); });
  if ($("action-close")) $("action-close").addEventListener("click", closeAction);
  if ($("action-cancel-btn")) $("action-cancel-btn").addEventListener("click", closeAction);
  if ($("btn-action-confirm")) $("btn-action-confirm").addEventListener("click", confirmAction);
  const am = $("action-modal");
  if (am) am.addEventListener("click", (e) => { if (e.target === am) closeAction(); });
}

document.addEventListener("DOMContentLoaded", init);

function setChecklistItem(i, value) {
  const list = [...state.app.checklist];
  list[i] = !!value;
  savePatch({ checklist: list });
}

export { openAction, confirmAction, verifyDoc, setChecklistItem };
