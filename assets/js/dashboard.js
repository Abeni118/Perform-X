document.addEventListener("DOMContentLoaded", () => {
  const S = window.PerformXShared;
  if (!S) return;
  
  // Load current user data and update UI
  const loadUserData = async () => {
    try {
      const response = await fetch(window.apiUrl('auth/get_user.php'), { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load user data');
      const result = await response.json();
      if (result.status === 'success' && result.data) {
        const user = result.data;
        const displayName = user.name || user.email || 'User';
        
        // Update user name in topbar
        const userNameEl = document.getElementById('topbar-user-name');
        if (userNameEl) userNameEl.textContent = displayName;
        
        // Update user role
        const userRoleEl = document.getElementById('topbar-user-role');
        if (userRoleEl) userRoleEl.textContent = user.role || 'User';
        
        // Update welcome message
        document.querySelectorAll('.page-title p').forEach((el) => {
          const text = el.textContent || '';
          if (/welcome back/i.test(text)) {
            el.textContent = `Welcome back, ${displayName}.`;
          }
        });
        
        // Update avatar
        const avatarName = encodeURIComponent(displayName);
        document.querySelectorAll('.user-profile .user-avatar, .topbar .user-avatar').forEach((img) => {
          if (img.tagName.toLowerCase() !== 'img') return;
          img.src = `https://ui-avatars.com/api/?name=${avatarName}&background=0D8ABC&color=fff&rounded=true`;
          img.alt = displayName;
        });
        
        // Update activity user name
        const activityUserNameEl = document.querySelector('.activity-user-name');
        if (activityUserNameEl) activityUserNameEl.textContent = displayName;
        
        // Update activity avatar
        const activityAvatarEl = document.querySelector('.activity-avatar');
        if (activityAvatarEl && activityAvatarEl.tagName.toLowerCase() === 'img') {
          activityAvatarEl.src = `https://ui-avatars.com/api/?name=${avatarName}&background=0D8ABC&color=fff&rounded=true`;
          activityAvatarEl.alt = displayName;
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };
  
  loadUserData();

  const statCards = S.qsa(".stats-grid .stat-card");
  const velocityCanvas = S.qs("#velocityChart");
  const throughputCanvas = S.qs("#throughputChart");
  const btnExport = S.qs("#btnExportSummary");
  const btnRefresh = S.qs("#btnRefreshDashboard");
  const btnNotifications = S.qs("#btnNotifications");
  const linkViewAllSuggestions = S.qs("#linkViewAllSuggestions");
  const linkShowMoreActivity = S.qs("#linkShowMoreActivity");
  const suggestionLinks = S.qsa(".suggest-link");
  const activityList = S.qs(".activity-list");

  let chartVelocityInstance = null;
  let chartThroughputInstance = null;

  // Inline plugin to draw exact numbers on top of the charts
  const exactNumberPlugin = {
    id: "exactNumbers",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.font = 'bold 12px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#4F46E5';

      chart.data.datasets.forEach((dataset, i) => {
        const meta = chart.getDatasetMeta(i);
        meta.data.forEach((element, index) => {
          const value = dataset.data[index];
          const yPos = chart.config.type === 'bar' ? element.y - 5 : element.y - 8;
          ctx.fillText(value, element.x, yPos);
        });
      });
    }
  };

  const loadDashboardData = async () => {
     try {
         const response = await fetch(window.apiUrl('reports/dashboard_data.php'), { credentials: 'include' });
         if (!response.ok) throw new Error("Dashboard fetch failed");
         const result = await response.json();
         if (result.status === 'success') {
             const data = result.data;
             
             // Update Stat cards securely avoiding innerHTML
             if (statCards.length >= 4) {
                 const tTasks = statCards[0].querySelector(".stat-value");
                 const cTasks = statCards[1].querySelector(".stat-value");
                 const pScore = statCards[2].querySelector(".stat-value");
                 
                 if (tTasks) tTasks.textContent = data.total_tasks;
                 if (cTasks) cTasks.textContent = data.completed_tasks;
                 if (pScore) pScore.textContent = `${data.performance_score}%`;
             }

             // Update charts
             const velocityCounts = data.charts.weekly_velocity || [3, 5, 4, 7, 5, 6, 8];
             const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
             const labels = Array.from({length: 7}).map((_, i) => dayNames[(new Date().getDay() - i + 7) % 7]).reverse();
             
             if (velocityCanvas && window.Chart) {
                 if (chartVelocityInstance) {
                     chartVelocityInstance.data.datasets[0].data = velocityCounts;
                     chartVelocityInstance.update();
                 } else {
                     chartVelocityInstance = new Chart(velocityCanvas.getContext("2d"), {
                       type: "line",
                       data: {
                         labels: labels,
                         datasets: [{ data: velocityCounts, borderColor: "#4F46E5", borderWidth: 3, tension: 0.4, pointRadius: 4, fill: false }]
                       },
                       options: {
                         responsive: true,
                         maintainAspectRatio: false,
                         plugins: { legend: { display: false } },
                         scales: { y: { beginAtZero: true, suggestedMax: Math.max(...velocityCounts) + 5, ticks: { precision: 0 } } },
                         layout: { padding: { top: 20 } }
                       },
                       plugins: [exactNumberPlugin]
                     });
                 }
             }

             if (throughputCanvas && window.Chart) {
                 const tpData = data.charts.monthly_throughput && data.charts.monthly_throughput.some(v => v > 0) 
                              ? data.charts.monthly_throughput.slice(0, 6) 
                              : [12, 15, 13, 18, 20, 14];
                 if (chartThroughputInstance) {
                     chartThroughputInstance.data.datasets[0].data = tpData;
                     chartThroughputInstance.update();
                 } else {
                     chartThroughputInstance = new Chart(throughputCanvas.getContext("2d"), {
                       type: "bar",
                       data: {
                         labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                         datasets: [{ data: tpData, backgroundColor: "#4F46E5", borderRadius: 6 }]
                       },
                       options: {
                         responsive: true,
                         maintainAspectRatio: false,
                         plugins: { legend: { display: false } },
                         scales: { y: { ticks: { precision: 0 } } },
                         layout: { padding: { top: 20 } }
                       },
                       plugins: [exactNumberPlugin]
                     });
                 }
             }
         }
     } catch (err) {
         console.error(err);
         S.toast("Error fetching analytics", "error");
     }
  };

  loadDashboardData();

  const getSummaryRows = () =>
    statCards.map((card) => ({
      metric: card.querySelector(".stat-label")?.textContent?.trim() ?? "",
      value: card.querySelector(".stat-value")?.textContent?.trim() ?? "",
      details: card.querySelector(".stat-desc")?.textContent?.trim() ?? ""
    }));

  btnExport?.addEventListener("click", () => {
    S.exportToCSV(getSummaryRows(), "dashboard-summary.csv");
  });

  btnRefresh?.addEventListener("click", () => {
    loadDashboardData();
    S.toast("Dashboard data refreshed.", "success");
  });

  btnNotifications?.addEventListener("click", () => {
    S.toast("Notifications coming soon!", "info");
  });

  btnContactSupport?.addEventListener("click", () => {
    window.location.href = "pages/support.html";
  });

  suggestionLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const key = link.dataset.suggestion || "suggestion";
      link.textContent = "Applied";
      link.style.pointerEvents = "none";
      S.toast(`Suggestion "${key}" applied.`, "success");
    });
  });

  linkViewAllSuggestions?.addEventListener("click", (e) => {
    e.preventDefault();
    S.toast("Showing all suggestions.");
  });

  linkShowMoreActivity?.addEventListener("click", (e) => {
    e.preventDefault();
    if (!activityList) return;
    const row = document.createElement("div");
    row.className = "activity-item";
    row.innerHTML = `
      <img src="https://ui-avatars.com/api/?name=System&background=6366F1&color=fff&rounded=true" alt="System" class="activity-avatar">
      <div class="activity-content">
        <p><span>System</span> <span class="muted">generated</span> dashboard insights</p>
        <div class="activity-time"><i class='bx bx-time-five'></i> just now</div>
      </div>
      <button class="activity-more"><i class='bx bx-dots-vertical-rounded'></i></button>
    `;
    activityList.appendChild(row);
    S.toast("New activity loaded.", "success");
  });

  activityList?.addEventListener("click", (e) => {
    const btn = e.target.closest(".activity-more");
    if (!btn) return;
    S.toast("Activity options opened.");
  });
});

