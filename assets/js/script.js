document.addEventListener('DOMContentLoaded', function () {

  // Weekly Task Velocity (Line Chart)
  const velocityCtx = document.getElementById('velocityChart');
  if (velocityCtx) {
    new Chart(velocityCtx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Completed Tasks',
          data: [8, 12, 7, 15, 11, 4, 3],
          borderColor: '#4F46E5', // Primary Color
          borderWidth: 2,
          tension: 0.4, // Smooth curve
          pointRadius: 0, // No points unless hovered
          pointHoverRadius: 4,
          pointBackgroundColor: '#4F46E5',
          fill: true,
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 300);
            gradient.addColorStop(0, 'rgba(79, 70, 229, 0.15)');
            gradient.addColorStop(1, 'rgba(79, 70, 229, 0)');
            return gradient;
          }
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111827',
            padding: 12,
            titleFont: { family: 'Inter', size: 12 },
            bodyFont: { family: 'Inter', size: 13, weight: 'bold' },
            displayColors: false,
            cornerRadius: 8,
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 16,
            ticks: {
              stepSize: 4,
              font: { family: 'Inter', size: 11 },
              color: '#9CA3AF'
            },
            grid: {
              color: '#F3F4F6',
              drawBorder: false,
              borderDash: [5, 5]
            }
          },
          x: {
            grid: { display: false, drawBorder: false },
            ticks: {
              font: { family: 'Inter', size: 11 },
              color: '#9CA3AF',
              padding: 10
            }
          }
        },
        interaction: { intersect: false, mode: 'index' }
      }
    });
  }

  // Monthly Throughput (Bar Chart)
  const throughputCtx = document.getElementById('throughputChart');
  if (throughputCtx) {
    new Chart(throughputCtx, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Volume',
          data: [120, 155, 130, 180, 200, 145],
          backgroundColor: (context) => {
            // Make 'May' the primary blue color, the rest light gray
            if (context.dataIndex === 4) {
              return '#4F46E5';
            }
            return '#E5E7EB';
          },
          borderRadius: 4,
          barPercentage: 0.7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#111827',
            padding: 10,
            titleFont: { family: 'Inter', size: 12 },
            bodyFont: { family: 'Inter', size: 13, weight: 'bold' },
            displayColors: false,
            cornerRadius: 6,
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 200,
            ticks: {
              stepSize: 50,
              font: { family: 'Inter', size: 10 },
              color: '#9CA3AF'
            },
            grid: {
              color: '#F3F4F6',
              drawBorder: false,
            }
          },
          x: {
            grid: { display: false, drawBorder: false },
            ticks: {
              font: { family: 'Inter', size: 10 },
              color: '#9CA3AF'
            }
          }
        }
      }
    });
  }

});