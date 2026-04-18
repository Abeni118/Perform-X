(() => {
  const STORAGE_PREFIX = "performx:";

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  // Remove data storage functions - data now comes from backend API
  // Theme storage is kept as it's UI preference, not application data

  const ensureToastHost = () => {
    let host = qs("#performx-toast-host");
    if (host) return host;
    host = document.createElement("div");
    host.id = "performx-toast-host";
    host.style.cssText = [
      "position:fixed",
      "right:1rem",
      "bottom:1rem",
      "z-index:2000",
      "display:flex",
      "flex-direction:column",
      "gap:0.5rem",
      "max-width:min(90vw, 360px)"
    ].join(";");
    document.body.appendChild(host);
    return host;
  };

  const toast = (message, type = "info") => {
    const host = ensureToastHost();
    const el = document.createElement("div");
    const bg = type === "error" ? "#EF4444" : type === "success" ? "#10B981" : "#1F2937";
    el.style.cssText = [
      `background:${bg}`,
      "color:#fff",
      "padding:0.65rem 0.85rem",
      "border-radius:8px",
      "font-size:0.85rem",
      "font-weight:500",
      "box-shadow:0 6px 20px rgba(0,0,0,0.2)",
      "opacity:0",
      "transform:translateY(8px)",
      "transition:all .2s ease"
    ].join(";");
    el.textContent = message;
    host.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    });
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      setTimeout(() => el.remove(), 220);
    }, 2600);
  };

  const validateRequired = (label, value) => {
    if (!value || !String(value).trim()) {
      toast(`${label} is required.`, "error");
      return false;
    }
    return true;
  };

  const exportToCSV = (rows, filename) => {
    if (!Array.isArray(rows) || rows.length === 0) {
      toast("Nothing to export.", "error");
      return;
    }
    const keys = Object.keys(rows[0]);
    const csv = [
      keys.join(","),
      ...rows.map((row) =>
        keys
          .map((k) => `"${String(row[k] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast(`Exported ${filename}`, "success");
  };

  const exportToJSON = (rows, filename) => {
    if (!Array.isArray(rows) || rows.length === 0) {
      toast("Nothing to export.", "error");
      return;
    }
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast(`Exported ${filename}`, "success");
  };

  const initThemeToggle = () => {
    const themeToggle = qs("#themeToggle");
    const themeIcon = qs("#themeIcon");
    const isDark = localStorage.getItem("performx-theme") === "dark";
    if (isDark) {
      document.body.classList.add("dark-mode");
      if (themeIcon) {
        themeIcon.classList.remove("bx-moon");
        themeIcon.classList.add("bx-sun");
      }
    }
    if (!themeToggle) return;
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const dark = document.body.classList.contains("dark-mode");
      localStorage.setItem("performx-theme", dark ? "dark" : "light");
      if (themeIcon) {
        themeIcon.classList.toggle("bx-moon", !dark);
        themeIcon.classList.toggle("bx-sun", dark);
      }
    });
  };

  const initGlobalLinks = () => {
    qsa('a[href="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
      });
    });
  };

  const initPageTransitions = () => {
    const reveal = () => {
      const content = document.getElementById("page-content");
      if (content) requestAnimationFrame(() => content.classList.add("loaded"));
    };

    if (document.readyState === "complete" || document.readyState === "interactive") {
      reveal();
    } else {
      document.addEventListener("DOMContentLoaded", reveal);
      window.addEventListener("load", reveal); // strict fallback
    }

    document.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", function (e) {
        const href = this.getAttribute("href");

        if (
          href &&
          !href.startsWith("#") &&
          !href.startsWith("http") &&
          !this.hasAttribute("download") &&
          this.target !== "_blank"
        ) {
          e.preventDefault();
          const content = document.getElementById("page-content");
          if (content) {
            content.classList.remove("loaded");
            content.classList.add("fade-out");
          }

          setTimeout(() => {
            window.location.href = href;
          }, 100);
        }
      });
    });
  };

  const ensureNotificationDropdown = () => {
    let bellBtn = qs('.bx-bell');
    if (!bellBtn) return null;
    bellBtn = bellBtn.closest('.icon-action');
    if (!bellBtn) return null;

    let dropdown = qs('#performx-notifications', bellBtn);
    if (!dropdown) {
      bellBtn.style.position = 'relative'; // Ensure dropdown anchors to it
      dropdown = document.createElement("div");
      dropdown.id = "performx-notifications";
      dropdown.style.cssText = [
        "position:absolute",
        "top:100%",
        "right:-10px",
        "width:320px",
        "background:var(--card-bg, #fff)",
        "border:1px solid var(--border-color, #e2e8f0)",
        "border-radius:8px",
        "box-shadow:0 10px 25px rgba(0,0,0,0.1)",
        "max-height:400px",
        "overflow-y:auto",
        "display:none",
        "flex-direction:column",
        "z-index:9999",
        "padding:0.5rem",
        "cursor:default",
        "text-align:left"
      ].join(";");
      
      const header = document.createElement("div");
      header.style.cssText = "padding:0.5rem;font-weight:600;border-bottom:1px solid var(--border-color, #e2e8f0);margin-bottom:0.5rem;display:flex;justify-content:space-between;color:var(--text-color, #1F2937);";
      header.innerHTML = `<span>Notifications</span><button id="clear-notifications" style="background:none;border:none;color:var(--primary-color, #4F46E5);cursor:pointer;font-size:0.8rem;">Clear All</button>`;
      dropdown.appendChild(header);
      
      const list = document.createElement("div");
      list.id = "performx-notifications-list";
      dropdown.appendChild(list);
      
      bellBtn.appendChild(dropdown);
      
      bellBtn.addEventListener("click", (e) => {
        if (e.target.closest("#clear-notifications")) {
          list.innerHTML = "";
          const badge = qs('.badge-dot', bellBtn);
          if (badge) badge.style.display = 'none';
          e.stopPropagation();
          return;
        }
        if (e.target.closest("#performx-notifications")) {
            e.stopPropagation(); 
            return;
        }
        const isVisible = dropdown.style.display === "flex";
        dropdown.style.display = isVisible ? "none" : "flex";
        // Hide badge when opening
        if (!isVisible) {
           const badge = qs('.badge-dot', bellBtn);
           if (badge) badge.style.display = 'none';
        }
      });

      document.addEventListener("click", (e) => {
        if (!bellBtn.contains(e.target)) dropdown.style.display = "none";
      });
    }
    return dropdown;
  };

  const addNotification = (message, type = "info") => {
    const dropdown = ensureNotificationDropdown();
    if (!dropdown) {
        toast(message, type); // fallback if no bell
        return;
    }
    
    const list = qs('#performx-notifications-list', dropdown);
    const item = document.createElement("div");
    item.style.cssText = [
      "padding:0.75rem",
      "border-radius:6px",
      "font-size:0.85rem",
      "margin-bottom:0.5rem",
      "line-height:1.4",
      "background:var(--primary-light, #EEF2FF)",
      "color:#1F2937",
      "border-left:4px solid"
    ].join(";");

    // Let dark mode be handled by general contrast but the background here is local
    // To play nice with dark mode we use var(--input-bg) etc if available
    item.style.background = "var(--input-bg, #f8fafc)";
    item.style.color = "var(--text-color, #1F2937)";
    
    if (type === "warning") {
        item.style.borderLeftColor = "#F59E0B";
    } else if (type === "error") {
        item.style.borderLeftColor = "#EF4444";
    } else if (type === "success") {
        item.style.borderLeftColor = "#10B981";
    } else {
        item.style.borderLeftColor = "#4F46E5";
    }

    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    item.innerHTML = `<div>${message}</div><div style="font-size:0.75rem;opacity:0.6;margin-top:0.25rem;">${time}</div>`;
    
    // add to top
    list.insertBefore(item, list.firstChild);
    
    // show indicator
    const bellBtn = qs('.bx-bell').closest('.icon-action');
    if (bellBtn) {
        const badge = qs('.badge-dot', bellBtn);
        if (badge) badge.style.display = 'block';
    }
    
    // also trigger a toast
    toast(message, type);
  };

  window.PerformXShared = {
    qs,
    qsa,
    toast,
    addNotification,
    validateRequired,
    exportToCSV,
    exportToJSON,
    initThemeToggle,
    initGlobalLinks
  };

  document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    initGlobalLinks();
    initPageTransitions();
  });
})();

