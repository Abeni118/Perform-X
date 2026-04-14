document.addEventListener("DOMContentLoaded", () => {
  const S = window.AdminShared;
  const M = window.PerformXModal;
  if (!S || !M) return;

  const table = S.qs("#adminUsersTable");
  const tbody = table?.querySelector("tbody");
  const headerSearch = S.qs(".topbar .search-bar input");
  const tableSearch = S.qs("#adminUsersTableSearch");
  const exportBtn = S.qs("#adminUsersExportBtn");
  const createBtn = S.qs("#adminUsersCreateBtn");
  const filterBtn = S.qs("#adminUsersFilterBtn");
  const notifyBtn = S.qs("#adminUsersNotifyBtn");
  const masterCheckbox = table?.querySelector("thead input[type='checkbox']");
  if (!table || !tbody) return;

  let users = [];
  
  // Load users from backend API
  const loadUsers = async () => {
    try {
      const response = await fetch(window.apiUrl('users/get_users.php'), { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load users');
      const result = await response.json();
      if (result.status === 'success') {
        users = result.data || [];
        render();
      } else {
        S.toast(result.message || 'Failed to load users', 'error');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      S.toast('Error loading users from server', 'error');
    }
  };
  
  loadUsers();

  let roleFilter = "all";
  let searchQuery = "";

  const filteredUsers = () =>
    users.filter((u) => {
      const haystack = `${u.name} ${u.email} ${u.role} ${u.status}`.toLowerCase();
      const roleOk = roleFilter === "all" || u.role.toLowerCase().includes(roleFilter);
      return roleOk && haystack.includes(searchQuery.toLowerCase());
    });

  const render = () => {
    const rows = filteredUsers();
    tbody.innerHTML = rows
      .map(
        (u) => `
      <tr data-id="${u.id}">
        <td style="padding-right:0;"><input type="checkbox" style="width:16px; height:16px;"></td>
        <td>
          <div style="display:flex; align-items:center; gap:1rem;">
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=4338CA&color=fff&rounded=true" alt="${u.name}" style="width:40px; height:40px; border-radius:50%;">
            <div>
              <div style="font-weight:600; font-size:0.95rem; color:#111827;">${u.name}</div>
              <div style="font-size:0.75rem; color:#6B7280;">${u.email}</div>
            </div>
          </div>
        </td>
        <td style="text-align:center;"><span style="background:#F3F4F6; color:#4B5563; font-size:0.75rem; padding:0.25rem 0.75rem; border-radius:999px; border:1px solid #E5E7EB; font-weight:600;">${u.role}</span></td>
        <td style="font-size:0.875rem; color:#4B5563; font-weight:500;">${u.accountType}</td>
        <td style="text-align:center; font-size:0.875rem; font-weight:700; color:#111827;">${u.tasks}</td>
        <td style="text-align:center; font-size:0.875rem; font-weight:700; color:#111827;">${u.completion}%</td>
        <td style="text-align:center; font-size:0.875rem; font-weight:700; color:#111827;">${u.score}</td>
        <td><span style="font-weight:700; font-size:0.8rem; color:${u.status === "Suspended" ? "#FFFFFF" : "#111827"}; background:${u.status === "Suspended" ? "#EF4444" : "transparent"}; padding:${u.status === "Suspended" ? "0.25rem 0.75rem" : "0"}; border-radius:999px;">${u.status}</span></td>
        <td><button data-action="menu" style="background:none; border:none; color:#9CA3AF; cursor:pointer;"><i class='bx bx-dots-vertical-rounded'></i></button></td>
      </tr>`
      )
      .join("") || `<tr><td colspan="9" style="padding:1rem;">No users found.</td></tr>`;
    updateKpis();
  };

  const updateKpis = () => {
    const activeUsers = users.filter((u) => u.status.toLowerCase() === "active").length;
    const avgScore = users.length ? Math.round(users.reduce((a, b) => a + b.score, 0) / users.length) : 0;
    // TODO: Load actual reports and tasks from backend APIs
    const completedTasks = 0;
    const pendingReports = 0;
    const compliancePct = "100%";
    S.updateStats([String(activeUsers), compliancePct, `${avgScore}/100`, String(Math.max(pendingReports, completedTasks))]);
  };

  const addUser = async () => {
    if (!S.requireAdmin("create users")) return;
    const data = await M.openForm({
      title: "Create New User",
      submitText: "Create User",
      fields: [
        { name: "name", label: "Full Name", type: "text" },
        { name: "email", label: "Email", type: "email" },
        {
          name: "role",
          label: "Role",
          type: "select",
          value: "Standard",
          options: [
            { value: "Admin", label: "Admin" },
            { value: "Manager", label: "Manager" },
            { value: "Standard", label: "Standard" }
          ]
        }
      ],
      validate: (v) => {
        if (!String(v.name || "").trim()) return "Name is required.";
        if (!String(v.email || "").trim()) return "Email is required.";
        if (!S.validateEmail(v.email)) return "Invalid email format.";
        return true;
      }
    });
    if (!data) return;
    users.unshift({
      id: `USR-${Date.now()}`,
      name: data.name.trim(),
      email: data.email.trim(),
      role: data.role.trim(),
      accountType: "Professional",
      tasks: 0,
      completion: 0,
      score: 70,
      status: "Active"
    });
    render();
    S.toast("User added successfully.", "success");
  };

  const openRowMenu = async (id) => {
    const user = users.find((u) => u.id === id);
    if (!user) return;
    const actionData = await M.openForm({
      title: `Manage ${user.name}`,
      submitText: "Apply",
      fields: [
        {
          name: "action",
          label: "Action",
          type: "select",
          value: "edit",
          options: [
            { value: "edit", label: "Edit User" },
            { value: "delete", label: "Delete User" },
            { value: "toggle-role", label: "Toggle Admin Role" },
            { value: "suspend", label: user.status === "Suspended" ? "Reactivate User" : "Suspend User" }
          ]
        }
      ]
    });
    if (!actionData) return;
    const cmd = actionData.action;
    if (cmd === "delete") {
      if (!S.requireAdmin("delete users")) return;
      if (user.role.toLowerCase().includes("admin") && users.filter((u) => u.role.toLowerCase().includes("admin")).length === 1) {
        S.toast("Cannot delete the last admin account.", "error");
        return;
      }
      const ok = await M.confirm({ title: "Delete User", message: `Delete ${user.name}?`, confirmText: "Delete" });
      if (!ok) return;
      users = users.filter((u) => u.id !== id);
      render();
      S.toast("User deleted.", "success");
      return;
    }
    if (cmd === "toggle-role") {
      if (!S.requireAdmin("edit user roles")) return;
      user.role = /admin/i.test(user.role) ? "Standard" : "Admin";
      render();
      S.toast("User role updated.", "success");
      return;
    }
    if (cmd === "suspend") {
      if (!S.requireAdmin("suspend users")) return;
      user.status = user.status === "Suspended" ? "Active" : "Suspended";
      render();
      S.toast(`User ${user.status.toLowerCase()}.`, "success");
      return;
    }
    if (!S.requireAdmin("edit users")) return;
    const edit = await M.openForm({
      title: `Edit ${user.name}`,
      submitText: "Update User",
      fields: [
        { name: "name", label: "Full Name", type: "text", value: user.name },
        { name: "email", label: "Email", type: "email", value: user.email }
      ],
      validate: (v) => {
        if (!String(v.name || "").trim()) return "Name is required.";
        if (!String(v.email || "").trim()) return "Email is required.";
        if (!S.validateEmail(v.email)) return "Invalid email format.";
        return true;
      }
    });
    if (!edit) return;
    user.name = edit.name.trim();
    user.email = edit.email.trim();
    render();
    S.toast("User updated.", "success");
  };

  [headerSearch, tableSearch].forEach((input) => {
    input?.addEventListener("input", (e) => {
      searchQuery = (e.target.value || "").trim();
      render();
    });
  });

  exportBtn?.addEventListener("click", () => S.exportToCSV(filteredUsers(), "admin-users.csv"));
  createBtn?.addEventListener("click", addUser);
  notifyBtn?.addEventListener("click", () => S.toast("No urgent admin notifications."));
  filterBtn?.addEventListener("click", async () => {
    const data = await M.openForm({
      title: "Filter Users",
      submitText: "Apply",
      fields: [
        {
          name: "role",
          label: "Role Filter",
          type: "select",
          value: roleFilter,
          options: [
            { value: "all", label: "All" },
            { value: "admin", label: "Admin" },
            { value: "manager", label: "Manager" },
            { value: "standard", label: "Standard" }
          ]
        }
      ]
    });
    if (!data) return;
    roleFilter = data.role || "all";
    render();
  });

  masterCheckbox?.addEventListener("change", () => {
    S.qsa("tbody input[type='checkbox']", table).forEach((cb) => {
      cb.checked = masterCheckbox.checked;
    });
  });

  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-action='menu']");
    if (!btn) return;
    const row = btn.closest("tr[data-id]");
    if (!row) return;
    openRowMenu(row.dataset.id);
  });

  render();
});

