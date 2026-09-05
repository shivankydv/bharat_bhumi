import { isAuthenticated, getCurrentUser, logout, requirePortal } from "./services/auth-service.js";

/* Demo wizard (no application-submission API exists in backend — do not invent endpoints). */
const SERVICES = [
  { id: "mutation", name: "Property Mutation", desc: "Transfer ownership after sale, gift, inheritance or partition.", fee: 2500, icon: "swap_horiz", prefix: "MUT", docs: ["Sale Deed / Gift Deed", "Identity Proof (Aadhaar)", "Previous RoR / Khata"] },
  { id: "ror", name: "Record of Rights (RoR)", desc: "Certified copy of the Record of Rights for your parcel.", fee: 150, icon: "description", prefix: "ROR", docs: ["Identity Proof (Aadhaar)", "Property Tax Receipt"] },
  { id: "ec", name: "Encumbrance Certificate", desc: "Certificate of charges, mortgages and liabilities on the property.", fee: 350, icon: "verified_user", prefix: "EC", docs: ["Sale Deed", "Identity Proof (Aadhaar)"] },
  { id: "tax", name: "Property Tax Assessment", desc: "New assessment or reassessment of property tax.", fee: 200, icon: "receipt_long", prefix: "PTX", docs: ["Identity Proof (Aadhaar)", "Property Tax Receipt", "Address Proof"] }
];

const STEP_LABELS = ["Select Service", "Property Details", "Applicant Details", "Upload Documents", "Review & Submit"];

const state = {
  step: 1,
  service: null,
  property: { ulpin: "", type: "", state: "", district: "", address: "", area: "" },
  applicant: { name: "", mobile: "", email: "" },
  docs: {},
  submitted: null
};

const $ = (id) => document.getElementById(id);
const fmt = (n) => "₹ " + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function toast(msg) {
  const el = $("app-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 2600);
}

function serviceById(id) {
  return SERVICES.find((s) => s.id === id) || null;
}

/* ---------- Stepper ---------- */
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
  for (let i = 1; i <= 5; i++) {
    const el = $("step-" + i);
    if (el) el.classList.toggle("hidden", i !== n);
  }
  const success = $("success-screen");
  if (success) success.classList.add("hidden");
  const form = $("wizard-form");
  if (form) form.classList.remove("hidden");
  renderStepper();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- Step 1: services ---------- */
function renderServices() {
  const grid = $("service-grid");
  if (!grid) return;
  grid.innerHTML = SERVICES.map((s) => `
    <button type="button" data-service="${s.id}"
      class="service-card text-left rounded-xl border p-5 transition hover:shadow-md ${state.service === s.id ? "border-primary bg-primary-fixed/20 shadow-md" : "border-outline-variant/60 bg-white"}">
      <div class="flex items-start gap-3">
        <div class="w-11 h-11 rounded-lg ${state.service === s.id ? "bg-primary text-white" : "bg-primary-fixed/30 text-primary"} flex items-center justify-center flex-shrink-0">
          <span class="material-symbols-outlined">${s.icon}</span>
        </div>
        <div class="flex-1">
          <h3 class="font-bold text-on-surface">${s.name}</h3>
          <p class="text-sm text-secondary mt-1">${s.desc}</p>
          <p class="mt-2 text-sm font-bold text-primary">Fee: ${fmt(s.fee)} <span class="font-normal text-secondary">(payable later on Payments page)</span></p>
        </div>
        <span class="material-symbols-outlined ${state.service === s.id ? "text-primary" : "text-outline-variant"}">${state.service === s.id ? "check_circle" : "radio_button_unchecked"}</span>
      </div>
    </button>`).join("");
  grid.querySelectorAll(".service-card").forEach((b) =>
    b.addEventListener("click", () => {
      state.service = b.getAttribute("data-service");
      state.docs = {};
      renderServices();
      hideErr("service-error");
    }));
}

/* ---------- Validation helpers ---------- */
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
function hideErr(id) {
  setErr(id, "");
}
function markInvalid(input, invalid) {
  if (!input) return;
  input.classList.toggle("border-error", invalid);
  input.classList.toggle("ring-1", invalid);
  input.classList.toggle("ring-error", invalid);
}

function validateStep2() {
  const p = state.property;
  p.ulpin = $("prop-ulpin").value.trim();
  p.type = $("prop-type").value;
  p.state = $("prop-state").value.trim();
  p.district = $("prop-district").value.trim();
  p.address = $("prop-address").value.trim();
  p.area = $("prop-area").value.trim();
  let ok = true;
  const req = [
    ["prop-ulpin", "err-ulpin", p.ulpin.length >= 6 ? "" : "Enter a valid ULPIN / Property ID (min 6 characters)."],
    ["prop-type", "err-type", p.type ? "" : "Select the property type."],
    ["prop-state", "err-state", p.state ? "" : "Enter the state."],
    ["prop-district", "err-district", p.district ? "" : "Enter the district."],
    ["prop-address", "err-address", p.address ? "" : "Enter the property address."],
    ["prop-area", "err-area", p.area && Number(p.area) > 0 ? "" : "Enter a valid area greater than 0."]
  ];
  req.forEach(([inputId, errId, msg]) => {
    setErr(errId, msg);
    markInvalid($(inputId), Boolean(msg));
    if (msg) ok = false;
  });
  return ok;
}

function validateStep3() {
  const a = state.applicant;
  a.name = $("app-name").value.trim();
  a.mobile = $("app-mobile").value.trim();
  a.email = $("app-email").value.trim();
  let ok = true;
  const req = [
    ["app-name", "err-name", a.name ? "" : "Enter the applicant's full name."],
    ["app-mobile", "err-mobile", /^[6-9]\d{9}$/.test(a.mobile) ? "" : "Enter a valid 10-digit mobile number."],
    ["app-email", "err-email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email) ? "" : "Enter a valid email address."]
  ];
  req.forEach(([inputId, errId, msg]) => {
    setErr(errId, msg);
    markInvalid($(inputId), Boolean(msg));
    if (msg) ok = false;
  });
  return ok;
}

/* ---------- Step 4: documents ---------- */
function renderDocs() {
  const svc = serviceById(state.service);
  const box = $("docs-list");
  if (!box || !svc) return;
  box.innerHTML = svc.docs.map((name, i) => {
    const attached = state.docs[name];
    return `
    <div class="flex items-center gap-3 p-4 rounded-lg border ${attached ? "border-green-300 bg-green-50/50" : "border-outline-variant/60 bg-white"}">
      <span class="material-symbols-outlined ${attached ? "text-green-700" : "text-secondary"}">${attached ? "check_circle" : "upload_file"}</span>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-on-surface text-sm">${name} <span class="text-error text-xs">*required</span></p>
        <p class="text-xs ${attached ? "text-green-700 font-medium" : "text-secondary"} truncate">${attached || "Not attached yet"}</p>
      </div>
      <label class="px-3 py-2 rounded-md border border-outline-variant text-sm font-semibold text-primary cursor-pointer hover:bg-surface-container-low transition whitespace-nowrap">
        ${attached ? "Replace" : "Choose file"}
        <input type="file" class="hidden doc-input" data-doc="${name}" accept=".pdf,.jpg,.jpeg,.png">
      </label>
    </div>`;
  }).join("") + `
    <p class="text-xs text-secondary">Accepted formats: PDF, JPG, PNG. Files stay in your browser for this demo.</p>`;
  box.querySelectorAll(".doc-input").forEach((input) =>
    input.addEventListener("change", () => {
      const f = input.files && input.files[0];
      if (f) {
        state.docs[input.getAttribute("data-doc")] = `${f.name}`;
        renderDocs();
      }
    }));
}

function validateStep4() {
  const svc = serviceById(state.service);
  if (!svc) return false;
  const missing = svc.docs.filter((d) => !state.docs[d]);
  setErr("docs-error", missing.length ? `Please attach the required documents: ${missing.join(", ")}.` : "");
  if (missing.length) {
    toast("Attach all required documents to continue");
    return false;
  }
  return true;
}

/* ---------- Step 5: review & submit ---------- */
function renderReview() {
  const svc = serviceById(state.service);
  const p = state.property;
  const a = state.applicant;
  if (!svc) return;
  if ($("review-service")) $("review-service").textContent = svc.name;
  if ($("review-fee")) $("review-fee").innerHTML = `${fmt(svc.fee)} <span class="font-normal text-secondary text-sm">(payable later — <a href="payments.html" class="text-primary underline">Payments page</a>)</span>`;
  if ($("review-ulpin")) $("review-ulpin").textContent = p.ulpin;
  if ($("review-type")) $("review-type").textContent = p.type;
  if ($("review-location")) $("review-location").textContent = `${p.district}, ${p.state}`;
  if ($("review-address")) $("review-address").textContent = p.address;
  if ($("review-area")) $("review-area").textContent = `${p.area} sq.m.`;
  if ($("review-name")) $("review-name").textContent = a.name;
  if ($("review-mobile")) $("review-mobile").textContent = `+91 ${a.mobile}`;
  if ($("review-email")) $("review-email").textContent = a.email;
  if ($("review-docs")) $("review-docs").innerHTML = svc.docs.map((d) =>
    `<li class="flex items-center gap-2 text-sm"><span class="material-symbols-outlined text-[18px] text-green-700">check_circle</span><span class="font-medium text-on-surface">${d}</span><span class="text-secondary truncate">— ${state.docs[d] || ""}</span></li>`).join("");
}

function submitApplication() {
  const svc = serviceById(state.service);
  if (!svc) return;
  setErr("submit-error", "");
  const btn = $("btn-submit");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined animate-spin">progress_activity</span> Submitting…`;
  }
  setTimeout(() => {
    const seq = Math.floor(1000 + Math.random() * 9000);
    const appId = `${svc.prefix}-2026-${seq}A`;
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    state.submitted = { id: appId, date: today, service: svc.name, ulpin: state.property.ulpin, status: "Submitted" };
    try {
      const prev = JSON.parse(localStorage.getItem("bb_applications") || "[]");
      prev.unshift({
        ...state.submitted,
        fee: svc.fee,
        iso: new Date().toISOString().slice(0, 10),
        username: (getCurrentUser() || {}).username || "",
        applicant: { ...state.applicant },
        docs: svc.docs.map((name) => ({ name, file: state.docs[name] || null }))
      });
      localStorage.setItem("bb_applications", JSON.stringify(prev));
    } catch (e) {
      console.warn("[New Application] Failed to persist submission:", e);
    }
    if ($("success-appid")) $("success-appid").textContent = appId;
    if ($("success-date")) $("success-date").textContent = today;
    if ($("success-service")) $("success-service").textContent = svc.name;
    if ($("success-ulpin")) $("success-ulpin").textContent = state.property.ulpin;
    if ($("wizard-form")) $("wizard-form").classList.add("hidden");
    const s = $("success-screen");
    if (s) s.classList.remove("hidden");
    renderStepperDone();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, 1200);
}

function renderStepperDone() {
  const box = $("stepper");
  if (!box) return;
  box.innerHTML = STEP_LABELS.map((label) =>
    `<div class="flex items-center flex-1">
      <div class="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0"><span class="material-symbols-outlined">check</span></div>
      <span class="ml-2 text-sm font-semibold hidden sm:block text-on-surface">${label}</span>
      <div class="flex-1 h-0.5 mx-2 rounded bg-primary"></div>
    </div>`).join("");
}

function setupSession() {
  const user = getCurrentUser() || {};
  const name = user.username || "";
  if ($("top-nav-username")) $("top-nav-username").textContent = name || "Citizen";
  if ($("top-nav-role-badge")) $("top-nav-role-badge").textContent = user.role || "USER";
  // Sidebar portal header stays static: "Citizen Portal" / "USER • Verified Profile".
  if ($("app-name") && name && !$("app-name").value) $("app-name").value = name;
  const doLogout = () => logout("login.html");
  if ($("btn-topnav-logout")) $("btn-topnav-logout").addEventListener("click", doLogout);
  if ($("btn-sidebar-logout")) $("btn-sidebar-logout").addEventListener("click", doLogout);
}

// Preselects the wizard service from a safe ?service=<id> query parameter
// (used by the Services catalogue). Unknown values are ignored.
function applyServiceParam() {
  try {
    const id = new URLSearchParams(window.location.search).get("service");
    if (id && serviceById(id)) {
      state.service = id;
      state.docs = {};
    }
  } catch {
    /* ignore malformed URLs */
  }
}

function init() {
  if (!requirePortal("citizen")) {
    return;
  }
  setupSession();
  applyServiceParam();
  renderServices();
  renderStepper();
  const go = (from, to, validator) => {
    const btn = $(`btn-next-${from}`);
    if (btn) btn.addEventListener("click", () => {
      if (validator && !validator()) {
        toast("Please fix the highlighted errors");
        return;
      }
      if (to === 4) renderDocs();
      if (to === 5) renderReview();
      showStep(to);
    });
  };
  go(1, 2, () => {
    if (!state.service) {
      setErr("service-error", "Please select a service to continue.");
      toast("Select a service to continue");
      return false;
    }
    return true;
  });
  go(2, 3, validateStep2);
  go(3, 4, validateStep3);
  go(4, 5, validateStep4);
  for (let i = 2; i <= 5; i++) {
    const back = $(`btn-back-${i}`);
    if (back) back.addEventListener("click", () => showStep(i - 1));
  }
  if ($("btn-submit")) $("btn-submit").addEventListener("click", submitApplication);
  if ($("btn-track")) $("btn-track").addEventListener("click", () => { window.location.href = "application-tracker.html"; });
  if ($("btn-dash")) $("btn-dash").addEventListener("click", () => { window.location.href = "dashboard.html"; });
}

document.addEventListener("DOMContentLoaded", init);
