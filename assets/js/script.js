document.addEventListener("DOMContentLoaded", function () {
    // --- THEME TOGGLE LOGIC ---
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const body = document.body;

    // Load saved preference
    if (localStorage.getItem('performx-theme') === 'dark') {
        body.classList.add('dark-mode');
        if (themeIcon) {
            themeIcon.classList.remove('bx-moon');
            themeIcon.classList.add('bx-sun');
        }
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            body.classList.toggle('dark-mode');
            const isDark = body.classList.contains('dark-mode');
            localStorage.setItem('performx-theme', isDark ? 'dark' : 'light');
            if (themeIcon) {
                if (isDark) {
                    themeIcon.classList.remove('bx-moon');
                    themeIcon.classList.add('bx-sun');
                } else {
                    themeIcon.classList.remove('bx-sun');
                    themeIcon.classList.add('bx-moon');
                }
            }
        });
    }

    const ctx1 = document.getElementById('velocityChart');
    if (ctx1) {
        new Chart(ctx1.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    data: [8, 12, 7, 15, 11, 4, 3],
                    borderColor: '#4F46E5',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: {
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { color: '#9CA3AF', font: { size: 11, family: 'Inter' }, padding: 10 }
                    },
                    y: {
                        min: 0, max: 16,
                        ticks: { stepSize: 4, color: '#9CA3AF', font: { size: 11, family: 'Inter' }, padding: 10 },
                        grid: { color: '#F3F4F6', borderDash: [4, 4], drawBorder: false }
                    }
                },
                layout: { padding: { left: 0, right: 0, top: 10, bottom: 0 } }
            }
        });
    }

    const ctx2 = document.getElementById('throughputChart');
    if (ctx2) {
        new Chart(ctx2.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    data: [120, 155, 130, 180, 200, 145],
                    backgroundColor: function (context) {
                        return context.dataIndex === 4 ? '#4F46E5' : '#E5E7EB';
                    },
                    borderRadius: 6,
                    borderSkipped: false,
                    barThickness: 20
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: {
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { color: '#9CA3AF', font: { size: 11, family: 'Inter' }, padding: 10 }
                    },
                    y: {
                        min: 0, max: 200,
                        ticks: { stepSize: 50, color: '#9CA3AF', font: { size: 11, family: 'Inter' }, padding: 10 },
                        grid: { color: '#F3F4F6', borderDash: [4, 4], drawBorder: false },
                        beginAtZero: true
                    }
                },
                layout: { padding: { left: 0, right: 0, top: 10, bottom: 0 } }
            }
        });
    }

    // --- REPORT PAGE CHARTS ---

    // 1. Weekly Performance Line Chart
    const weekCtx = document.getElementById('weeklyPerformance');
    if (weekCtx) {
        new Chart(weekCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    data: [82, 88, 75, 94, 92, 60, 65],
                    borderColor: '#4F46E5',
                    borderWidth: 3,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    fill: true,
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 250);
                        gradient.addColorStop(0, 'rgba(79, 70, 229, 0.15)');
                        gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');
                        return gradient;
                    }
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: {
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { color: '#9CA3AF', font: { size: 11, family: 'Inter' }, padding: 10 }
                    },
                    y: {
                        min: 0, max: 100,
                        ticks: { stepSize: 25, color: '#9CA3AF', font: { size: 11, family: 'Inter' }, padding: 10 },
                        grid: { color: '#F3F4F6', borderDash: [4, 4], drawBorder: false },
                        beginAtZero: true
                    }
                },
                layout: { padding: { left: 0, right: 0, top: 10, bottom: 0 } }
            }
        });
    }

    // 2. Monthly Benchmarks Bar Chart
    const monthCtx = document.getElementById('monthlyBenchmarks');
    if (monthCtx) {
        new Chart(monthCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    {
                        label: 'Target',
                        data: [80, 80, 85, 85, 90, 95],
                        backgroundColor: '#F3F4F6',
                        borderRadius: 4,
                        barPercentage: 0.6,
                        categoryPercentage: 0.5
                    },
                    {
                        label: 'Actual',
                        data: [72, 78, 85, 82, 90, 94],
                        backgroundColor: '#4F46E5',
                        borderRadius: 4,
                        barPercentage: 0.6,
                        categoryPercentage: 0.5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: {
                    x: {
                        stacked: false,
                        grid: { display: false, drawBorder: false },
                        ticks: { color: '#9CA3AF', font: { size: 11, family: 'Inter' }, padding: 10 }
                    },
                    y: {
                        min: 0, max: 100,
                        ticks: { stepSize: 25, color: '#9CA3AF', font: { size: 11, family: 'Inter' }, padding: 10 },
                        grid: { color: '#F3F4F6', borderDash: [4, 4], drawBorder: false },
                        beginAtZero: true
                    }
                },
                layout: { padding: { left: 0, right: 0, top: 10, bottom: 0 } }
            }
        });
    }

    // 3. Streak Heatmap Generation
    const grid = document.getElementById('heatmapGrid');
    if (grid) {
        const columns = 20; 
        const rows = 7;
        let html = '';

        for (let c = 0; c < columns; c++) {
            html += '<div class="heat-col">';
            for (let r = 0; r < rows; r++) {
                // Simulate recent activity density matching the design image
                let heatLvl = 0;
                if (c > 12) {
                    heatLvl = Math.floor(Math.random() * 4) + 1; // More active recently
                } else if (c > 5) {
                    heatLvl = Math.random() > 0.4 ? Math.floor(Math.random() * 3) + 1 : 0; 
                } else {
                    heatLvl = Math.random() > 0.7 ? Math.floor(Math.random() * 2) + 1 : 0;
                }
                html += `<div class="heat-dot heat-${heatLvl}"></div>`;
            }
            html += '</div>';
        }
        grid.innerHTML = html;
    }

    // --- TEAM PAGE CHARTS ---

    // 1. Employee Performance Score Comparison
    const teamCtx = document.getElementById('teamScoreChart');
    if (teamCtx) {
        new Chart(teamCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Sarah', 'Michael', 'Elena', 'David', 'Sofia', 'James'],
                datasets: [
                    {
                        label: 'Performance Score',
                        data: [93, 89, 97, 82, 91, 85],
                        backgroundColor: '#4F46E5', // Solid indigo matching design
                        borderRadius: 4,
                        barPercentage: 0.6,
                        categoryPercentage: 0.7
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: {
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { color: '#6B7280', font: { size: 11, family: 'Inter', weight: 500 }, padding: 10 }
                    },
                    y: {
                        min: 0, max: 100,
                        ticks: { stepSize: 25, color: '#9CA3AF', font: { size: 11, family: 'Inter' }, padding: 10 },
                        grid: { color: '#F3F4F6', borderDash: [4, 4], drawBorder: false },
                        beginAtZero: true
                    }
                },
                layout: { padding: { left: 0, right: 0, top: 10, bottom: 0 } }
            }
        });
    }

});
