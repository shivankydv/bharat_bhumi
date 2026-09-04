import { isAuthenticated, getCurrentUser, logout } from "./services/auth-service.js";

/* Demo payment data (no payment API exists in backend — do not invent endpoints). */
const DUE = {
  appId: "MUT-2024-8921A",
  service: "Property Mutation Fee (Balance)",
  ulpin: "IN-MH-789-456-123",
  amount: 1750,
  dueDate: "Oct 30, 2024"
};

const SEED_TXNS = [
  { id: "TXN-88120451", date: "Oct 12, 2024", service: "Property Mutation Fee (Advance)", category: "Mutation", appRef: "MUT-2024-8921A", amount: 2500, method: "UPI", status: "success" },
  { id: "TXN-88119770", date: "Oct 15, 2024", service: "Record of Rights Fee", category: "Record of Rights", appRef: "IN-MH-789-456-123", amount: 150, method: "Card", status: "success" },
  { id: "TXN-88115002", date: "Sep 28, 2024", service: "Property Tax (FY 23-24)", category: "Property Tax", appRef: "IN-MH-789-456-123", amount: 4850, method: "Net Banking", status: "success" },
  { id: "TXN-88109934", date: "Sep 20, 2024", service: "Encumbrance Certificate Fee", category: "Encumbrance Certificate", appRef: "IN-DL-102-334-008", amount: 350, method: "UPI", status: "pending" },
  { id: "TXN-88107112", date: "Sep 12, 2024", service: "Property Tax (FY 23-24)", category: "Property Tax", appRef: "IN-DL-102-334-008", amount: 3120, method: "Card", status: "failed" }
];

const TXN_KEY = "bb_payments_txns";
const DUE_KEY = "bb_due_paid";

const $ = (id) => document.getElementById(id);
const fmt = (n) => "₹ " + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function loadExtra() {
  try {
    return JSON.parse(localStorage.getItem(TXN_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveExtra(list) {
  try {
    localStorage.setItem(TXN_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("[Payments] Failed to persist transactions:", e);
  }
}

function isDuePaid() {
  try {
    return localStorage.getItem(DUE_KEY) === "1";
  } catch {
    return false;
  }
}

function allTxns() {
  return [...loadExtra(), ...SEED_TXNS];
}

function toast(msg) {
  const el = $("pay-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 2600);
}

function statusBadge(status) {
  if (status === "success") return `<span class="status-badge status-verified">Successful</span>`;
  if (status === "pending") return `<span class="status-badge status-pending">Pending</span>`;
  return `<span class="status-badge status-failed">Failed</span>`;
}

function getFiltered() {
  const q = (($("pay-search") || {}).value || "").trim().toLowerCase();
  const status = $("status-filter") ? $("status-filter").value : "all";
  const type = $("type-filter") ? $("type-filter").value : "all";
  return allTxns().filter((t) => {
    if (status !== "all" && t.status !== status) return false;
    if (type !== "all" && t.category !== type) return false;
    if (!q) return true;
    return t.id.toLowerCase().includes(q) || t.service.toLowerCase().includes(q) ||
      t.appRef.toLowerCase().includes(q) || t.method.toLowerCase().includes(q);
  });
}

function renderStats() {
  const txns = allTxns();
  const paid = txns.filter((t) => t.status === "success").reduce((s, t) => s + t.amount, 0);
  const pendingTx = txns.filter((t) => t.status === "pending").reduce((s, t) => s + t.amount, 0);
  const pending = pendingTx + (isDuePaid() ? 0 : DUE.amount);
  if ($("stats-paid")) $("stats-paid").textContent = fmt(paid);
  if ($("stats-pending")) $("stats-pending").textContent = fmt(pending);
  if ($("stats-count")) $("stats-count").textContent = txns.length;
}

function renderDue() {
  const wrap = $("due-card");
  if (!wrap) return;
  if (isDuePaid()) {
    wrap.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
          <span class="material-symbols-outlined text-green-300 text-3xl">check_circle</span>
        </div>
        <div>
          <p class="text-label-sm font-semibold uppercase tracking-wider text-green-200">All dues cleared</p>
          <h3 class="text-xl font-bold text-white mt-1">No pending payments. Receipts are available below.</h3>
        </div>
      </div>`;
    return;
  }
  wrap.innerHTML = `
    <div class="flex flex-col lg:flex-row lg:items-center gap-6">
      <div class="flex-1">
        <p class="text-label-sm font-semibold uppercase tracking-wider text-blue-200">Payment Due</p>
        <h3 class="text-2xl font-bold text-white mt-1">${DUE.service}</h3>
        <div class="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div><p class="text-blue-200 text-xs uppercase tracking-wide">Application ID</p><p class="font-mono font-semibold text-white">${DUE.appId}</p></div>
          <div><p class="text-blue-200 text-xs uppercase tracking-wide">Property / ULPIN</p><p class="font-mono font-semibold text-white">${DUE.ulpin}</p></div>
          <div><p class="text-blue-200 text-xs uppercase tracking-wide">Due Date</p><p class="font-semibold text-white">${DUE.dueDate}</p></div>
        </div>
      </div>
      <div class="flex lg:flex-col items-center lg:items-end gap-3 flex-shrink-0">
        <p class="text-4xl font-bold text-white">${fmt(DUE.amount)}</p>
        <button id="btn-pay-now" class="flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-bold hover:bg-blue-50 transition shadow">
          <span class="material-symbols-outlined">payments</span>Pay Now
        </button>
      </div>
    </div>`;
  const btn = $("btn-pay-now");
  if (btn) btn.addEventListener("click", openPayModal);
}

function renderTxns() {
  const list = getFiltered();
  renderStats();
  renderDue();
  if ($("txn-count")) $("txn-count").textContent = `Showing ${list.length} transaction${list.length === 1 ? "" : "s"}`;
  const empty = $("empty-state");
  const tbody = $("txn-tbody");
  const cards = $("txn-cards");
  if (!list.length) {
    if (tbody) tbody.innerHTML = "";
    if (cards) cards.innerHTML = "";
    if (empty) empty.classList.remove("hidden");
    return;
  }
  if (empty) empty.classList.add("hidden");
  if (tbody) {
    tbody.innerHTML = list.map((t) => `
      <tr class="border-b border-outline-variant/30 hover:bg-surface-container-high transition">
        <td class="px-6 py-4 font-mono text-sm font-semibold text-primary whitespace-nowrap">${t.id}</td>
        <td class="px-6 py-4 text-sm text-secondary whitespace-nowrap">${t.date}</td>
        <td class="px-6 py-4"><p class="font-semibold text-on-surface">${t.service}</p><p class="text-xs font-mono text-secondary">${t.appRef}</p></td>
        <td class="px-6 py-4 font-bold text-on-surface whitespace-nowrap">${fmt(t.amount)}</td>
        <td class="px-6 py-4 text-sm text-secondary whitespace-nowrap">${t.method}</td>
        <td class="px-6 py-4">${statusBadge(t.status)}</td>
        <td class="px-6 py-4 text-right whitespace-nowrap">
          <button class="txn-view text-primary hover:underline text-sm font-semibold" data-id="${t.id}">View</button>
          <span class="text-outline-variant mx-1">|</span>
          <button class="txn-receipt text-primary hover:underline text-sm font-semibold" data-id="${t.id}">Receipt</button>
        </td>
      </tr>`).join("");
  }
  if (cards) {
    cards.innerHTML = list.map((t) => `
      <div class="bg-white rounded-lg border border-outline-variant/40 shadow-sm p-4">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0"><h3 class="font-bold text-on-surface truncate">${t.service}</h3>
          <p class="text-xs font-mono text-secondary truncate">${t.id} • ${t.appRef}</p></div>
          ${statusBadge(t.status)}
        </div>
        <p class="mt-2 text-sm text-secondary">${t.date} • ${t.method}</p>
        <div class="mt-2 flex items-center justify-between">
          <p class="text-lg font-bold text-on-surface">${fmt(t.amount)}</p>
          <div class="flex gap-2">
            <button class="txn-view px-3 py-2 rounded-md border border-outline-variant text-sm font-semibold text-primary" data-id="${t.id}">View</button>
            <button class="txn-receipt px-3 py-2 rounded-md bg-primary text-white text-sm font-semibold" data-id="${t.id}">Receipt</button>
          </div>
        </div>
      </div>`).join("");
  }
  document.querySelectorAll(".txn-view").forEach((b) =>
    b.addEventListener("click", () => openReceipt(b.getAttribute("data-id"))));
  document.querySelectorAll(".txn-receipt").forEach((b) =>
    b.addEventListener("click", () => openReceipt(b.getAttribute("data-id"))));
}

function findTxn(id) {
  return allTxns().find((t) => t.id === id);
}

/* ---------- Pay modal ---------- */
let payMethod = "UPI";

function setStep(step) {
  ["pay-step-form", "pay-step-processing", "pay-step-success"].forEach((id) => {
    const el = $(id);
    if (el) el.classList.add("hidden");
  });
  const el = $(step);
  if (el) el.classList.remove("hidden");
  const success = step === "pay-step-success";
  if ($("btn-confirm-pay")) $("btn-confirm-pay").classList.toggle("hidden", success);
  if ($("pay-cancel-btn")) $("pay-cancel-btn").classList.toggle("hidden", success);
  if ($("pay-done-btn")) $("pay-done-btn").classList.toggle("hidden", !success);
}

function openPayModal() {
  if (isDuePaid()) {
    toast("No pending dues (demo)");
    return;
  }
  if ($("pay-amount")) $("pay-amount").textContent = fmt(DUE.amount);
  if ($("pay-service")) $("pay-service").textContent = DUE.service;
  if ($("pay-app")) $("pay-app").textContent = DUE.appId;
  if ($("pay-ulpin")) $("pay-ulpin").textContent = DUE.ulpin;
  selectMethod("UPI");
  setStep("pay-step-form");
  const m = $("pay-modal");
  if (m) { m.classList.remove("hidden"); m.classList.add("flex"); }
}

function closePayModal() {
  const m = $("pay-modal");
  if (m) { m.classList.add("hidden"); m.classList.remove("flex"); }
}

function selectMethod(method) {
  payMethod = method;
  document.querySelectorAll(".pay-method").forEach((b) => {
    const active = b.getAttribute("data-method") === method;
    b.classList.toggle("border-primary", active);
    b.classList.toggle("bg-primary-fixed/20", active);
    b.classList.toggle("border-outline-variant", !active);
  });
  const labels = { UPI: "UPI ID (e.g. citizen@okhdfc)", Card: "Card Number (e.g. 4111 2222 3333 4444)", "Net Banking": "Bank (e.g. State Bank of India)" };
  if ($("pay-detail-label")) $("pay-detail-label").textContent = labels[method];
  if ($("pay-detail")) { $("pay-detail").value = ""; $("pay-detail").placeholder = labels[method]; }
}

function confirmPayment() {
  const detail = $("pay-detail") ? $("pay-detail").value.trim() : "";
  if (!detail) {
    toast(`Please enter your ${payMethod === "UPI" ? "UPI ID" : payMethod === "Card" ? "card number" : "bank name"}`);
    return;
  }
  setStep("pay-step-processing");
  setTimeout(() => {
    const txnId = `TXN-${Date.now().toString().slice(-8)}`;
    const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const extra = loadExtra();
    extra.unshift({
      id: txnId, date: today, service: DUE.service, category: "Mutation",
      appRef: DUE.appId, amount: DUE.amount, method: payMethod, status: "success"
    });
    saveExtra(extra);
    try {
      localStorage.setItem(DUE_KEY, "1");
    } catch (e) {
      console.warn("[Payments] Failed to persist due state:", e);
    }
    if ($("success-txn-id")) $("success-txn-id").textContent = txnId;
    if ($("success-amount")) $("success-amount").textContent = fmt(DUE.amount);
    setStep("pay-step-success");
    renderTxns();
    if ($("btn-success-view")) $("btn-success-view").onclick = () => { closePayModal(); openReceipt(txnId); };
    if ($("btn-success-download")) $("btn-success-download").onclick = () => downloadReceipt(txnId);
  }, 1400);
}

/* ---------- Receipt ---------- */
function openReceipt(id) {
  const t = findTxn(id);
  if (!t) return;
  if ($("receipt-title")) $("receipt-title").innerHTML =
    `<span class="material-symbols-outlined text-primary">receipt_long</span> Payment Receipt`;
  if ($("receipt-body")) $("receipt-body").innerHTML = `
    <div class="rounded-lg bg-primary text-on-primary p-5">
      <p class="text-xs uppercase tracking-wider text-blue-200">Bharat Bhumi • E-Receipt (Demo)</p>
      <p class="mt-1 text-3xl font-bold">${fmt(t.amount)}</p>
      <div class="mt-1">${statusBadge(t.status)}</div>
    </div>
    <dl class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      <div><dt class="text-label-sm font-semibold text-on-surface-variant">TRANSACTION ID</dt><dd class="font-mono font-semibold text-primary">${t.id}</dd></div>
      <div><dt class="text-label-sm font-semibold text-on-surface-variant">DATE</dt><dd class="text-on-surface">${t.date}</dd></div>
      <div><dt class="text-label-sm font-semibold text-on-surface-variant">SERVICE</dt><dd class="text-on-surface font-medium">${t.service}</dd></div>
      <div><dt class="text-label-sm font-semibold text-on-surface-variant">APPLICATION / ULPIN</dt><dd class="font-mono text-primary">${t.appRef}</dd></div>
      <div><dt class="text-label-sm font-semibold text-on-surface-variant">PAYMENT METHOD</dt><dd class="text-on-surface">${t.method}</dd></div>
      <div><dt class="text-label-sm font-semibold text-on-surface-variant">STATUS</dt><dd class="mt-1">${statusBadge(t.status)}</dd></div>
    </dl>
    <p class="mt-3 text-xs text-secondary">Challan generated by the Revenue Department gateway in this demo. GSTIN: 07GOVT0000R1Z5.</p>`;
  if ($("btn-receipt-download")) $("btn-receipt-download").onclick = () => downloadReceipt(t.id);
  const m = $("receipt-modal");
  if (m) { m.classList.remove("hidden"); m.classList.add("flex"); }
}

function closeReceipt() {
  const m = $("receipt-modal");
  if (m) { m.classList.add("hidden"); m.classList.remove("flex"); }
}

function downloadReceipt(id) {
  const t = findTxn(id);
  if (!t) return;
  const lines = [
    "BHARAT BHUMI - PAYMENT RECEIPT (DEMO)",
    "=====================================",
    `Transaction ID: ${t.id}`,
    `Date: ${t.date}`,
    `Service: ${t.service}`,
    `Application / ULPIN: ${t.appRef}`,
    `Amount: ${fmt(t.amount)}`,
    `Method: ${t.method}`,
    `Status: ${t.status}`,
    "Gateway: Revenue Department E-Pay (Demo) • GSTIN: 07GOVT0000R1Z5",
    "",
    "Note: Demo receipt generated locally for SIH 2026 frontend demonstration."
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Receipt_${t.id}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast(`Receipt downloaded for ${t.id} (demo)`);
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
  renderTxns();
  if ($("pay-search")) $("pay-search").addEventListener("input", renderTxns);
  if ($("status-filter")) $("status-filter").addEventListener("change", renderTxns);
  if ($("type-filter")) $("type-filter").addEventListener("change", renderTxns);
  if ($("btn-clear-filters")) $("btn-clear-filters").addEventListener("click", () => {
    if ($("pay-search")) $("pay-search").value = "";
    if ($("status-filter")) $("status-filter").value = "all";
    if ($("type-filter")) $("type-filter").value = "all";
    renderTxns();
  });
  document.querySelectorAll(".pay-method").forEach((b) =>
    b.addEventListener("click", () => selectMethod(b.getAttribute("data-method"))));
  if ($("btn-confirm-pay")) $("btn-confirm-pay").addEventListener("click", confirmPayment);
  if ($("pay-close")) $("pay-close").addEventListener("click", closePayModal);
  if ($("pay-cancel-btn")) $("pay-cancel-btn").addEventListener("click", closePayModal);
  if ($("pay-done-btn")) $("pay-done-btn").addEventListener("click", closePayModal);
  const pm = $("pay-modal");
  if (pm) pm.addEventListener("click", (e) => { if (e.target === pm) closePayModal(); });
  if ($("receipt-close")) $("receipt-close").addEventListener("click", closeReceipt);
  if ($("receipt-close-btn")) $("receipt-close-btn").addEventListener("click", closeReceipt);
  const rm = $("receipt-modal");
  if (rm) rm.addEventListener("click", (e) => { if (e.target === rm) closeReceipt(); });
}

document.addEventListener("DOMContentLoaded", init);
