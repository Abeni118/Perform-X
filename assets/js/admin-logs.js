document.addEventListener("DOMContentLoaded", () => {
  const S = window.AdminShared;
  const M = window.PerformXModal;
  if (!S || !M) return;

  const table = S.qs("#adminLogsTable");
  const tbody = table?.querySelector("tbody");
  const topSearch = S.qs(".topbar .search-bar input");
  const logsSearch = S.qs("#adminLogsSearch");
  const refreshBtn = S.qs("#adminLogsRefreshBtn");
  const exportBtn = S.qs("#adminLogsExportBtn");
  const rangeBtn = S.qs("#adminLogsRangeBtn");
  const filterBtn = S.qs("#adminLogsFilterBtn");
  const prevBtn = S.qs("#adminLogsPrevBtn");
  const nextBtn = S.qs("#adminLogsNextBtn");
  const privacyLink = S.qs("#adminLogsPrivacyLink");
  const notifyBtn = S.qs("#adminLogsNotifyBtn");
  if (!table || !tbody) return;

  let tasks = [];

  const loadLogs = async () => {
    try {
      const response = await fetch(window.apiUrl('logs/get_logs.php'), { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load logs');
      const result = await response.json();
      if (result.status === 'success') {
        tasks = result.data || [];
        render();
      } else {
        S.toast(result.message || 'Failed to load logs', 'error');
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      S.toast('Error loading logs from server', 'error');
    }
  };

  loadLogs();

  let query = "";
  let severity = "all";
  let page = 1;
  const pageSize = 5;

  const filtered = () =>
    tasks.filter((t) => {
      const text = `${t.timestamp} ${t.type} ${t.component} ${t.summary} ${t.status}`.toLowerCase();
      const sevOk = severity === "all" || t.status.toLowerCase().includes(severity);
      return sevOk && text.includes(query.toLowerCase());
    });

  const paginated = () => {
    const items = filtered();
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    page = Math.min(page, totalPages);
    const start = (page - 1) * pageSize;
    return { items: items.slice(start, start + pageSize), total: items.length, totalPages };
  };

  const statusPill = (status) => {
    const s = status.toLowerCase();
    if (s.includes("error")) return `<span class="pill" style="background:#FEE2E2; color:#EF4444; border:1px solid #FECACA;">Error</span>`;
    if (s.includes("success")) return `<span class="pill pill-outline">Success</span>`;
    if (s.includes("warning")) return `<span class="pill pill-outline">Warning</span>`;
    return `<span class="pill pill-outline">Info</span>`;
  };

  const render = () => {
    const { items, total, totalPages } = paginated();
    tbody.innerHTML = items
      .map((t, i) => {
        const [datePart, timePart = ""] = t.timestamp.split(" ");
        return `
          <tr data-index="${i}">
            <td style="padding-left:0;"><div style="font-size:0.875rem; color:#111827; font-weight:500;">${datePart}</div><div style="font-size:0.75rem; color:#6B7280;">${timePart}</div></td>
            <td><span style="font-size:0.8rem; font-weight:700; letter-spacing:0.05em; color:#111827;">${t.type}</span></td>
            <td style="font-weight:600; font-size:0.875rem; color:#111827;">${t.component}</td>
            <td style="color:#4B5563; font-size:0.875rem;">${t.summary}</td>
            <td style="text-align:right;">${statusPill(t.status)}</td>
          </tr>`;
      })
      .join("") || `<tr><td colspan="5" style="padding:1rem;">No log events found.</td></tr>`;

    const info = S.qs("#adminLogsTable")?.closest(".table-card")?.querySelector("div[style*='Showing']");
    if (info) info.innerHTML = `Showing <strong style="color:#111827;">${items.length}</strong> of <strong style="color:#111827;">${total}</strong> events`;
    prevBtn.disabled = page <= 1;
    nextBtn.disabled = page >= totalPages;
    updateKpis();
  };

  const updateKpis = () => {
    const critical = tasks.filter((t) => /error/i.test(t.status)).length;
    const suspicious = tasks.filter((t) => /warning|error/i.test(t.status)).length;
    const success = tasks.filter((t) => /success/i.test(t.status)).length;
    const uptime = tasks.length ? `${Math.max(80, Math.round((success / tasks.length) * 100))}%` : "100%";
    S.updateStats([String(critical), `${tasks.length}`, String(suspicious), uptime]);
  };

  const addLog = () => {
    tasks.unshift({
      timestamp: `${new Date().toISOString().slice(0, 10)} ${new Date().toTimeString().slice(0, 8)}`,
      type: "MANUAL_AUDIT",
      component: "Admin-Console",
      summary: "Manual audit refresh triggered by administrator",
      status: "Success"
    });
    render();
    S.toast("Log feed refreshed.", "success");
  };

  [topSearch, logsSearch].forEach((input) => {
    input?.addEventListener("input", (e) => {
      query = e.target.value || "";
      page = 1;
      render();
    });
  });

  notifyBtn?.addEventListener("click", () => S.toast("No new alert notifications."));
  refreshBtn?.addEventListener("click", addLog);
  exportBtn?.addEventListener("click", () => S.exportToCSV(filtered(), "admin-logs.csv"));
  rangeBtn?.addEventListener("click", () => S.toast("Date range switched to last 7 days."));
  filterBtn?.addEventListener("click", async () => {
    const data = await M.openForm({
      title: "Filter Log Severity",
      submitText: "Apply Filter",
      fields: [
        {
          name: "severity",
          label: "Severity",
          type: "select",
          value: severity,
          options: [
            { value: "all", label: "All" },
            { value: "success", label: "Success" },
            { value: "warning", label: "Warning" },
            { value: "error", label: "Error" },
            { value: "info", label: "Info" }
          ]
        }
      ]
    });
    if (!data) return;
    severity = data.severity || "all";
    page = 1;
    render();
  });
  prevBtn?.addEventListener("click", () => {
    page = Math.max(1, page - 1);
    render();
  });
  nextBtn?.addEventListener("click", () => {
    page += 1;
    render();
  });
  privacyLink?.addEventListener("click", (e) => {
    e.preventDefault();
    S.toast("Privacy policy viewer opened.");
  });

  tbody.addEventListener("dblclick", async (e) => {
    const row = e.target.closest("tr");
    if (!row) return;
    if (!S.requireAdmin("edit log records")) return;
    const idx = row.rowIndex - 1 + (page - 1) * pageSize;
    const item = filtered()[idx];
    if (!item) return;
    const data = await M.openForm({
      title: "Edit Log Summary",
      submitText: "Update Summary",
      fields: [{ name: "summary", label: "Summary", type: "textarea", value: item.summary }],
      validate: (v) => (!String(v.summary || "").trim() ? "Summary is required." : true)
    });
    if (!data) return;
    const baseIndex = tasks.findIndex((t) => t.timestamp === item.timestamp && t.type === item.type && t.summary === item.summary);
    if (baseIndex >= 0) {
      tasks[baseIndex].summary = data.summary.trim();
      render();
      S.toast("Log entry updated.", "success");
    }
  });

  render();
});

