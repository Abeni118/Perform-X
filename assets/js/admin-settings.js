document.addEventListener("DOMContentLoaded", () => {
  const S = window.AdminShared;
  const M = window.PerformXModal;
  if (!S || !M) return;

  const auditBtn = S.qs("#adminSettingsAuditBtn");
  const saveBtn = S.qs("#adminSettingsSaveBtn");
  const addRoleBtn = S.qs("#adminAddRoleBtn");
  const backupBtn = S.qs("#adminVaultBackupBtn");
  const restoreBtn = S.qs("#adminRestorePointBtn");
  const logsLink = S.qs("#adminSettingsUpdateLogsLink");
  const marketLink = S.qs("#adminIntegrationMarketplaceLink");
  const notifyBtn = S.qs("#adminSettingsNotifyBtn");
  const sessionInput = S.qs("#adminSessionTimeout");
  const attemptsInput = S.qs("#adminLoginAttempts");
  const rbacTable = S.qs("#adminRbacTable");
  const toggles = S.qsa(".toggle-switch");

  const key = "settings";
  const defaults = {
    sessionTimeout: 30,
    loginAttempts: 5,
    mfaEnabled: true,
    roles: []
  };
  const state = { ...defaults, ...S.load(key, defaults) };

  const seedRolesFromDom = () =>
    S.qsa("tbody tr", rbacTable).map((tr) => ({
      name: tr.querySelector("td:nth-child(1) div:nth-child(1)")?.textContent?.trim() || "Role",
      scope: tr.querySelector("td:nth-child(1) div:nth-child(2)")?.textContent?.trim() || "SCOPE",
      permission: tr.querySelector("td:nth-child(2) span")?.textContent?.trim() || "Read-only"
    }));

  if (!state.roles.length) state.roles = seedRolesFromDom();

  const saveState = () => S.save(key, state);

  const validate = () => {
    const timeout = Number(sessionInput?.value || 0);
    const attempts = Number(attemptsInput?.value || 0);
    if (!Number.isFinite(timeout) || timeout < 5 || timeout > 240) {
      S.toast("Session timeout must be between 5 and 240 minutes.", "error");
      return false;
    }
    if (!Number.isFinite(attempts) || attempts < 1 || attempts > 20) {
      S.toast("Max login attempts must be between 1 and 20.", "error");
      return false;
    }
    state.sessionTimeout = timeout;
    state.loginAttempts = attempts;
    state.mfaEnabled = toggles[0]?.classList.contains("active") ?? true;
    return true;
  };

  const renderRoles = () => {
    const tbody = rbacTable?.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = state.roles
      .map(
        (r, i) => `
      <tr data-index="${i}">
        <td style="padding: 1rem 0; border-bottom: 1px solid #F3F4F6;">
          <div style="font-size:0.95rem; font-weight:600; color:#111827; margin-bottom:0.25rem;">${r.name}</div>
          <div style="font-size:0.75rem; font-weight:600; text-transform:uppercase; color:#6B7280;">${r.scope}</div>
        </td>
        <td style="padding: 1rem 0; border-bottom: 1px solid #F3F4F6;">
          <span style="background: #F3F4F6; color: #4B5563; padding: 0.35rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600;">${r.permission}</span>
        </td>
        <td style="padding: 1rem 0; border-bottom: 1px solid #F3F4F6; text-align:right;">
          <button data-action="edit-role" style="background:none;border:none;color:#9CA3AF;cursor:pointer;"><i class='bx bx-pencil'></i></button>
          <button data-action="delete-role" style="background:none;border:none;color:#EF4444;cursor:pointer;"><i class='bx bx-trash'></i></button>
        </td>
      </tr>`
      )
      .join("");
  };

  sessionInput && (sessionInput.value = String(state.sessionTimeout));
  attemptsInput && (attemptsInput.value = String(state.loginAttempts));
  if (toggles[0]) toggles[0].classList.toggle("active", !!state.mfaEnabled);

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      toggle.classList.toggle("active");
      S.toast(toggle.classList.contains("active") ? "Setting enabled." : "Setting disabled.");
    });
  });

  notifyBtn?.addEventListener("click", () => S.toast("Settings notifications checked."));
  auditBtn?.addEventListener("click", () => S.exportToJSON([state], "admin-settings-audit.json"));
  logsLink?.addEventListener("click", (e) => {
    e.preventDefault();
    S.toast("Security logs update started.", "success");
  });
  marketLink?.addEventListener("click", (e) => {
    e.preventDefault();
    S.toast("Opening integration marketplace.");
  });
  backupBtn?.addEventListener("click", () => {
    if (!S.requireAdmin("create backups")) return;
    if (!validate()) return;
    saveState();
    S.toast("Vault backup initiated.", "success");
  });
  restoreBtn?.addEventListener("click", async () => {
    if (!S.requireAdmin("restore backups")) return;
    const ok = await M.confirm({ title: "Restore Backup", message: "Restore latest backup point?", confirmText: "Restore" });
    if (!ok) return;
    S.toast("Restore point applied.", "success");
  });
  saveBtn?.addEventListener("click", () => {
    if (!S.requireAdmin("save global settings")) return;
    if (!validate()) return;
    saveState();
    S.toast("Settings saved successfully.", "success");
  });

  addRoleBtn?.addEventListener("click", async () => {
    if (!S.requireAdmin("add roles")) return;
    const data = await M.openForm({
      title: "Add Administrative Role",
      submitText: "Add Role",
      fields: [
        { name: "name", label: "Role Name", type: "text" },
        { name: "permission", label: "Primary Permission", type: "text", value: "Read-only" }
      ],
      validate: (v) => (!String(v.name || "").trim() ? "Role name is required." : !String(v.permission || "").trim() ? "Permission is required." : true)
    });
    if (!data) return;
    state.roles.push({
      name: data.name.trim(),
      scope: "CUSTOM SCOPE",
      permission: data.permission.trim()
    });
    renderRoles();
    saveState();
    S.toast("Role added.", "success");
  });

  rbacTable?.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    const row = btn.closest("tr[data-index]");
    if (!row) return;
    const idx = Number(row.dataset.index);
    const role = state.roles[idx];
    if (!role) return;
    if (btn.dataset.action === "delete-role") {
      if (!S.requireAdmin("delete roles")) return;
      const ok = await M.confirm({ title: "Delete Role", message: `Delete role "${role.name}"?`, confirmText: "Delete" });
      if (!ok) return;
      state.roles.splice(idx, 1);
      renderRoles();
      saveState();
      S.toast("Role deleted.", "success");
      return;
    }
    if (!S.requireAdmin("edit roles")) return;
    const data = await M.openForm({
      title: `Edit ${role.name}`,
      submitText: "Update Role",
      fields: [{ name: "permission", label: "Permission", type: "text", value: role.permission }],
      validate: (v) => (!String(v.permission || "").trim() ? "Permission is required." : true)
    });
    if (!data) return;
    role.permission = data.permission.trim();
    renderRoles();
    saveState();
    S.toast("Role updated.", "success");
  });

  renderRoles();
});

