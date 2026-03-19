/**
 * ADMIN PAGE MODULE (adminPage.js)
 * 
 * Handles Admin Dashboard with Global Analytics and Station Management.
 */
import { stationService } from "../services/stationServiceV5.js";
import { isAdmin, handleAdminLogin } from "../main.js";

const API_ADMIN_STATS = "../backend/api/get_admin_stats.php";
let statsChart = null;

export function render(container) {
    if (!isAdmin()) {
        renderLoginPrompt(container);
        return;
    }

    container.innerHTML = `
        <div class="text-white">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="fw-bold"><i class="bi bi-shield-lock me-2 text-primary"></i>Admin Panel</h2>
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-info btn-sm rounded-pill px-3" id="refreshStatsBtn">
                        <i class="bi bi-arrow-clockwise"></i> Aktualisieren
                    </button>
                    <button class="btn btn-danger btn-sm rounded-pill px-3" id="logoutBtn">Abmelden</button>
                </div>
            </div>

            <!-- GLOBAL ANALYTICS SECTION -->
            <div class="row g-4 mb-5">
                <!-- Live Users Card -->
                <div class="col-md-4">
                    <div class="card h-100 shadow-lg border-0 bg-dark p-4 position-relative overflow-hidden">
                        <div class="position-absolute top-0 end-0 p-3 opacity-75 text-info">
                            <i class="bi bi-people-fill display-1"></i>
                        </div>
                        <h6 class="text-info text-uppercase fw-bold mb-1" style="letter-spacing: 1px;">Live Hörer</h6>
                        <div class="d-flex align-items-baseline">
                            <h2 class="display-4 fw-bold mb-0 text-white" id="liveListeners" style="text-shadow: 0 0 15px rgba(255, 255, 255, 0.2);">0</h2>
                            <span class="ms-2 text-success small"><i class="bi bi-dot fs-2"></i> Live</span>
                        </div>
                        <p class="text-white-50 small mt-2">Aktive User in den letzten 10 Min.</p>
                    </div>
                </div>

                <!-- Database Status Card -->
                <div class="col-md-4">
                    <div class="card h-100 shadow-lg border-0 bg-dark p-4 position-relative overflow-hidden">
                        <div class="position-absolute top-0 end-0 p-3 opacity-75 text-warning">
                            <i class="bi bi-database-fill display-1"></i>
                        </div>
                        <h6 class="text-warning text-uppercase fw-bold mb-1" style="letter-spacing: 1px;">Datenbank-Status</h6>
                        <div class="d-flex align-items-baseline">
                            <h2 class="display-4 fw-bold mb-0 text-white" id="dbSize" style="text-shadow: 0 0 15px rgba(255, 255, 255, 0.2);">0.00</h2>
                            <span class="ms-2 text-white fw-bold small">MB</span>
                        </div>
                        <div class="mt-3">
                            <button class="btn btn-warning btn-sm rounded-pill px-3 fw-bold w-100" id="optimizeDbBtn">
                                <i class="bi bi-tools me-1"></i> Jetzt optimieren
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Chart Card -->
                <div class="col-md-4">
                    <div class="card h-100 shadow-lg border-0 bg-dark p-4">
                        <h6 class="text-white text-uppercase fw-bold mb-3" style="letter-spacing: 1px; opacity: 0.9;">Top 10 Sender (Beliebtheit)</h6>
                        <div style="height: 250px;">
                            <canvas id="topStationsChart"></canvas>
                        </div>
                    </div>
                </div>
            </div>

            <!-- STATION MANAGEMENT SECTION -->
            <div class="card bg-dark border-secondary shadow p-4 mb-4">
                <h5 class="card-title text-primary fw-bold mb-4">
                    <i class="bi bi-plus-circle me-2"></i>Sender hinzufügen / bearbeiten
                </h5>
                <form id="radioForm" class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label small text-white-50">Sender Name</label>
                        <input type="text" id="sender" class="form-control bg-secondary text-white border-0" placeholder="Name des Senders" required>
                    </div>
                    <div class="col-md-6">
                        <label class="form-label small text-white-50">Stream URL</label>
                        <input type="url" id="url" class="form-control bg-secondary text-white border-0" placeholder="https://..." required>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small text-white-50">Genre</label>
                        <input type="text" id="genre" class="form-control bg-secondary text-white border-0" placeholder="z.B. Pop, Rock" required>
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small text-white-50">Logo URL</label>
                        <input type="url" id="logo" class="form-control bg-secondary text-white border-0" placeholder="https://...">
                    </div>
                    <div class="col-md-4">
                        <label class="form-label small text-white-50">Metadata URL</label>
                        <input type="url" id="nowPlaying" class="form-control bg-secondary text-white border-0" placeholder="https://...">
                    </div>
                    
                    <input type="hidden" id="editIndex">
                    
                    <div class="col-12 mt-4">
                        <button type="submit" class="btn btn-primary px-5 rounded-pill fw-bold" id="submitBtn">Speichern</button>
                        <button type="button" class="btn btn-outline-light px-4 rounded-pill ms-2" id="resetBtn">Abbrechen</button>
                    </div>
                </form>
            </div>

            <!-- EXISTING STATIONS LIST -->
            <h5 class="fw-bold mb-3 mt-5">Vorhandene Sender</h5>
            <div id="genreButtons" class="d-flex flex-wrap gap-2 mb-3"></div>
            <div id="genreContainer" class="row g-3"></div>
        </div>
    `;

    // Initialize Station Management (Moved logic)
    initStationManagement(container);
    
    // Initialize Dashboard Stats
    loadStats(container);

    // Event Listeners
    container.querySelector("#refreshStatsBtn").onclick = () => loadStats(container);
    container.querySelector("#logoutBtn").onclick = async () => {
        try {
            await fetch("../backend/api/auth.php", { method: "DELETE" });
        } catch (err) {
            console.warn("Logout-API-Fehler:", err);
        }
        sessionStorage.removeItem("isAdmin");
        window.location.hash = "radio";
        window.location.reload();
    };

    // Optimize Button Logic
    const optimizeBtn = container.querySelector("#optimizeDbBtn");
    if (optimizeBtn) {
        optimizeBtn.onclick = async () => {
            if (!confirm("Möchtest du die Datenbank jetzt optimieren? Daten älter als 6 Monate werden archiviert.")) return;

            const originalContent = optimizeBtn.innerHTML;
            optimizeBtn.disabled = true;
            optimizeBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Läuft...`;

            try {
                // Get Token (In a real app, this might come from a secure setting or be requested)
                // For now, we assume the token is known or we Fetch it if needed. 
                // Since this is an admin panel already authenticated, we can rely on existing session for the fetch
                // but the backend requires CRON_TOKEN for the maintenance script itself.
                const token = "milo_radio_maintenance_token_2026"; // Consistent with .env
                
                const response = await fetch(`../backend/api/maintenance.php?token=${token}`, {
                    method: "POST"
                });
                const result = await response.json();

                if (result.success) {
                    alert("Erfolg: " + result.message);
                    loadStats(container);
                } else {
                    alert("Fehler: " + (result.error || "Unbekannter Fehler"));
                }
            } catch (err) {
                console.error("Maintenance error:", err);
                alert("Verbindungsfehler bei der Wartung.");
            } finally {
                optimizeBtn.disabled = false;
                optimizeBtn.innerHTML = originalContent;
            }
        };
    }
}

function renderLoginPrompt(container) {
    container.innerHTML = `
        <div class="text-center p-5 mt-5">
            <div class="card bg-dark border-secondary shadow-lg p-5 mx-auto" style="max-width: 500px;">
                <i class="bi bi-shield-lock display-1 text-warning mb-4"></i>
                <h2 class="fw-bold mb-3">Admin Bereich</h2>
                <p class="text-white-50 mb-4">Dieser Bereich ist geschützt. Bitte loggen Sie sich ein.</p>
                <button class="btn btn-primary btn-lg px-5 rounded-pill fw-bold" id="loginBtn">Admin Login</button>
            </div>
        </div>
    `;
    container.querySelector("#loginBtn").onclick = () => handleAdminLogin("admin");
}

async function loadStats(container) {
    const liveListenersEl = container.querySelector("#liveListeners");
    const chartCtx = container.querySelector("#topStationsChart");

    try {
        const response = await fetch(API_ADMIN_STATS);
        const result = await response.json();

        if (result.success) {
            const data = result.data;
            
            // Update Live Listeners
            liveListenersEl.textContent = data.liveStats.active_listeners || 0;

            // Update DB Size
            const dbSizeEl = container.querySelector("#dbSize");
            if (dbSizeEl) {
                dbSizeEl.textContent = data.tableSizeMB || "0.00";
            }

            // Update Chart
            updateChart(chartCtx, data.topStations);
        }
    } catch (err) {
        console.error("Stats Load error:", err);
    }
}

function updateChart(ctx, topStations) {
    const labels = topStations.map(s => s.sender_name);
    const values = topStations.map(s => s.listen_count);

    if (statsChart) {
        statsChart.destroy();
    }

    statsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Hör-Events',
                data: values,
                backgroundColor: 'rgba(99, 102, 241, 0.6)',
                borderColor: '#6366f1',
                borderWidth: 1,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255,255,255,0.05)' },
                    ticks: { color: '#94a3b8' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#94a3b8' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

/** 
 * --- STATION MANAGEMENT LOGIC (From settingsPage.js) ---
 */
function initStationManagement(container) {
    const form = container.querySelector("#radioForm");
    const senderInput = container.querySelector("#sender");
    const urlInput = container.querySelector("#url");
    const genreInput = container.querySelector("#genre");
    const logoInput = container.querySelector("#logo");
    const nowPlayingInput = container.querySelector("#nowPlaying");
    const editIndexInput = container.querySelector("#editIndex");
    const submitBtn = container.querySelector("#submitBtn");
    const resetBtn = container.querySelector("#resetBtn");
    const genreButtons = container.querySelector("#genreButtons");
    const genreContainer = container.querySelector("#genreContainer");

    const renderGenreButtons = () => {
        genreButtons.innerHTML = "";
        const genres = [...new Set(stationService.getAll().map((s) => s.genre ?? "Unbekannt"))].sort();
        genres.forEach((g) => {
            const btn = document.createElement("button");
            btn.className = "btn btn-sm btn-outline-info rounded-pill px-3";
            btn.textContent = g;
            btn.onclick = () => renderStations(g);
            genreButtons.appendChild(btn);
        });
        if (genres.length > 0) renderStations(genres[0]);
    };

    const renderStations = (selectedGenre) => {
        genreContainer.innerHTML = "";
        const stations = stationService.getAll()
            .map((s, i) => ({ ...s, _index: i }))
            .filter((s) => (s.genre ?? "Unbekannt") === selectedGenre);

        stations.forEach((station) => {
            const col = document.createElement("div");
            col.className = "col-6 col-md-3 col-lg-2";
            col.innerHTML = `
                <div class="card h-100 bg-dark text-white border-secondary">
                    <img src="${station.sender_Logo || './images/android.png'}" class="card-img-top p-2 rounded-circle mx-auto" style="width: 80px; height: 80px; object-fit: cover;">
                    <div class="card-body p-2 text-center">
                        <p class="small text-truncate mb-2">${station.sender_Name}</p>
                        <div class="d-grid gap-1">
                            <button class="btn btn-xs btn-outline-primary py-0 edit-btn">Edit</button>
                            <button class="btn btn-xs btn-outline-danger py-0 del-btn">Del</button>
                        </div>
                    </div>
                </div>`;
            
            col.querySelector(".edit-btn").onclick = () => {
                senderInput.value = station.sender_Name;
                urlInput.value = station.sender_Url;
                genreInput.value = station.genre ?? "";
                logoInput.value = station.sender_Logo ?? "";
                nowPlayingInput.value = station.now_playing_url ?? "";
                editIndexInput.value = station._index;
                submitBtn.textContent = "Aktualisieren";
                form.scrollIntoView({ behavior: "smooth" });
            };

            col.querySelector(".del-btn").onclick = () => {
                if (confirm(`Station "${station.sender_Name}" löschen?`)) {
                    stationService.remove(station._index);
                    renderGenreButtons();
                }
            };
            genreContainer.appendChild(col);
        });
    };

    resetBtn.onclick = () => {
        form.reset();
        editIndexInput.value = "";
        submitBtn.textContent = "Speichern";
    };

    form.onsubmit = (e) => {
        e.preventDefault();
        const station = {
            sender_Name: senderInput.value.trim(),
            sender_Url: urlInput.value.trim(),
            genre: genreInput.value.trim(),
            sender_Logo: logoInput.value.trim() || null,
            now_playing_url: nowPlayingInput.value.trim() || null,
        };
        const editIndex = editIndexInput.value;
        if (editIndex !== "") {
            stationService.update(Number(editIndex), station);
        } else {
            stationService.add(station);
        }
        renderGenreButtons();
        form.reset();
        editIndexInput.value = "";
        submitBtn.textContent = "Speichern";
    };

    stationService.on("loaded", () => {
        renderGenreButtons();
    });

    renderGenreButtons();
}
