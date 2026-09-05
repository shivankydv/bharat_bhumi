/**
 * Shared notification popup for the Bharat Bhumi top navbar.
 *
 * Works on every page from the existing #btn-notifications bell — no page
 * markup changes needed. Demo notifications with localStorage read/unread
 * persistence (no notification API exists in backend — do not invent one).
 *
 * Plain classic script (no imports) so it loads alongside any page module.
 */
(function () {
  var STORE_KEY = "bb_notifications_read";

  // Pages may define window.BB_NOTIF_ITEMS before this script loads to show
  // their own demo items (e.g. admin pending-application alerts).
  var ITEMS = window.BB_NOTIF_ITEMS || [
    {
      id: "n-app",
      kind: "info",
      icon: "assignment",
      color: "#002F6C",
      title: "Application Update",
      text: "Your mutation application APP-2026-0142 is under review.",
      time: "10 min ago",
      href: "application-tracker.html"
    },
    {
      id: "n-pay",
      kind: "success",
      icon: "check_circle",
      color: "#16A34A",
      title: "Payment Successful",
      text: "Payment of \u20B9500 for Property Mutation was successful.",
      time: "2 hours ago",
      href: "payments.html"
    },
    {
      id: "n-doc",
      kind: "success",
      icon: "verified",
      title: "Document Verification",
      text: "Your Sale Deed has been verified successfully.",
      time: "Yesterday",
      href: "documents.html",
      color: "#16A34A"
    },
    {
      id: "n-act",
      kind: "warning",
      icon: "warning",
      color: "#EA580C",
      title: "Action Required",
      text: "Additional document is required for your pending application.",
      time: "2 days ago",
      href: "documents.html"
    }
  ];

  var bell = null;
  var panel = null;
  var dot = null;

  function readIds() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      return [];
    }
  }

  function writeIds(ids) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(ids));
    } catch (e) {
      /* storage unavailable — popup still works for the session */
    }
  }

  function isRead(id) {
    return readIds().indexOf(id) !== -1;
  }

  function unreadCount() {
    return ITEMS.filter(function (n) {
      return !isRead(n.id);
    }).length;
  }

  function markRead(id) {
    var ids = readIds();
    if (ids.indexOf(id) === -1) {
      ids.push(id);
      writeIds(ids);
    }
    render();
  }

  function markAllRead() {
    writeIds(ITEMS.map(function (n) {
      return n.id;
    }));
    render();
  }

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  }

  function itemHtml(n) {
    var unread = !isRead(n.id);
    return (
      '<button class="notif-item' + (unread ? " unread" : "") + '" data-id="' + n.id + '">' +
        '<span class="material-symbols-outlined" style="color: ' + n.color + ';">' + n.icon + "</span>" +
        '<span class="flex-1 min-w-0">' +
          '<span class="block text-sm font-bold" style="color: #1a1b20;">' + esc(n.title) + "</span>" +
          '<span class="block text-sm" style="color: #5c5f61;">' + esc(n.text) + "</span>" +
          '<span class="block text-xs mt-0.5" style="color: #5c5f61;">' + esc(n.time) + "</span>" +
        "</span>" +
        (unread
          ? '<span style="width: 8px; height: 8px; border-radius: 9999px; background: #002F6C; margin-top: 6px; flex-shrink: 0;"></span>'
          : "") +
      "</button>"
    );
  }

  function render() {
    if (!panel) return;
    var unread = unreadCount();
    var body;
    if (unread === 0) {
      body =
        '<div style="padding: 24px 16px; text-align: center;">' +
          '<span class="material-symbols-outlined" style="font-size: 32px; color: #16A34A;">check_circle</span>' +
          '<p style="font-weight: 700; color: #1a1b20; margin-top: 8px;">You\'re all caught up</p>' +
          '<p class="text-sm" style="color: #5c5f61;">No new notifications.</p>' +
        "</div>";
    } else {
      body = ITEMS.map(itemHtml).join("");
    }
    panel.innerHTML =
      '<div class="notif-head">' +
        '<span style="font-weight: 700; color: #1a1b20;">Notifications</span>' +
        (unread > 0
          ? '<button data-mark-all style="color: #001b44; font-size: 13px; font-weight: 600;">Mark all as read</button>'
          : "") +
      "</div>" +
      body;
    renderBadge();
  }

  function renderBadge() {
    if (!dot) return;
    var unread = unreadCount();
    if (unread === 0) {
      dot.style.display = "none";
      return;
    }
    dot.style.display = "";
    dot.className = "notif-count";
    dot.textContent = unread > 9 ? "9+" : String(unread);
  }

  function isOpen() {
    return !!panel && panel.style.display !== "none";
  }

  function position() {
    if (!bell || !panel) return;
    var rect = bell.getBoundingClientRect();
    panel.style.top = rect.bottom + 8 + "px";
    panel.style.right = Math.max(8, window.innerWidth - rect.right) + "px";
  }

  function open() {
    render();
    position();
    panel.style.display = "block";
  }

  function close() {
    if (panel) panel.style.display = "none";
  }

  function toggle() {
    if (isOpen()) close();
    else open();
  }

  function init() {
    bell = document.getElementById("btn-notifications");
    if (!bell) return;

    panel = document.createElement("div");
    panel.id = "bb-notif-panel";
    // Critical layout inline so the popup works even if styles.css is stale-cached.
    panel.style.display = "none";
    panel.style.position = "fixed";
    panel.style.zIndex = "300";
    panel.style.width = "360px";
    panel.style.maxWidth = "calc(100vw - 16px)";
    panel.style.maxHeight = "min(70vh, 480px)";
    panel.style.overflowY = "auto";
    panel.style.background = "#ffffff";
    panel.style.border = "1px solid #C4C6D2";
    panel.style.borderRadius = "12px";
    panel.style.boxShadow = "0 12px 32px rgba(0, 27, 68, 0.18)";
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Notifications");
    document.body.appendChild(panel);

    dot = bell.querySelector("span.absolute");

    bell.addEventListener("click", function (e) {
      e.stopPropagation();
      toggle();
    });

    panel.addEventListener("click", function (e) {
      var markAll = e.target.closest
        ? e.target.closest("[data-mark-all]")
        : null;
      if (markAll) {
        markAllRead();
        return;
      }
      var item = e.target.closest
        ? e.target.closest("[data-id]")
        : null;
      if (item) {
        var id = item.getAttribute("data-id");
        var found = null;
        ITEMS.forEach(function (n) {
          if (n.id === id) found = n;
        });
        markRead(id);
        close();
        if (found && found.href) window.location.href = found.href;
      }
    });

    document.addEventListener("click", function (e) {
      if (!isOpen()) return;
      if (e.target === bell || (bell.contains && bell.contains(e.target))) return;
      if (e.target === panel || (panel.contains && panel.contains(e.target))) return;
      close();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });

    renderBadge();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Exposed for automated verification; harmless in production.
  window.BBNotifications = {
    isOpen: isOpen,
    unreadCount: unreadCount,
    toggle: toggle,
    markAllRead: markAllRead,
    ITEMS: ITEMS
  };
})();
