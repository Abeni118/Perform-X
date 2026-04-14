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

  window.PerformXShared = {
    qs,
    qsa,
    toast,
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

