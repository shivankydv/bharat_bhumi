import { isAuthenticated, getCurrentUser, logout, requirePortal } from "./services/auth-service.js";

/* Demo land-record documents (no document API exists in backend — do not invent endpoints). */
const SEED_DOCUMENTS = [
  { id: "DOC-1001", name: "Sale Deed", type: "Deed", ref: "MUT-2024-8921A", uploadedDate: "Oct 12, 2024", status: "verified", size: "2.4 MB", format: "PDF" },
  { id: "DOC-1002", name: "Aadhaar Card (Identity Proof)", type: "Identity Proof", ref: "CIT-2019-00417", uploadedDate: "Oct 12, 2024", status: "verified", size: "1.1 MB", format: "JPG" },
  { id: "DOC-1003", name: "Record of Rights (RoR)", type: "Record of Rights", ref: "IN-MH-789-456-123", uploadedDate: "Oct 15, 2024", status: "verified", size: "0.8 MB", format: "PDF" },
  { id: "DOC-1004", name: "Encumbrance Certificate", type: "Encumbrance Certificate", ref: "IN-DL-102-334-008", uploadedDate: "Oct 18, 2024", status: "pending", size: "0.6 MB", format: "PDF" },
  { id: "DOC-1005", name: "Property Tax Receipt (FY 23-24)", type: "Tax Receipt", ref: "IN-MH-789-456-123", uploadedDate: "Oct 20, 2024", status: "verified", size: "0.3 MB", format: "PDF" },
  { id: "DOC-1006", name: "Mutation Application Form", type: "Application Form", ref: "MUT-2024-8921A", uploadedDate: "Oct 12, 2024", status: "pending", size: "0.5 MB", format: "PDF" },
  { id: "DOC-1007", name: "Survey Sketch", type: "Survey", ref: "IN-DL-207-118-540", uploadedDate: "Oct 22, 2024", status: "rejected", size: "1.9 MB", format: "PDF" }
];

const STORE_KEY = "bb_documents_uploads";

const $ = (id) => document.getElementById(id);

function loadUploads() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveUploads(list) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("[Documents] Failed to persist uploads:", e);
  }
}

function allDocuments() {
  return [...loadUploads(), ...SEED_DOCUMENTS];
}

function toast(msg) {
  const el = $("docs-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 2600);
}

function statusBadge(status) {
  const cls = status === "verified" ? "status-verified" : status === "pending" ? "status-pending" : "status-rejected";
  const label = status === "verified" ? "Verified" : status === "pending" ? "Pending" : "Rejected";
  return `<span class="status-badge ${cls}">${label}</span>`;
}

function typeIcon(format) {
  return format === "PDF" ? "picture_as_pdf" : "image";
}

function getFiltered() {
  const q = (($("doc-search") || {}).value || "").trim().toLowerCase();
  const type = $("type-filter") ? $("type-filter").value : "all";
  const status = $("status-filter") ? $("status-filter").value : "all";
  return allDocuments().filter((d) => {
    if (type !== "all" && d.type !== type) return false;
    if (status !== "all" && d.status !== status) return false;
    if (!q) return true;
    return d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q) || d.ref.toLowerCase().includes(q);
  });
}

function renderStats() {
  const docs = allDocuments();
  if ($("stats-total")) $("stats-total").textContent = docs.length;
  if ($("stats-verified")) $("stats-verified").textContent = docs.filter((d) => d.status === "verified").length;
  if ($("stats-pending")) $("stats-pending").textContent = docs.filter((d) => d.status === "pending").length;
  if ($("stats-rejected")) $("stats-rejected").textContent = docs.filter((d) => d.status === "rejected").length;
}

function renderAll() {
  const list = getFiltered();
  renderStats();
  if ($("doc-count")) $("doc-count").textContent = `Showing ${list.length} document${list.length === 1 ? "" : "s"}`;
  const empty = $("empty-state");
  const tbody = $("docs-tbody");
  const cards = $("docs-cards");
  if (!list.length) {
    if (tbody) tbody.innerHTML = "";
    if (cards) cards.innerHTML = "";
    if (empty) empty.classList.remove("hidden");
    return;
  }
  if (empty) empty.classList.add("hidden");
  if (tbody) {
    tbody.innerHTML = list.map((d) => `
      <tr class="border-b border-outline-variant/30 hover:bg-surface-container-high transition">
        <td class="px-6 py-4"><div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-primary">${typeIcon(d.format)}</span>
          <div><p class="font-semibold text-on-surface">${d.name}</p><p class="text-xs text-secondary">${d.format} • ${d.size}</p></div>
        </div></td>
        <td class="px-6 py-4 text-sm text-secondary">${d.type}</td>
        <td class="px-6 py-4 text-sm font-mono text-primary truncate" title="${d.ref}">${d.ref}</td>
        <td class="px-6 py-4 text-sm text-secondary whitespace-nowrap">${d.uploadedDate}</td>
        <td class="px-6 py-4">${statusBadge(d.status)}</td>
        <td class="px-6 py-4 text-right whitespace-nowrap">
          <button class="doc-view text-primary hover:underline text-sm font-semibold" data-id="${d.id}">View</button>
          <span class="text-outline-variant mx-1">|</span>
          <button class="doc-download text-primary hover:underline text-sm font-semibold" data-id="${d.id}">Download</button>
        </td>
      </tr>`).join("");
  }
  if (cards) {
    cards.innerHTML = list.map((d) => `
      <div class="bg-white rounded-lg border border-outline-variant/40 shadow-sm p-4">
        <div class="flex items-start gap-3">
          <span class="material-symbols-outlined text-primary">${typeIcon(d.format)}</span>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-on-surface truncate">${d.name}</h3>
            <p class="text-xs text-secondary truncate">${d.type} • ${d.ref}</p>
          </div>
          ${statusBadge(d.status)}
        </div>
        <p class="mt-2 text-xs text-secondary">${d.uploadedDate} • ${d.format} • ${d.size}</p>
        <div class="mt-3 flex gap-2">
          <button class="doc-view flex-1 px-3 py-2 rounded-md border border-outline-variant text-sm font-semibold text-primary" data-id="${d.id}">View</button>
          <button class="doc-download flex-1 px-3 py-2 rounded-md bg-primary text-white text-sm font-semibold" data-id="${d.id}">Download</button>
        </div>
      </div>`).join("");
  }
  document.querySelectorAll(".doc-view").forEach((b) =>
    b.addEventListener("click", () => openPreview(b.getAttribute("data-id"))));
  document.querySelectorAll(".doc-download").forEach((b) =>
    b.addEventListener("click", () => downloadDoc(b.getAttribute("data-id"))));
}

function findDoc(id) {
  return allDocuments().find((d) => d.id === id);
}

function openPreview(id) {
  const d = findDoc(id);
  if (!d) return;
  if ($("modal-title")) $("modal-title").innerHTML =
    `<span class="material-symbols-outlined text-primary">${typeIcon(d.format)}</span> ${d.name}`;
  if ($("modal-body")) $("modal-body").innerHTML = `
    <div class="rounded-lg border border-outline-variant/50 bg-surface-container-low p-6 text-center">
      <span class="material-symbols-outlined text-5xl text-primary">${typeIcon(d.format)}</span>
      <p class="mt-2 font-bold text-on-surface">${d.name}</p>
      <p class="text-sm text-secondary">${d.format} • ${d.size} • Demo preview</p>
    </div>
    <dl class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      <div><dt class="text-label-sm font-semibold text-on-surface-variant">DOCUMENT TYPE</dt><dd class="font-medium text-on-surface">${d.type}</dd></div>
      <div><dt class="text-label-sm font-semibold text-on-surface-variant">APPLICATION ID / ULPIN</dt><dd class="font-mono text-primary">${d.ref}</dd></div>
      <div><dt class="text-label-sm font-semibold text-on-surface-variant">UPLOADED DATE</dt><dd class="text-on-surface">${d.uploadedDate}</dd></div>
      <div><dt class="text-label-sm font-semibold text-on-surface-variant">VERIFICATION STATUS</dt><dd class="mt-1">${statusBadge(d.status)}</dd></div>
    </dl>
    <p class="mt-3 text-xs text-secondary">Preview shows record metadata in this demo. The source file stays with the issuing department.</p>`;
  const m = $("doc-modal");
  if (m) { m.classList.remove("hidden"); m.classList.add("flex"); }
}

function closePreview() {
  const m = $("doc-modal");
  if (m) { m.classList.add("hidden"); m.classList.remove("flex"); }
}

function downloadDoc(id) {
  const d = findDoc(id);
  if (!d) return;
  const lines = [
    "BHARAT BHUMI - DOCUMENT RECORD (DEMO)",
    "=====================================",
    `Document: ${d.name}`,
    `Type: ${d.type}`,
    `Application ID / ULPIN: ${d.ref}`,
    `Uploaded: ${d.uploadedDate}`,
    `Status: ${d.status}`,
    `File: ${d.format}, ${d.size}`,
    "",
    "Note: Demo record summary generated locally for SIH 2026 frontend demonstration."
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${d.name.replace(/[^A-Za-z0-9]+/g, "_")}_${d.id}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(`Downloaded ${d.name} (demo)`);
}

function openUpload() {
  const m = $("upload-modal");
  if (m) { m.classList.remove("hidden"); m.classList.add("flex"); }
}

function closeUpload() {
  const m = $("upload-modal");
  if (m) { m.classList.add("hidden"); m.classList.remove("flex"); }
}

function submitUpload() {
  const fileInput = $("upload-file");
  const file = fileInput && fileInput.files && fileInput.files[0];
  if (!file) {
    toast("Please choose a file first");
    return;
  }
  const type = $("upload-type") ? $("upload-type").value : "Other";
  const ref = $("upload-ref") && $("upload-ref").value.trim()
    ? $("upload-ref").value.trim()
    : "MUT-2024-8921A";
  const ext = (file.name.split(".").pop() || "PDF").toUpperCase().slice(0, 4);
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const uploads = loadUploads();
  uploads.unshift({
    id: `DOC-${Date.now().toString().slice(-6)}`,
    name: file.name.replace(/\.[^.]+$/, "") || "Untitled Document",
    type,
    ref,
    uploadedDate: today,
    status: "pending",
    size: file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`,
    format: ext
  });
  saveUploads(uploads);
  if (fileInput) fileInput.value = "";
  if ($("upload-ref")) $("upload-ref").value = "";
  if ($("upload-file-label")) $("upload-file-label").textContent = "Choose file…";
  closeUpload();
  renderAll();
  toast("Document uploaded — pending verification (demo)");
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
  renderAll();
  if ($("doc-search")) $("doc-search").addEventListener("input", renderAll);
  if ($("type-filter")) $("type-filter").addEventListener("change", renderAll);
  if ($("status-filter")) $("status-filter").addEventListener("change", renderAll);
  if ($("btn-clear-filters")) $("btn-clear-filters").addEventListener("click", () => {
    if ($("doc-search")) $("doc-search").value = "";
    if ($("type-filter")) $("type-filter").value = "all";
    if ($("status-filter")) $("status-filter").value = "all";
    renderAll();
  });
  if ($("btn-upload-doc")) $("btn-upload-doc").addEventListener("click", openUpload);
  if ($("btn-empty-upload")) $("btn-empty-upload").addEventListener("click", openUpload);
  if ($("upload-close")) $("upload-close").addEventListener("click", closeUpload);
  if ($("upload-close-btn")) $("upload-close-btn").addEventListener("click", closeUpload);
  if ($("btn-submit-upload")) $("btn-submit-upload").addEventListener("click", submitUpload);
  if ($("upload-file")) $("upload-file").addEventListener("change", (e) => {
    const f = e.target.files && e.target.files[0];
    if ($("upload-file-label")) $("upload-file-label").textContent = f ? `${f.name}` : "Choose file…";
  });
  if ($("modal-close")) $("modal-close").addEventListener("click", closePreview);
  if ($("modal-close-btn")) $("modal-close-btn").addEventListener("click", closePreview);
  const m = $("doc-modal");
  if (m) m.addEventListener("click", (e) => { if (e.target === m) closePreview(); });
  const u = $("upload-modal");
  if (u) u.addEventListener("click", (e) => { if (e.target === u) closeUpload(); });
}

document.addEventListener("DOMContentLoaded", init);
