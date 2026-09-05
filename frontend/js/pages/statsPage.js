/**
 * SEITE 4: STATISTIKEN (statsPage.js) - Deep Analytics, 1-Klick Playlist-Übernahme & Personalisierte Empfehlungen
 */
import { userStationService } from "../services/userStationService.js";
import { stationService } from "../services/stationServiceV5.js";
import { radioService } from "../services/radioServiceV2.js";

let historyChart = null;
let topStationsChart = null;
let genreChart = null;
let currentPeriod = 'today';
let cachedStats = null;

const genreColors = {
    'Jazz': 'rgba(168, 85, 247, 0.85)',      // Purple
    'Ranchera': 'rgba(239, 68, 68, 0.85)',   // Red
    'Rancheras': 'rgba(239, 68, 68, 0.85)',  // Red (Alias)
    'Hip Hop': 'rgba(59, 130, 246, 0.85)',   // Blue
    'Pop': 'rgba(251, 191, 36, 0.85)',       // Amber/Yellow
    'Afro': 'rgba(249, 115, 22, 0.85)',      // Orange
    'Electronic': 'rgba(236, 72, 153, 0.85)', // Pink
    'Electro': 'rgba(236, 72, 153, 0.85)',    // Pink (Alias)
    'Rock': 'rgba(185, 28, 28, 0.85)',       // Dark Red
    'Classic': 'rgba(34, 197, 94, 0.85)',    // Green
    'Chill': 'rgba(20, 184, 166, 0.85)',     // Teal
    'Oldies': 'rgba(120, 113, 108, 0.85)',   // Stone/Gray
    'Default': 'rgba(99, 102, 241, 0.85)'    // Indigo
};

function getGenreColor(genre) {
    if (!genre) return genreColors.Default;
    
    const normalized = genre.trim();
    const key = Object.keys(genreColors).find(k => k.toLowerCase() === normalized.toLowerCase());
    if (key) return genreColors[key];
    
    let hash = 0;
    for (let i = 0; i < normalized.length; i++) {
        hash = normalized.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    return `hsla(${h}, 75%, 60%, 0.85)`;
}

function normalizeUrl(url) {
    if (!url || typeof url !== "string") return "";
    return url.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "").toLowerCase();
}

export function render(container) {
    container.innerHTML = `
        <div class="text-white pb-4">
            <!-- Toast Container -->
            <div id="toastContainer" class="position-fixed bottom-0 start-50 translate-middle-x p-3" style="z-index: 1060; margin-bottom: 90px; pointer-events: none;"></div>

            <!-- Header -->
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
                <div class="d-flex align-items-center gap-3">
                    <i class="bi bi-graph-up-arrow display-6 text-info"></i>
                    <div>
                        <h2 class="mb-0 fw-bold">Analytics Dashboard</h2>
                        <p class="text-white-50 small mb-0" id="periodDisplay">Statistiken von heute</p>
                    </div>
                </div>
                
                <div class="btn-group shadow-sm" role="group" aria-label="Zeitraum Auswahl">
                    <button type="button" class="btn btn-outline-info active" data-period="today">Heute</button>
                    <button type="button" class="btn btn-outline-info" data-period="week">Woche</button>
                    <button type="button" class="btn btn-outline-info" data-period="month">Monat</button>
                </div>
            </div>

            <!-- Summary Cards -->
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

            <!-- Sektion: Personalisierte Empfehlungen -->
            <div class="card bg-dark border-secondary shadow p-3 mb-4 card-glass" id="recommendationsCard">
                <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-stars text-warning fs-4"></i>
                        <div>
                            <h5 class="text-white mb-0 fw-bold">Empfehlungen für dich</h5>
                            <small class="text-white-50" id="recSubtitle">Wird basierend auf deinem Hörverhalten ermittelt...</small>
                        </div>
                    </div>
                    <span id="recGenreBadge" class="badge rounded-pill bg-info bg-opacity-10 text-info px-3 py-2 border border-info border-opacity-25 small d-none"></span>
                </div>
                <div class="row g-3" id="recommendationsContainer">
                    <div class="col-12 text-center py-4 text-white-50">
                        <div class="spinner-border spinner-border-sm text-info me-2"></div>
                        Empfehlungen werden geladen...
                    </div>
                </div>
            </div>

            <!-- Charts & Listen -->
            <div class="row g-3">
                <div class="col-lg-8">
                    <!-- Hörverlauf -->
                    <div class="card bg-dark border-secondary shadow p-3 mb-3 card-glass">
                        <h5 class="text-white-50 small text-uppercase fw-bold mb-3 tracking-wider">Hörverlauf</h5>
                        <div style="height: 250px; position: relative;">
                            <canvas id="historyChart"></canvas>
                        </div>
                    </div>
                    
                    <!-- Top 5 Sender mit 1-Klick Playlist-Übernahme -->
                    <div class="card bg-dark border-secondary shadow p-3 card-glass">
                        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                            <div>
                                <h5 class="text-white-50 small text-uppercase fw-bold mb-0 tracking-wider">Top 5 Sender</h5>
                                <small class="text-white-50" id="topStationsSubtitle">Deine meistgehörten Stationen</small>
                            </div>
                            <button id="btnApplyTopPlaylist" class="btn btn-sm btn-outline-info rounded-pill px-3 d-inline-flex align-items-center gap-1 shadow-sm" disabled>
                                <i class="bi bi-box-arrow-in-down"></i> <span>Als Playlist übernehmen</span>
                            </button>
                        </div>
                        <div style="height: 220px; position: relative;" class="mb-3">
                            <canvas id="topStationsChart"></canvas>
                        </div>
                        <div id="topStationsList" class="border-top border-secondary border-opacity-25 pt-3">
                            <!-- Dynamische Liste -->
                        </div>
                    </div>
                </div>
                
                <div class="col-lg-4">
                    <!-- Genre-Verteilung -->
                    <div class="card bg-dark border-secondary shadow p-3 h-100 card-glass">
                        <h5 class="text-white-50 small text-uppercase fw-bold mb-3 tracking-wider">Genre-Verteilung</h5>
                        <div style="height: 280px; position: relative;">
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
                transform: translateY(-3px);
            }
            .tracking-wider { letter-spacing: 0.1em; }
            .badge-rank-1 { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; }
            .badge-rank-2 { background: linear-gradient(135deg, #94a3b8, #64748b); color: #fff; }
            .badge-rank-3 { background: linear-gradient(135deg, #b45309, #78350f); color: #fff; }
            .badge-rank-default { background: rgba(255, 255, 255, 0.1); color: #cbd5e1; }
            .rec-card {
                background: rgba(15, 23, 42, 0.6) !important;
                border: 1px solid rgba(255, 255, 255, 0.08) !important;
                border-radius: 16px;
                transition: all 0.25s ease;
            }
            .rec-card:hover {
                background: rgba(30, 41, 59, 0.9) !important;
                border-color: rgba(99, 102, 241, 0.4) !important;
                transform: translateY(-4px);
                box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.5);
            }
            .toast-message {
                animation: toastSlideUp 0.3s ease-out;
            }
            @keyframes toastSlideUp {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        </style>
    `;

    const btnApplyTopPlaylist = container.querySelector("#btnApplyTopPlaylist");
    const recommendationsContainer = container.querySelector("#recommendationsContainer");
    const recSubtitle = container.querySelector("#recSubtitle");
    const recGenreBadge = container.querySelector("#recGenreBadge");
    const topStationsList = container.querySelector("#topStationsList");
    const toastContainer = container.querySelector("#toastContainer");

    initEvents();
    loadStats(currentPeriod);

    // Event-Listener für externe Änderungen (z.B. Radio-Wiedergabe oder Favoriten-Update)
    const onRadioPlay = () => updateInteractiveStates();
    const onRadioStop = () => updateInteractiveStates();
    const onUserStationUpdate = () => {
        updateInteractiveStates();
        renderRecommendations();
    };

    radioService.on("play", onRadioPlay);
    radioService.on("stop", onRadioStop);
    userStationService.on("update", onUserStationUpdate);

    function showToast(message, actionText = "Top 6 ansehen ➔", actionHref = "#radio") {
        if (!toastContainer) return;
        const toast = document.createElement("div");
        toast.className = "toast-message d-flex align-items-center justify-content-between p-3 rounded-4 shadow-lg mb-2 text-white border border-success";
        toast.style.background = "linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))";
        toast.style.backdropFilter = "blur(12px)";
        toast.style.minWidth = "300px";
        toast.style.maxWidth = "90vw";
        toast.style.pointerEvents = "auto";
        toast.innerHTML = `
            <div class="d-flex align-items-center gap-2 me-3">
                <i class="bi bi-check-circle-fill fs-5 text-white"></i>
                <span class="small fw-semibold">${message}</span>
            </div>
            ${actionHref ? `<a href="${actionHref}" class="btn btn-light btn-sm rounded-pill px-3 fw-bold text-dark text-decoration-none small text-nowrap">${actionText}</a>` : ''}
        `;

        toastContainer.innerHTML = "";
        toastContainer.appendChild(toast);

        setTimeout(() => {
            if (toast.parentNode) toast.remove();
        }, 4000);
    }

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

        // 1-Klick Playlist-Übernahme
        if (btnApplyTopPlaylist) {
            btnApplyTopPlaylist.addEventListener('click', applyTopStationsAsPlaylist);
        }
    }

    async function loadStats(period) {
        try {
            const response = await fetch(`../backend/api/get_stats.php?period=${period}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();

            if (data.error) {
                console.warn("API Note:", data.error);
                const lastActiveContent = document.getElementById('lastActiveContent');
                if (lastActiveContent) lastActiveContent.innerHTML = '<p class="text-white-50 small mb-0">Noch keine Live-Statistiken vorhanden.</p>';
                cachedStats = { top_stations: [], genres: [], history: [], summary: { total_minutes: 0 } };
                renderRecommendations();
                return;
            }

            cachedStats = data;

            try { updateSummary(data.summary); } catch (e) { console.error("Error updating summary:", e); }
            try { renderHistoryChart(data.history || []); } catch (e) { console.error("Error rendering history chart:", e); }
            try { renderTopStations(data.top_stations || []); } catch (e) { console.error("Error rendering top stations:", e); }
            try { renderGenreChart(data.genres || []); } catch (e) { console.error("Error rendering genre chart:", e); }
            try { renderRecommendations(); } catch (e) { console.error("Error rendering recommendations:", e); }

        } catch (err) {
            console.warn("Stats API nicht erreichbar, nutze lokale Präferenzen:", err);
            const lastActiveContent = document.getElementById('lastActiveContent');
            if (lastActiveContent) lastActiveContent.innerHTML = '<p class="text-white-50 small mb-0">Offline-Modus aktiv.</p>';
            cachedStats = { top_stations: [], genres: [], history: [], summary: { total_minutes: 0 } };
            try { renderRecommendations(); } catch (e) { console.error("Error rendering fallback recommendations:", e); }
        }
    }

    function parseMySQLDate(dateString) {
        if (!dateString) return new Date();
        const t = dateString.split(/[- :]/);
        if (t.length < 3) return new Date(dateString);
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
        
        const totalTimeDisplay = document.getElementById('totalTimeDisplay');
        const totalTimeLabel = document.getElementById('totalTimeLabel');
        if (totalTimeDisplay) totalTimeDisplay.textContent = parts[0] || '0';
        if (totalTimeLabel) totalTimeLabel.textContent = parts.slice(1).join(' ') || 'Minuten';

        const lastActiveContent = document.getElementById('lastActiveContent');
        if (lastActiveContent) {
            if (summary.last_active && summary.last_active.sender_name) {
                const date = parseMySQLDate(summary.last_active.created_at);
                const dateStr = !isNaN(date.getTime()) ? date.toLocaleString('de-DE') : summary.last_active.created_at;
                
                lastActiveContent.innerHTML = `
                    <img src="${summary.last_active.sender_logo || './images/cholo_love.png'}" 
                         class="rounded-circle shadow" 
                         style="width: 50px; height: 50px; object-fit: cover;"
                         onerror="this.src='./images/cholo_love.png'">
                    <div>
                        <div class="fw-bold text-white">${summary.last_active.sender_name}</div>
                        <div class="small text-white-50" style="opacity: 0.8 !important;">${dateStr}</div>
                    </div>
                `;
            } else {
                lastActiveContent.innerHTML = '<p class="text-muted small mb-0">Noch keine Daten verfügbar.</p>';
            }
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
                    x: { grid: { display: false }, ticks: { color: '#f8fafc', font: { size: 10 } } },
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#f8fafc', font: { size: 10 } } }
                }
            }
        });
    }

    function renderTopStations(stations) {
        const canvas = document.getElementById('topStationsChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (topStationsChart) topStationsChart.destroy();

        const hasStations = Array.isArray(stations) && stations.length > 0;
        if (btnApplyTopPlaylist) {
            btnApplyTopPlaylist.disabled = !hasStations;
        }

        topStationsChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: stations.map(s => s.sender_name || 'Unbekannt'),
                datasets: [{
                    data: stations.map(s => s.ping_count || 0),
                    backgroundColor: stations.map(s => getGenreColor(s.genre)),
                    borderRadius: 5
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#f8fafc' } },
                    y: { grid: { display: false }, ticks: { color: '#f8fafc' } }
                }
            }
        });

        // Top-Stations Liste rendern
        renderTopStationsList(stations);
    }

    function renderTopStationsList(stations) {
        if (!topStationsList) return;
        if (!Array.isArray(stations) || stations.length === 0) {
            topStationsList.innerHTML = '<div class="text-white-50 small text-center py-2">Noch keine Sender-Statistiken in diesem Zeitraum.</div>';
            return;
        }

        const currentPlayingUrl = normalizeUrl(radioService.getCurrentStation() || '');
        const rankBadges = ['badge-rank-1', 'badge-rank-2', 'badge-rank-3', 'badge-rank-default', 'badge-rank-default'];

        topStationsList.innerHTML = `
            <div class="d-flex flex-column gap-2">
                ${stations.map((s, idx) => {
                    const cleanUrl = normalizeUrl(s.sender_url || s.sender_Url || '');
                    const isPlaying = currentPlayingUrl && currentPlayingUrl === cleanUrl;
                    const mins = Math.round(((s.ping_count || 0) * 30) / 60);
                    const rankClass = rankBadges[idx] || 'badge-rank-default';
                    const logo = s.sender_logo || './images/cholo_love.png';
                    const name = s.sender_name || 'Radio';
                    const genre = s.genre || 'Allgemein';

                    return `
                        <div class="d-flex align-items-center justify-content-between p-2 rounded-3 bg-dark bg-opacity-50 border border-secondary border-opacity-25 top-station-row" data-url="${cleanUrl}">
                            <div class="d-flex align-items-center gap-3 min-w-0">
                                <span class="badge rounded-circle p-2 px-2 fw-bold ${rankClass}" style="width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.75rem;">
                                    #${idx + 1}
                                </span>
                                <img src="${logo}" alt="${name}" class="rounded-circle shadow-sm" style="width: 38px; height: 38px; object-fit: cover;" onerror="this.src='./images/cholo_love.png'">
                                <div class="text-truncate">
                                    <div class="text-white fw-semibold small text-truncate" title="${name}">${name}</div>
                                    <div class="d-flex align-items-center gap-2">
                                        <span class="badge rounded-pill text-white-50 border border-secondary border-opacity-50" style="font-size: 0.65rem;">${genre}</span>
                                        <span class="text-white-50" style="font-size: 0.72rem;">${mins} Min.</span>
                                    </div>
                                </div>
                            </div>
                            <button class="btn btn-sm ${isPlaying ? 'btn-success' : 'btn-outline-primary'} rounded-pill px-3 py-1 btn-top-play d-flex align-items-center gap-1 shadow-sm text-nowrap" data-idx="${idx}">
                                <i class="bi ${isPlaying ? 'bi-volume-up-fill' : 'bi-play-fill'}"></i>
                                <span>${isPlaying ? 'Läuft' : 'Play'}</span>
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        topStationsList.querySelectorAll('.btn-top-play').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.idx, 10);
                const s = stations[idx];
                if (!s) return;
                
                const master = stationService.getAll().find(m => 
                    (m.id && s.id && String(m.id) === String(s.id)) ||
                    (m.sender_url && s.sender_url && normalizeUrl(m.sender_url) === normalizeUrl(s.sender_url)) ||
                    (m.sender_name && s.sender_name && m.sender_name.toLowerCase() === s.sender_name.toLowerCase())
                );

                const stationToPlay = {
                    id: s.id || (master ? master.id : undefined),
                    sender_Name: s.sender_name || (master ? (master.sender_Name || master.sender_name) : 'Radio'),
                    sender_Url: s.sender_url || (master ? (master.sender_Url || master.sender_url) : ''),
                    sender_Logo: s.sender_logo || (master ? (master.sender_Logo || master.sender_logo) : './images/cholo_love.png'),
                    genre: s.genre || (master ? master.genre : 'Allgemein'),
                    now_playing_url: s.now_playing_url || (master ? master.now_playing_url : '')
                };

                radioService.play(stationToPlay);
                updateInteractiveStates();
            };
        });
    }

    function renderGenreChart(genres) {
        const canvas = document.getElementById('genreChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (genreChart) genreChart.destroy();

        if (genres.length === 0) {
            const info = document.getElementById('genreInfo');
            if (info) info.innerHTML = '<div class="text-muted text-center py-3">Keine Genre-Daten vorhanden.</div>';
            return;
        }

        genreChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: genres.map(g => g.genre || 'Unbekannt'),
                datasets: [{
                    data: genres.map(g => g.ping_count || 0),
                    backgroundColor: genres.map(g => getGenreColor(g.genre)),
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
                        labels: { color: '#eee', padding: 15, usePointStyle: true, font: { size: 11 } }
                    }
                }
            }
        });
        
        const info = document.getElementById('genreInfo');
        if (info) {
            info.innerHTML = genres.slice(0, 3).map(g => `
                <div class="d-flex justify-content-between align-items-center py-1 border-bottom border-secondary border-opacity-25">
                    <span>${g.genre || 'Andere'}</span>
                    <strong class="text-info">${Math.round(((g.ping_count || 0) * 30) / 60)} Min.</strong>
                </div>
            `).join('');
        }
    }

    // Hook stationService loaded event for initial async load
    if (!stationService.isLoaded) {
        stationService.on("loaded", () => {
            renderRecommendations();
        });
    }

    /**
     * Sektion: Personalisierte Empfehlungs-Engine
     */
    function renderRecommendations() {
        if (!recommendationsContainer) return;

        const masterStations = stationService.getAll();
        if (!Array.isArray(masterStations) || masterStations.length === 0) {
            recommendationsContainer.innerHTML = `
                <div class="col-12 text-center text-white-50 py-3 small">
                    <div class="spinner-border spinner-border-sm text-info me-2"></div>
                    Senderkatalog wird geladen...
                </div>
            `;
            return;
        }

        // 1. Favoriten des Nutzers erfassen (nicht erneut empfehlen)
        const userStations = userStationService.getStations();
        const userUrls = new Set(userStations.map(s => normalizeUrl(s.sender_Url || s.sender_url || s.url || '')));

        // 2. Meistgehörte Sender aus Stats ermitteln
        const topStationList = (cachedStats && cachedStats.top_stations) ? cachedStats.top_stations : [];
        const topUrls = new Set(topStationList.map(s => normalizeUrl(s.sender_url || s.sender_Url || '')));

        // 3. Top-Genres ermitteln (aus Genre-Stats, Top-Sendern oder bestehenden Favoriten)
        let topGenres = [];
        if (cachedStats && Array.isArray(cachedStats.genres) && cachedStats.genres.length > 0) {
            topGenres = cachedStats.genres.map(g => (g.genre || '').trim()).filter(Boolean);
        } else if (topStationList.length > 0) {
            topGenres = [...new Set(topStationList.map(s => (s.genre || '').trim()).filter(Boolean))];
        } else if (userStations.length > 0) {
            topGenres = [...new Set(userStations.map(s => (s.genre || '').trim()).filter(Boolean))];
        }

        let primaryGenre = topGenres[0] || null;
        let secondaryGenre = topGenres[1] || null;

        // 4. Sender finden, die noch nicht in Top 6 sind
        const unownedMaster = masterStations.filter(s => {
            const u = normalizeUrl(s.sender_url || s.sender_Url || s.url || '');
            return u && !userUrls.has(u);
        });

        let recommendedList = [];

        if (primaryGenre) {
            // Bevorzuge Sender des Lieblingsgenres, die der Nutzer noch nicht gehört oder gespeichert hat
            const fromPrimary = unownedMaster.filter(s => 
                (s.genre || '').toLowerCase() === primaryGenre.toLowerCase() &&
                !topUrls.has(normalizeUrl(s.sender_url || s.sender_Url || ''))
            );

            recommendedList.push(...fromPrimary.slice(0, 2).map(s => ({
                ...s,
                recReason: `Weil du gerne ${primaryGenre} hörst`
            })));

            if (secondaryGenre) {
                const fromSecondary = unownedMaster.filter(s => 
                    (s.genre || '').toLowerCase() === secondaryGenre.toLowerCase() &&
                    !topUrls.has(normalizeUrl(s.sender_url || s.sender_Url || '')) &&
                    !recommendedList.some(r => normalizeUrl(r.sender_url) === normalizeUrl(s.sender_url))
                );
                recommendedList.push(...fromSecondary.slice(0, 2).map(s => ({
                    ...s,
                    recReason: `Weil du gerne ${secondaryGenre} hörst`
                })));
            }

            // Auffüllen falls nötig mit weiteren Sendern aus primaryGenre
            if (recommendedList.length < 4) {
                const morePrimary = unownedMaster.filter(s => 
                    (s.genre || '').toLowerCase() === primaryGenre.toLowerCase() &&
                    !recommendedList.some(r => normalizeUrl(r.sender_url) === normalizeUrl(s.sender_url))
                );
                recommendedList.push(...morePrimary.slice(0, 4 - recommendedList.length).map(s => ({
                    ...s,
                    recReason: `Genre-Tipp: ${primaryGenre}`
                })));
            }
        }

        // Fallback: Wenn keine Genre-Historie existiert oder Liste noch nicht voll ist
        if (recommendedList.length < 4) {
            const genericPool = unownedMaster.filter(s => 
                !recommendedList.some(r => normalizeUrl(r.sender_url) === normalizeUrl(s.sender_url))
            );
            
            // Beliebte oder vielfältige Sender beimischen
            const needed = 4 - recommendedList.length;
            recommendedList.push(...genericPool.slice(0, needed).map(s => ({
                ...s,
                recReason: s.genre ? `Entdecke ${s.genre}` : 'Empfehlung der Redaktion'
            })));
        }

        // Begrenzen auf max. 4 Empfehlungen
        const finalRecommendations = recommendedList.slice(0, 4);

        if (finalRecommendations.length === 0) {
            recommendationsContainer.innerHTML = `
                <div class="col-12 text-center text-white-50 py-3 small">
                    Du hast bereits alle empfohlenen Sender in deinen Favoriten! 🎉
                </div>
            `;
            if (recSubtitle) recSubtitle.textContent = 'Alle passenden Sender sind bereits in deiner Top 6';
            if (recGenreBadge) recGenreBadge.classList.add('d-none');
            return;
        }

        if (primaryGenre) {
            if (recSubtitle) recSubtitle.textContent = `Inspiriert von deinem Lieblings-Genre ${primaryGenre}`;
            if (recGenreBadge) {
                recGenreBadge.textContent = `Lieblingsgenre: ${primaryGenre}`;
                recGenreBadge.classList.remove('d-none');
            }
        } else {
            if (recSubtitle) recSubtitle.textContent = 'Beliebte Sender zum Entdecken für dich';
            if (recGenreBadge) recGenreBadge.classList.add('d-none');
        }

        const currentPlayingUrl = normalizeUrl(radioService.getCurrentStation() || '');

        recommendationsContainer.innerHTML = finalRecommendations.map((station, i) => {
            const url = (station.sender_Url || station.sender_url || station.url || '').trim();
            const cleanUrl = normalizeUrl(url);
            const isPlaying = currentPlayingUrl && currentPlayingUrl === cleanUrl;
            const alreadyInTop6 = userUrls.has(cleanUrl);
            const name = station.sender_Name || station.sender_name || station.name || 'Radio';
            const logo = station.sender_Logo || station.sender_logo || station.logo || './images/cholo_love.png';
            const genre = station.genre || 'Allgemein';
            const reason = station.recReason || 'Empfehlung';

            return `
                <div class="col-12 col-sm-6 col-lg-3">
                    <div class="card h-100 rec-card p-3 d-flex flex-column justify-content-between ${isPlaying ? 'border-primary border-2' : ''}" data-url="${cleanUrl}">
                        <div>
                            <div class="d-flex align-items-center justify-content-between mb-2">
                                <span class="badge rounded-pill bg-info bg-opacity-20 text-info border border-info border-opacity-25" style="font-size: 0.68rem;">
                                    ${reason}
                                </span>
                            </div>
                            <div class="text-center my-2">
                                <img src="${logo}" alt="${name}" class="rounded-circle shadow border border-secondary border-opacity-50 mx-auto" style="width: 70px; height: 70px; object-fit: cover;" onerror="this.src='./images/cholo_love.png'">
                            </div>
                            <div class="text-center mt-2">
                                <h6 class="text-white fw-bold mb-1 text-truncate" title="${name}">${name}</h6>
                                <span class="badge rounded-pill bg-dark border border-secondary border-opacity-50 text-white-50 small mb-3">${genre}</span>
                            </div>
                        </div>
                        <div class="d-grid gap-2 mt-2">
                            <button class="btn btn-sm ${isPlaying ? 'btn-success fw-bold' : 'btn-primary'} rounded-pill shadow-sm btn-rec-play" data-idx="${i}">
                                <i class="bi ${isPlaying ? 'bi-volume-up-fill' : 'bi-play-fill'}"></i>
                                <span>${isPlaying ? 'Läuft' : 'Play'}</span>
                            </button>
                            <button class="btn btn-sm ${alreadyInTop6 ? 'btn-success fw-bold' : 'btn-outline-info text-white'} rounded-pill btn-rec-add" data-idx="${i}">
                                <i class="bi ${alreadyInTop6 ? 'bi-check-circle-fill' : 'bi-plus-circle'}"></i>
                                <span>${alreadyInTop6 ? 'In Top 6' : '+ Zu Top 6'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Event-Handlers für Empfehlungs-Buttons
        recommendationsContainer.querySelectorAll('.btn-rec-play').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.idx, 10);
                const s = finalRecommendations[idx];
                if (!s) return;
                radioService.play(s);
                updateInteractiveStates();
            };
        });

        recommendationsContainer.querySelectorAll('.btn-rec-add').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.idx, 10);
                const s = finalRecommendations[idx];
                if (!s) return;
                
                const name = s.sender_Name || s.sender_name || s.name || 'Sender';
                userStationService.addStation(s, 6);
                showToast(`"${name}" zu den Top 6 hinzugefügt!`);
                renderRecommendations();
            };
        });
    }

    /**
     * 1-Klick Übernahme der Top-Sender als Favoriten-Playlist
     */
    function applyTopStationsAsPlaylist() {
        const topStations = (cachedStats && Array.isArray(cachedStats.top_stations)) ? cachedStats.top_stations : [];
        if (topStations.length === 0) return;

        const masterStations = stationService.getAll();
        const stationsToApply = topStations.map(s => {
            const master = masterStations.find(m => 
                (m.id && s.id && String(m.id) === String(s.id)) ||
                (m.sender_url && s.sender_url && normalizeUrl(m.sender_url) === normalizeUrl(s.sender_url)) ||
                (m.sender_name && s.sender_name && m.sender_name.toLowerCase() === s.sender_name.toLowerCase())
            );

            return {
                id: s.id || (master ? master.id : Date.now()),
                sender_Name: s.sender_name || (master ? (master.sender_Name || master.sender_name) : 'Radio'),
                sender_Url: s.sender_url || (master ? (master.sender_Url || master.sender_url) : ''),
                sender_Logo: s.sender_logo || (master ? (master.sender_Logo || master.sender_logo) : './images/cholo_love.png'),
                genre: s.genre || (master ? master.genre : 'Allgemein'),
                now_playing_url: s.now_playing_url || (master ? master.now_playing_url : '')
            };
        }).filter(s => s.sender_Url).slice(0, 6);

        if (stationsToApply.length === 0) return;

        userStationService.setStations(stationsToApply);
        showToast(`${stationsToApply.length} Top-Sender als Favoriten-Playlist geladen!`, 'Top 6 ansehen ➔', '#radio');
        
        renderRecommendations();
        renderTopStationsList(topStations);
    }

    /**
     * Aktualisiert den Play/Pause Status auf allen dynamischen Buttons
     */
    function updateInteractiveStates() {
        const currentPlayingUrl = normalizeUrl(radioService.getCurrentStation() || '');
        
        // Top-Stations Liste aktualisieren
        if (topStationsList) {
            topStationsList.querySelectorAll('.top-station-row').forEach(row => {
                const url = row.dataset.url;
                const isPlaying = currentPlayingUrl && currentPlayingUrl === url;
                const playBtn = row.querySelector('.btn-top-play');
                if (playBtn) {
                    playBtn.className = `btn btn-sm ${isPlaying ? 'btn-success' : 'btn-outline-primary'} rounded-pill px-3 py-1 btn-top-play d-flex align-items-center gap-1 shadow-sm text-nowrap`;
                    playBtn.innerHTML = `<i class="bi ${isPlaying ? 'bi-volume-up-fill' : 'bi-play-fill'}"></i> <span>${isPlaying ? 'Läuft' : 'Play'}</span>`;
                }
            });
        }

        // Empfehlungs-Cards aktualisieren
        if (recommendationsContainer) {
            const userStations = userStationService.getStations();
            const userUrls = new Set(userStations.map(s => normalizeUrl(s.sender_Url || s.sender_url || s.url || '')));

            recommendationsContainer.querySelectorAll('.rec-card').forEach(card => {
                const url = card.dataset.url;
                const isPlaying = currentPlayingUrl && currentPlayingUrl === url;
                const inTop6 = userUrls.has(url);

                const playBtn = card.querySelector('.btn-rec-play');
                if (playBtn) {
                    playBtn.className = `btn btn-sm ${isPlaying ? 'btn-success fw-bold' : 'btn-primary'} rounded-pill shadow-sm btn-rec-play`;
                    playBtn.innerHTML = `<i class="bi ${isPlaying ? 'bi-volume-up-fill' : 'bi-play-fill'}"></i> <span>${isPlaying ? 'Läuft' : 'Play'}</span>`;
                }

                const addBtn = card.querySelector('.btn-rec-add');
                if (addBtn) {
                    addBtn.className = `btn btn-sm ${inTop6 ? 'btn-success fw-bold' : 'btn-outline-info text-white'} rounded-pill btn-rec-add`;
                    addBtn.innerHTML = `<i class="bi ${inTop6 ? 'bi-check-circle-fill' : 'bi-plus-circle'}"></i> <span>${inTop6 ? 'In Top 6' : '+ Zu Top 6'}</span>`;
                }

                if (isPlaying) {
                    card.classList.add('border-primary', 'border-2');
                } else {
                    card.classList.remove('border-primary', 'border-2');
                }
            });
        }
    }
}
