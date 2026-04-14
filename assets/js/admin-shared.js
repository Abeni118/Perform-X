(() => {
  const PREFIX = "performx:admin:";

  const qs = (selector, root = document) => root.querySelector(selector);
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  // Remove localStorage load/save functions - data now comes from backend API

  const getRole = () => localStorage.getItem(PREFIX + "role") || "admin";
  const setRole = (role) => localStorage.setItem(PREFIX + "role", role);

  const ensureToastHost = () => {
    let host = qs("#admin-toast-host");
    if (host) return host;
    host = document.createElement("div");
    host.id = "admin-toast-host";
    host.style.cssText = "position:fixed;right:1rem;bottom:1rem;z-index:2500;display:flex;flex-direction:column;gap:.5rem;max-width:min(90vw,360px);";
    document.body.appendChild(host);
    return host;
  };

  const toast = (message, type = "info") => {
    const host = ensureToastHost();
    const el = document.createElement("div");
    const bg = type === "error" ? "#EF4444" : type === "success" ? "#10B981" : "#1F2937";
    el.style.cssText = `background:${bg};color:#fff;padding:.65rem .85rem;border-radius:8px;font-size:.85rem;font-weight:500;opacity:0;transform:translateY(8px);transition:all .2s ease;`;
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
    if (!String(value || "").trim()) {
      toast(`${label} is required.`, "error");
      return false;
    }
    return true;
  };

  const validateEmail = (email) => {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
    if (!ok) toast("Please enter a valid email address.", "error");
    return ok;
  };

  const requireAdmin = (action = "perform this action") => {
    if (getRole() === "admin") return true;
    toast(`Only admins can ${action}.`, "error");
    return false;
  };

  const exportToCSV = (rows, filename) => {
    if (!Array.isArray(rows) || !rows.length) {
      toast("No data available for export.", "error");
      return;
    }
    const keys = Object.keys(rows[0]);
    const csv = [
      keys.join(","),
      ...rows.map((row) => keys.map((k) => `"${String(row[k] ?? "").replace(/"/g, '""')}"`).join(","))
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
    if (!Array.isArray(rows) || !rows.length) {
      toast("No data available for export.", "error");
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

  const initTheme = () => {
    const btn = qs("#themeToggle");
    const icon = qs("#themeIcon");
    const isDark = localStorage.getItem("performx-theme") === "dark";
    if (isDark) {
      document.body.classList.add("dark-mode");
      if (icon) {
        icon.classList.remove("bx-moon");
        icon.classList.add("bx-sun");
      }
    }
    btn?.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      const dark = document.body.classList.contains("dark-mode");
      localStorage.setItem("performx-theme", dark ? "dark" : "light");
      if (icon) {
        icon.classList.toggle("bx-moon", !dark);
        icon.classList.toggle("bx-sun", dark);
      }
    });
  };

  // Remove localStorage datasets - all data now comes from backend API
  const datasets = {
    users: [],
    tasks: [],
    reports: []
  };

  const updateStats = (values = []) => {
    const cards = qsa(".kpi-row .admin-stat-card .stat-value");
    values.forEach((v, i) => {
      if (cards[i]) cards[i].textContent = v;
    });
  };

  const initAnchorSafety = () => {
    qsa('a[href="#"]').forEach((a) => {
      a.addEventListener("click", (e) => e.preventDefault());
    });
  };

  window.AdminShared = {
    qs,
    qsa,
    getRole,
    setRole,
    toast,
    validateRequired,
    validateEmail,
    requireAdmin,
    exportToCSV,
    exportToJSON,
    initTheme,
    datasets,
    updateStats
  };

  // Load user data for admin pages
  const loadAdminUserData = async () => {
    try {
      const response = await fetch(window.apiUrl('auth/get_user.php'), { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load user data');
      const result = await response.json();
      if (result.status === 'success' && result.data) {
        const user = result.data;
        const displayName = user.name || user.email || 'Admin';
        
        // Update user name in topbar
        const userNameEl = document.getElementById('topbar-user-name');
        if (userNameEl) userNameEl.textContent = displayName;
        
        // Update user role
        const userRoleEl = document.getElementById('topbar-user-role');
        if (userRoleEl) userRoleEl.textContent = user.role || 'Admin';
        
        // Update avatar
        const avatarName = encodeURIComponent(displayName);
        document.querySelectorAll('.user-profile .user-avatar, .topbar .user-avatar').forEach((img) => {
          if (img.tagName.toLowerCase() !== 'img') return;
          img.src = `https://ui-avatars.com/api/?name=${avatarName}&background=0D8ABC&color=fff&rounded=true`;
          img.alt = displayName;
        });
      }
    } catch (error) {
      console.error('Error loading admin user data:', error);
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initAnchorSafety();
    loadAdminUserData();
  });
})();

