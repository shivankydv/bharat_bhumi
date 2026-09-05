import { getCurrentUser, getSession, logout, requirePortal } from "./services/auth-service.js";
import { pendingCount } from "./admin-data.js";

const $ = (id) => document.getElementById(id);
const PREF_KEY = "bb_admin_prefs";

function toast(msg) {
  const el = $("admin-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 2600);
}

function loadPrefs() {
  try {
    return { queueAlerts: true, decisionAlerts: true, dailyDigest: false, ...(JSON.parse(localStorage.getItem(PREF_KEY) || "{}")) };
  } catch {
    return { queueAlerts: true, decisionAlerts: true, dailyDigest: false };
  }
}

function renderProfile() {
  const user = getCurrentUser() || {};
  const session = (typeof getSession === "function" ? getSession() : null) || {};
  const rows = [
    ["USERNAME", user.username || "—"],
    ["ROLE", user.role || "ADMIN"],
    ["ACCESS SCOPE", "Revenue, Registration, Survey, Planning, Municipal, Legal (demo scope)"],
    ["SESSION STARTED", session.loggedInAt ? new Date(session.loggedInAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "—"]
  ];
  const box = $("admin-profile");
  if (box) {
    box.innerHTML = `<dl class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">` + rows.map(([k, v]) =>
      `<div class="rounded-lg border border-outline-variant/50 bg-surface-container-low p-3">
         <dt class="text-label-sm font-semibold text-on-surface-variant">${k}</dt>
         <dd class="font-medium text-on-surface mt-0.5">${v}</dd>
       </div>`).join("") + `</dl>`;
  }
}

function renderPrefs() {
  const prefs = loadPrefs();
  [["pref-queue", "queueAlerts"], ["pref-decisions", "decisionAlerts"], ["pref-digest", "dailyDigest"]].forEach(([id, key]) => {
    const el = $(id);
    if (el) {
      el.checked = Boolean(prefs[key]);
      el.addEventListener("change", () => {
        const p = loadPrefs();
        p[key] = el.checked;
        try {
          localStorage.setItem(PREF_KEY, JSON.stringify(p));
        } catch (e) {
          console.warn("[Admin Settings] Failed to persist prefs:", e);
        }
        toast("Preference saved (demo).");
      });
    }
  });
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
  if ($("btn-logout-all")) $("btn-logout-all").addEventListener("click", doLogout);
}

function init() {
  if (!requirePortal("admin")) return;
  setupSession();
  renderProfile();
  renderPrefs();
}

document.addEventListener("DOMContentLoaded", init);
