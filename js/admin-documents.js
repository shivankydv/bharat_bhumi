import { getCurrentUser, logout, requirePortal } from "./services/auth-service.js";
import { getApplications, pendingCount, saveApplicationPatch, prependHistory, nowStamp } from "./admin-data.js";

const $ = (id) => document.getElementById(id);
let viewing = null;

function toast(msg, isError) {
  const el = $("admin-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle("bg-error", Boolean(isError));
  el.classList.toggle("bg-primary", !isError);
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 2600);
}

function docBadge(status) {
  const cls = status === "Verified" ? "status-verified"
    : status === "Rejected" ? "status-rejected"
    : status === "Missing" ? "status-neutral" : "status-pending";
  return `<span class="status-badge ${cls}">${status}</span>`;
}

function allDocs() {
  const out = [];
  getApplications().forEach((a) => {
    a.docs.forEach((d, i) => {
      out.push({ appId: a.id, citizen: a.citizen, ulpin: a.ulpin, docIndex: i, ...d });
    });
  });
  return out;
}

function getFiltered() {
  const q = (($("doc-search") || {}).value || "").trim().toLowerCase();
  const status = $("f-status") ? $("f-status").value : "all";
  return allDocs().filter((d) => {
    if (status !== "all" && d.status !== status) return false;
    if (!q) return true;
    return d.name.toLowerCase().includes(q) || d.citizen.toLowerCase().includes(q) ||
      d.appId.toLowerCase().includes(q) || String(d.ulpin || "").toLowerCase().includes(q);
  });
}

function render() {
  const list = getFiltered();
  if ($("docs-count")) $("docs-count").textContent = `Showing ${list.length} document${list.length === 1 ? "" : "s"}`;
  const empty = $("empty-state");
  const row = (d) => `
    <tr class="border-b border-outline-variant/30 hover:bg-surface-container-high transition">
      <td class="px-6 py-4 text-sm font-semibold text-on-surface">${d.name}</td>
      <td class="px-6 py-4 text-sm text-secondary">${d.citizen}</td>
      <td class="px-6 py-4 text-sm font-mono text-primary whitespace-nowrap">${d.appId}</td>
      <td class="px-6 py-4 text-sm font-mono text-secondary whitespace-nowrap">${d.ulpin}</td>
      <td class="px-6 py-4 text-sm text-secondary">${d.type}</td>
      <td class="px-6 py-4 text-sm text-secondary whitespace-nowrap">${d.uploaded || "—"}</td>
      <td class="px-6 py-4">${docBadge(d.status)}</td>
      <td class="px-6 py-4 text-right whitespace-nowrap">
        <button class="doc-view text-primary hover:underline text-sm font-semibold" data-app="${d.appId}" data-idx="${d.docIndex}">View</button>
        ${d.status === "Pending Verification" ? `
          <span class="text-outline-variant mx-1">|</span>
          <button class="doc-verify text-[#16A34A] hover:underline text-sm font-semibold" data-app="${d.appId}" data-idx="${d.docIndex}">Verify</button>
          <span class="text-outline-variant mx-1">|</span>
          <button class="doc-reject text-error hover:underline text-sm font-semibold" data-app="${d.appId}" data-idx="${d.docIndex}">Reject</button>` : ""}
      </td>
    </tr>`;
  const tb = $("docs-tbody");
  if (tb) tb.innerHTML = list.map(row).join("");
  const cards = $("docs-cards");
  if (cards) {
    cards.innerHTML = list.map((d) => `
      <div class="bg-white rounded-lg border border-outline-variant/40 shadow-sm p-4">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0"><p class="font-bold text-on-surface text-sm">${d.name}</p>
          <p class="text-xs text-secondary truncate">${d.citizen} • ${d.appId}</p></div>
          ${docBadge(d.status)}
        </div>
        <p class="text-xs text-secondary mt-1">${d.ulpin} • ${d.type} • ${d.uploaded || "—"}</p>
        <div class="mt-3 flex gap-2">
          <button class="doc-view flex-1 px-3 py-2 rounded-md border border-outline-variant text-sm font-semibold text-primary" data-app="${d.appId}" data-idx="${d.docIndex}">View</button>
          ${d.status === "Pending Verification" ? `<button class="doc-verify flex-1 px-3 py-2 rounded-md bg-primary text-white text-sm font-semibold" data-app="${d.appId}" data-idx="${d.docIndex}">Verify</button>` : ""}
        </div>
      </div>`).join("");
  }
  if (empty) empty.classList.toggle("hidden", list.length > 0);
  document.querySelectorAll(".doc-view").forEach((b) =>
    b.addEventListener("click", () => openPreview(b.getAttribute("data-app"), Number(b.getAttribute("data-idx")))));
  document.querySelectorAll(".doc-verify").forEach((b) =>
    b.addEventListener("click", () => setDocStatus(b.getAttribute("data-app"), Number(b.getAttribute("data-idx")), "Verified", "verified by Admin")));
  document.querySelectorAll(".doc-reject").forEach((b) =>
    b.addEventListener("click", () => openReject(b.getAttribute("data-app"), Number(b.getAttribute("data-idx")))));
}

function findDoc(appId, idx) {
  const app = getApplications().find((a) => a.id === appId);
  return app && app.docs[idx] ? { app, doc: app.docs[idx] } : null;
}

function setDocStatus(appId, idx, status, activitySuffix) {
  const found = findDoc(appId, idx);
  if (!found) return;
  const docs = found.app.docs.map((d, j) => (j === idx ? { ...d, status } : d));
  saveApplicationPatch(appId, { docs });
  const user = getCurrentUser() || {};
  prependHistory(appId, { time: nowStamp(), text: `${found.doc.name} ${activitySuffix} (by ${user.username || "Admin"})` });
  render();
}

function openPreview(appId, idx) {
  const found = findDoc(appId, idx);
  if (!found) return;
  viewing = { appId, idx };
  if ($("doc-title")) $("doc-title").textContent = found.doc.name;
  if ($("doc-body")) {
    $("doc-body").innerHTML = `
      <div class="rounded-lg border border-outline-variant/50 bg-surface-container-low p-8 text-center">
        <span class="material-symbols-outlined text-6xl text-primary">picture_as_pdf</span>
        <p class="mt-2 font-bold">${found.doc.name}</p>
        <p class="mt-1 inline-block text-xs font-bold px-2 py-1 rounded bg-[#fdf3c7] text-[#936b00]">DEMO DOCUMENT — NOT AN OFFICIAL GOVERNMENT DOCUMENT</p>
      </div>
      <dl class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div><dt class="text-label-sm font-semibold text-on-surface-variant">APPLICATION</dt><dd class="font-mono text-primary">${appId}</dd></div>
        <div><dt class="text-label-sm font-semibold text-on-surface-variant">CITIZEN</dt><dd>${found.app.citizen}</dd></div>
        <div><dt class="text-label-sm font-semibold text-on-surface-variant">TYPE / UPLOADED</dt><dd>${found.doc.type} • ${found.doc.uploaded || "—"}</dd></div>
        <div><dt class="text-label-sm font-semibold text-on-surface-variant">STATUS</dt><dd class="mt-1">${docBadge(found.doc.status)}</dd></div>
      </dl>`;
  }
  const canAct = found.doc.status === "Pending Verification";
  if ($("doc-verify-btn")) $("doc-verify-btn").classList.toggle("hidden", !canAct);
  if ($("doc-reject-btn")) $("doc-reject-btn").classList.toggle("hidden", !canAct);
  const m = $("doc-modal");
  if (m) { m.classList.remove("hidden"); m.classList.add("flex"); }
}

function closePreview() {
  const m = $("doc-modal");
  if (m) { m.classList.add("hidden"); m.classList.remove("flex"); }
  viewing = null;
}

function openReject(appId, idx) {
  const found = findDoc(appId, idx);
  if (!found) return;
  viewing = { appId, idx };
  if ($("docreject-name")) $("docreject-name").textContent = found.doc.name;
  if ($("docreject-reason")) $("docreject-reason").value = "";
  const e = $("docreject-error");
  if (e) { e.classList.add("hidden"); e.textContent = ""; }
  const m = $("docreject-modal");
  if (m) { m.classList.remove("hidden"); m.classList.add("flex"); }
}

function closeReject() {
  const m = $("docreject-modal");
  if (m) { m.classList.add("hidden"); m.classList.remove("flex"); }
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
  if (!requirePortal("admin")) return;
  setupSession();
  render();
  if ($("doc-search")) $("doc-search").addEventListener("input", render);
  if ($("f-status")) $("f-status").addEventListener("change", render);
  if ($("btn-clear-filters")) $("btn-clear-filters").addEventListener("click", () => {
    if ($("doc-search")) $("doc-search").value = "";
    if ($("f-status")) $("f-status").value = "all";
    render();
  });
  if ($("doc-close")) $("doc-close").addEventListener("click", closePreview);
  if ($("doc-close-btn")) $("doc-close-btn").addEventListener("click", closePreview);
  if ($("doc-verify-btn")) $("doc-verify-btn").addEventListener("click", () => {
    if (viewing) {
      setDocStatus(viewing.appId, viewing.idx, "Verified", "verified by Admin");
      closePreview();
      toast("Document verified (demo).");
    }
  });
  if ($("doc-reject-btn")) $("doc-reject-btn").addEventListener("click", () => {
    if (viewing) {
      closePreview();
      openReject(viewing.appId, viewing.idx);
    }
  });
  if ($("docreject-close")) $("docreject-close").addEventListener("click", closeReject);
  if ($("docreject-cancel")) $("docreject-cancel").addEventListener("click", closeReject);
  if ($("btn-docreject-confirm")) $("btn-docreject-confirm").addEventListener("click", () => {
    const reason = $("docreject-reason") ? $("docreject-reason").value.trim() : "";
    if (!reason) {
      const e = $("docreject-error");
      if (e) {
        e.textContent = "A reason is required to reject a document.";
        e.classList.remove("hidden");
      }
      return;
    }
    if (viewing) {
      const docs = getApplications().find((a) => a.id === viewing.appId).docs
        .map((d, j) => (j === viewing.idx ? { ...d, status: "Rejected" } : d));
      saveApplicationPatch(viewing.appId, { docs });
      const user = getCurrentUser() || {};
      prependHistory(viewing.appId, { time: nowStamp(), text: `Document rejected by ${user.username || "Admin"} — ${reason}` });
      render();
    }
    closeReject();
    toast("Document rejected (demo).");
  });
  const dm = $("doc-modal");
  if (dm) dm.addEventListener("click", (e) => { if (e.target === dm) closePreview(); });
  const rm = $("docreject-modal");
  if (rm) rm.addEventListener("click", (e) => { if (e.target === rm) closeReject(); });
}

document.addEventListener("DOMContentLoaded", init);

export { getFiltered };
