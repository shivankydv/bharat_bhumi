import { isAuthenticated, getCurrentUser, logout, requirePortal } from "./services/auth-service.js";
import {
  getCitizenRequests, saveCitizenRequest, updateCitizenRequest,
  saveRequestPatch, prependRequestHistory, nowStamp
} from "./land-discovery-data.js";

const $ = (id) => document.getElementById(id);

const STEP_LABELS = ["Applicant", "Land Information", "Supporting Info", "Review & Submit"];

const state = {
  step: 1,
  applicant: { name: "", mobile: "", email: "", relationship: "Self" },
  land: {},
  docs: [],
  submitted: null
};

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

function setErr(id, msg) {
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

function renderStepper() {
  const box = $("stepper");
  if (!box) return;
  box.innerHTML = STEP_LABELS.map((label, i) => {
    const n = i + 1;
    const done = n < state.step;
    const current = n === state.step;
    const circle = done
      ? `<div class="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0"><span class="material-symbols-outlined">check</span></div>`
      : `<div class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-bold ${current ? "bg-primary text-on-primary" : "bg-surface-variant text-outline"}">${n}</div>`;
    const line = n < STEP_LABELS.length
      ? `<div class="flex-1 h-0.5 mx-2 rounded ${n < state.step ? "bg-primary" : "bg-surface-variant"}"></div>` : "";
    return `<div class="flex items-center ${n < STEP_LABELS.length ? "flex-1" : ""}">${circle}
      <span class="ml-2 text-sm font-semibold hidden sm:block ${current ? "text-primary" : done ? "text-on-surface" : "text-secondary"}">${label}</span>${line}</div>`;
  }).join("");
}

function showStep(n) {
  state.step = n;
  for (let i = 1; i <= 4; i++) {
    const el = $("step-" + i);
    if (el) el.classList.toggle("hidden", i !== n);
  }
  renderStepper();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function prefillApplicant() {
  const user = getCurrentUser() || {};
  let profile = {};
  try {
    profile = JSON.parse(localStorage.getItem("bb_profile") || "{}");
  } catch { /* ignore */ }
  if ($("app-name") && !$("app-name").value) $("app-name").value = profile.fullName || user.username || "";
  if ($("app-email") && !$("app-email").value) $("app-email").value = profile.email || "";
  if ($("app-mobile") && !$("app-mobile").value) $("app-mobile").value = profile.mobile || "";
}

function readStep1() {
  state.applicant = {
    name: $("app-name").value.trim(),
    mobile: $("app-mobile").value.trim(),
    email: $("app-email").value.trim(),
    relationship: $("app-relationship").value
  };
  if (!state.applicant.name) {
    setErr("err-applicant", "Full name is required.");
    return false;
  }
  if (!/^[6-9]\d{9}$/.test(state.applicant.mobile)) {
    setErr("err-applicant", "Enter a valid 10-digit mobile number.");
    return false;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.applicant.email)) {
    setErr("err-applicant", "Enter a valid email address.");
    return false;
  }
  setErr("err-applicant", "");
  return true;
}

const LAND_FIELDS = ["owner", "prevOwner", "state", "district", "tehsil", "village", "location", "area", "landmark", "extra"];

function readStep2() {
  state.land = {};
  LAND_FIELDS.forEach((k) => {
    const el = $("land-" + k);
    state.land[k] = el ? el.value.trim() : "";
  });
  const lt = $("land-type");
  state.land.landType = lt ? lt.value : "Unknown";
  return true;
}

function readStep3() {
  state.docs = [];
  document.querySelectorAll(".ldr-doc-check:checked").forEach((cb) => {
    state.docs.push({ name: cb.value, file: null });
  });
  const fi = $("support-file");
  if (fi && fi.files && fi.files[0] && state.docs.length) {
    state.docs[0] = { ...state.docs[0], file: fi.files[0].name };
  }
}

function reviewHtml() {
  const a = state.applicant;
  const l = state.land;
  const row = (t, v) => `<div class="rounded-lg border border-outline-variant/50 bg-surface-container-low p-3">
    <dt class="text-label-sm font-semibold text-on-surface-variant">${t}</dt>
    <dd class="font-medium text-on-surface mt-0.5">${v || "—"}</dd></div>`;
  return `<h3 class="font-bold text-on-surface mb-2">APPLICANT</h3>
    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
    ${row("FULL NAME", a.name)}${row("MOBILE", "+91 " + a.mobile)}${row("EMAIL", a.email)}${row("RELATIONSHIP", a.relationship)}</dl>
    <h3 class="font-bold text-on-surface mt-5 mb-2">LAND INFORMATION</h3>
    <dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
    ${row("POSSIBLE OWNER", l.owner)}${row("PREVIOUS OWNER / FAMILY", l.prevOwner)}
    ${row("STATE", l.state)}${row("DISTRICT", l.district)}${row("TEHSIL", l.tehsil)}${row("VILLAGE", l.village)}
    ${row("LOCATION", l.location)}${row("AREA", l.area)}${row("LAND TYPE", l.landType)}${row("LANDMARK", l.landmark)}</dl>
    <div class="mt-3">${row("OTHER INFORMATION", l.extra)}</div>
    <h3 class="font-bold text-on-surface mt-5 mb-2">SUPPORTING INFORMATION</h3>
    <p class="text-sm">${state.docs.length ? state.docs.map((d) => `${d.name}${d.file ? ` — ${d.file}` : ""}`).join("; ") : "No documents provided (allowed)."}</p>
    <label class="mt-4 flex items-start gap-2 text-sm cursor-pointer">
      <input type="checkbox" id="declaration" class="mt-1 w-4 h-4 text-primary focus:ring-primary">
      <span>I confirm that the information provided is true to the best of my knowledge.</span>
    </label>
    <p id="err-declare" class="field-error hidden"></p>`;
}

function submitRequest() {
  const decl = $("declaration");
  if (!decl || !decl.checked) {
    setErr("err-declare", "Please accept the declaration to submit.");
    return;
  }
  setErr("err-declare", "");
  const user = getCurrentUser() || {};
  const seq = String(Math.floor(1000 + Math.random() * 9000));
  const id = `LDR-2026-${seq}`;
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const a = state.applicant;
  const l = state.land;
  const req = {
    id,
    citizen: a.name,
    username: user.username || "",
    relationship: a.relationship,
    clues: {
      district: l.district, village: l.village, tehsil: l.tehsil, location: l.location,
      ownerName: l.owner, oldSurvey: "", period: "", landType: l.landType,
      state: l.state, area: l.area
    },
    claim: {
      type: "Land discovery", owners: l.owner, elder: l.prevOwner,
      year: "", area: l.area, landmarks: l.landmark, extra: l.extra
    },
    docs: state.docs.map((d) => ({ name: d.name, file: d.file })),
    identity: { name: a.name, username: user.username || "", email: a.email, mobile: a.mobile },
    submitted: today,
    iso: new Date().toISOString().slice(0, 10),
    stage: "Submitted",
    department: "Revenue",
    priority: "Medium",
    assignee: "Unassigned",
    resolution: null,
    history: [{ time: `${today} — Submitted`, text: "Request submitted by citizen" }]
  };
  saveCitizenRequest(req);
  state.submitted = req;
  if ($("success-id")) $("success-id").textContent = id;
  if ($("success-date")) $("success-date").textContent = today;
  if ($("wizard-form")) $("wizard-form").classList.add("hidden");
  const s = $("success-screen");
  if (s) s.classList.remove("hidden");
  renderMine();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function stageBadge(stage) {
  const s = String(stage || "").toLowerCase();
  const cls = /resolv|verif|match|located/.test(s) ? "status-verified"
    : /reject|fail|no record/.test(s) ? "status-rejected"
    : /submit|review|search|pending|required/.test(s) ? "status-pending" : "status-neutral";
  return `<span class="status-badge ${cls}">${stage}</span>`;
}

function discoveredHtml(d) {
  if (!d) return "";
  const row = (l, v) => `<div><dt class="text-label-sm font-semibold text-on-surface-variant">${l}</dt><dd class="font-medium">${v || "—"}</dd></div>`;
  return `
    <div class="mt-3 rounded-xl border-2 border-green-500/50 bg-green-50/50 p-4">
      <p class="font-bold text-[#15803d] flex items-center gap-2"><span class="material-symbols-outlined">verified</span>Possible Land Record Found</p>
      <p class="text-xs text-secondary mt-1">Clearly labelled as a possible match until officially verified — not a government record.</p>
      <dl class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
        ${row("ULPIN", `<span class="font-mono font-bold text-primary">${d.ulpin}</span>`)}
        ${row("SURVEY NO", d.survey)}${row("RECORDED OWNER", d.owner)}${row("AREA", d.area)}
        ${row("VILLAGE", d.village)}${row("DISTRICT", d.district)}
        ${row("LAND CLASSIFICATION", d.classification)}${row("MATCH CONFIDENCE", d.confidence)}
      </dl>
      ${d.notes ? `<p class="text-sm mt-2"><span class="font-semibold">Officer note:</span> ${d.notes}</p>` : ""}
    </div>`;
}

function renderMine() {
  const box = $("my-requests");
  if (!box) return;
  const user = getCurrentUser() || {};
  const mine = getCitizenRequests().filter((r) => !r.username || r.username === user.username);
  if (!mine.length) {
    box.innerHTML = `<p class="text-sm text-secondary">No discovery requests yet. Submitted requests appear here with live status.</p>`;
    return;
  }
  box.innerHTML = mine.map((r) => {
    const disc = r.discovered || null;
    const showDetails = disc && ["Possible Match Found", "Officer Verification", "Resolved"].includes(r.stage);
    return `
    <div class="rounded-xl border border-outline-variant/40 bg-white p-4" data-ldr="${r.id}">
      <div class="flex flex-wrap items-center gap-2 justify-between">
        <p class="font-mono font-bold text-primary">${r.id}</p>${stageBadge(r.stage)}
      </div>
      <p class="text-sm text-secondary mt-1">${r.submitted} • ${(r.clues && (r.clues.district || r.clues.village)) || "Location partial"}</p>
      <div class="mt-2 flex flex-col gap-1 ldr-timeline">
        ${(r.history || []).map((h) => `<p class="text-xs text-secondary">• <strong>${h.time}</strong> — ${h.text}</p>`).join("")}
      </div>
      ${r.stage === "Additional Information Required" ? `
        <div class="mt-3 rounded-lg bg-[#fdf3c7]/50 border border-[#e6a800]/40 p-3">
          <p class="text-sm font-bold text-[#936b00]">Additional Information Required</p>
          <p class="text-xs text-secondary mt-0.5">${(r.history[r.history.length - 1] || {}).text || ""}</p>
          <div class="mt-2 flex gap-2">
            <button class="ldr-update-btn px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold" data-id="${r.id}">Update Request</button>
            <button class="ldr-details-btn px-4 py-2 rounded-lg border border-outline-variant text-sm font-semibold" data-id="${r.id}">View Details</button>
          </div>
          <div class="ldr-update-wrap hidden mt-2">
            <textarea id="upd-${r.id}" rows="2" placeholder="Provide the requested information..."
              class="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm"></textarea>
            <button class="ldr-send-btn mt-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold" data-id="${r.id}">Submit Information</button>
          </div>
        </div>` : `
        <div class="mt-2"><button class="ldr-details-btn text-primary text-sm font-semibold hover:underline" data-id="${r.id}">View Details</button></div>`}
      <div class="ldr-detail-view hidden mt-2 rounded-lg border border-outline-variant/50 bg-surface-container-low p-3 text-sm"></div>
      ${showDetails ? discoveredHtml(disc) : ""}
      ${r.stage === "Resolved" ? `
        <div class="mt-3 rounded-lg bg-green-500/10 border border-green-500/40 p-3">
          <p class="font-bold text-[#15803d]">Land Discovery Request Resolved</p>
          <div class="mt-2 flex flex-wrap gap-2">
            <a href="my-properties.html" class="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">View Land Record</a>
            <button class="ldr-download-btn px-4 py-2 rounded-lg border border-outline-variant text-sm font-semibold" data-id="${r.id}">Download Details</button>
            <a href="dashboard.html" class="px-4 py-2 rounded-lg border border-outline-variant text-sm font-semibold">Back to Dashboard</a>
          </div>
        </div>` : ""}
    </div>`;
  }).join("");

  box.querySelectorAll(".ldr-details-btn").forEach((b) =>
    b.addEventListener("click", () => {
      const card = box.querySelector(`[data-ldr="${b.getAttribute("data-id")}"]`);
      const view = card ? card.querySelector(".ldr-detail-view") : null;
      if (!view) return;
      if (view.classList.contains("hidden")) {
        const r = mine.find((x) => x.id === b.getAttribute("data-id"));
        view.innerHTML = detailHtml(r);
        view.classList.remove("hidden");
        b.textContent = "Hide Details";
      } else {
        view.classList.add("hidden");
        b.textContent = "View Details";
      }
    }));
  box.querySelectorAll(".ldr-update-btn").forEach((b) =>
    b.addEventListener("click", () => {
      const card = box.querySelector(`[data-ldr="${b.getAttribute("data-id")}"]`);
      const wrap = card ? card.querySelector(".ldr-update-wrap") : null;
      if (wrap) wrap.classList.toggle("hidden");
    }));
  box.querySelectorAll(".ldr-send-btn").forEach((b) =>
    b.addEventListener("click", () => {
      const id = b.getAttribute("data-id");
      const ta = $("upd-" + CSS.escape(id));
      const text = ta ? ta.value.trim() : "";
      if (text.length < 10) {
        toast("Please describe the additional information (min 10 characters).", true);
        return;
      }
      const rec = getCitizenRequests().find((x) => x.id === id);
      if (!rec) return;
      rec.history = [...(rec.history || []), { time: stampLite(), text: `Citizen provided additional information: ${text}` }];
      rec.stage = "Under Review";
      updateCitizenRequest(id, { history: rec.history, stage: rec.stage });
      saveRequestPatch(id, { stage: "Under Review" });
      prependRequestHistory(id, { time: stampLite(), text: "Citizen submitted the requested information" });
      renderMine();
      toast("Information submitted — review resumed (demo).");
    }));
  box.querySelectorAll(".ldr-download-btn").forEach((b) =>
    b.addEventListener("click", () => downloadDetails(b.getAttribute("data-id"))));
}

function detailHtml(r) {
  if (!r) return "";
  const c = r.clues || {};
  const row = (l, v) => `<div><dt class="text-label-sm font-semibold text-on-surface-variant">${l}</dt><dd class="font-medium">${v || "—"}</dd></div>`;
  return `<dl class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
    ${row("POSSIBLE OWNER", c.ownerName)}${row("DISTRICT", c.district)}${row("VILLAGE", c.village)}
    ${row("LAND TYPE", c.landType)}${row("SUBMITTED", r.submitted)}${row("DEPARTMENT", r.department)}</dl>`;
}

function downloadDetails(id) {
  const rec = getCitizenRequests().find((x) => x.id === id);
  if (!rec) return;
  const d = rec.discovered || {};
  const lines = [
    "BHARAT BHUMI - LAND DISCOVERY RESULT (DEMO)", "==========================================",
    `Request: ${rec.id}`, `Stage: ${rec.stage}`,
    `ULPIN: ${d.ulpin || "—"}`, `Survey No: ${d.survey || "—"}`, `Recorded Owner: ${d.owner || "—"}`,
    `Area: ${d.area || "—"}`, `Village: ${d.village || "—"}`, `District: ${d.district || "—"}`,
    `Classification: ${d.classification || "—"}`, `Confidence: ${d.confidence || "—"}`,
    "", "Possible match — ownership confirmed only by authority verification."
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${id}_details.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast("Details downloaded (demo).");
}

function stampLite() {
  return new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" });
}

function setupSession() {
  const user = getCurrentUser() || {};
  const name = user.username || "Citizen";
  const role = user.role || "USER";
  if ($("top-nav-username")) $("top-nav-username").textContent = name;
  if ($("top-nav-role-badge")) $("top-nav-role-badge").textContent = role;
  const doLogout = () => logout("login.html");
  if ($("btn-topnav-logout")) $("btn-topnav-logout").addEventListener("click", doLogout);
  if ($("btn-sidebar-logout")) $("btn-sidebar-logout").addEventListener("click", doLogout);
}

function init() {
  if (!requirePortal("citizen")) {
    return;
  }
  setupSession();
  prefillApplicant();
  renderStepper();
  renderMine();

  const go = (from, to, pre) => {
    const btn = $(`btn-next-${from}`);
    if (btn) btn.addEventListener("click", () => {
      if (pre && pre() === false) return;
      if (to === 4 && $("review-body")) $("review-body").innerHTML = reviewHtml();
      showStep(to);
    });
  };
  go(1, 2, readStep1);
  go(2, 3, readStep2);
  go(3, 4, readStep3);
  for (let i = 2; i <= 4; i++) {
    const back = $(`btn-back-${i}`);
    if (back) back.addEventListener("click", () => showStep(i - 1));
  }
  if ($("btn-submit")) $("btn-submit").addEventListener("click", submitRequest);
  if ($("btn-track")) $("btn-track").addEventListener("click", () => {
    const el = $("my-requests-section");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  });
  if ($("btn-dash")) $("btn-dash").addEventListener("click", () => {
    window.location.href = "dashboard.html";
  });
}

document.addEventListener("DOMContentLoaded", init);

export { readStep1, submitRequest };
