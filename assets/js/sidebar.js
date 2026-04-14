document.addEventListener("DOMContentLoaded", function () {
  const sidebar = document.querySelector(".sidebar");
  const toggleButton = document.getElementById("sidebarToggle");
  const overlay = document.querySelector('[data-sidebar-backdrop]');

  if (!sidebar || !toggleButton) return;

  const STORAGE_KEY = "performx-sidebar-mode";
  const desktopMq = window.matchMedia("(min-width: 769px)");

  const getStoredMode = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw || null;
    } catch (e) {
      return null;
    }
  };

  const setStoredMode = (mode) => {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {
      // ignore storage failures (private mode, etc.)
    }
  };

  const isMobile = () => !desktopMq.matches;

  const applyState = (mode, { persist } = { persist: true }) => {
    const safeMode = mode || (isMobile() ? "closed" : "open");
    const isClosed = safeMode === "closed";
    const isCompact = safeMode === "compact";

    sidebar.classList.toggle("closed", isClosed);
    sidebar.classList.toggle("compact", isCompact);
    document.body.classList.toggle("sidebar-closed", isClosed);
    document.body.classList.toggle("sidebar-compact", isCompact);

    if (overlay) {
      overlay.classList.toggle("active", !isClosed && isMobile());
    }

    toggleButton.setAttribute("aria-expanded", String(!isClosed));
    if (persist) setStoredMode(safeMode);
  };

  const storedMode = getStoredMode();
  const initialMode = storedMode || (isMobile() ? "closed" : "open");
  applyState(initialMode, { persist: false });

  toggleButton.addEventListener("click", () => {
    if (isMobile()) {
      const next = sidebar.classList.contains("closed") ? "open" : "closed";
      applyState(next, { persist: true });
      return;
    }
    const next = sidebar.classList.contains("compact") ? "open" : "compact";
    applyState(next, { persist: true });
  });

  if (overlay) {
    overlay.addEventListener("click", () => applyState("closed", { persist: true }));
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !sidebar.classList.contains("closed")) {
      applyState(isMobile() ? "closed" : "compact", { persist: true });
    }
  });

  desktopMq.addEventListener("change", () => {
    const currentStored = getStoredMode();
    if (!currentStored) {
      applyState(isMobile() ? "closed" : "open", { persist: false });
    } else {
      const currentMode = currentStored;
      if (!isMobile() && currentMode === "closed") {
        applyState("open", { persist: false });
      } else if (isMobile() && currentMode === "compact") {
        applyState("closed", { persist: false });
      } else {
        applyState(currentMode, { persist: false });
      }
    }
  });
});

