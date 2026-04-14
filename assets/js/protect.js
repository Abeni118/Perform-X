(() => {
  const path = window.location.pathname.replace(/\\/g, "/");
  const isAdminPage = path.includes("/admin/");
  const isPagesDir = path.includes("/pages/") || path.includes("/admin/");
  const isRegisterPage = path.endsWith("/auth/register.html") || path.endsWith("/register.html");

  const loginPath = isPagesDir ? "../auth/login.html" : "auth/login.html";
  const dashboardPath = isPagesDir ? "../index.html" : "index.html";
  const authUrl = (endpoint) => (window.apiUrl ? window.apiUrl(`auth/${endpoint}`) : `../backend/auth/${endpoint}`);

  const redirectToLogin = () => {
    window.location.href = loginPath;
  };

  const applyUserToUI = (user) => {
    if (!user) return;
    const displayName = user.name || user.email || "User";
    const role = user.role || "user";
    // Use specific IDs to avoid global DOM overwrite
    const userNameEl = document.getElementById("topbar-user-name");
    if (userNameEl) userNameEl.textContent = displayName;
    
    const userRoleEl = document.getElementById("topbar-user-role");
    if (userRoleEl) userRoleEl.textContent = role;
    
    const usernameEl = document.getElementById("username");
    if (usernameEl) usernameEl.textContent = displayName;
    document.querySelectorAll(".page-title p").forEach((el) => {
      const text = el.textContent || "";
      if (/welcome back/i.test(text)) {
        el.textContent = `Welcome back, ${displayName}.`;
      }
    });
    const avatarName = encodeURIComponent(displayName);
    document.querySelectorAll(".user-profile .user-avatar, .topbar .user-avatar").forEach((img) => {
      if (img.tagName.toLowerCase() !== "img") return;
      img.src = `https://ui-avatars.com/api/?name=${avatarName}&background=0D8ABC&color=fff&rounded=true`;
      img.alt = displayName;
    });
  };

  const boot = async () => {
    if (isRegisterPage) return;
    try {
      const response = await fetch(authUrl('session.php'), {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        redirectToLogin();
        return;
      }
      
      const result = await response.json();
      const user = result.user || result.data;
      if (!user || !user.role) {
        redirectToLogin();
        return;
      }
      
      const userRole = user.role;
      applyUserToUI(user);
      if (isAdminPage && userRole !== "admin") {
        window.location.href = dashboardPath;
        return;
      }
    } catch (err) {
      console.error("Session check failed:", err);
      redirectToLogin();
      return;
    }

    const currentFile = path.split("/").pop() || "";
    document.querySelectorAll(".nav-menu .nav-item").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (!href || href === "#") return;
      if (href.endsWith(currentFile)) {
        document.querySelectorAll(".nav-menu .nav-item.active").forEach((a) => a.classList.remove("active"));
        link.classList.add("active");
      }
    });

    const logoutSelectors = [
      ".nav-item-danger",
      '.sidebar-footer a[href*="login.html"]'
    ];
    const logoutLinks = logoutSelectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)));
    logoutLinks.forEach((link) => {
      link.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
           await fetch(authUrl('logout.php'), {
             method: 'POST',
             credentials: 'include'
           });
        } catch (error) {
           console.error("Logout failed", error);
        }
        window.location.href = loginPath;
      });
    });
  };

  document.addEventListener("DOMContentLoaded", boot);
})();

