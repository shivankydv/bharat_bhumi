import { getCurrentUser, logout, requirePortal } from "./services/auth-service.js";
import { ADMIN_TRANSACTIONS, pendingCount } from "./admin-data.js";

const $ = (id) => document.getElementById(id);
const fmt = (n) => "₹ " + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function badge(status) {
  const cls = status === "Successful" ? "status-verified"
    : status === "Failed" ? "status-rejected" : "status-pending";
  return `<span class="status-badge ${cls}">${status}</span>`;
}

function getFiltered() {
  const q = (($("txn-search") || {}).value || "").trim().toLowerCase();
  const status = $("f-status") ? $("f-status").value : "all";
  return ADMIN_TRANSACTIONS.filter((t) => {
    if (status !== "all" && t.status !== status) return false;
    if (!q) return true;
    return t.id.toLowerCase().includes(q) || t.citizen.toLowerCase().includes(q) ||
      t.app.toLowerCase().includes(q) || t.service.toLowerCase().includes(q);
  });
}

function render() {
  const list = getFiltered();
  if ($("txn-count")) $("txn-count").textContent = `Showing ${list.length} transaction${list.length === 1 ? "" : "s"}`;
  const empty = $("empty-state");
  const row = (t) => `
    <tr class="border-b border-outline-variant/30 hover:bg-surface-container-high transition">
      <td class="px-6 py-4 font-mono text-sm font-semibold text-primary whitespace-nowrap">${t.id}</td>
      <td class="px-6 py-4 text-sm font-semibold text-on-surface">${t.citizen}</td>
      <td class="px-6 py-4 text-sm font-mono text-secondary whitespace-nowrap">${t.app}</td>
      <td class="px-6 py-4 text-sm text-secondary">${t.service}</td>
      <td class="px-6 py-4 text-sm font-bold text-on-surface whitespace-nowrap">${fmt(t.amount)}</td>
      <td class="px-6 py-4 text-sm text-secondary whitespace-nowrap">${t.date}</td>
      <td class="px-6 py-4 text-sm text-secondary">${t.method}</td>
      <td class="px-6 py-4">${badge(t.status)}</td>
      <td class="px-6 py-4 text-right">
        <button class="txn-receipt text-primary hover:underline text-sm font-semibold" data-id="${t.id}">Receipt</button>
      </td>
    </tr>`;
  const tb = $("txn-tbody");
  if (tb) tb.innerHTML = list.map(row).join("");
  const cards = $("txn-cards");
  if (cards) {
    cards.innerHTML = list.map((t) => `
      <div class="bg-white rounded-lg border border-outline-variant/40 shadow-sm p-4">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0"><p class="font-mono font-bold text-primary text-sm">${t.id}</p>
          <p class="font-semibold text-on-surface text-sm truncate">${t.citizen} • ${t.service}</p></div>
          ${badge(t.status)}
        </div>
        <p class="text-xs text-secondary mt-1">${t.date} • ${t.method}</p>
        <div class="mt-2 flex items-center justify-between">
          <p class="text-lg font-bold">${fmt(t.amount)}</p>
          <button class="txn-receipt px-3 py-2 rounded-md bg-primary text-white text-sm font-semibold" data-id="${t.id}">Receipt</button>
        </div>
      </div>`).join("");
  }
  if (empty) empty.classList.toggle("hidden", list.length > 0);
  document.querySelectorAll(".txn-receipt").forEach((b) =>
    b.addEventListener("click", () => downloadReceipt(b.getAttribute("data-id"))));
}

function downloadReceipt(id) {
  const t = ADMIN_TRANSACTIONS.find((x) => x.id === id);
  if (!t) return;
  const lines = [
    "BHARAT BHUMI - PAYMENT RECEIPT (DEMO)", "=====================================",
    `Transaction ID: ${t.id}`, `Citizen: ${t.citizen}`, `Application: ${t.app}`,
    `Service: ${t.service}`, `Amount: ${fmt(t.amount)}`, `Date: ${t.date}`,
    `Method: ${t.method}`, `Status: ${t.status}`, "",
    "Note: Demo receipt generated locally for SIH 2026 demonstration."
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/plain" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Receipt_${t.id}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
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
  if ($("txn-search")) $("txn-search").addEventListener("input", render);
  if ($("f-status")) $("f-status").addEventListener("change", render);
  if ($("btn-clear-filters")) $("btn-clear-filters").addEventListener("click", () => {
    if ($("txn-search")) $("txn-search").value = "";
    if ($("f-status")) $("f-status").value = "all";
    render();
  });
}

document.addEventListener("DOMContentLoaded", init);

export { getFiltered };
