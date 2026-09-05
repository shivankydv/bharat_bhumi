import { isAuthenticated, getCurrentUser, logout, requirePortal } from "./services/auth-service.js";

/* Frontend demo catalogue (no services API exists in backend — do not invent endpoints). */
const SERVICES = [
  // ---- Land Records ----
  {
    id: "ror-view", name: "Record of Rights (RoR)", category: "Land Records",
    desc: "Get a certified copy of the Record of Rights for your land parcel.",
    time: "5–7 working days", timeDays: 7, fee: 150, icon: "description",
    availability: "Online",
    docs: ["Identity Proof (Aadhaar)", "Property Tax Receipt"],
    who: "Landowners and co-owners recorded in the revenue register.",
    steps: ["Select this service and enter the ULPIN", "Upload identity and tax documents", "Pay the government fee", "Download the certified RoR"],
    notes: ["The RoR is valid as a certified revenue record for legal purposes."],
    apply: { kind: "wizard", service: "ror", label: "Apply Now" }
  },
  {
    id: "view-record", name: "View Land Record", category: "Land Records",
    desc: "View ownership, area and classification details of any recorded parcel.",
    time: "Instant", timeDays: 0, fee: 0, icon: "visibility",
    availability: "Online",
    docs: [],
    who: "Any citizen with the ULPIN or property details.",
    steps: ["Open My Properties", "Search by ULPIN, location or type", "Open the property record"],
    notes: ["Viewing your own records is free."],
    apply: { kind: "link", href: "my-properties.html", label: "Open" }
  },
  {
    id: "download-record", name: "Download Land Record", category: "Land Records",
    desc: "Download digitally signed copies of your land documents.",
    time: "Instant", timeDays: 0, fee: 50, icon: "download",
    availability: "Online",
    docs: ["Identity Proof (Aadhaar)"],
    who: "Verified account holders.",
    steps: ["Open the Documents page", "Find the verified document", "Download the signed copy"],
    notes: ["Downloads are logged against your account."],
    apply: { kind: "link", href: "documents.html", label: "Open" }
  },
  {
    id: "certified-record", name: "Certified Land Record", category: "Land Records",
    desc: "Request a Tehsil-attested certified copy for court or loan use.",
    time: "7–15 working days", timeDays: 10, fee: 200, icon: "verified",
    availability: "Office",
    docs: ["Identity Proof (Aadhaar)", "Application Form", "Existing RoR"],
    who: "Landowners and authorised representatives.",
    steps: ["Submit the request at the Tehsil office", "Verification by the nodal officer", "Collect the attested copy"],
    notes: ["Attestation requires an in-person visit to the Tehsil office."],
    apply: null
  },
  // ---- Property Services ----
  {
    id: "mutation", name: "Property Mutation", category: "Property Services",
    desc: "Update ownership details after sale, inheritance or transfer.",
    time: "15–30 working days", timeDays: 21, fee: 2500, icon: "swap_horiz",
    availability: "Online",
    docs: ["Sale Deed", "Aadhaar / Identity Proof", "Existing RoR", "Property Tax Receipt"],
    who: "Buyers, legal heirs and donees of agricultural and non-agricultural land.",
    steps: ["Start a New Application and select Mutation", "Enter property and applicant details", "Upload the required documents", "Track the application to approval"],
    notes: ["Payment can be completed from Payments after submitting the application."],
    apply: { kind: "wizard", service: "mutation", label: "Apply Now" }
  },
  {
    id: "registration", name: "Property Registration", category: "Property Services",
    desc: "Register sale, gift and partition deeds with the Sub-Registrar.",
    time: "7–15 working days", timeDays: 10, fee: null, icon: "app_registration",
    availability: "Office",
    docs: ["Sale / Gift Deed", "Identity Proof of parties", "Existing RoR", "No-Objection Certificate"],
    who: "Buyers, sellers and their authorised agents.",
    steps: ["Book a slot at the Sub-Registrar office", "Present originals with witnesses", "Pay stamp duty and registration fee", "Collect the registered deed"],
    notes: ["Stamp duty varies by state slab and deed value."],
    apply: null
  },
  {
    id: "ownership", name: "Property Ownership Details", category: "Property Services",
    desc: "Check current and historical ownership of a property.",
    time: "Instant", timeDays: 0, fee: 100, icon: "person_search",
    availability: "Online",
    docs: ["Identity Proof (Aadhaar)"],
    who: "Any citizen verifying a property before a transaction.",
    steps: ["Open My Properties or GIS Explorer", "Search the ULPIN", "Review the ownership panel"],
    notes: ["Useful before purchase or loan processing."],
    apply: { kind: "link", href: "my-properties.html", label: "Open" }
  },
  {
    id: "tax", name: "Property Tax Services", category: "Property Services",
    desc: "New tax assessment, reassessment and payment of property tax.",
    time: "5–7 working days", timeDays: 7, fee: 200, icon: "receipt_long",
    availability: "Online",
    docs: ["Identity Proof (Aadhaar)", "Property Tax Receipt", "Address Proof"],
    who: "Property owners and occupiers liable for municipal tax.",
    steps: ["Apply for assessment online", "Department verifies measurements", "Pay the assessed tax from Payments"],
    notes: ["Payment can be completed from Payments after submitting the application."],
    apply: { kind: "wizard", service: "tax", label: "Apply Now" }
  },
  // ---- Certificates & Documents ----
  {
    id: "ec", name: "Encumbrance Certificate", category: "Certificates & Documents",
    desc: "Certificate of mortgages, charges and liabilities on a property.",
    time: "10–15 working days", timeDays: 12, fee: 350, icon: "verified_user",
    availability: "Online",
    docs: ["Sale Deed", "Aadhaar / Identity Proof", "Existing RoR"],
    who: "Buyers, banks and financial institutions.",
    steps: ["Start a New Application and select Encumbrance Certificate", "Enter the ULPIN and search period", "Upload documents and submit"],
    notes: ["Payment can be completed from Payments after submitting the application."],
    apply: { kind: "wizard", service: "ec", label: "Apply Now" }
  },
  {
    id: "land-cert", name: "Land/Property Certificate", category: "Certificates & Documents",
    desc: "Official holding certificate for domicile, loan and scheme use.",
    time: "7 working days", timeDays: 7, fee: 150, icon: "workspace_premium",
    availability: "Office",
    docs: ["Identity Proof (Aadhaar)", "Existing RoR", "Address Proof"],
    who: "Landholders applying for schemes, loans or admissions.",
    steps: ["Apply at the Tehsil office with documents", "Field verification if required", "Collect the certificate"],
    notes: ["Certificates carry a verifiable serial number."],
    apply: null
  },
  {
    id: "certified-copy", name: "Certified Copy of Record", category: "Certificates & Documents",
    desc: "Attested photocopies of registered deeds and revenue papers.",
    time: "7 working days", timeDays: 7, fee: 200, icon: "file_copy",
    availability: "Online",
    docs: ["Identity Proof (Aadhaar)", "Record reference number"],
    who: "Parties to a deed and their legal representatives.",
    steps: ["Open the Documents page", "Select the verified record", "Request and download the certified copy"],
    notes: ["Each copy is stamped with issue date and serial."],
    apply: { kind: "link", href: "documents.html", label: "Open" }
  },
  {
    id: "doc-verify", name: "Document Verification", category: "Certificates & Documents",
    desc: "Get uploaded sale deeds and identity proofs verified by the nodal officer.",
    time: "3–5 working days", timeDays: 4, fee: 0, icon: "fact_check",
    availability: "Online",
    docs: ["Document to be verified"],
    who: "Any applicant with pending documents.",
    steps: ["Upload the document from the Documents page", "Nodal officer verifies the record", "Status updates to Verified or Rejected with reasons"],
    notes: ["Rejected documents can be corrected and re-uploaded."],
    apply: { kind: "link", href: "documents.html", label: "Open" }
  },
  // ---- Applications & Disputes ----
  {
    id: "dispute", name: "File Land Dispute", category: "Applications & Disputes",
    desc: "Raise boundary, ownership or possession disputes for revenue adjudication.",
    time: "30–60 working days", timeDays: 45, fee: 500, icon: "gavel",
    availability: "Online",
    docs: ["Identity Proof (Aadhaar)", "Existing RoR", "Supporting evidence"],
    who: "Affected landholders and their legal representatives.",
    steps: ["File a grievance with survey and record details", "Hearing before the revenue officer", "Speaking order uploaded to your account"],
    notes: ["Use the Grievance flow under Settings for this demo."],
    apply: { kind: "link", href: "settings.html", label: "Open" }
  },
  {
    id: "mutation-app", name: "Mutation Application", category: "Applications & Disputes",
    desc: "Start a fresh mutation request with guided steps and document checks.",
    time: "15–30 working days", timeDays: 21, fee: 2500, icon: "edit_document",
    availability: "Online",
    docs: ["Sale Deed", "Aadhaar / Identity Proof", "Existing RoR"],
    who: "Buyers, heirs and donees.",
    steps: ["Start a New Application and select Mutation", "Complete the five guided steps", "Submit and track to approval"],
    notes: ["Payment can be completed from Payments after submitting the application."],
    apply: { kind: "wizard", service: "mutation", label: "Apply Now" }
  },
  {
    id: "track", name: "Application Status / Tracking", category: "Applications & Disputes",
    desc: "Track every application stage from submission to certificate issuance.",
    time: "Instant", timeDays: 0, fee: 0, icon: "track_changes",
    availability: "Online",
    docs: [],
    who: "Any applicant with an application ID.",
    steps: ["Open the Application Tracker", "Review the progress timeline", "Download receipts as stages complete"],
    notes: ["Keep your application ID handy."],
    apply: { kind: "link", href: "application-tracker.html", label: "Track" }
  },
  {
    id: "grievance", name: "Grievance / Complaint", category: "Applications & Disputes",
    desc: "Complain about delays, rejections or record errors and get a reference ID.",
    time: "15 working days", timeDays: 15, fee: 0, icon: "feedback",
    availability: "Online",
    docs: ["Application ID (if any)"],
    who: "Any citizen facing a service issue.",
    steps: ["Open Settings and file a grievance", "Describe the issue with references", "Track resolution against the reference ID"],
    notes: ["Escalation matrix is published in the Help Centre."],
    apply: { kind: "link", href: "settings.html", label: "Open" }
  }
];

const POPULAR_IDS = ["mutation", "ror-view", "ec", "tax"];
const CATEGORIES = ["Land Records", "Property Services", "Certificates & Documents", "Applications & Disputes"];

const $ = (id) => document.getElementById(id);
const fmtFee = (fee) => (fee === null ? "Fee varies" : fee === 0 ? "Free" : "₹ " + Number(fee).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

function toast(msg) {
  const el = $("svc-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 2600);
}

function findService(id) {
  return SERVICES.find((s) => s.id === id);
}

function availBadge(s) {
  return s.availability === "Online"
    ? `<span class="status-badge status-verified">Available Online</span>`
    : `<span class="status-badge status-neutral">Office Visit</span>`;
}

function applyTarget(s) {
  if (!s.apply) return null;
  if (s.apply.kind === "wizard") return `new-application.html?service=${s.apply.service}`;
  return s.apply.href;
}

function getFiltered() {
  const q = (($("svc-search") || {}).value || "").trim().toLowerCase();
  const cat = $("f-category") ? $("f-category").value : "all";
  const avail = $("f-avail") ? $("f-avail").value : "all";
  const fee = $("f-fee") ? $("f-fee").value : "all";
  const time = $("f-time") ? $("f-time").value : "all";
  return SERVICES.filter((s) => {
    if (cat !== "all" && s.category !== cat) return false;
    if (avail !== "all" && s.availability !== avail) return false;
    if (fee === "free" && s.fee !== 0) return false;
    if (fee === "paid" && !(s.fee > 0)) return false;
    if (fee === "varies" && s.fee !== null) return false;
    if (time === "week" && !(s.timeDays <= 7)) return false;
    if (time === "month" && !(s.timeDays > 7 && s.timeDays <= 30)) return false;
    if (time === "long" && !(s.timeDays > 30)) return false;
    if (!q) return true;
    return s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
  });
}

function cardHtml(s) {
  const apply = s.apply;
  return `
  <article class="bg-white rounded-xl border border-outline-variant/40 shadow-sm p-5 flex flex-col gap-3">
    <div class="flex items-start gap-3">
      <div class="w-11 h-11 rounded-lg bg-primary-fixed/30 text-primary flex items-center justify-center flex-shrink-0">
        <span class="material-symbols-outlined">${s.icon}</span>
      </div>
      <div class="flex-1 min-w-0">
        <h3 class="font-bold text-on-surface leading-snug">${s.name}</h3>
        <p class="text-xs text-secondary">${s.category}</p>
      </div>
      ${availBadge(s)}
    </div>
    <p class="text-sm text-secondary">${s.desc}</p>
    <dl class="grid grid-cols-3 gap-2 text-center text-xs border-t border-outline-variant/40 pt-3">
      <div><dt class="text-secondary">Processing</dt><dd class="font-bold text-on-surface mt-0.5">${s.time}</dd></div>
      <div><dt class="text-secondary">Fee</dt><dd class="font-bold text-primary mt-0.5">${fmtFee(s.fee)}</dd></div>
      <div><dt class="text-secondary">Documents</dt><dd class="font-bold text-on-surface mt-0.5">${s.docs.length || "—"}</dd></div>
    </dl>
    <div class="flex gap-2 mt-auto">
      <button class="svc-view flex-1 px-3 py-2 rounded-lg border border-outline-variant text-sm font-semibold text-primary hover:bg-surface-container-low transition" data-id="${s.id}">View Details</button>
      ${apply ? `<button class="svc-apply flex-1 px-3 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-container transition" data-id="${s.id}">${apply.label}</button>` : ""}
    </div>
  </article>`;
}

function renderAll() {
  const list = getFiltered();
  if ($("svc-count")) $("svc-count").textContent = `Showing ${list.length} service${list.length === 1 ? "" : "s"}`;
  const grid = $("svc-grid");
  const empty = $("empty-state");
  if (!list.length) {
    if (grid) grid.innerHTML = "";
    if (empty) empty.classList.remove("hidden");
  } else {
    if (empty) empty.classList.add("hidden");
    if (grid) grid.innerHTML = list.map(cardHtml).join("");
  }
  document.querySelectorAll(".svc-view").forEach((b) =>
    b.addEventListener("click", () => openDetails(b.getAttribute("data-id"))));
  document.querySelectorAll(".svc-apply").forEach((b) =>
    b.addEventListener("click", () => applyFor(b.getAttribute("data-id"))));
}

function renderPopular() {
  const grid = $("popular-grid");
  if (!grid) return;
  grid.innerHTML = POPULAR_IDS.map((id) => {
    const s = findService(id);
    if (!s) return "";
    return `
    <button class="popular-card text-left bg-white rounded-xl border border-outline-variant/40 shadow-sm p-4 hover:shadow-md transition flex items-center gap-3" data-id="${s.id}">
      <span class="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center flex-shrink-0">
        <span class="material-symbols-outlined">${s.icon}</span>
      </span>
      <span><span class="block font-bold text-on-surface text-sm">${s.name}</span>
      <span class="block text-xs text-secondary">${s.time} • ${fmtFee(s.fee)}</span></span>
    </button>`;
  }).join("");
  grid.querySelectorAll(".popular-card").forEach((b) =>
    b.addEventListener("click", () => openDetails(b.getAttribute("data-id"))));
}

function openDetails(id) {
  const s = findService(id);
  if (!s) return;
  if ($("modal-title")) $("modal-title").innerHTML =
    `<span class="material-symbols-outlined text-primary">${s.icon}</span> ${s.name}`;
  if ($("modal-body")) $("modal-body").innerHTML = `
    <div class="flex flex-wrap items-center gap-2">${availBadge(s)}
      <span class="text-sm text-secondary">${s.category} • ${s.time} • ${fmtFee(s.fee)}</span></div>
    <p class="mt-3 text-body-md text-on-surface">${s.desc}</p>
    <h4 class="mt-4 font-bold text-on-surface text-sm">WHO CAN APPLY</h4>
    <p class="text-sm text-secondary mt-1">${s.who}</p>
    <h4 class="mt-4 font-bold text-on-surface text-sm">REQUIRED DOCUMENTS (${s.docs.length || 0})</h4>
    ${s.docs.length ? `<ul class="mt-1 flex flex-col gap-1">${s.docs.map((d) =>
      `<li class="flex items-center gap-2 text-sm text-on-surface"><span class="material-symbols-outlined text-[18px] text-primary">description</span>${d}</li>`).join("")}</ul>`
      : `<p class="text-sm text-secondary mt-1">No documents needed.</p>`}
    <h4 class="mt-4 font-bold text-on-surface text-sm">APPLICATION STEPS</h4>
    <ol class="mt-1 flex flex-col gap-1 list-decimal pl-5 text-sm text-secondary">${s.steps.map((st) => `<li>${st}</li>`).join("")}</ol>
    <div class="mt-4 rounded-lg bg-surface-container-low border border-outline-variant/50 p-3 text-sm">
      <p><span class="font-semibold">Government fee:</span> ${fmtFee(s.fee)}</p>
      ${s.apply && s.apply.kind === "wizard" ? `<p class="text-secondary mt-1">Payment can be completed from <a href="payments.html" class="text-primary underline">Payments</a> after submitting the application.</p>` : ""}
    </div>
    ${s.notes.map((n) => `<p class="mt-2 text-xs text-secondary flex gap-1"><span class="material-symbols-outlined text-[16px]">info</span>${n}</p>`).join("")}`;
  const applyBtn = $("modal-apply");
  if (applyBtn) {
    if (s.apply) {
      applyBtn.classList.remove("hidden");
      applyBtn.textContent = s.apply.label === "Track" ? "Track Now" : s.apply.label;
      applyBtn.onclick = () => applyFor(s.id);
    } else {
      applyBtn.classList.add("hidden");
    }
  }
  const m = $("svc-modal");
  if (m) { m.classList.remove("hidden"); m.classList.add("flex"); }
}

function closeDetails() {
  const m = $("svc-modal");
  if (m) { m.classList.add("hidden"); m.classList.remove("flex"); }
}

function applyFor(id) {
  const target = applyTarget(findService(id));
  if (target) window.location.href = target;
}

function renderApps() {
  let mine = [];
  try {
    mine = JSON.parse(localStorage.getItem("bb_applications") || "[]");
  } catch {
    mine = [];
  }
  if ($("apps-active")) $("apps-active").textContent = 1 + mine.length;
  const list = $("apps-list");
  if (list) {
    list.innerHTML = mine.length
      ? mine.slice(0, 3).map((a) => `
        <div class="flex items-center justify-between gap-2 py-2 border-b border-outline-variant/40 text-sm">
          <div class="min-w-0"><p class="font-mono font-bold text-primary truncate">${a.id}</p>
          <p class="text-xs text-secondary truncate">${a.service || "Application"} • ${a.status || "Submitted"}</p></div>
          <a href="application-tracker.html" class="text-primary text-sm font-semibold hover:underline flex-shrink-0">Track</a>
        </div>`).join("")
      : `<p class="text-sm text-secondary py-1">No applications started yet in this demo.</p>`;
  }
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
  if (!requirePortal("citizen")) {
    return;
  }
  setupSession();
  renderPopular();
  renderAll();
  renderApps();
  if ($("svc-search")) $("svc-search").addEventListener("input", renderAll);
  ["f-category", "f-avail", "f-fee", "f-time"].forEach((id) => {
    const el = $(id);
    if (el) el.addEventListener("change", renderAll);
  });
  if ($("btn-clear-filters")) $("btn-clear-filters").addEventListener("click", () => {
    if ($("svc-search")) $("svc-search").value = "";
    ["f-category", "f-avail", "f-fee", "f-time"].forEach((id) => {
      const el = $(id);
      if (el) el.value = "all";
    });
    renderAll();
  });
  if ($("btn-track-apps")) $("btn-track-apps").addEventListener("click", () => {
    window.location.href = "application-tracker.html";
  });
  if ($("modal-close")) $("modal-close").addEventListener("click", closeDetails);
  if ($("modal-close-btn")) $("modal-close-btn").addEventListener("click", closeDetails);
  const m = $("svc-modal");
  if (m) m.addEventListener("click", (e) => { if (e.target === m) closeDetails(); });
}

document.addEventListener("DOMContentLoaded", init);

export { SERVICES, getFiltered, openDetails, applyFor };
