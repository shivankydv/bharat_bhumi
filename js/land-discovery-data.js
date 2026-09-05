/**
 * Shared frontend DEMO data + logic for Land Discovery Requests.
 *
 * Citizens who lack ULPIN/documents can ask authorities to help identify
 * a land record. Officers search, mark POTENTIAL matches (never ownership),
 * and resolve. All demo data — never real government records.
 * No backend endpoint exists for this — do not invent one.
 */
import { DEMO_PROPERTIES } from "./demo-data.js";
import { PROPERTIES_360 } from "./admin-data.js";

export const LDR_STORE = "bb_ldr_requests";
export const LDR_ADMIN_STORE = "bb_ldr_admin";

export const LDR_STAGES = [
  "Submitted", "Under Review", "Record Search", "Possible Match Found",
  "Officer Verification", "Additional Information Required",
  "No Record Found", "Resolved", "Rejected"
];

/* Legacy stages from the first draft, mapped forward on load. */
const LEGACY_STAGE_MAP = {
  "Under Search": "Record Search",
  "Potential Match": "Possible Match Found",
  "Verification Required": "Officer Verification",
  "Verified Match": "Officer Verification"
};

export const LDR_DEPTS = ["Revenue", "Survey / GIS", "Registration", "Municipal / ULB", "Planning", "Legal"];

export const LDR_WORKFLOW = [
  "Citizen submits request",
  "Revenue searches ownership / RoR / mutation",
  "Survey / GIS checks parcel and location",
  "Registration checks transaction history",
  "Municipal checks property record where applicable",
  "Officer reviews evidence",
  "Authority decision",
  "Citizen receives result"
];
export const SEED_LDRS = [
  {
    id: "LDR-2026-00124", citizen: "Shivank Yadav", username: "shivank",
    relationship: "Self",
    clues: { district: "District A", village: "North Village", tehsil: "Tehsil North", location: "North Village, near sector road", ownerName: "Ram Prasad Yadav", oldSurvey: "", period: "1990s", landType: "Agricultural", state: "State A", area: "" },
    claim: { type: "Family / Ancestral", owners: "Ram Prasad Yadav", elder: "Late Ram Prasad Yadav", year: "1992", area: "", landmarks: "Sector road, banyan tree", extra: "Family land; papers misplaced." },
    docs: [],
    identity: { name: "Shivank Yadav", username: "shivank", email: "shivank@example.in", mobile: "9810012345" },
    submitted: "05 Sep 2026", iso: "2026-09-05", stage: "Under Review", department: "Revenue",
    priority: "High", assignee: "Revenue Officer — District A", resolution: null,
    history: [
      { time: "05 Sep 2026 — 09:02 AM", text: "Request submitted by citizen" },
      { time: "05 Sep 2026 — 10:15 AM", text: "Assigned to Revenue Authority" }
    ]
  },
  {
    id: "LDR-2026-00123", citizen: "Anita Sharma", username: "anita",
    relationship: "Parent",
    clues: { district: "District B", village: "Village Central", tehsil: "Tehsil Central", location: "Central village area", ownerName: "Mohan Lal Sharma", oldSurvey: "", period: "", landType: "Unknown", state: "State B", area: "" },
    claim: { type: "Family / Ancestral", owners: "Mohan Lal Sharma", elder: "Mohan Lal Sharma", year: "", area: "", landmarks: "", extra: "" },
    docs: [],
    identity: { name: "Anita Sharma", username: "anita", email: "anita@example.in", mobile: "9820023456" },
    submitted: "04 Sep 2026", iso: "2026-09-04", stage: "Record Search", department: "Revenue",
    priority: "Medium", assignee: "Revenue Officer — District A", resolution: null,
    history: [
      { time: "04 Sep 2026 — 02:40 PM", text: "Request submitted by citizen" },
      { time: "05 Sep 2026 — 09:30 AM", text: "Record search started" }
    ]
  },
  {
    id: "LDR-2026-0002", citizen: "Priya Verma", username: "priya",
    relationship: "Legal Heir",
    clues: { district: "District B", village: "Metro Layout", tehsil: "Tehsil Central", location: "Block C area", ownerName: "Suresh Verma", oldSurvey: "88/1", period: "2019", landType: "Residential", state: "State B", area: "1200 Sq. Ft." },
    claim: { type: "Previously Purchased", owners: "Suresh Verma", elder: "", year: "2019", area: "1200 Sq. Ft.", landmarks: "Metro pillar 44", extra: "" },
    docs: [{ name: "Old Tax Receipt", file: "tax-2019.jpg" }],
    identity: { name: "Priya Verma", username: "priya", email: "priya@example.in", mobile: "9830034567" },
    submitted: "05 Sep 2026", iso: "2026-09-05", stage: "Possible Match Found", department: "Survey / GIS",
    priority: "Medium", assignee: "Survey Officer — Field Team 2", resolution: null,
    history: [
      { time: "05 Sep 2026 — 08:40 AM", text: "Request submitted by citizen" },
      { time: "05 Sep 2026 — 12:05 PM", text: "Possible match identified — awaiting authority verification" }
    ]
  },
  {
    id: "LDR-2026-0003", citizen: "Mohan Das", username: "mohan",
    relationship: "Grandparent",
    clues: { district: "District C", village: "", tehsil: "", location: "Somewhere south", ownerName: "", oldSurvey: "", period: "", landType: "Unknown", state: "", area: "" },
    claim: { type: "Family / Ancestral", owners: "", elder: "Grandfather", year: "", area: "", landmarks: "", extra: "Family mentions land down south." },
    docs: [],
    identity: { name: "Mohan Das", username: "mohan", email: "mohan@example.in", mobile: "9840055555" },
    submitted: "04 Sep 2026", iso: "2026-09-04", stage: "Submitted", department: "Revenue",
    priority: "Low", assignee: "Unassigned", resolution: null,
    history: [{ time: "04 Sep 2026 — 04:12 PM", text: "Request submitted by citizen" }]
  },
  {
    id: "LDR-2026-0004", citizen: "Sunita Devi", username: "sunita",
    relationship: "Self",
    clues: { district: "District B", village: "Green Colony", tehsil: "", location: "", ownerName: "Sunita Devi", oldSurvey: "", period: "2015", landType: "Residential", state: "State B", area: "" },
    claim: { type: "My own land", owners: "Sunita Devi", elder: "", year: "2015", area: "", landmarks: "", extra: "" },
    docs: [],
    identity: { name: "Sunita Devi", username: "sunita", email: "sunita@example.in", mobile: "9850066666" },
    submitted: "03 Sep 2026", iso: "2026-09-03", stage: "Additional Information Required", department: "Revenue",
    priority: "Medium", assignee: "Revenue Officer — District A", resolution: null,
    history: [
      { time: "03 Sep 2026 — 11:20 AM", text: "Request submitted by citizen" },
      { time: "04 Sep 2026 — 10:02 AM", text: "Additional information requested: village name or approximate location" }
    ]
  },
  {
    id: "LDR-2026-0005", citizen: "Rajesh Kumar", username: "rajesh",
    relationship: "Other",
    clues: { district: "District B", village: "Metro Layout", tehsil: "Tehsil Central", location: "Block C", ownerName: "City Developers Ltd.", oldSurvey: "", period: "2024", landType: "Residential", state: "State B", area: "1200 Sq. Ft." },
    claim: { type: "Previously Purchased", owners: "Priya Sharma", elder: "", year: "2024", area: "1200 Sq. Ft.", landmarks: "", extra: "" },
    docs: [{ name: "Registration Document", file: "reg-2024.pdf" }],
    identity: { name: "Rajesh Kumar", username: "rajesh", email: "rajesh@example.in", mobile: "9860077777" },
    submitted: "28 Aug 2026", iso: "2026-08-28", stage: "Resolved", department: "Revenue",
    priority: "Medium", assignee: "Revenue Officer — District A",
    resolution: { outcome: "Verified Record Located", notes: "Record matched and authority-verified.", time: "02 Sep 2026", ulpin: "ULP-110-398-B" },
    history: [
      { time: "28 Aug 2026 — 09:00 AM", text: "Request submitted by citizen" },
      { time: "02 Sep 2026 — 03:30 PM", text: "Resolved: verified record located (ULP-110-398-B)" }
    ]
  }
];

/* ---------- candidate pool + scoring (demo, frontend-only) ---------- */

function candidates() {
  const byUlp = {};
  PROPERTIES_360.forEach((p) => {
    byUlp[p.ulpin] = {
      ulpin: p.ulpin,
      village: p.revenue.village || "",
      district: p.revenue.district || "",
      owner: p.revenue.owner || "",
      landType: p.property.landType || "",
      area: p.property.area || "",
      historyCount: (p.revenue.history || []).length
    };
  });
  DEMO_PROPERTIES.forEach((p) => {
    if (!byUlp[p.ulpin]) {
      byUlp[p.ulpin] = { ulpin: p.ulpin, village: p.location || "", district: "", owner: p.ownerName || "", landType: p.type || "", area: p.area || "", historyCount: 0 };
    }
  });
  return Object.values(byUlp);
}

function surname(name) {
  const parts = String(name || "").trim().split(/\s+/);
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : parts[0].toLowerCase();
}

export function findMatches(req) {
  const clues = req.clues || {};
  const locQ = `${clues.village || ""} ${clues.location || ""} ${clues.district || ""}`.toLowerCase();
  const ownerQ = surname(clues.ownerName) || surname((req.claim || {}).owners);
  const typeQ = String(clues.landType || "").toLowerCase();
  return candidates()
    .map((c) => {
      const locHit = locQ.trim() && `${c.village} ${c.ulpin}`.toLowerCase().split(/[\s,]+/).some((w) => w.length > 3 && locQ.includes(w));
      const ownerHit = ownerQ.length > 2 && c.owner.toLowerCase().includes(ownerQ);
      const typeHit = typeQ && typeQ !== "don't know" && c.landType.toLowerCase().includes(typeQ);
      const districtHit = String(clues.district || "").trim().toLowerCase() &&
        String(c.district || "").toLowerCase() === String(clues.district).trim().toLowerCase();
      const score = (locHit ? 2 : 0) + (ownerHit ? 2 : 0) + (typeHit ? 1 : 0) + (districtHit ? 1 : 0);
      return {
        ...c,
        score,
        indicators: {
          location: locHit ? "match" : "none",
          owner: ownerHit ? "match" : "none",
          area: typeHit ? "partial" : "none",
          history: c.historyCount > 0
        }
      };
    })
    .filter((c) => c.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

/* ---------- stores ---------- */

function read(key, fallback) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "null");
    return v === null ? fallback : v;
  } catch {
    return fallback;
  }
}

function write(key, val) {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.warn("[LDR] persist failed:", e);
  }
}

export function getCitizenRequests() {
  return read(LDR_STORE, []);
}

export function saveCitizenRequest(req) {
  const list = getCitizenRequests();
  list.unshift(req);
  write(LDR_STORE, list);
}

export function updateCitizenRequest(id, patch) {
  const list = getCitizenRequests().map((r) => (r.id === id ? { ...r, ...patch } : r));
  write(LDR_STORE, list);
}

export function getLdrOverrides() {
  return read(LDR_ADMIN_STORE, {});
}

function applyOverride(req, ov) {
  if (!ov) return normalizeStage(req);
  const out = { ...req };
  ["stage", "department", "priority", "assignee", "resolution", "discovered"].forEach((k) => {
    if (ov[k] !== undefined) out[k] = ov[k];
  });
  if (Array.isArray(ov.matches)) out.matches = ov.matches;
  if (Array.isArray(ov.historyPrepend)) out.history = [...ov.historyPrepend, ...out.history];
  if (Array.isArray(ov.infoAdded)) out.infoAdded = [...(out.infoAdded || []), ...ov.infoAdded];
  return normalizeStage(out);
}

function normalizeStage(req) {
  if (req && LEGACY_STAGE_MAP[req.stage]) req.stage = LEGACY_STAGE_MAP[req.stage];
  return req;
}

export function getAllRequests() {
  const ov = getLdrOverrides();
  const seen = new Set();
  const list = SEED_LDRS.map((s) => {
    seen.add(s.id);
    return applyOverride(JSON.parse(JSON.stringify(s)), ov[s.id]);
  });
  getCitizenRequests().forEach((c) => {
    if (!c || !c.id || seen.has(c.id)) return;
    seen.add(c.id);
    list.unshift(applyOverride(c, ov[c.id]));
  });
  return list;
}

export function getRequest(id) {
  return getAllRequests().find((r) => r.id === id) || null;
}

export function saveRequestPatch(id, patch) {
  const ov = getLdrOverrides();
  ov[id] = { ...(ov[id] || {}), ...patch };
  write(LDR_ADMIN_STORE, ov);
}

export function prependRequestHistory(id, entry) {
  const ov = getLdrOverrides();
  const cur = ov[id] || {};
  cur.historyPrepend = [entry, ...(cur.historyPrepend || [])];
  ov[id] = cur;
  write(LDR_ADMIN_STORE, ov);
}

export function activeLdrCount() {
  return getAllRequests().filter((r) => !["Resolved", "Rejected"].includes(r.stage)).length;
}

export function nowStamp() {
  return new Date().toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit"
  });
}
