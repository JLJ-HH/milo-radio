/**
 * SEITE 4: STATISTIKEN (statsPage.js) - Deep Analytics & Zeiträume
 */

let historyChart = null;
let topStationsChart = null;
let genreChart = null;
let currentPeriod = 'today';

export function render(container) {
    container.innerHTML = `
        <div class="text-white">
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div class="d-flex align-items-center gap-3">
                    <i class="bi bi-graph-up-arrow display-6 text-info"></i>
                    <div>
                        <h2 class="mb-0">Analytics Dashboard</h2>
                        <p class="text-white-50 small mb-0" id="periodDisplay">Statistiken von heute</p>
                    </div>
                </div>
                
                <div class="btn-group shadow-sm" role="group" aria-label="Zeitraum Auswahl">
                    <button type="button" class="btn btn-outline-info active" data-period="today">Heute</button>
                    <button type="button" class="btn btn-outline-info" data-period="week">Woche</button>
                    <button type="button" class="btn btn-outline-info" data-period="month">Monat</button>
                </div>
            </div>

            <div class="row g-3 mb-4">
                <div class="col-md-6 col-lg-4">
                    <div class="card bg-dark border-info shadow h-100 card-glass">
                        <div class="card-body text-center d-flex flex-column justify-content-center py-4">
                            <h5 class="text-info-emphasis small text-uppercase fw-bold mb-3 tracking-wider">Gesamte Hörzeit</h5>
                            <div class="display-3 fw-bold text-info counter" id="totalTimeDisplay">0</div>
                            <div class="text-white-50" id="totalTimeLabel">Minuten</div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6 col-lg-8">
                    <div class="card bg-dark border-secondary shadow h-100 card-glass" id="lastActiveCard">
                        <div class="card-body">
                            <h5 class="text-white-50 small text-uppercase fw-bold mb-3 tracking-wider">Zuletzt gehört</h5>
                            <div class="d-flex align-items-center gap-3" id="lastActiveContent">
                                <div class="spinner-border spinner-border-sm text-light"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row g-3">
                <div class="col-lg-8">
                    <div class="card bg-dark border-secondary shadow p-3 mb-3 card-glass">
                        <h5 class="text-white-50 small text-uppercase fw-bold mb-3 tracking-wider">Hörverlauf</h5>
                        <div style="height: 250px; position: relative;">
                            <canvas id="historyChart"></canvas>
                        </div>
                    </div>
                    
                    <div class="card bg-dark border-secondary shadow p-3 card-glass">
                        <h5 class="text-white-50 small text-uppercase fw-bold mb-3 tracking-wider">Top 5 Sender</h5>
                        <div style="height: 250px; position: relative;">
                            <canvas id="topStationsChart"></canvas>
                        </div>
                    </div>
                </div>
                
                <div class="col-lg-4">
                    <div class="card bg-dark border-secondary shadow p-3 h-100 card-glass">
                        <h5 class="text-white-50 small text-uppercase fw-bold mb-3 tracking-wider">Genre-Verteilung</h5>
                        <div style="height: 300px; position: relative;">
                            <canvas id="genreChart"></canvas>
                        </div>
                        <div id="genreInfo" class="mt-3 small text-white-50"></div>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .card-glass {
                background: rgba(30, 41, 59, 0.7) !important;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                transition: transform 0.3s ease;
            }
            .card-glass:hover {
                transform: translateY(-5px);
            }
            .tracking-wider { letter-spacing: 0.1em; }
        </style>
    `;

    initEvents();
    loadStats(currentPeriod);

    function initEvents() {
        const buttons = container.querySelectorAll('.btn-group .btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentPeriod = btn.dataset.period;
                
                const periodMap = { today: 'heute', week: 'der letzten 7 Tage', month: 'der letzten 30 Tage' };
                document.getElementById('periodDisplay').textContent = `Statistiken ${periodMap[currentPeriod]}`;
                
                loadStats(currentPeriod);
            });
        });
    }

    async function loadStats(period) {
        try {
            const response = await fetch(`../backend/api/get_stats.php?period=${period}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            if (data.error) {
                console.error("API Error:", data.error);
                const lastActiveContent = document.getElementById('lastActiveContent');
                if (lastActiveContent) lastActiveContent.innerHTML = `<p class="text-danger small">API Fehler: ${data.error}</p>`;
                return;
            }

            // Update components individually with try-catch to prevent one failure from breaking everything
            try { updateSummary(data.summary); } catch (e) { console.error("Error updating summary:", e); }
            try { renderHistoryChart(data.history || []); } catch (e) { console.error("Error rendering history chart:", e); }
            try { renderTopStationsChart(data.top_stations || []); } catch (e) { console.error("Error rendering top stations chart:", e); }
            try { renderGenreChart(data.genres || []); } catch (e) { console.error("Error rendering genre chart:", e); }

        } catch (err) {
            console.error("Error loading stats:", err);
            const lastActiveContent = document.getElementById('lastActiveContent');
            if (lastActiveContent) lastActiveContent.innerHTML = '<p class="text-danger small">Ladefehler. Bitte später erneut versuchen.</p>';
        }
    }

    function parseMySQLDate(dateString) {
        if (!dateString) return new Date();
        // Replace space with T to make it ISO-8601 compliant for broader browser support if needed
        const t = dateString.split(/[- :]/);
        if (t.length < 3) return new Date(dateString); // Fallback
        return new Date(t[0], t[1] - 1, t[2], t[3] || 0, t[4] || 0, t[5] || 0);
    }

    function formatDuration(minutes) {
        if (minutes < 60) return `${minutes} Min.`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return `${hours} Std. ${mins} Min.`;
    }

    function updateSummary(summary) {
        if (!summary) return;
        
        const totalMin = summary.total_minutes || 0;
        const formatted = formatDuration(totalMin);
        const parts = formatted.split(' ');
        
        document.getElementById('totalTimeDisplay').textContent = parts[0] || '0';
        document.getElementById('totalTimeLabel').textContent = parts.slice(1).join(' ') || 'Minuten';

        const lastActiveContent = document.getElementById('lastActiveContent');
        if (summary.last_active && summary.last_active.sender_name) {
            const date = parseMySQLDate(summary.last_active.created_at);
            const dateStr = !isNaN(date.getTime()) ? date.toLocaleString('de-DE') : summary.last_active.created_at;
            
            lastActiveContent.innerHTML = `
                <img src="${summary.last_active.sender_logo || './images/cholo_love.png'}" 
                     class="rounded-circle shadow" 
                     style="width: 50px; height: 50px; object-fit: cover;"
                     onerror="this.src='./images/cholo_love.png'">
                <div>
                    <div class="fw-bold">${summary.last_active.sender_name}</div>
                    <div class="small text-white-50">${dateStr}</div>
                </div>
            `;
        } else {
            lastActiveContent.innerHTML = '<p class="text-muted small">Noch keine Daten verfügbar.</p>';
        }
    }

    function renderHistoryChart(history) {
        const canvas = document.getElementById('historyChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (historyChart) historyChart.destroy();

        const labels = history.map(h => h.label || '');
        const dataValues = history.map(h => Math.round(((h.pings || 0) * 30) / 60));

        historyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Hörzeit (Minuten)',
                    data: dataValues,
                    borderColor: '#0dcaf0',
                    backgroundColor: 'rgba(13, 202, 240, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#0dcaf0'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#aaa', font: { size: 10 } } },
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#666', font: { size: 10 } } }
                }
            }
        });
    }

    function renderTopStationsChart(stations) {
        const canvas = document.getElementById('topStationsChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (topStationsChart) topStationsChart.destroy();

        topStationsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: stations.map(s => s.sender_name || 'Unbekannt'),
                datasets: [{
                    data: stations.map(s => s.ping_count || 0),
                    backgroundColor: 'rgba(13, 202, 240, 0.6)',
                    borderRadius: 5
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#aaa' } },
                    y: { grid: { display: false }, ticks: { color: '#fff' } }
                }
            }
        });
    }

    function renderGenreChart(genres) {
        const canvas = document.getElementById('genreChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (genreChart) genreChart.destroy();

        if (genres.length === 0) {
            const info = document.getElementById('genreInfo');
            if (info) info.innerHTML = '<div class="text-muted">Keine Genre-Daten.</div>';
            return;
        }

        const colors = [
            'rgba(13, 202, 240, 0.7)', 'rgba(102, 16, 242, 0.7)', 
            'rgba(214, 51, 132, 0.7)', 'rgba(253, 126, 20, 0.7)', 
            'rgba(32, 201, 151, 0.7)'
        ];

        genreChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: genres.map(g => g.genre || 'Unbekannt'),
                datasets: [{
                    data: genres.map(g => g.ping_count || 0),
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#aaa', padding: 20, usePointStyle: true }
                    }
                }
            }
        });
        
        // Update simple list below
        const info = document.getElementById('genreInfo');
        if (info) {
            info.innerHTML = genres.slice(0, 3).map(g => `<div>${g.genre || 'Andere'}: <strong>${Math.round(((g.ping_count || 0) * 30) / 60)} Min.</strong></div>`).join('');
        }
    }
}
