document.addEventListener("DOMContentLoaded", () => {
  const S = window.PerformXShared;
  const M = window.PerformXModal;
  if (!S || !M) {
    console.error('Required shared modules not loaded');
    return;
  }

  const weeklyCanvas = S.qs("#weeklyPerformance");
  const monthlyCanvas = S.qs("#monthlyBenchmarks");
  const heatmapGrid = S.qs("#heatmapGrid");
  const kpiCards = S.qsa(".kpi-grid .kpi-card");
  const btnFilter = S.qs("#btnReportFilter");
  const btnExport = S.qs("#btnReportExport");
  const btnUpdate = S.qs("#btnUpdateInsights");
  const btnStreakRange = S.qs("#btnStreakRange");
  const breakdownLink = S.qs("#linkReportBreakdown");
  const searchInput = S.qs(".topbar .search-bar input");

  let reportData = {};
  let filterText = "";
  let weeklyChart = null;
  let monthlyChart = null;

  // Helper function to get API URL with fallback
  const getApiUrl = (endpoint) => {
    if (window.apiUrl) {
      return window.apiUrl(endpoint);
    }
    // Fallback for development
    console.warn('window.apiUrl not available, using fallback');
    return `../backend/${endpoint}`;
  };

  const loadReportData = async () => {
    try {
      console.log('Loading report data...');
      const url = getApiUrl('reports/get_report.php');
      const response = await fetch(url, { credentials: 'include' });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Report data response:', result);
      
      if (result.status === 'success') {
        reportData = result.data || {};
        console.log('Report data loaded:', reportData);
        updateKPIs();
      } else {
        throw new Error(result.message || 'Failed to load report data');
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      S.toast('Error loading report data from server', 'error');
      // Show default values
      if (kpiCards.length >= 3) {
        kpiCards[0].querySelector('.kpi-value').textContent = '0';
        kpiCards[1].querySelector('.kpi-value').textContent = '0';
        kpiCards[2].querySelector('.kpi-value').textContent = '0%';
      }
      reportData = {};
    } finally {
      updateCharts(); // Always try to initialize charts
    }
  };

  const updateKPIs = () => {
    if (kpiCards.length >= 3) {
      const totalCard = kpiCards[0];
      const completedCard = kpiCards[1];
      const performanceCard = kpiCards[2];

      const totalValue = totalCard.querySelector(".kpi-value");
      const completedValue = completedCard.querySelector(".kpi-value");
      const performanceValue = performanceCard.querySelector(".kpi-value");

      if (totalValue) totalValue.textContent = reportData.total_tasks || 0;
      if (completedValue) completedValue.textContent = reportData.completed_tasks || 0;
      if (performanceValue) performanceValue.textContent = `${reportData.performance_score || 0}%`;
    }
  };

  const updateCharts = () => {
    if (!window.Chart) {
      console.error('Chart.js is not loaded.');
      return;
    }

    try {
      // Update weekly performance chart
      if (weeklyCanvas) {
        const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        let data = [0, 0, 0, 0, 0, 0, 0];
        
        if (reportData && Array.isArray(reportData.weekly_performance) && reportData.weekly_performance.length > 0) {
          data = reportData.weekly_performance;
        }
        
        if (weeklyChart) {
          weeklyChart.data.datasets[0].data = data;
          weeklyChart.update();
        } else {
          weeklyChart = new Chart(weeklyCanvas.getContext("2d"), {
            type: "line",
            data: { labels, datasets: [{ data, borderColor: "#4F46E5", borderWidth: 3, tension: 0.4, pointRadius: 0, fill: false }] },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
          });
        }
      }
    } catch (err) {
      console.error("Error updating weekly chart:", err);
    }

    try {
      // Update monthly benchmarks chart
      if (monthlyCanvas) {
        const defaultLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
        let labels = defaultLabels;
        let targetData = [0, 0, 0, 0, 0, 0];
        let actualData = [0, 0, 0, 0, 0, 0];
        
        if (reportData && Array.isArray(reportData.monthly_targets) && reportData.monthly_targets.length > 0) {
          labels = defaultLabels.slice(0, reportData.monthly_targets.length);
          targetData = reportData.monthly_targets;
          actualData = (reportData.monthly_actuals && Array.isArray(reportData.monthly_actuals)) 
            ? reportData.monthly_actuals 
            : new Array(targetData.length).fill(0);
        }
        
        if (monthlyChart) {
          monthlyChart.data.labels = labels;
          monthlyChart.data.datasets[0].data = targetData;
          monthlyChart.data.datasets[1].data = actualData;
          monthlyChart.update();
        } else {
          monthlyChart = new Chart(monthlyCanvas.getContext("2d"), {
            type: "bar",
            data: {
              labels,
              datasets: [
                { data: targetData, backgroundColor: "#E5E7EB", borderRadius: 4 },
                { data: actualData, backgroundColor: "#4F46E5", borderRadius: 4 }
              ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
          });
        }
      }
    } catch (err) {
      console.error("Error updating monthly chart:", err);
    }
  };

  const applyFilter = () => {
    const q = filterText.toLowerCase();
    kpiCards.forEach((card) => {
      const text = card.textContent.toLowerCase();
      card.style.display = !q || text.includes(q) ? "" : "none";
    });
  };

  btnFilter?.addEventListener("click", async () => {
    const data = await M.openForm({
      title: "Filter Reports",
      submitText: "Apply Filter",
      fields: [{ name: "keyword", label: "Keyword", type: "text", value: filterText }]
    });
    if (!data) return;
    filterText = (data.keyword || "").trim();
    applyFilter();
    S.toast(filterText ? `Filtered by "${filterText}"` : "Filter cleared.", "success");
  });

  btnExport?.addEventListener("click", () => {
    try {
      const exportData = [
        ['Metric', 'Value'],
        ['Total Tasks', reportData.total_tasks || 0],
        ['Completed Tasks', reportData.completed_tasks || 0],
        ['Pending Tasks', reportData.pending_tasks || 0],
        ['Performance Score', `${reportData.performance_score || 0}%`]
      ];
      console.log('Exporting report data:', exportData);
      S.exportToCSV(exportData, "report-metrics.csv");
      S.toast('Report exported successfully', 'success');
    } catch (error) {
      console.error('Export error:', error);
      S.toast('Failed to export report', 'error');
    }
  });

  btnUpdate?.addEventListener("click", () => {
    loadReportData();
    S.toast("Report data refreshed.", "success");
  });

  // Initialize heatmap with random data for visual effect
  const drawHeatmap = (columns = 20) => {
    if (!heatmapGrid) return;
    let html = "";
    for (let c = 0; c < columns; c += 1) {
      html += '<div class="heat-col">';
      for (let r = 0; r < 7; r += 1) {
        const lvl = Math.floor(Math.random() * 5);
        html += `<div class="heat-dot heat-${lvl}"></div>`;
      }
      html += '</div>';
    }
    heatmapGrid.innerHTML = html;
  };

  btnStreakRange?.addEventListener("click", () => {
    const nextLabel = btnStreakRange.textContent.includes("3 Months") ? " Last 6 Months" : " Last 3 Months";
    btnStreakRange.innerHTML = `<i class='bx bx-calendar-event'></i>${nextLabel}`;
    drawHeatmap(nextLabel.includes("6") ? 26 : 20);
    S.toast("Streak range updated.");
  });

  breakdownLink?.addEventListener("click", (e) => {
    e.preventDefault();
    const breakdownData = {
      report_data: reportData,
      generated_at: new Date().toISOString()
    };
    S.exportToJSON(breakdownData, "report-breakdown.json");
  });

  searchInput?.addEventListener("input", (e) => {
    filterText = (e.target.value || "").trim();
    applyFilter();
  });

  // Initialize the page
  loadReportData();
});

