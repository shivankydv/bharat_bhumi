import { isAuthenticated, getCurrentUser, logout, requirePortal } from "./services/auth-service.js";

/* Demo application data (backend has no application-tracking API — do not invent endpoints). */
const DEMO_APPLICATION = {
  id: "MUT-2024-8921A",
  title: "Application Tracker",
  subtitle: "Real-time status updates for your property mutation request.",
  currentStage: "Department Review",
  expectedMonth: "Oct 28",
  expectedYear: "2024",
  expectedNote: "Most applications in your district are processing slightly ahead of schedule.",
  serviceType: "Property Mutation (Sale)",
  propertyAddress: "Plot 42, Sector 9, Digital Infrastructure Zone, New Delhi",
  applicantName: "Rajiv Sharma",
  feesPaid: "₹ 2,500.00",
  feesStatus: "SUCCESS",
  etaLabel: "3-5 Days",
  etaProgress: 40,
  stages: [
    {
      title: "Application Submitted",
      date: "Oct 12, 2024 • 10:30 AM",
      desc: "Your application and initial fees were successfully received by the system.",
      state: "done",
      icon: "check"
    },
    {
      title: "Document Verification",
      date: "Oct 15, 2024 • 02:15 PM",
      desc: "All uploaded documents (Sale Deed, Identity Proof) have been verified by the nodal officer.",
      state: "done",
      icon: "fact_check",
      attachments: ["Deed.pdf", "ID_Card.jpg"]
    },
    {
      title: "Department Review",
      date: "",
      desc: "The local revenue department is currently reviewing the mutation request against zoning regulations.",
      state: "current",
      icon: "hourglass_top"
    },
    {
      title: "Officer Approval",
      date: "",
      desc: "Final sign-off from the Sub-Divisional Magistrate.",
      state: "pending",
      icon: "how_to_reg"
    },
    {
      title: "Completed",
      date: "",
      desc: "Certificate issuance and registry update.",
      state: "pending",
      icon: "task_alt"
    }
  ]
};

const $ = (id) => document.getElementById(id);

function toast(msg) {
  const el = $("tracker-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 2600);
}

function renderHeader(app) {
  if ($("app-id")) $("app-id").textContent = app.id;
  if ($("current-stage-badge")) $("current-stage-badge").innerHTML =
    `<span class="material-symbols-outlined text-[18px]">pending</span><span class="text-label-md font-label-md font-bold">${app.currentStage}</span>`;
}

function renderTimeline(app) {
  const box = $("timeline");
  if (!box) return;
  box.innerHTML = app.stages.map((s, i) => {
    const isLast = i === app.stages.length - 1;
    const lineCls = s.state === "done" ? "timeline-line active" : "timeline-line";
    let circle;
    if (s.state === "done") {
      circle = `<div class="relative z-10 w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0 shadow-sm"><span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1;">${s.icon}</span></div>`;
    } else if (s.state === "current") {
      circle = `<div class="relative z-10 w-12 h-12 rounded-full bg-[#fdf3c7] border-2 border-[#e6a800] text-[#936b00] flex items-center justify-center flex-shrink-0 shadow-sm"><span class="material-symbols-outlined animate-pulse" style="font-variation-settings:'FILL' 1;">${s.icon}</span></div>`;
    } else {
      circle = `<div class="relative z-10 w-12 h-12 rounded-full bg-surface-variant text-outline flex items-center justify-center flex-shrink-0"><span class="material-symbols-outlined">${s.icon}</span></div>`;
    }
    const titleCls = s.state === "done" ? "text-primary" : s.state === "current" ? "text-on-surface" : "text-on-surface";
    const itemCls = s.state === "pending" ? "timeline-item relative flex gap-6 pb-12 opacity-50" : "timeline-item relative flex gap-6 pb-12";
    const dateHtml = s.date
      ? `<span class="text-label-sm font-label-sm text-on-surface-variant flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">calendar_today</span>${s.date}</span>` : "";
    const currentTag = s.state === "current"
      ? `<span class="text-label-sm font-label-sm text-[#936b00] font-bold bg-[#fdf3c7] px-2 py-0.5 rounded">Current Stage</span>` : "";
    const attachHtml = s.attachments
      ? `<div class="mt-3 flex gap-2 flex-wrap">${s.attachments.map((a) =>
        `<span class="inline-flex items-center gap-1 bg-surface-container text-on-surface text-label-sm px-2 py-1 rounded"><span class="material-symbols-outlined text-[14px]">attachment</span>${a}</span>`).join("")}</div>` : "";
    const etaHtml = s.state === "current"
      ? `<div class="mt-4 p-4 bg-surface-container-low rounded-lg border border-outline-variant/50"><div class="flex justify-between text-label-sm font-label-sm text-on-surface-variant mb-1"><span>Estimated time remaining</span><span>${app.etaLabel}</span></div><div class="w-full bg-surface-variant rounded-full h-1.5"><div class="bg-[#e6a800] h-1.5 rounded-full" style="width:${app.etaProgress}%"></div></div></div>` : "";
    return `<div class="${itemCls}">${isLast ? "" : `<div class="${lineCls}"></div>`}${circle}
      <div class="flex-1 pt-2">
        <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
          <h3 class="text-body-lg font-bold ${titleCls}">${s.title}</h3>${dateHtml}${currentTag}
        </div>
        <p class="text-body-md mt-2 ${s.state === "current" ? "text-on-surface" : "text-on-surface-variant"}">${s.desc}</p>
        ${attachHtml}${etaHtml}
      </div></div>`;
  }).join("");
}

function renderSummary(app) {
  if ($("sum-service")) $("sum-service").textContent = app.serviceType;
  if ($("sum-address")) $("sum-address").textContent = app.propertyAddress;
  if ($("sum-applicant")) $("sum-applicant").textContent = app.applicantName;
  if ($("sum-fees")) $("sum-fees").innerHTML =
    `${app.feesPaid} <span class="text-green-600 text-[12px] ml-1 bg-green-100 px-1.5 py-0.5 rounded">${app.feesStatus}</span>`;
  if ($("exp-month")) $("exp-month").textContent = app.expectedMonth;
  if ($("exp-year")) $("exp-year").textContent = app.expectedYear;
  if ($("exp-note")) $("exp-note").textContent = app.expectedNote;
}

function downloadReceipt() {
  const app = DEMO_APPLICATION;
  const lines = [
    "BHARAT BHUMI - APPLICATION FEE RECEIPT (DEMO)",
    "=============================================",
    `Application ID: ${app.id}`,
    `Service Type: ${app.serviceType}`,
    `Applicant: ${app.applicantName}`,
    `Property: ${app.propertyAddress}`,
    `Fees Paid: ${app.feesPaid} (${app.feesStatus})`,
    `Current Stage: ${app.currentStage}`,
    `Expected Completion: ${app.expectedMonth} ${app.expectedYear}`,
    "",
    "Note: Demo receipt generated locally for SIH 2026 frontend demonstration."
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Receipt_${app.id.replace(/[^A-Za-z0-9]+/g, "_")}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(`Receipt downloaded for ${app.id} (demo)`);
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
  renderHeader(DEMO_APPLICATION);
  renderTimeline(DEMO_APPLICATION);
  renderSummary(DEMO_APPLICATION);
  if ($("btn-download-receipt")) $("btn-download-receipt").addEventListener("click", downloadReceipt);
  if ($("btn-contact-support")) $("btn-contact-support").addEventListener("click", () =>
    toast("Support request noted for MUT-2024-8921A — helpdesk will contact you (demo)"));
}

document.addEventListener("DOMContentLoaded", init);
