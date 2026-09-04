import { isAuthenticated, getCurrentUser, logout } from "./services/auth-service.js";
import { SERVICES } from "./services.js";

/* Frontend demo help content (no help/ticket API exists in backend — do not invent endpoints). */
const FAQS = [
  { cat: "Account", q: "How do I log in?", a: "Open the Login page, enter your registered username and password, and submit. Your session stays active in this browser until you log out." },
  { cat: "Account", q: "How do I update my profile?", a: "Open Settings, then Profile & Account, and click Edit Profile. Update your name, email or mobile number and save. Changes apply immediately in this demo." },
  { cat: "Account", q: "What should I do if I forget my password?", a: "On the Login page choose the password help option, or contact support. Never share passwords or OTPs with anyone claiming to be an officer." },
  { cat: "Properties", q: "How can I view my registered properties?", a: "Open My Properties from the sidebar. Use search and the status/type filters, then click View on any record for full details." },
  { cat: "Properties", q: "What is a ULPIN?", a: "ULPIN (Unique Land Parcel Identification Number) is the unique ID assigned to every recorded land parcel, e.g. ULP-892-441-A. Quote it in every application and payment." },
  { cat: "Properties", q: "How can I verify my property details?", a: "Compare the record on My Properties with your deed and RoR. Area, type and location must match. Raise a grievance if anything differs." },
  { cat: "Applications", q: "How do I apply for a land service?", a: "Open Services, pick a service, review requirements and click Apply Now. The New Application wizard walks you through five steps to submission." },
  { cat: "Applications", q: "How can I track my application?", a: "Open Applications (Application Tracker) and follow the progress timeline from submission to completion." },
  { cat: "Applications", q: "What do the different application statuses mean?", a: "See the Application Status Guide below: Submitted means received; Under Review means an officer is examining it; Documents Required or Payment Pending need action from you; Approved and Completed are final stages." },
  { cat: "Applications", q: "How long does an application take?", a: "Most services complete in 5–30 working days depending on the service. Mutation takes 15–30 working days; RoR copies take 5–7. The tracker shows your expected completion date." },
  { cat: "Documents", q: "Which documents are required for Property Mutation?", a: "Sale Deed, Aadhaar / Identity Proof, existing RoR and Property Tax Receipt. The full list appears in the service details and in the New Application wizard." },
  { cat: "Documents", q: "How do I upload a document?", a: "Open Documents and click Upload Document. Choose the file (PDF/JPG/PNG), select the document type and the Application ID or ULPIN, then submit. It enters verification as Pending." },
  { cat: "Documents", q: "Why is my document showing as Pending or Rejected?", a: "Pending means a nodal officer has not reviewed it yet. Rejected means it was unclear, expired or mismatched — read the reason, correct the file and re-upload." },
  { cat: "Payments", q: "How can I pay an application fee?", a: "Open Payments, find the Payment Due card, click Pay Now, choose UPI, Card or Net Banking, and confirm. No money moves in this demo." },
  { cat: "Payments", q: "How can I download my payment receipt?", a: "In Payments, click Receipt on any transaction, then Download Receipt. Receipts carry the transaction ID, challan details and status." },
  { cat: "Payments", q: "What should I do if payment was deducted but the status is pending?", a: "Wait 24 hours for gateway settlement, then check Payments again. If still pending, file a grievance with the transaction ID — never pay twice for the same due." },
  { cat: "GIS", q: "How do I search for a property on the map?", a: "Open GIS Explorer and type the ULPIN, owner name or locality in Search & Filters. Matching parcels list below the filters." },
  { cat: "GIS", q: "How do I view parcel details?", a: "Click a parcel boundary on the map or a result in the parcel list. The Parcel Details panel shows ownership, area, class and tax status." },
  { cat: "GIS", q: "What do the map markers mean?", a: "Navy markers are property locations; the green centre dot means a verified record and saffron means under review. Use the + / − buttons or satellite toggle on the right." }
];

const GUIDES = [
  {
    id: "guide-apply", title: "Apply for a Service", icon: "edit_document",
    steps: ["Open Services", "Select the required service", "Review requirements", "Start New Application", "Enter property/applicant details", "Upload required documents", "Review and submit", "Complete payment if required", "Track the application"]
  },
  {
    id: "guide-track", title: "Track an Application", icon: "track_changes",
    steps: ["Open Applications", "Select the application", "View current status and the progress timeline"]
  },
  {
    id: "guide-props", title: "Manage Properties", icon: "domain",
    steps: ["Open My Properties", "Search or filter by status and type", "Click View for full property details"]
  },
  {
    id: "guide-docs", title: "Upload Documents", icon: "upload_file",
    steps: ["Open Documents", "Select the application or property reference", "Upload the document file", "Check the verification status"]
  },
  {
    id: "guide-pay", title: "Make a Payment", icon: "payments",
    steps: ["Open Payments", "Select the pending payment", "Choose UPI, Card or Net Banking", "Confirm the payment", "Download the receipt"]
  },
  {
    id: "guide-gis", title: "Use GIS Explorer", icon: "map",
    steps: ["Search by ULPIN or property", "Select the parcel on the map or list", "View parcel details", "Open the linked property information"]
  }
];

const STATUSES = [
  { name: "Draft", cls: "status-neutral", action: "Complete all steps of the application and submit it. Drafts are not processed." },
  { name: "Submitted", cls: "status-pending", action: "Your request is received. Wait for document verification to begin." },
  { name: "Under Review", cls: "status-pending", action: "An officer is examining the request. No action needed unless contacted." },
  { name: "Documents Required", cls: "status-pending", action: "Upload the missing documents from the Documents page promptly." },
  { name: "Payment Pending", cls: "status-pending", action: "Clear the due from the Payments page to resume processing." },
  { name: "Approved", cls: "status-verified", action: "Approved by the competent officer. The certificate is being issued." },
  { name: "Rejected", cls: "status-rejected", action: "Read the rejection reason, correct the issue and submit a fresh application." },
  { name: "Completed", cls: "status-verified", action: "Certificate issued and registry updated. Download your records." }
];

const SERVICE_HELP_IDS = ["mutation", "ror-view", "ec", "tax", "dispute"];

const $ = (id) => document.getElementById(id);

function toast(msg, isError) {
  const el = $("help-toast");
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

function fmtFee(fee) {
  if (fee === null) return "Fee varies";
  if (fee === 0) return "Free";
  return "₹ " + Number(fee).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ---------- FAQs ---------- */
let faqFilter = "all";

function renderFaqs() {
  const box = $("faq-list");
  if (!box) return;
  const cats = ["all", ...new Set(FAQS.map((f) => f.cat))];
  const chips = $("faq-chips");
  if (chips) {
    chips.innerHTML = cats.map((c) =>
      `<button data-faqcat="${c}" class="px-3 py-1.5 rounded-full text-sm font-semibold border transition ${faqFilter === c ? "bg-primary text-white border-primary" : "border-outline-variant text-on-surface-variant hover:bg-surface-container-high"}">${c === "all" ? "All" : c}</button>`).join("");
    chips.querySelectorAll("[data-faqcat]").forEach((b) =>
      b.addEventListener("click", () => { faqFilter = b.getAttribute("data-faqcat"); renderFaqs(); }));
  }
  const list = FAQS.map((f, i) => ({ ...f, idx: i })).filter((f) => faqFilter === "all" || f.cat === faqFilter);
  box.innerHTML = list.map((f) => `
    <div class="faq-item rounded-lg border border-outline-variant/50 bg-white" data-faq="${f.idx}">
      <button class="faq-q w-full flex items-center justify-between gap-3 px-4 py-3 text-left" data-faqbtn="${f.idx}">
        <span><span class="block text-xs font-semibold text-secondary">${f.cat}</span>
        <span class="block font-semibold text-on-surface text-sm mt-0.5">${f.q}</span></span>
        <span class="material-symbols-outlined faq-chev text-on-surface-variant transition-transform">expand_more</span>
      </button>
      <div class="faq-a hidden px-4 pb-4 text-sm text-secondary" data-faqans="${f.idx}">${f.a}</div>
    </div>`).join("");
  box.querySelectorAll("[data-faqbtn]").forEach((b) =>
    b.addEventListener("click", () => toggleFaq(Number(b.getAttribute("data-faqbtn")))));
}

function toggleFaq(idx, open) {
  const ans = document.querySelector(`[data-faqans="${idx}"]`);
  const item = document.querySelector(`[data-faq="${idx}"]`);
  if (!ans) return;
  const show = open !== undefined ? open : ans.classList.contains("hidden");
  ans.classList.toggle("hidden", !show);
  const chev = item ? item.querySelector(".faq-chev") : null;
  if (chev) chev.style.transform = show ? "rotate(180deg)" : "";
}

/* ---------- Guides ---------- */
function renderGuides() {
  const box = $("guides-grid");
  if (!box) return;
  box.innerHTML = GUIDES.map((g) => `
    <article id="${g.id}" class="bg-white rounded-xl border border-outline-variant/40 shadow-sm p-5">
      <div class="flex items-center gap-3 mb-3">
        <span class="w-10 h-10 rounded-lg bg-primary-fixed/30 text-primary flex items-center justify-center">
          <span class="material-symbols-outlined">${g.icon}</span>
        </span>
        <h3 class="font-bold text-on-surface">${g.title}</h3>
      </div>
      <ol class="flex flex-col gap-2">
        ${g.steps.map((s, i) => `
          <li class="flex gap-3 text-sm">
            <span class="w-6 h-6 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">${i + 1}</span>
            <span class="text-on-surface-variant pt-0.5">${s}</span>
          </li>`).join("")}
      </ol>
    </article>`).join("");
}

/* ---------- Service help (reuses Services catalogue) ---------- */
function renderServiceHelp() {
  const box = $("service-help-grid");
  if (!box) return;
  box.innerHTML = SERVICE_HELP_IDS.map((id) => {
    const s = SERVICES.find((x) => x.id === id);
    if (!s) return "";
    return `
    <article class="bg-white rounded-xl border border-outline-variant/40 shadow-sm p-5 flex flex-col gap-2">
      <div class="flex items-center gap-3">
        <span class="w-10 h-10 rounded-lg bg-primary-fixed/30 text-primary flex items-center justify-center">
          <span class="material-symbols-outlined">${s.icon}</span>
        </span>
        <h3 class="font-bold text-on-surface">${s.name}</h3>
      </div>
      <p class="text-sm text-secondary">${s.desc}</p>
      <p class="text-sm"><span class="font-semibold">Who can apply:</span> <span class="text-secondary">${s.who}</span></p>
      <p class="text-sm"><span class="font-semibold">Documents:</span> <span class="text-secondary">${s.docs.join(", ") || "None"}</span></p>
      <p class="text-sm text-secondary">${s.time} • ${fmtFee(s.fee)}</p>
      <a href="services.html" class="mt-auto inline-flex items-center gap-1 text-primary text-sm font-semibold hover:underline">View Service<span class="material-symbols-outlined text-[18px]">arrow_forward</span></a>
    </article>`;
  }).join("");
}

/* ---------- Status guide ---------- */
function renderStatuses() {
  const box = $("status-grid");
  if (!box) return;
  box.innerHTML = STATUSES.map((s) => `
    <div class="bg-white rounded-xl border border-outline-variant/40 shadow-sm p-4">
      <span class="status-badge ${s.cls}">${s.name}</span>
      <p class="text-sm text-secondary mt-2">${s.action}</p>
    </div>`).join("");
}

/* ---------- Search ---------- */
function runSearch() {
  const q = (($("help-search") || {}).value || "").trim().toLowerCase();
  const panel = $("search-results");
  if (!panel) return;
  if (!q) {
    panel.classList.add("hidden");
    panel.innerHTML = "";
    return;
  }
  const faqs = FAQS.map((f, i) => ({ ...f, idx: i }))
    .filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q) || f.cat.toLowerCase().includes(q)).slice(0, 5);
  const guides = GUIDES.filter((g) =>
    g.title.toLowerCase().includes(q) || g.steps.join(" ").toLowerCase().includes(q)).slice(0, 3);
  const svcs = SERVICES.filter((s) =>
    s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || s.category.toLowerCase().includes(q)).slice(0, 4);
  if (!faqs.length && !guides.length && !svcs.length) {
    panel.classList.remove("hidden");
    panel.innerHTML = `<div class="bg-white rounded-xl border border-outline-variant/40 p-6 text-center">
      <p class="font-bold text-on-surface">No results found. Try different keywords or contact support.</p></div>`;
    return;
  }
  panel.classList.remove("hidden");
  panel.innerHTML = `
    <div class="bg-white rounded-xl border border-outline-variant/40 p-5 flex flex-col gap-4">
      <h3 class="font-bold text-on-surface">Results for “${$("help-search").value.trim()}”</h3>
      ${faqs.length ? `<div><p class="text-xs font-bold text-secondary mb-2">FAQs</p>
        ${faqs.map((f) => `<button class="search-faq block w-full text-left text-sm text-primary hover:underline py-1" data-idx="${f.idx}">${f.q}</button>`).join("")}</div>` : ""}
      ${guides.length ? `<div><p class="text-xs font-bold text-secondary mb-2">GUIDES</p>
        ${guides.map((g) => `<a href="#${g.id}" class="block text-sm text-primary hover:underline py-1">${g.title}</a>`).join("")}</div>` : ""}
      ${svcs.length ? `<div><p class="text-xs font-bold text-secondary mb-2">SERVICES</p>
        ${svcs.map((s) => `<a href="services.html" class="block text-sm text-primary hover:underline py-1">${s.name} — ${s.category}</a>`).join("")}</div>` : ""}
    </div>`;
  panel.querySelectorAll(".search-faq").forEach((b) =>
    b.addEventListener("click", () => {
      faqFilter = "all";
      renderFaqs();
      toggleFaq(Number(b.getAttribute("data-idx")), true);
      const item = document.querySelector(`[data-faq="${b.getAttribute("data-idx")}"]`);
      if (item) item.scrollIntoView({ behavior: "smooth", block: "center" });
    }));
}

/* ---------- Support ticket (frontend demo) ---------- */
function openSupport() {
  ["sp-name", "sp-email", "sp-app", "sp-ulpin", "sp-subject", "sp-desc"].forEach((id) => {
    const el = $(id);
    if (el) el.value = "";
  });
  if ($("sp-category")) $("sp-category").value = "Application issue";
  setErr("sp-error", "");
  if ($("support-form-view")) $("support-form-view").classList.remove("hidden");
  if ($("support-success-view")) $("support-success-view").classList.add("hidden");
  if ($("btn-submit-support")) $("btn-submit-support").classList.remove("hidden");
  if ($("support-cancel-btn")) $("support-cancel-btn").classList.remove("hidden");
  if ($("support-done-btn")) $("support-done-btn").classList.add("hidden");
  const m = $("support-modal");
  if (m) { m.classList.remove("hidden"); m.classList.add("flex"); }
}

function closeSupport() {
  const m = $("support-modal");
  if (m) { m.classList.add("hidden"); m.classList.remove("flex"); }
}

function submitSupport() {
  const name = $("sp-name").value.trim();
  const email = $("sp-email").value.trim();
  const subject = $("sp-subject").value.trim();
  const desc = $("sp-desc").value.trim();
  if (!name || !email || !subject || !desc) {
    setErr("sp-error", "Name, email, subject and description are required.");
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setErr("sp-error", "Enter a valid email address.");
    return;
  }
  if (desc.length < 20) {
    setErr("sp-error", "Please describe the issue in at least 20 characters.");
    return;
  }
  const ref = `SUP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  if ($("support-ticket-id")) $("support-ticket-id").textContent = ref;
  if ($("support-form-view")) $("support-form-view").classList.add("hidden");
  if ($("support-success-view")) $("support-success-view").classList.remove("hidden");
  if ($("btn-submit-support")) $("btn-submit-support").classList.add("hidden");
  if ($("support-cancel-btn")) $("support-cancel-btn").classList.add("hidden");
  if ($("support-done-btn")) $("support-done-btn").classList.remove("hidden");
}

/* ---------- Grievance (frontend demo) ---------- */
function submitGrievance() {
  const desc = $("gr-desc").value.trim();
  if (desc.length < 20) {
    setErr("gr-error", "Please describe the issue in at least 20 characters.");
    return;
  }
  const ref = `GRV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  try {
    const prev = JSON.parse(localStorage.getItem("bb_grievances") || "[]");
    prev.unshift({
      ref,
      category: $("gr-category").value,
      app: $("gr-app").value.trim(),
      ulpin: $("gr-ulpin").value.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    });
    localStorage.setItem("bb_grievances", JSON.stringify(prev));
  } catch (e) {
    console.warn("[Help] Failed to persist grievance:", e);
  }
  if ($("grievance-ref")) $("grievance-ref").textContent = ref;
  if ($("grievance-form-view")) $("grievance-form-view").classList.add("hidden");
  if ($("grievance-success-view")) $("grievance-success-view").classList.remove("hidden");
  renderGrievances();
}

function renderGrievances() {
  const box = $("grievance-list");
  if (!box) return;
  let list = [];
  try {
    list = JSON.parse(localStorage.getItem("bb_grievances") || "[]");
  } catch {
    list = [];
  }
  box.innerHTML = list.length
    ? list.slice(0, 5).map((g) => `
      <div class="flex items-center justify-between gap-2 py-2 border-b border-outline-variant/40 text-sm">
        <div class="min-w-0"><p class="font-mono font-bold text-primary">${g.ref}</p>
        <p class="text-xs text-secondary truncate">${g.category} • ${g.date}</p></div>
        <span class="status-badge status-pending">Submitted</span>
      </div>`).join("")
    : `<p class="text-sm text-secondary">No grievances filed yet in this demo.</p>`;
}

/* ---------- Report issue (frontend demo) ---------- */
function submitIssue() {
  const desc = $("issue-desc").value.trim();
  if (desc.length < 10) {
    setErr("issue-error", "Please describe the issue briefly (min 10 characters).");
    return;
  }
  const ref = `REP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  if ($("issue-ref")) $("issue-ref").textContent = ref;
  if ($("issue-form-view")) $("issue-form-view").classList.add("hidden");
  if ($("issue-success-view")) $("issue-success-view").classList.remove("hidden");
}

function setupSession() {
  const user = getCurrentUser() || {};
  const name = user.username || "Citizen";
  const role = user.role || "USER";
  if ($("top-nav-username")) $("top-nav-username").textContent = name;
  if ($("top-nav-role-badge")) $("top-nav-role-badge").textContent = role;
  // Sidebar portal header stays static: "Citizen Portal" / "USER • Verified Profile".
  const doLogout = () => logout("login.html");
  if ($("btn-topnav-logout")) $("btn-topnav-logout").addEventListener("click", doLogout);
  if ($("btn-sidebar-logout")) $("btn-sidebar-logout").addEventListener("click", doLogout);
}

function init() {
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return;
  }
  setupSession();
  renderFaqs();
  renderGuides();
  renderServiceHelp();
  renderStatuses();
  renderGrievances();

  if ($("help-search")) $("help-search").addEventListener("input", runSearch);

  if ($("btn-contact")) $("btn-contact").addEventListener("click", openSupport);
  if ($("btn-contact-2")) $("btn-contact-2").addEventListener("click", openSupport);
  if ($("support-close")) $("support-close").addEventListener("click", closeSupport);
  if ($("support-cancel-btn")) $("support-cancel-btn").addEventListener("click", closeSupport);
  if ($("btn-submit-support")) $("btn-submit-support").addEventListener("click", submitSupport);
  if ($("support-done-btn")) $("support-done-btn").addEventListener("click", closeSupport);
  const sm = $("support-modal");
  if (sm) sm.addEventListener("click", (e) => { if (e.target === sm) closeSupport(); });

  if ($("btn-submit-grievance")) $("btn-submit-grievance").addEventListener("click", submitGrievance);
  if ($("btn-track-grievance")) $("btn-track-grievance").addEventListener("click", () => {
    renderGrievances();
    toast("Showing your grievance references below (demo).");
  });
  if ($("btn-new-grievance")) $("btn-new-grievance").addEventListener("click", () => {
    if ($("grievance-form-view")) $("grievance-form-view").classList.remove("hidden");
    if ($("grievance-success-view")) $("grievance-success-view").classList.add("hidden");
  });

  if ($("btn-submit-issue")) $("btn-submit-issue").addEventListener("click", submitIssue);
  if ($("btn-new-issue")) $("btn-new-issue").addEventListener("click", () => {
    if ($("issue-form-view")) $("issue-form-view").classList.remove("hidden");
    if ($("issue-success-view")) $("issue-success-view").classList.add("hidden");
  });
}

document.addEventListener("DOMContentLoaded", init);

export { FAQS, GUIDES, STATUSES, runSearch, toggleFaq, submitSupport, submitGrievance, submitIssue };
