import { isAuthenticated, getCurrentUser, getSession, logout } from "./services/auth-service.js";

/* Frontend-only persistence (no profile/settings API exists in backend — do not invent endpoints). */
const PREF_KEY = "bb_settings_prefs";
const PROFILE_KEY = "bb_profile";

const DEFAULT_PREFS = {
  notif: { appStatus: true, payments: true, docVerify: true, sms: true, email: false },
  lang: "en",
  textSize: "normal",
  highContrast: false,
  reducedMotion: false
};

const I18N = {
  en: {
    title: "Settings",
    subtitle: "Manage your account, preferences and portal access.",
    secProfile: "Profile & Account",
    secSecurity: "Security",
    secNotif: "Notifications",
    secLang: "Language & Accessibility",
    secPrivacy: "Privacy & Data",
    secHelp: "Help & Support",
    saved: "Settings saved."
  },
  hi: {
    title: "सेटिंग्स",
    subtitle: "अपना खाता, प्राथमिकताएँ और पोर्टल एक्सेस प्रबंधित करें।",
    secProfile: "प्रोफ़ाइल और खाता",
    secSecurity: "सुरक्षा",
    secNotif: "सूचनाएँ",
    secLang: "भाषा और सुगमता",
    secPrivacy: "गोपनीयता और डेटा",
    secHelp: "सहायता और समर्थन",
    saved: "सेटिंग्स सहेजी गईं।"
  }
};

const $ = (id) => document.getElementById(id);

function loadPrefs() {
  try {
    const raw = JSON.parse(localStorage.getItem(PREF_KEY) || "{}");
    return { ...DEFAULT_PREFS, ...raw, notif: { ...DEFAULT_PREFS.notif, ...(raw.notif || {}) } };
  } catch {
    return JSON.parse(JSON.stringify(DEFAULT_PREFS));
  }
}

function savePrefs(prefs) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.warn("[Settings] Failed to persist preferences:", e);
  }
}

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
  } catch {
    return {};
  }
}

function toast(msg, isError) {
  const el = $("settings-toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.toggle("bg-error", Boolean(isError));
  el.classList.toggle("bg-primary", !isError);
  el.classList.remove("hidden");
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.add("hidden"), 2600);
}

/* ---------- A. Profile ---------- */
function renderProfile() {
  const user = getCurrentUser() || {};
  const stored = loadProfile();
  const fullName = stored.fullName || user.username || "Citizen";
  if ($("pf-name")) $("pf-name").textContent = fullName;
  if ($("pf-username")) $("pf-username").textContent = user.username || "—";
  if ($("pf-email")) $("pf-email").textContent = stored.email || "Not provided";
  if ($("pf-mobile")) $("pf-mobile").textContent = stored.mobile ? `+91 ${stored.mobile}` : "Not provided";
  if ($("pf-role")) $("pf-role").textContent = user.role || "USER";
}

function openProfileModal() {
  const user = getCurrentUser() || {};
  const stored = loadProfile();
  if ($("ep-name")) $("ep-name").value = stored.fullName || user.username || "";
  if ($("ep-email")) $("ep-email").value = stored.email || "";
  if ($("ep-mobile")) $("ep-mobile").value = stored.mobile || "";
  setErr("ep-error", "");
  const m = $("profile-modal");
  if (m) { m.classList.remove("hidden"); m.classList.add("flex"); }
}

function closeProfileModal() {
  const m = $("profile-modal");
  if (m) { m.classList.add("hidden"); m.classList.remove("flex"); }
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

function saveProfile() {
  const name = $("ep-name").value.trim();
  const email = $("ep-email").value.trim();
  const mobile = $("ep-mobile").value.trim();
  if (!name) {
    setErr("ep-error", "Full name is required.");
    return;
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setErr("ep-error", "Enter a valid email address.");
    return;
  }
  if (mobile && !/^[6-9]\d{9}$/.test(mobile)) {
    setErr("ep-error", "Enter a valid 10-digit mobile number.");
    return;
  }
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({ fullName: name, email, mobile }));
  } catch (e) {
    console.warn("[Settings] Failed to save profile:", e);
  }
  closeProfileModal();
  renderProfile();
  toast("Profile updated successfully.");
}

/* ---------- B. Security ---------- */
function renderSecurity() {
  const session = getSession() || {};
  let lastLogin = "—";
  if (session.loggedInAt) {
    const d = new Date(session.loggedInAt);
    if (!isNaN(d)) lastLogin = d.toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
  }
  if ($("sec-last-login")) $("sec-last-login").textContent = lastLogin;
  if ($("sec-device")) {
    const platform = (navigator.userAgentData && navigator.userAgentData.platform) || navigator.platform || "This device";
    $("sec-device").textContent = `${platform} • ${navigator.language || "en"} • Active now`;
  }
}

function openPwModal() {
  if ($("pw-current")) $("pw-current").value = "";
  if ($("pw-new")) $("pw-new").value = "";
  if ($("pw-confirm")) $("pw-confirm").value = "";
  setErr("pw-error", "");
  const m = $("pw-modal");
  if (m) { m.classList.remove("hidden"); m.classList.add("flex"); }
}

function closePwModal() {
  const m = $("pw-modal");
  if (m) { m.classList.add("hidden"); m.classList.remove("flex"); }
}

function savePassword() {
  const current = $("pw-current").value;
  const next = $("pw-new").value;
  const confirm = $("pw-confirm").value;
  if (!current || !next || !confirm) {
    setErr("pw-error", "All three fields are required.");
    return;
  }
  if (next.length < 8 || !/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) {
    setErr("pw-error", "New password must be at least 8 characters with letters and numbers.");
    return;
  }
  if (next !== confirm) {
    setErr("pw-error", "New password and confirmation do not match.");
    return;
  }
  closePwModal();
  toast("Password changed successfully (demo).");
}

/* ---------- C. Notifications ---------- */
const NOTIF_KEYS = ["appStatus", "payments", "docVerify", "sms", "email"];
const NOTIF_IDS = { appStatus: "ntf-app", payments: "ntf-pay", docVerify: "ntf-doc", sms: "ntf-sms", email: "ntf-email" };

function renderNotif(prefs) {
  NOTIF_KEYS.forEach((k) => {
    const el = $(NOTIF_IDS[k]);
    if (el) el.checked = Boolean(prefs.notif[k]);
  });
}

/* ---------- D. Language & accessibility ---------- */
function applyLang(lang) {
  const dict = I18N[lang] || I18N.en;
  document.documentElement.lang = lang === "hi" ? "hi" : "en";
  if ($("settings-title")) $("settings-title").textContent = dict.title;
  if ($("settings-subtitle")) $("settings-subtitle").textContent = dict.subtitle;
  const map = { "sec-profile": dict.secProfile, "sec-security": dict.secSecurity, "sec-notif": dict.secNotif, "sec-lang": dict.secLang, "sec-privacy": dict.secPrivacy, "sec-help": dict.secHelp };
  Object.entries(map).forEach(([id, text]) => {
    const el = $(id);
    if (el) el.textContent = text;
  });
}

function applyA11y(prefs) {
  document.body.classList.toggle("text-large", prefs.textSize === "large");
  document.body.classList.toggle("high-contrast", Boolean(prefs.highContrast));
  document.body.classList.toggle("reduced-motion", Boolean(prefs.reducedMotion));
  document.querySelectorAll('input[name="textsize"]').forEach((r) => {
    r.checked = r.value === prefs.textSize;
  });
  if ($("set-contrast")) $("set-contrast").checked = Boolean(prefs.highContrast);
  if ($("set-motion")) $("set-motion").checked = Boolean(prefs.reducedMotion);
  if ($("set-lang")) $("set-lang").value = prefs.lang;
}

/* ---------- E. Privacy ---------- */
function downloadData() {
  const data = {
    exportedAt: new Date().toISOString(),
    session: getSession(),
    profile: loadProfile(),
    preferences: loadPrefs(),
    demoUploads: safeParse("bb_documents_uploads"),
    demoPayments: safeParse("bb_payments_txns"),
    demoApplications: safeParse("bb_applications")
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "bharat-bhumi-personal-data.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast("Personal data downloaded (demo).");
}

function safeParse(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function requestDelete() {
  const wrap = $("delete-confirm-wrap");
  if (wrap) wrap.classList.remove("hidden");
}

function confirmDelete() {
  const input = $("delete-confirm-input");
  if (!input || input.value.trim().toUpperCase() !== "DELETE") {
    toast("Type DELETE in the box to confirm.", true);
    return;
  }
  ["bb_settings_prefs", "bb_profile", "bb_documents_uploads", "bb_payments_txns", "bb_due_paid", "bb_applications"].forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch (e) {
      console.warn("[Settings] Failed to remove key:", k, e);
    }
  });
  logout("login.html");
}

/* ---------- F. Help ---------- */
function openGrievance() {
  if ($("gr-category")) $("gr-category").value = "Delay in application";
  if ($("gr-desc")) $("gr-desc").value = "";
  setErr("gr-error", "");
  const m = $("grievance-modal");
  if (m) { m.classList.remove("hidden"); m.classList.add("flex"); }
}

function closeGrievance() {
  const m = $("grievance-modal");
  if (m) { m.classList.add("hidden"); m.classList.remove("flex"); }
}

function submitGrievance() {
  const desc = $("gr-desc").value.trim();
  if (desc.length < 20) {
    setErr("gr-error", "Please describe the issue in at least 20 characters.");
    return;
  }
  const ref = `GRV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  closeGrievance();
  toast(`Grievance registered. Reference: ${ref} (demo).`);
}

function setupSession() {
  const user = getCurrentUser() || {};
  const stored = loadProfile();
  const display = stored.fullName || user.username || "Citizen";
  if ($("top-nav-username")) $("top-nav-username").textContent = display;
  if ($("top-nav-role-badge")) $("top-nav-role-badge").textContent = user.role || "USER";
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
  const prefs = loadPrefs();
  setupSession();
  renderProfile();
  renderSecurity();
  renderNotif(prefs);
  applyLang(prefs.lang);
  applyA11y(prefs);

  if ($("btn-edit-profile")) $("btn-edit-profile").addEventListener("click", openProfileModal);
  if ($("btn-save-profile")) $("btn-save-profile").addEventListener("click", saveProfile);
  if ($("profile-close")) $("profile-close").addEventListener("click", closeProfileModal);
  if ($("profile-cancel-btn")) $("profile-cancel-btn").addEventListener("click", closeProfileModal);

  if ($("btn-change-pw")) $("btn-change-pw").addEventListener("click", openPwModal);
  if ($("btn-save-pw")) $("btn-save-pw").addEventListener("click", savePassword);
  if ($("pw-close")) $("pw-close").addEventListener("click", closePwModal);
  if ($("pw-cancel-btn")) $("pw-cancel-btn").addEventListener("click", closePwModal);
  if ($("btn-logout-others")) $("btn-logout-others").addEventListener("click", () => {
    toast("All other sessions signed out (demo).");
  });

  NOTIF_KEYS.forEach((k) => {
    const el = $(NOTIF_IDS[k]);
    if (el) el.addEventListener("change", () => {
      const p = loadPrefs();
      p.notif[k] = el.checked;
      savePrefs(p);
      toast(I18N[p.lang].saved);
    });
  });

  if ($("set-lang")) $("set-lang").addEventListener("change", (e) => {
    const p = loadPrefs();
    p.lang = e.target.value;
    savePrefs(p);
    applyLang(p.lang);
    toast(I18N[p.lang].saved);
  });
  document.querySelectorAll('input[name="textsize"]').forEach((r) =>
    r.addEventListener("change", () => {
      const p = loadPrefs();
      p.textSize = document.querySelector('input[name="textsize"]:checked').value;
      savePrefs(p);
      applyA11y(p);
      toast(I18N[p.lang].saved);
    }));
  if ($("set-contrast")) $("set-contrast").addEventListener("change", (e) => {
    const p = loadPrefs();
    p.highContrast = e.target.checked;
    savePrefs(p);
    applyA11y(p);
    toast(I18N[p.lang].saved);
  });
  if ($("set-motion")) $("set-motion").addEventListener("change", (e) => {
    const p = loadPrefs();
    p.reducedMotion = e.target.checked;
    savePrefs(p);
    applyA11y(p);
    toast(I18N[p.lang].saved);
  });

  if ($("btn-download-data")) $("btn-download-data").addEventListener("click", downloadData);
  if ($("btn-delete-account")) $("btn-delete-account").addEventListener("click", requestDelete);
  if ($("btn-confirm-delete")) $("btn-confirm-delete").addEventListener("click", confirmDelete);

  if ($("btn-contact")) $("btn-contact").addEventListener("click", () => {
    toast("Toll-free 1800-XXX-XXXX (Mon–Sat, 9am–6pm) (demo).");
  });
  if ($("btn-grievance")) $("btn-grievance").addEventListener("click", openGrievance);
  if ($("btn-submit-grievance")) $("btn-submit-grievance").addEventListener("click", submitGrievance);
  if ($("grievance-close")) $("grievance-close").addEventListener("click", closeGrievance);
  if ($("grievance-cancel-btn")) $("grievance-cancel-btn").addEventListener("click", closeGrievance);

  ["profile-modal", "pw-modal", "grievance-modal"].forEach((id) => {
    const m = $(id);
    if (m) m.addEventListener("click", (e) => {
      if (e.target === m) {
        m.classList.add("hidden");
        m.classList.remove("flex");
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", init);
