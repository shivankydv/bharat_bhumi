/**
 * Shared frontend DEMO data for the Bharat Bhumi Admin Portal.
 *
 * All records below are fictitious demonstration data for the SIH 2026 demo.
 * They are NOT real government records and MUST NOT be presented as such.
 * No backend admin API exists — do not invent endpoints.
 */

export const WORKFLOW_STAGES = [
  "Review",
  "Verify",
  "Approve",
  "Reject / Request Changes",
  "Resolve",
  "Manage"
];

export const CROSS_DEPT_FLOW = [
  { icon: "person", label: "Citizen submits Mutation" },
  { icon: "account_balance", label: "Revenue checks ownership" },
  { icon: "app_registration", label: "Registration verifies transaction" },
  { icon: "location_city", label: "Municipal checks property record" },
  { icon: "map", label: "Survey / GIS verifies parcel" },
  { icon: "supervisor_account", label: "Officer reviews everything" },
  { icon: "rule", label: "Approve / Reject / Request Changes" },
  { icon: "task_alt", label: "Resolve" },
  { icon: "mark_email_read", label: "Citizen receives status" }
];

export const DEPT_OVERVIEW = [
  { dept: "Revenue", icon: "account_balance", records: "842 records", pending: "18 pending verification" },
  { dept: "Municipal", icon: "location_city", records: "526 properties", pending: "12 permissions pending" },
  { dept: "Registration", icon: "app_registration", records: "731 transactions", pending: "9 awaiting verification" },
  { dept: "Survey / GIS", icon: "map", records: "1,284 parcels", pending: "6 boundary discrepancies" },
  { dept: "Planning", icon: "domain_add", records: "214 approvals", pending: "5 pending" },
  { dept: "Legal / Disputes", icon: "gavel", records: "27 active cases", pending: "7 requiring action" }
];

export const DEPARTMENTS = [
  {
    id: "revenue", name: "Revenue Department", summary: "Ownership & Land Records",
    desc: "Primary land ownership and revenue records.",
    primary: true,
    fields: ["Property / ULPIN", "Current owner", "Previous owner", "Ownership history", "Purchase / transfer details", "Sale / transaction date", "Recorded transaction value", "Land classification", "Area", "Village / District / Tehsil", "RoR / land record", "Mutation status", "Property tax / revenue information"],
    actions: ["View Land Record", "View Ownership History", "Verify Mutation", "Resolve Record Issue"]
  },
  {
    id: "municipal", name: "Municipal / Urban Local Body", summary: "Building & Construction Permissions",
    desc: "Building and construction-related information.",
    primary: true,
    fields: ["Property ID", "Building / plot address", "Building plan", "Plan approval status", "Building permission", "Construction permission", "Approved building map", "Permit number", "Approval date", "Land-use / zoning", "Completion certificate", "Property tax information"],
    actions: ["View Building Plan", "View Permission", "Verify Approval", "Resolve Permission Issue"]
  },
  {
    id: "registration", name: "Registration Department", summary: "Property Registration & Transactions",
    desc: "Property transaction and registration information.",
    primary: true,
    fields: ["Registration number", "Sale deed details", "Registration date", "Buyer", "Seller", "Transaction value", "Property / ULPIN", "Document status", "Registration office"],
    actions: ["View Registration", "View Sale Deed", "Verify Transaction"]
  },
  {
    id: "survey", name: "Survey / Land Records Department", summary: "Spatial & Parcel Information",
    desc: "Spatial and parcel information.",
    primary: true,
    fields: ["ULPIN", "Survey number", "Plot number", "Parcel boundaries", "Area", "Coordinates", "Cadastral / map reference", "Land classification", "Survey status"],
    actions: ["Open in GIS", "View Parcel", "Verify Boundary", "Flag Discrepancy"]
  },
  {
    id: "planning", name: "Planning / Development Authority", summary: "Zoning & Development Control",
    desc: "Urban planning and land-use information.",
    primary: true,
    fields: ["Land-use classification", "Zoning", "Development permission", "Layout approval", "Road alignment", "Restricted / protected zone status", "Planning approval"],
    actions: ["View Zoning", "View Approval", "Verify Planning Status"]
  },
  {
    id: "legal", name: "Court / Legal / Disputes", summary: "Cases & Dispute Status",
    desc: "Legal and dispute information, restricted to authorised officers.",
    primary: true,
    restricted: true,
    fields: ["Dispute / case ID", "Property / ULPIN", "Case type", "Case status", "Court / authority", "Filing date", "Current status"],
    actions: ["View Case", "View Status", "Resolve / Update Case"]
  },
  {
    id: "stamps", name: "Stamps & Registration (Finance)", summary: "Duties, Fees & Receipts",
    desc: "Financial and transaction information for property transfers.",
    primary: false,
    fields: ["Stamp duty", "Registration fee", "Transaction value", "Payment status", "Registration details", "Transaction date"],
    actions: ["View Transaction", "Verify Payment", "View Receipt"]
  },
  {
    id: "environment", name: "Environment / Forest", summary: "Clearances & Restrictions",
    desc: "Environmental restrictions affecting land, where applicable.",
    primary: false,
    fields: ["Protected area status", "Forest / restricted land status", "Environmental clearance status", "Applicable restrictions"],
    actions: ["View Clearance", "View Restrictions", "Flag Property"]
  }
];

function prop(ulpin, address, area, landType) {
  return { ulpin, address, area, landType };
}

export const PROPERTIES_360 = [
  {
    ulpin: "ULP-892-441-A",
    status: "Under Review",
    property: prop("ULP-892-441-A", "Plot 42, North Sector, District A", "2.4 Hectares", "Agricultural"),
    revenue: {
      owner: "Rajesh Kumar", previousOwner: "Mohan Lal", txnDate: "Mar 02, 2024",
      txnValue: "₹ 48,50,000", landClass: "Agricultural Class II", village: "North Sector Village",
      district: "District A", tehsil: "Tehsil North", ror: "RoR-2024-11823 (Verified)", mutation: "MUT-2024-8921A — Under Review",
      tax: "FY 23-24 Paid (₹ 12,400)",
      history: ["2024 — Transfer deed registered: Mohan Lal → Rajesh Kumar", "2019 — Inheritance partition recorded", "2011 — First settlement entry digitised"]
    },
    registration: {
      regNo: "REG-2024-009142", deed: "Sale Deed Doc-4417 (Verified)", regDate: "Mar 05, 2024",
      buyer: "Rajesh Kumar", seller: "Mohan Lal", txnValue: "₹ 48,50,000",
      docStatus: "Registered & digitised", office: "Sub-Registrar Office, District A"
    },
    municipal: {
      permission: "Not applicable (agricultural holding)", map: "—", construction: "Farm shed (permitted)",
      tax: "FY 23-24 Paid", permitNo: "—", approvalDate: "—"
    },
    survey: {
      surveyNo: "S.No 145/2", plotNo: "Plot 42", boundary: "Verified 2023 resurvey",
      coords: "28.5765° N, 77.1455° E", cadastral: "Sheet 12-B, Plot 42", classification: "Agricultural Class II", surveyStatus: "Verified"
    },
    planning: {
      zoning: "Agricultural Green Belt", landUse: "Farming (permitted)", devPermission: "Not required",
      layout: "—", road: "Sector road 12 m", restricted: "None", approval: "—"
    },
    legal: {
      cases: [{ id: "CASE-2023-118", type: "Boundary demarcation", status: "Closed", authority: "Revenue Court", filed: "Aug 2023", current: "Decided; no appeal" }]
    },
    documents: ["Sale Deed (Verified)", "RoR-2024-11823 (Verified)", "Tax Receipt FY 23-24 (Verified)", "Survey Sketch (Pending)"],
    payments: ["Mutation Fee ₹ 2,500 — Successful (UPI)", "Balance Fee ₹ 1,750 — Due Oct 30, 2024"],
    applications: ["MUT-2024-8921A — Property Mutation — Under Review"]
  },
  {
    ulpin: "ULP-110-398-B",
    status: "Verified",
    property: prop("ULP-110-398-B", "Block C, Metro Layout, District B", "1200 Sq. Ft.", "Residential"),
    revenue: {
      owner: "Priya Sharma", previousOwner: "City Developers Ltd.", txnDate: "Jan 18, 2024",
      txnValue: "₹ 96,00,000", landClass: "Residential", village: "Metro Layout",
      district: "District B", tehsil: "Tehsil Central", ror: "RoR-2024-09117 (Verified)", mutation: "Completed Jan 2024",
      tax: "FY 23-24 Paid (₹ 18,200)",
      history: ["2024 — Purchase registered: City Developers Ltd. → Priya Sharma", "2021 — Layout approval recorded"]
    },
    registration: {
      regNo: "REG-2024-003308", deed: "Sale Deed Doc-2204 (Verified)", regDate: "Jan 20, 2024",
      buyer: "Priya Sharma", seller: "City Developers Ltd.", txnValue: "₹ 96,00,000",
      docStatus: "Registered & digitised", office: "Sub-Registrar Office, District B"
    },
    municipal: {
      permission: "Building Plan BP-2022-771 (Approved)", map: "Approved map on file", construction: "G+2 completed 2023",
      tax: "FY 23-24 Paid", permitNo: "BP-2022-771", approvalDate: "Nov 2022"
    },
    survey: {
      surveyNo: "S.No 88/1", plotNo: "Block C-14", boundary: "Verified",
      coords: "28.5885° N, 77.1615° E", cadastral: "Sheet 04-A, Plot C-14", classification: "Residential", surveyStatus: "Verified"
    },
    planning: {
      zoning: "Residential R-2", landUse: "Residential (permitted)", devPermission: "Granted 2022",
      layout: "Metro Layout approved", road: "Internal road 9 m", restricted: "None", approval: "Layout-2021-044"
    },
    legal: { cases: [] },
    documents: ["Sale Deed (Verified)", "Building Plan BP-2022-771 (Verified)", "Tax Receipt FY 23-24 (Verified)"],
    payments: ["Mutation Fee ₹ 2,500 — Successful", "Property Tax FY 23-24 — Successful"],
    applications: ["MUT-2024-88112 — Property Mutation — Completed"]
  },
  {
    ulpin: "Pending ID...",
    status: "Submitted",
    property: prop("Pending ID...", "Plot 5, Market Road, District A", "0.5 Hectares", "Commercial"),
    revenue: {
      owner: "Amit Patel (claimed)", previousOwner: "Unverified", txnDate: "—",
      txnValue: "—", landClass: "Commercial", village: "Market Road",
      district: "District A", tehsil: "Tehsil North", ror: "Pending digitisation", mutation: "Not filed",
      tax: "FY 23-24 Due",
      history: ["2024 — Claim submitted; ownership under verification"]
    },
    registration: {
      regNo: "Pending", deed: "Under verification", regDate: "—",
      buyer: "Amit Patel (claimed)", seller: "Unverified", txnValue: "—",
      docStatus: "Pending verification", office: "Sub-Registrar Office, District A"
    },
    municipal: {
      permission: "Pending verification", map: "—", construction: "Shop structure (unassessed)",
      tax: "FY 23-24 Due", permitNo: "—", approvalDate: "—"
    },
    survey: {
      surveyNo: "S.No 63/7", plotNo: "Plot 5", boundary: "Discrepancy flagged 2024",
      coords: "28.5645° N, 77.1575° E", cadastral: "Sheet 09-C, Plot 5", classification: "Commercial", surveyStatus: "Field check pending"
    },
    planning: {
      zoning: "Commercial C-1", landUse: "Commercial (permitted)", devPermission: "Pending",
      layout: "—", road: "Market Road 15 m", restricted: "None", approval: "—"
    },
    legal: {
      cases: [{ id: "CASE-2024-031", type: "Ownership claim", status: "Open", authority: "Revenue Court", filed: "Sep 2024", current: "Notice issued; hearing pending" }]
    },
    documents: ["Claim Form (Pending)", "ID Proof (Verified)", "Old Tax Receipt (Rejected — illegible)"],
    payments: ["EC Fee ₹ 350 — Pending"],
    applications: ["EC-2024-03391 — Encumbrance Certificate — Submitted"]
  }
];

export const REVIEW_QUEUE = [
  { id: "MUT-2024-8921A", kind: "Mutation", title: "Property Mutation — Rajesh Kumar", ulpin: "ULP-892-441-A", stage: "Under Review", priority: "High", received: "Oct 12, 2024" },
  { id: "EC-2024-03391", kind: "Certificate", title: "Encumbrance Certificate — Amit Patel", ulpin: "Pending ID...", stage: "Submitted", priority: "Medium", received: "Oct 18, 2024" },
  { id: "DOC-1007", kind: "Document", title: "Survey Sketch re-verification", ulpin: "ULP-892-441-A", stage: "Documents Required", priority: "Medium", received: "Oct 22, 2024" },
  { id: "CASE-2024-031", kind: "Dispute", title: "Ownership claim — Plot 5, Market Road", ulpin: "Pending ID...", stage: "Open", priority: "High", received: "Sep 28, 2024" },
  { id: "MUT-2024-88112", kind: "Mutation", title: "Property Mutation — Priya Sharma", ulpin: "ULP-110-398-B", stage: "Completed", priority: "Low", received: "Jan 2024" }
];

export function seedActivities(ulpin) {
  if (ulpin === "ULP-892-441-A") {
    return [
      { time: "11:20 AM, Oct 24", text: "Registration data verified by Registration Officer." },
      { time: "11:03 AM, Oct 24", text: "Sale Deed verified by Document Cell." },
      { time: "10:15 AM, Oct 24", text: "Ownership record reviewed by Revenue Officer." },
      { time: "09:42 AM, Oct 24", text: "Application received and queued for review." }
    ];
  }
  if (ulpin === "ULP-110-398-B") {
    return [
      { time: "02:10 PM, Jan 30", text: "Mutation certificate issued; case closed." },
      { time: "11:00 AM, Jan 29", text: "Application approved by Sub-Divisional Magistrate." },
      { time: "10:05 AM, Jan 25", text: "Building plan verified by Municipal Officer." }
    ];
  }
  return [
    { time: "04:40 PM, Oct 22", text: "Boundary discrepancy flagged by Survey team." },
    { time: "09:15 AM, Oct 18", text: "Claim submitted; ownership under verification." }
  ];
}

/* =========================================================
   PENDING APPLICATIONS (admin review demo data)
   ========================================================= */

export const APP_STORE_KEY = "bb_admin_apps";

export const CHECKLIST_TEMPLATE = [
  "Applicant identity verified",
  "Ownership details verified",
  "ULPIN matched with land record",
  "Sale deed verified",
  "Property tax checked",
  "No document discrepancy"
];

export const OFFICER_ROSTER = [
  "Revenue Officer — District A",
  "Registration Officer — District A",
  "Municipal Officer — ULB Central",
  "Survey Officer — Field Team 2",
  "Planning Officer — Development Authority",
  "Legal Officer — Revenue Court"
];

export const DOC_TYPES = ["Sale Deed", "Identity Proof", "RoR", "Property Tax Receipt", "Other"];

function doc(name, type, uploaded, status) {
  return { name, type, uploaded, status };
}

export const SEED_APPLICATIONS = [
  {
    id: "APP-2026-00124", citizen: "Shivank Yadav", username: "shivank", email: "shivank@example.in",
    mobile: "9810012345", applicantId: "CIT-2024-0117",
    service: "Property Mutation", department: "Revenue", ulpin: "ULP-892-441-A",
    submitted: "05 Sep 2026", iso: "2026-09-05", stage: "Pending Review", priority: "Normal",
    received: "05 Sep 2026", expectedTime: "15–30 working days", assignedOfficer: "Revenue Officer — District A",
    property: {
      type: "Agricultural", address: "Plot 42, North Sector, District A",
      district: "District A", tehsil: "Tehsil North", village: "North Sector Village",
      area: "2.4 Hectares", landClass: "Agricultural Class II"
    },
    docs: [
      doc("Sale Deed", "PDF", "05 Sep 2026", "Pending Verification"),
      doc("Aadhaar / Identity Proof", "PDF", "05 Sep 2026", "Verified"),
      doc("RoR / Land Record", "PDF", "05 Sep 2026", "Pending Verification"),
      doc("Property Tax Receipt", "PDF", "05 Sep 2026", "Verified")
    ],
    checklist: [true, true, true, false, true, false],
    history: [
      { time: "05 Sep 2026 — 10:42 AM", text: "Application submitted by citizen" },
      { time: "05 Sep 2026 — 11:05 AM", text: "Application assigned to Revenue Officer" }
    ],
    notes: []
  },
  {
    id: "APP-2026-00125", citizen: "Rahul Sharma", username: "rahul", email: "rahul@example.in",
    mobile: "9820023456", applicantId: "CIT-2024-0231",
    service: "Encumbrance Certificate", department: "Registration", ulpin: "ULP-110-398-B",
    submitted: "05 Sep 2026", iso: "2026-09-05", stage: "Document Verification", priority: "Normal",
    received: "05 Sep 2026", expectedTime: "10–15 working days", assignedOfficer: "Registration Officer — District A",
    property: {
      type: "Residential", address: "Block C, Metro Layout, District B",
      district: "District B", tehsil: "Tehsil Central", village: "Metro Layout",
      area: "1200 Sq. Ft.", landClass: "Residential"
    },
    docs: [
      doc("Sale Deed", "PDF", "05 Sep 2026", "Pending Verification"),
      doc("Aadhaar / Identity Proof", "PDF", "05 Sep 2026", "Verified"),
      doc("RoR / Land Record", "PDF", "05 Sep 2026", "Pending Verification")
    ],
    checklist: [true, true, false, false, true, false],
    history: [
      { time: "05 Sep 2026 — 09:18 AM", text: "Application submitted by citizen" },
      { time: "05 Sep 2026 — 10:02 AM", text: "Identity document verified" }
    ],
    notes: []
  },
  {
    id: "APP-2026-00126", citizen: "Priya Verma", username: "priya", email: "priya@example.in",
    mobile: "9830034567", applicantId: "CIT-2024-0308",
    service: "Land Record / RoR", department: "Revenue", ulpin: "ULP-892-441-A",
    submitted: "04 Sep 2026", iso: "2026-09-04", stage: "Documents Required", priority: "High",
    received: "04 Sep 2026", expectedTime: "5–7 working days", assignedOfficer: "Revenue Officer — District A",
    property: {
      type: "Agricultural", address: "Plot 42, North Sector, District A",
      district: "District A", tehsil: "Tehsil North", village: "North Sector Village",
      area: "2.4 Hectares", landClass: "Agricultural Class II"
    },
    docs: [
      doc("Aadhaar / Identity Proof", "PDF", "04 Sep 2026", "Verified"),
      doc("Property Tax Receipt", "PDF", "04 Sep 2026", "Verified"),
      doc("RoR / Land Record", "PDF", null, "Missing"),
      doc("Survey Sketch", "PDF", null, "Missing")
    ],
    checklist: [true, false, false, false, true, false],
    history: [
      { time: "04 Sep 2026 — 03:40 PM", text: "Application submitted by citizen" },
      { time: "05 Sep 2026 — 09:12 AM", text: "Additional documents requested by Admin" }
    ],
    notes: [{ time: "05 Sep 2026 — 09:12 AM", author: "Admin", text: "RoR copy and survey sketch still awaited from applicant." }]
  },
  {
    id: "APP-2026-00127", citizen: "Aman Kumar", username: "aman", email: "aman@example.in",
    mobile: "9840045678", applicantId: "CIT-2024-0419",
    service: "Property Tax", department: "Municipal", ulpin: "ULP-220-551-C",
    submitted: "04 Sep 2026", iso: "2026-09-04", stage: "Pending Review", priority: "Normal",
    received: "04 Sep 2026", expectedTime: "5–7 working days", assignedOfficer: "Municipal Officer — ULB Central",
    property: {
      type: "Commercial", address: "Shop 7, Market Road, District A",
      district: "District A", tehsil: "Tehsil North", village: "Market Road",
      area: "0.3 Hectares", landClass: "Commercial"
    },
    docs: [
      doc("Aadhaar / Identity Proof", "PDF", "04 Sep 2026", "Verified"),
      doc("Property Tax Receipt", "PDF", "04 Sep 2026", "Pending Verification"),
      doc("Address Proof", "PDF", "04 Sep 2026", "Pending Verification")
    ],
    checklist: [true, true, true, false, false, false],
    history: [
      { time: "04 Sep 2026 — 01:05 PM", text: "Application submitted by citizen" }
    ],
    notes: []
  },
  {
    id: "APP-2026-00128", citizen: "Kavita Singh", username: "kavita", email: "kavita@example.in",
    mobile: "9850056789", applicantId: "CIT-2024-0522",
    service: "Property Mutation", department: "Revenue", ulpin: "ULP-110-398-B",
    submitted: "03 Sep 2026", iso: "2026-09-03", stage: "Under Verification", priority: "Urgent",
    received: "03 Sep 2026", expectedTime: "15–30 working days", assignedOfficer: "Revenue Officer — District A",
    property: {
      type: "Residential", address: "Block C, Metro Layout, District B",
      district: "District B", tehsil: "Tehsil Central", village: "Metro Layout",
      area: "1200 Sq. Ft.", landClass: "Residential"
    },
    docs: [
      doc("Sale Deed", "PDF", "03 Sep 2026", "Verified"),
      doc("Aadhaar / Identity Proof", "PDF", "03 Sep 2026", "Verified"),
      doc("RoR / Land Record", "PDF", "03 Sep 2026", "Verified")
    ],
    checklist: [true, true, true, true, true, false],
    history: [
      { time: "03 Sep 2026 — 10:20 AM", text: "Application submitted by citizen" },
      { time: "04 Sep 2026 — 11:32 AM", text: "Property ownership details reviewed" },
      { time: "04 Sep 2026 — 11:45 AM", text: "Sale deed verification pending" }
    ],
    notes: []
  }
];

const SERVICE_DEPT = {
  "Property Mutation": "Revenue",
  "Record of Rights (RoR)": "Revenue",
  "Land Record / RoR": "Revenue",
  "Encumbrance Certificate": "Registration",
  "Property Tax Assessment": "Municipal",
  "Property Tax": "Municipal"
};

function deptForService(service) {
  if (SERVICE_DEPT[service]) return SERVICE_DEPT[service];
  const s = String(service || "").toLowerCase();
  if (s.includes("encumbrance") || s.includes("registration")) return "Registration";
  if (s.includes("tax")) return "Municipal";
  if (s.includes("dispute") || s.includes("grievance")) return "Legal";
  return "Revenue";
}

function citizenAppToReview(c) {
  const docs = Array.isArray(c.docs) && c.docs.length ? c.docs : [];
  return {
    id: c.id,
    citizen: (c.applicant && c.applicant.name) || c.username || "Citizen Applicant",
    username: c.username || "—",
    email: (c.applicant && c.applicant.email) || "—",
    mobile: (c.applicant && c.applicant.mobile) || "—",
    applicantId: "CIT-DEMO",
    service: c.service || "Land Service",
    department: deptForService(c.service),
    ulpin: c.ulpin || "—",
    submitted: c.date || "—",
    iso: c.iso || "",
    stage: "Pending Review",
    priority: "Normal",
    received: c.date || "—",
    expectedTime: "15–30 working days",
    assignedOfficer: "Unassigned",
    property: null,
    docs: docs.map((d) => ({
      name: d.name,
      type: (d.file || "").split(".").pop().toUpperCase().slice(0, 4) || "PDF",
      uploaded: c.date || "—",
      status: d.file ? "Pending Verification" : "Missing",
      file: d.file || null
    })),
    checklist: CHECKLIST_TEMPLATE.map(() => false),
    history: [{ time: `${c.date || ""} — Submitted`, text: "Application submitted by citizen" }],
    notes: [],
    citizenSubmitted: true
  };
}

function loadAppStore() {
  try {
    return JSON.parse(localStorage.getItem(APP_STORE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveAppStore(s) {
  try {
    localStorage.setItem(APP_STORE_KEY, JSON.stringify(s));
  } catch (e) {
    console.warn("[Admin] Failed to persist application state:", e);
  }
}

function loadCitizenApps() {
  try {
    return JSON.parse(localStorage.getItem("bb_applications") || "[]");
  } catch {
    return [];
  }
}

/* Merged application list: seeds + citizen submissions + stored overrides. */
export function getApplications() {
  const store = loadAppStore();
  const seen = new Set();
  const list = [];
  SEED_APPLICATIONS.forEach((seed) => {
    seen.add(seed.id);
    list.push(applyOverride(structuredCloneSafe(seed), store[seed.id]));
  });
  loadCitizenApps().forEach((c) => {
    if (!c || !c.id || seen.has(c.id)) return;
    seen.add(c.id);
    list.push(applyOverride(citizenAppToReview(c), store[c.id]));
  });
  return list;
}

function structuredCloneSafe(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function applyOverride(app, ov) {
  if (!ov) return app;
  ["stage", "assignedOfficer", "resolution", "resolvedAt"].forEach((k) => {
    if (ov[k] !== undefined) app[k] = ov[k];
  });
  if (Array.isArray(ov.docs)) app.docs = ov.docs;
  if (Array.isArray(ov.checklist)) app.checklist = ov.checklist;
  if (Array.isArray(ov.notes)) app.notes = ov.notes;
  if (Array.isArray(ov.historyPrepend)) app.history = [...ov.historyPrepend, ...app.history];
  return app;
}

export function getApplication(id) {
  return getApplications().find((a) => a.id === id) || null;
}

export function saveApplicationPatch(id, patch) {
  const store = loadAppStore();
  store[id] = { ...(store[id] || {}), ...patch };
  saveAppStore(store);
}

export function prependHistory(id, entry) {
  const store = loadAppStore();
  const cur = store[id] || {};
  cur.historyPrepend = [entry, ...(cur.historyPrepend || [])];
  store[id] = cur;
  saveAppStore(store);
}

const TERMINAL_STAGES = ["Approved", "Rejected", "Resolved", "Completed", "Closed"];

/* Applications still needing officer action (anything not terminal). */
export function pendingApplications() {
  return getApplications().filter((a) => !TERMINAL_STAGES.includes(a.stage));
}

export function pendingCount() {
  return pendingApplications().length;
}

export function nowStamp() {
  return new Date().toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit"
  });
}
