document.addEventListener("DOMContentLoaded", () => {
  const S = window.AdminShared;
  const M = window.PerformXModal;
  if (!S || !M) return;

  const table = S.qs("#adminComplianceTable");
  const tbody = table?.querySelector("tbody");
  const headerSearch = S.qs(".topbar .search-bar input");
  const requestSearch = S.qs("#adminComplianceSearch");
  const historyBtn = S.qs("#adminComplianceHistoryBtn");
  const scanBtn = S.qs("#adminComplianceScanBtn");
  const policyBtn = S.qs("#adminCompliancePolicyBtn");
  const fullLogLink = S.qs("#adminComplianceFullLogLink");
  const filterBtn = S.qs("#adminComplianceFilterBtn");
  const notifyBtn = S.qs("#adminComplianceNotifyBtn");
  const docsGrid = S.qs(".docs-grid");
  if (!table || !tbody) return;

  let reports = [];
  
  // Load reports from backend API
  const loadReports = async () => {
    try {
      const response = await fetch(window.apiUrl('reports/get_reports.php'), { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load reports');
      const result = await response.json();
      if (result.status === 'success') {
        reports = result.data || [];
        render();
      } else {
        S.toast(result.message || 'Failed to load reports', 'error');
      }
    } catch (error) {
      console.error('Error loading reports:', error);
      S.toast('Error loading reports from server', 'error');
    }
  };
  
  loadReports();
  let query = "";
  let statusFilter = "all";

  const filtered = () =>
    reports.filter((r) => {
      const text = `${r.id} ${r.requester} ${r.purpose} ${r.status}`.toLowerCase();
      const statusOk = statusFilter === "all" || r.status.toLowerCase().includes(statusFilter);
      return statusOk && text.includes(query.toLowerCase());
    });

  const pillClass = (status) => {
    if (/approved/i.test(status)) return "pill-blue";
    if (/denied|reject/i.test(status)) return "pill-red";
    return "pill-outline";
  };

  const render = () => {
    const rows = filtered();
    tbody.innerHTML = rows
      .map(
        (r) => `
      <tr data-id="${r.id}">
        <td style="color:#4F46E5; font-weight:600; font-size:0.875rem;">${r.id}</td>
        <td style="font-weight:600; font-size:0.875rem;">${r.requester}</td>
        <td style="color:#6B7280; font-style:italic;">"${r.purpose}"</td>
        <td style="color:#6B7280;">${r.date}</td>
        <td><span class="pill ${pillClass(r.status)}">${r.status}</span></td>
        <td><button data-action="row-menu" style="background:none; border:none; color:#9CA3AF; cursor:pointer;"><i class='bx bx-dots-vertical-rounded'></i></button></td>
      </tr>`
      )
      .join("") || `<tr><td colspan="6" style="padding:1rem;">No requests found.</td></tr>`;
    updateKpis();
  };

  const updateKpis = () => {
    const total = reports.length;
    const pending = reports.filter((r) => /pending/i.test(r.status)).length;
    const denied = reports.filter((r) => /denied|reject/i.test(r.status)).length;
    const score = total ? `${Math.max(70, Math.round(((total - denied) / total) * 100))}%` : "100%";
    const docs = S.qsa(".doc-card", docsGrid).length || 0;
    S.updateStats([score, String(pending), String(denied), String(docs)]);
  };

  const runScan = () => {
    if (!S.requireAdmin("run compliance scans")) return;
    reports.unshift({
      id: `ARQ-${Math.floor(Math.random() * 9000 + 1000)}`,
      requester: "Automated Scanner",
      purpose: "Scheduled policy conformance scan",
      date: new Date().toISOString().slice(0, 10),
      status: "Pending"
    });
    render();
    S.toast("Compliance scan queued.", "success");
  };

  const openRowMenu = async (id) => {
    const row = reports.find((r) => r.id === id);
    if (!row) return;
    const actionData = await M.openForm({
      title: `Manage ${row.id}`,
      submitText: "Apply",
      fields: [
        {
          name: "action",
          label: "Action",
          type: "select",
          value: "approve",
          options: [
            { value: "approve", label: "Approve" },
            { value: "reject", label: "Reject" },
            { value: "edit", label: "Edit Purpose" },
            { value: "delete", label: "Delete Request" }
          ]
        }
      ]
    });
    if (!actionData) return;
    const cmd = actionData.action;
    if (cmd === "approve" || cmd === "reject") {
      if (!S.requireAdmin("approve or reject requests")) return;
      row.status = cmd === "approve" ? "Approved" : "Denied";
      render();
      S.toast(`Request ${row.id} ${row.status.toLowerCase()}.`, "success");
      return;
    }
    if (cmd === "delete") {
      if (!S.requireAdmin("delete requests")) return;
      const ok = await M.confirm({ title: "Delete Request", message: `Delete request ${row.id}?`, confirmText: "Delete" });
      if (!ok) return;
      reports = reports.filter((r) => r.id !== id);
      render();
      S.toast("Request deleted.", "success");
      return;
    }
    if (!S.requireAdmin("edit requests")) return;
    const edit = await M.openForm({
      title: `Edit ${row.id}`,
      submitText: "Update",
      fields: [{ name: "purpose", label: "Purpose", type: "textarea", value: row.purpose }],
      validate: (v) => (!String(v.purpose || "").trim() ? "Purpose is required." : true)
    });
    if (!edit) return;
    row.purpose = edit.purpose.trim();
    render();
    S.toast("Request updated.", "success");
  };

  [headerSearch, requestSearch].forEach((input) => {
    input?.addEventListener("input", (e) => {
      query = e.target.value || "";
      render();
    });
  });

  notifyBtn?.addEventListener("click", () => S.toast("Compliance center is stable."));
  historyBtn?.addEventListener("click", () => S.exportToJSON(reports, "compliance-history.json"));
  fullLogLink?.addEventListener("click", (e) => {
    e.preventDefault();
    S.toast("Opening audit log timeline.");
  });
  policyBtn?.addEventListener("click", async () => {
    if (!S.requireAdmin("request policy changes")) return;
    const data = await M.openForm({
      title: "Request Policy Revision",
      submitText: "Submit Request",
      fields: [{ name: "note", label: "Revision Reason", type: "textarea" }],
      validate: (v) => (!String(v.note || "").trim() ? "Revision reason is required." : true)
    });
    if (!data) return;
    S.toast("Policy revision request submitted.", "success");
  });
  scanBtn?.addEventListener("click", runScan);
  filterBtn?.addEventListener("click", async () => {
    const data = await M.openForm({
      title: "Filter Requests",
      submitText: "Apply Filter",
      fields: [
        {
          name: "status",
          label: "Status",
          type: "select",
          value: statusFilter,
          options: [
            { value: "all", label: "All" },
            { value: "approved", label: "Approved" },
            { value: "pending", label: "Pending" },
            { value: "denied", label: "Denied" }
          ]
        }
      ]
    });
    if (!data) return;
    statusFilter = data.status || "all";
    render();
  });

  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action='row-menu']");
    if (!btn) return;
    const tr = btn.closest("tr[data-id]");
    if (!tr) return;
    openRowMenu(tr.dataset.id);
  });

  docsGrid?.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-sm-outline");
    if (!btn) return;
    const card = btn.closest(".doc-card");
    const name = card?.querySelector("h4")?.textContent?.trim() || "document";
    const action = btn.textContent.toLowerCase();
    if (action.includes("download")) {
      S.exportToJSON([{ name, downloadedAt: new Date().toISOString() }], `${name.replace(/\s+/g, "-").toLowerCase()}.json`);
      return;
    }
    S.toast(`${name} verified successfully.`, "success");
  });

  render();
});

