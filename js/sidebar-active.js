/**
 * Sidebar Active-State Enforcer for Bharat Bhumi
 *
 * Guarantees that only the sidebar item matching the CURRENT page carries the
 * shared "sidebar-active" class (light soft navy #DCE8F8, dark navy #001B44
 * text/icons from css/styles.css). Stale/hardcoded dark active classes on
 * other items are stripped based on window.location, so navigation can never
 * show two blue items at once.
 *
 * Plain classic script (no imports) so it works on every page.
 */
(function () {
  // Legacy dark active classes (kept for runtime cleanup of stale markup).
  var LEGACY_ACTIVE = ["bg-primary", "bg-primary-container", "text-white", "text-on-primary-container"];

  function fileName(href) {
    return String(href || "").split("?")[0].split("#")[0].split("/").pop().toLowerCase();
  }

  function enforce() {
    var current = fileName(window.location.pathname);
    if (!current) current = "index.html";
    var links = document.querySelectorAll("aside nav a[href]");
    if (!links.length) return;

    var matched = false;
    links.forEach(function (a) {
      if (fileName(a.getAttribute("href")) === current) matched = true;
    });
    // No sidebar entry for this page (e.g. new-application.html) — keep HTML as-is.
    if (!matched) return;

    links.forEach(function (a) {
      var isCurrent = fileName(a.getAttribute("href")) === current;
      if (isCurrent) {
        // The current page's item must carry exactly the shared active class.
        LEGACY_ACTIVE.forEach(function (c) {
          a.classList.remove(c);
        });
        a.classList.remove("text-on-surface-variant");
        if (!a.classList.contains("sidebar-active")) a.classList.add("sidebar-active");
        return;
      }
      var changed = false;
      ["sidebar-active"].concat(LEGACY_ACTIVE).forEach(function (c) {
        if (a.classList.contains(c)) {
          a.classList.remove(c);
          changed = true;
        }
      });
      if (a.classList.contains("font-semibold")) {
        a.classList.remove("font-semibold");
        changed = true;
      }
      if (changed) {
        if (!a.classList.contains("text-on-surface-variant")) a.classList.add("text-on-surface-variant");
        if (!a.classList.contains("transition")) a.classList.add("transition");
        var icon = a.querySelector(".material-symbols-outlined");
        if (icon) {
          icon.classList.remove("fill");
          icon.style.removeProperty("font-variation-settings");
        }
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enforce);
  } else {
    enforce();
  }
})();
