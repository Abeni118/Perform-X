document.addEventListener("DOMContentLoaded", () => {
  const S = window.PerformXShared;
  const M = window.PerformXModal;
  if (!S || !M) {
    console.error('Required shared modules not loaded');
    return;
  }

  const tableBody = S.qs(".team-table tbody");
  const scoreCanvas = S.qs("#teamScoreChart");
  const searchInput = S.qs(".topbar .search-bar input");
  const btnRange = S.qs("#btnTeamRange");
  const btnInvite = S.qs("#btnInviteMember");
  const btnExport = S.qs("#btnTeamExport");
  const btnFilter = S.qs("#btnDirectoryFilter");
  const btnAssign = S.qs("#btnAssignTeamTask");

  if (!tableBody) {
    console.error('Team table body not found');
    return;
  }

  let members = [];
  let query = "";
  let chartInstance = null;

  // Helper function to get API URL with fallback
  const getApiUrl = (endpoint) => {
    if (window.apiUrl) {
      return window.apiUrl(endpoint);
    }
    // Fallback for development
    console.warn('window.apiUrl not available, using fallback');
    return `../backend/${endpoint}`;
  };

  const loadTeamMembers = async () => {
    try {
      console.log('Loading team members...');
      const url = getApiUrl('teams/get_team_members.php');
      const response = await fetch(url, { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Team members response:', result);
      
      if (result.status === 'success') {
        members = result.data || [];
        console.log('Team members loaded:', members.length);
        render();
        updateChart();
      } else {
        throw new Error(result.message || 'Failed to load team members');
      }
    } catch (error) {
      console.error('Error loading team members:', error);
      S.toast('Error loading team members from server', 'error');
      // Show empty state
      tableBody.innerHTML = '<tr><td colspan="5" style="padding:1rem;text-align:center;">Unable to load team members. Please try again.</td></tr>';
    }
  };

  const updateChart = () => {
    if (!scoreCanvas || !window.Chart) return;
    
    const labels = members.slice(0, 6).map((m) => m.name.split(" ")[0]);
    const data = members.slice(0, 6).map((m) => m.score);
    
    if (chartInstance) {
      chartInstance.data.labels = labels;
      chartInstance.data.datasets[0].data = data;
      chartInstance.update();
    } else {
      chartInstance = new Chart(scoreCanvas.getContext("2d"), {
        type: "bar",
        data: { labels, datasets: [{ data, backgroundColor: "#4F46E5", borderRadius: 4 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
      });
    }
  };

  const render = () => {
    const filtered = members.filter((m) => `${m.name} ${m.role}`.toLowerCase().includes(query.toLowerCase()));
    tableBody.innerHTML = filtered
      .map(
        (m) => `
      <tr data-id="${m.id}">
        <td>
          <div class="emp-cell">
            <div class="emp-avatar-container">
              <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=E0E7FF&color=4F46E5&rounded=true" alt="${m.name}" class="emp-avatar">
            </div>
            <div class="emp-info">
              <div class="emp-name">${m.name}</div>
              <div class="emp-role">${m.role}</div>
            </div>
          </div>
        </td>
        <td style="text-align: center; color: #111827; font-weight: 500;">${m.total}</td>
        <td style="text-align: center; color: #10B981; font-weight: 600;">${m.completed}</td>
        <td>
          <div class="rate-wrapper">
            <div class="rate-labels"><span class="rate-lbl">RATE</span><span class="rate-val">${m.rate}%</span></div>
            <div class="rate-bar-bg"><div class="rate-bar-fill" style="width: ${m.rate}%; background: #4F46E5;"></div></div>
          </div>
        </td>
        <td style="text-align: center;"><span class="score-badge bg-gray-light text-gray">${m.score}</span></td>
      </tr>`
      )
      .join("") || `<tr><td colspan="5" style="padding:1rem;">No members found.</td></tr>`;
  };

  const addMember = async () => {
    const values = await M.openForm({
      title: "Invite Team Member",
      submitText: "Invite Member",
      fields: [
        { name: "name", label: "Member Name", type: "text" },
        { name: "role", label: "Role", type: "text", value: "Team Member" },
        { name: "email", label: "Email (Optional)", type: "email" }
      ],
      validate: (d) => (!String(d.name || "").trim() ? "Member name is required." : true)
    });
    if (!values) return;
    
    try {
      console.log('Adding team member:', values);
      const url = getApiUrl('teams/add_member.php');
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name.trim(),
          role: values.role.trim(),
          email: values.email?.trim() || ''
        })
      });
      
      const result = await response.json();
      console.log('Add member response:', result);
      
      if (response.ok && result.data) {
        S.toast("Member added successfully.", "success");
        // Reload data from backend to ensure consistency
        loadTeamMembers();
      } else {
        throw new Error(result.message || "Failed to add member");
      }
    } catch (error) {
      console.error('Error adding member:', error);
      S.toast("Error adding member: " + error.message, "error");
    }
  };

  btnInvite?.addEventListener("click", addMember);
  btnAssign?.addEventListener("click", async () => {
    if (!members.length) return S.toast("No team member available.", "error");
    const values = await M.openForm({
      title: "Assign Team",
      submitText: "Assign Team",
      fields: [
        { name: "teamName", label: "Team Name", type: "text", value: "Core Team" },
        {
          name: "members",
          label: "Members",
          type: "checkbox-group",
          options: members.map((m) => ({ value: m.id, label: m.name }))
        },
        { name: "role", label: "Role (Optional)", type: "text", value: "Owner" },
        { name: "notes", label: "Notes", type: "textarea", value: "" }
      ],
      validate: (d) => {
        if (!String(d.teamName || "").trim()) return "Team name is required.";
        if (!Array.isArray(d.members) || !d.members.length) return "Select at least one member.";
        return true;
      }
    });
    if (!values) return;
    members.forEach((m) => {
      if (values.members.includes(m.id)) {
        m.total += 1;
        m.rate = Math.min(100, Math.round((m.completed / Math.max(m.total, 1)) * 100));
      }
    });
    render();
    S.toast(`Assigned team "${values.teamName}" successfully.`, "success");
  });

  btnExport?.addEventListener("click", () => S.exportToCSV(members, "team-members.csv"));
  btnRange?.addEventListener("click", () => S.toast("Showing last 30 days snapshot."));
  btnFilter?.addEventListener("click", async () => {
    const values = await M.openForm({
      title: "Filter Team",
      submitText: "Apply",
      fields: [{ name: "keyword", label: "Role Keyword", type: "text", value: query }]
    });
    if (!values) return;
    query = (values.keyword || "").trim();
    render();
  });

  searchInput?.addEventListener("input", (e) => {
    query = e.target.value || "";
    render();
  });

  tableBody.addEventListener("dblclick", async (e) => {
    const row = e.target.closest("tr[data-id]");
    if (!row) return;
    const member = members.find((m) => m.id === row.dataset.id);
    if (!member) return;
    const values = await M.openForm({
      title: `Update ${member.name}`,
      submitText: "Update Member",
      fields: [{ name: "role", label: "Role", type: "text", value: member.role }],
      validate: (d) => (!String(d.role || "").trim() ? "Role is required." : true)
    });
    if (!values) return;
    member.role = values.role.trim();
    render();
    S.toast("Member updated.", "success");
  });

  // Initialize the page
  loadTeamMembers();
});

