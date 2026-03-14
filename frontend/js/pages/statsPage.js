/**
 * SEITE 4: STATISTIKEN (statsPage.js)
 */

export function render(container) {
    container.innerHTML = `
        <div class="text-white">
            <div class="d-flex align-items-center gap-3 mb-4">
                <i class="bi bi-graph-up display-5 text-info"></i>
                <div>
                    <h2 class="mb-0">Deine Radio-Statistiken</h2>
                    <p class="text-white-50 small mb-0">Insights über dein Hörverhalten von heute.</p>
                </div>
            </div>

            <div class="row g-3 mb-4">
                <div class="col-md-6">
                    <div class="card bg-dark border-info shadow h-100">
                        <div class="card-body text-center d-flex flex-column justify-content-center">
                            <h5 class="text-info-emphasis small text-uppercase fw-bold mb-3">Hörzeit Heute</h5>
                            <div class="display-2 fw-bold text-info" id="totalTime">0.0</div>
                            <div class="text-white-50">Minuten</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card bg-dark border-secondary shadow h-100" id="lastActiveCard">
                        <div class="card-body">
                            <h5 class="text-white-50 small text-uppercase fw-bold mb-3">Zuletzt gehört</h5>
                            <div class="d-flex align-items-center gap-3" id="lastActiveContent">
                                <div class="spinner-border spinner-border-sm text-light"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card bg-dark border-secondary shadow p-3">
                <h5 class="text-white-50 small text-uppercase fw-bold mb-3">Top 5 Sender</h5>
                <div style="height: 300px; position: relative;">
                    <canvas id="statsChart"></canvas>
                </div>
            </div>
        </div>
    `;

    loadStats();

    async function loadStats() {
        try {
            const response = await fetch('../backend/api/get_stats.php');
            const data = await response.json();

            if (data.error) {
                console.error("Server-seitiger Fehler:", data.error);
                return;
            }

            // Update Time
            document.getElementById('totalTime').textContent = data.total_minutes_today || '0.0';

            // Update Last Active
            const lastActiveContent = document.getElementById('lastActiveContent');
            if (data.last_active) {
                lastActiveContent.innerHTML = `
                    <img src="${data.last_active.sender_logo || './images/cholo_love.png'}" class="rounded-circle shadow" style="width: 50px; height: 50px; object-fit: cover;">
                    <div>
                        <div class="fw-bold">${data.last_active.sender_name}</div>
                        <div class="small text-white-50">${new Date(data.last_active.created_at).toLocaleTimeString()} Uhr</div>
                    </div>
                `;
            } else {
                lastActiveContent.innerHTML = '<p class="text-muted small">Noch keine Daten für heute.</p>';
            }

            // Render Chart
            renderChart(data.top_stations || []);

        } catch (err) {
            console.error("Error loading stats:", err);
            const lastActiveContent = document.getElementById('lastActiveContent');
            if (lastActiveContent) lastActiveContent.innerHTML = '<p class="text-danger small">Ladefehler.</p>';
        }
    }

    function renderChart(stations) {
        const ctx = document.getElementById('statsChart').getContext('2d');
        const isMobile = window.innerWidth < 576;
        
        if (!stations || stations.length === 0) {
            ctx.font = '14px sans-serif';
            ctx.fillStyle = '#666';
            ctx.textAlign = 'center';
            ctx.fillText('Keine Daten verfügbar', 150, 150);
            return;
        }

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: stations.map(s => s.sender_name),
                datasets: [{
                    label: 'Anzahl Streams (Pings)',
                    data: stations.map(s => s.ping_count),
                    backgroundColor: 'rgba(13, 202, 240, 0.6)',
                    borderColor: 'rgba(13, 202, 240, 1)',
                    borderWidth: 1,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                layout: {
                    padding: {
                        left: isMobile ? 10 : 0,
                        right: 20
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        titleFont: { size: 14 },
                        bodyFont: { size: 13 },
                        cornerRadius: 10,
                        displayColors: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.05)' },
                        ticks: { 
                            color: '#aaa',
                            font: { size: isMobile ? 10 : 11 }
                        }
                    },
                    y: {
                        grid: { display: false },
                        ticks: { 
                            color: '#fff',
                            font: { 
                                size: isMobile ? 10 : 12,
                                weight: '600'
                            },
                            autoSkip: false,
                            callback: function(value) {
                                const label = this.getLabelForValue(value);
                                if (isMobile && label.length > 12) {
                                    return label.substring(0, 10) + '...';
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
}
