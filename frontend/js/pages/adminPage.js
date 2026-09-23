/**
 * ADMIN PAGE MODULE (adminPage.js)
 * 
 * Handles Admin Dashboard with Global Analytics and Station Management.
 * All 5 sections (Live Hörer, Datenbank-Status, Top 10 Sender, Sender hinzufügen/bearbeiten,
 * Vorhandene Sender) are individually collapsible for optimal mobile and desktop UX.
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
        <div class="text-white pb-5">
            <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <div class="d-flex align-items-center gap-2">
                    <i class="bi bi-shield-lock display-6 text-primary"></i>
                    <div>
                        <h2 class="fw-bold mb-0">Admin Panel</h2>
                        <p class="text-white-50 small mb-0">Verwaltung, Echtzeit-Statistiken und Sender-Pflege</p>
                    </div>
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-outline-info btn-sm rounded-pill px-3 d-flex align-items-center gap-1" id="refreshStatsBtn">
                        <i class="bi bi-arrow-clockwise"></i> <span>Aktualisieren</span>
                    </button>
                    <button class="btn btn-danger btn-sm rounded-pill px-3" id="logoutBtn">Abmelden</button>
                </div>
            </div>

            <!-- BEREICHE 1-3: GLOBAL ANALYTICS SECTION -->
            <div class="row g-4 mb-4">
                <!-- BEREICH 1: Live Users Card -->
                <div class="col-md-4">
                    <div class="card h-100 shadow-lg border-secondary bg-dark p-3 p-md-4 position-relative overflow-hidden rounded-4">
                        <div class="d-flex justify-content-between align-items-center mb-2" id="toggleLiveListeners" style="cursor: pointer;" title="Ein-/Ausklappen">
                            <h6 class="text-info text-uppercase fw-bold mb-0 d-flex align-items-center gap-2" style="letter-spacing: 1px;">
                                <i class="bi bi-people-fill fs-5"></i> Live Hörer
                            </h6>
                            <button class="btn btn-link text-info text-decoration-none p-0" id="liveListenersToggleBtn" aria-label="Live Hörer umschalten">
                                <i class="bi bi-chevron-up fs-5" id="liveListenersIcon"></i>
                            </button>
                        </div>
                        <div id="liveListenersBody">
                            <div class="d-flex align-items-baseline mt-2">
                                <h2 class="display-4 fw-bold mb-0 text-white" id="liveListeners" style="text-shadow: 0 0 15px rgba(255, 255, 255, 0.2);">0</h2>
                                <span class="ms-2 text-success small fw-semibold"><i class="bi bi-dot fs-2"></i> Live</span>
                            </div>
                            <p class="text-white-50 small mt-2 mb-0">Aktive User in den letzten 10 Min.</p>
                        </div>
                    </div>
                </div>

                <!-- BEREICH 2: Database Status Card -->
                <div class="col-md-4">
                    <div class="card h-100 shadow-lg border-secondary bg-dark p-3 p-md-4 position-relative overflow-hidden rounded-4">
                        <div class="d-flex justify-content-between align-items-center mb-2" id="toggleDbStatus" style="cursor: pointer;" title="Ein-/Ausklappen">
                            <h6 class="text-warning text-uppercase fw-bold mb-0 d-flex align-items-center gap-2" style="letter-spacing: 1px;">
                                <i class="bi bi-database-fill fs-5"></i> Datenbank-Status
                            </h6>
                            <button class="btn btn-link text-warning text-decoration-none p-0" id="dbStatusToggleBtn" aria-label="Datenbank-Status umschalten">
                                <i class="bi bi-chevron-up fs-5" id="dbStatusIcon"></i>
                            </button>
                        </div>
                        <div id="dbStatusBody">
                            <div class="d-flex align-items-baseline mt-2">
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
                </div>

                <!-- BEREICH 3: Chart Card -->
                <div class="col-md-4">
                    <div class="card h-100 shadow-lg border-secondary bg-dark p-3 p-md-4 rounded-4">
                        <div class="d-flex justify-content-between align-items-center mb-2" id="toggleTopStations" style="cursor: pointer;" title="Ein-/Ausklappen">
                            <h6 class="text-white text-uppercase fw-bold mb-0 d-flex align-items-center gap-2" style="letter-spacing: 1px; opacity: 0.9;">
                                <i class="bi bi-bar-chart-line-fill text-primary fs-5"></i> Top 10 Sender
                            </h6>
                            <button class="btn btn-link text-white-50 text-decoration-none p-0" id="topStationsToggleBtn" aria-label="Top 10 Sender umschalten">
                                <i class="bi bi-chevron-up fs-5" id="topStationsIcon"></i>
                            </button>
                        </div>
                        <div id="topStationsBody">
                            <div style="height: 220px;" class="mt-2">
                                <canvas id="topStationsChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- BEREICH 4: STATION MANAGEMENT (ADD / EDIT) -->
            <div class="card bg-dark border-secondary shadow-lg p-3 p-md-4 mb-4 rounded-4" id="stationFormCard">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2" id="toggleFormHeader" style="cursor: pointer;" title="Ein-/Ausklappen">
                    <h5 class="card-title text-primary fw-bold mb-0 d-flex align-items-center gap-2">
                        <i class="bi bi-plus-circle-fill"></i>
                        <span id="formCardTitle">Sender hinzufügen / bearbeiten</span>
                    </h5>
                    <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1 text-white-50 small d-flex align-items-center gap-1" id="formCollapseBtn" style="font-size: 0.8rem;">
                        <i class="bi bi-chevron-up" id="formCollapseIcon"></i>
                        <span id="formCollapseText">Einklappen</span>
                    </button>
                </div>
                <div id="stationFormBody" class="mt-3">
                    <!-- Auto-Import / Suche Feature Box -->
                    <div class="p-3 mb-3 rounded-4" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1);">
                        <!-- Tab Umschalter -->
                        <div class="d-flex align-items-center justify-content-between mb-3 border-bottom border-secondary pb-2 flex-wrap gap-2">
                            <div class="d-flex gap-2">
                                <button type="button" id="tabRadioSearchBtn" class="btn btn-sm btn-primary rounded-pill px-3 fw-semibold d-flex align-items-center gap-2">
                                    <i class="bi bi-broadcast"></i>
                                    <span>Radiosender suchen</span>
                                </button>
                                <button type="button" id="tabPodcastImportBtn" class="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold d-flex align-items-center gap-2 text-white-50">
                                    <i class="bi bi-rss"></i>
                                    <span>Podcast importieren</span>
                                </button>
                            </div>
                            <span class="text-white-50 small d-none d-sm-inline">Auto-Fill für Formulardaten</span>
                        </div>

                        <!-- Tab 1: Radiosender Suche -->
                        <div id="tabRadioSearchContent">
                            <div class="input-group">
                                <span class="input-group-text bg-secondary text-white-50 border-0"><i class="bi bi-search"></i></span>
                                <input type="text" id="radioSearchInput" class="form-control bg-secondary text-white border-0" placeholder="Sender suchen (z. B. Rock Antenne, Sunshine Live, 1LIVE)...">
                                <button type="button" id="radioSearchBtn" class="btn btn-primary fw-semibold px-3 d-flex align-items-center gap-1">
                                    <span>Suchen</span>
                                </button>
                            </div>
                            <div id="radioSearchFeedback" class="small mt-2" style="display: none;"></div>
                            <div id="radioSearchResults" class="mt-3 row g-2" style="display: none; max-height: 290px; overflow-y: auto;"></div>
                        </div>

                        <!-- Tab 2: Podcast Auto-Import & Suche -->
                        <div id="tabPodcastImportContent" style="display: none;">
                            <div class="input-group">
                                <span class="input-group-text bg-secondary text-white-50 border-0"><i class="bi bi-search"></i></span>
                                <input type="text" id="podcastSearchInput" class="form-control bg-secondary text-white border-0" placeholder="Podcast suchen (z. B. Finanzfluss, Wohlstand für Alle, Zeit Verbrechen)...">
                                <button type="button" id="podcastSearchBtn" class="btn btn-info fw-semibold px-3 d-flex align-items-center gap-1">
                                    <i class="bi bi-search"></i> <span>Suchen</span>
                                </button>
                            </div>
                            <div id="podcastSearchFeedback" class="small mt-2" style="display: none;"></div>
                            <div id="podcastSearchResults" class="mt-3 row g-2" style="display: none; max-height: 290px; overflow-y: auto;"></div>

                            <!-- Direkte RSS-Feed-URL als Fallback / Expertenmodus -->
                            <div class="mt-3 pt-2 border-top border-secondary border-opacity-25">
                                <a href="javascript:void(0)" id="toggleManualRssLink" class="text-white-50 small text-decoration-none d-inline-flex align-items-center gap-1">
                                    <i class="bi bi-chevron-right" id="toggleManualRssIcon"></i>
                                    <span>Oder direkte RSS-Feed-URL manuell eingeben</span>
                                </a>
                                <div id="manualRssContainer" class="mt-2" style="display: none;">
                                    <div class="input-group">
                                        <span class="input-group-text bg-secondary text-white-50 border-0"><i class="bi bi-link-45deg"></i></span>
                                        <input type="url" id="podcastImportUrl" class="form-control bg-secondary text-white border-0" placeholder="z. B. https://anchor.fm/s/108bcffe4/podcast/rss oder https://kiupdate.podigee.io/feed/mp3">
                                        <button type="button" id="podcastImportBtn" class="btn btn-outline-info fw-semibold px-3 d-flex align-items-center gap-1">
                                            <i class="bi bi-cloud-arrow-down-fill"></i> <span>Feed laden</span>
                                        </button>
                                    </div>
                                    <div id="podcastImportFeedback" class="small mt-2" style="display: none;"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <form id="radioForm" class="row g-3 pt-2">
                        <div class="col-md-6">
                            <label class="form-label small text-white-50">Sender Name</label>
                            <input type="text" id="sender" class="form-control bg-secondary text-white border-0" placeholder="Name des Senders" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small text-white-50">Stream URL (oder RSS-Feed)</label>
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
                        
                        <input type="hidden" id="editStationId">
                        <div id="stationAlert" class="col-12 d-none"></div>
                        
                        <div class="col-12 mt-4">
                            <button type="submit" class="btn btn-primary px-5 rounded-pill fw-bold" id="submitBtn">Speichern</button>
                            <button type="button" class="btn btn-outline-light px-4 rounded-pill ms-2" id="resetBtn">Abbrechen</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- BEREICH 5: EXISTING STATIONS LIST -->
            <div class="card bg-dark border-secondary shadow-lg p-3 p-md-4 mb-4 rounded-4" id="existingStationsCard">
                <div class="d-flex justify-content-between align-items-center flex-wrap gap-2" id="toggleStationsListHeader" style="cursor: pointer;" title="Ein-/Ausklappen">
                    <h5 class="fw-bold mb-0 d-flex align-items-center gap-2">
                        <i class="bi bi-broadcast text-info"></i>
                        <span>Vorhandene Sender</span>
                        <span id="totalStationCountBadge" class="badge bg-secondary rounded-pill fw-normal fs-6">0 Sender</span>
                    </h5>
                    <button type="button" class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1 text-white-50 small d-flex align-items-center gap-1" id="stationsListCollapseBtn" style="font-size: 0.8rem;">
                        <i class="bi bi-chevron-up" id="stationsListCollapseIcon"></i>
                        <span id="stationsListCollapseText">Einklappen</span>
                    </button>
                </div>
                <div id="existingStationsBody" class="mt-4">
                    <div class="mb-3">
                        <span class="text-white-50 small fw-bold text-uppercase d-block mb-2" style="letter-spacing: 0.5px;">Filter nach Genre:</span>
                        <div id="genreButtons" class="d-flex flex-wrap gap-2"></div>
                    </div>
                    <div id="genreContainer" class="row g-3 pt-2"></div>
                </div>
            </div>
        </div>
    `;

    // Collapsible Setup Helper
    const setupCollapsible = (headerId, bodyId, iconId, textId = null, onExpand = null) => {
        const header = container.querySelector(headerId);
        const body = container.querySelector(bodyId);
        const icon = container.querySelector(iconId);
        const text = textId ? container.querySelector(textId) : null;
        if (!header || !body || !icon) return;

        let isCollapsed = false;
        header.addEventListener("click", () => {
            isCollapsed = !isCollapsed;
            if (isCollapsed) {
                body.classList.add("d-none");
                icon.className = "bi bi-chevron-down";
                if (text) text.textContent = "Ausklappen";
            } else {
                body.classList.remove("d-none");
                icon.className = "bi bi-chevron-up";
                if (text) text.textContent = "Einklappen";
                if (onExpand) onExpand();
            }
        });
    };

    // Initialize the 5 Collapsible Areas
    // 1. Live Hörer
    setupCollapsible("#toggleLiveListeners", "#liveListenersBody", "#liveListenersIcon");

    // 2. Datenbank-Status
    setupCollapsible("#toggleDbStatus", "#dbStatusBody", "#dbStatusIcon");

    // 3. Top 10 Sender (Beliebtheit)
    setupCollapsible("#toggleTopStations", "#topStationsBody", "#topStationsIcon", null, () => {
        if (statsChart) {
            setTimeout(() => statsChart.resize(), 50);
        }
    });

    // 4. Sender hinzufügen / bearbeiten
    setupCollapsible("#toggleFormHeader", "#stationFormBody", "#formCollapseIcon", "#formCollapseText");

    // 5. Vorhandene Sender
    setupCollapsible("#toggleStationsListHeader", "#existingStationsBody", "#stationsListCollapseIcon", "#stationsListCollapseText");

    // Initialize Station Management Logic
    initStationManagement(container);
    
    // Initialize Dashboard Stats
    loadStats(container);

    // Event Listeners for Header Actions
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
                const response = await fetch(`../backend/api/maintenance.php`, {
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
            <div class="card bg-dark border-secondary shadow-lg p-5 mx-auto rounded-4" style="max-width: 500px;">
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
    if (!ctx) return;
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
 * --- STATION MANAGEMENT LOGIC ---
 */
function initStationManagement(container) {
    const form = container.querySelector("#radioForm");
    const senderInput = container.querySelector("#sender");
    const urlInput = container.querySelector("#url");
    const genreInput = container.querySelector("#genre");
    const logoInput = container.querySelector("#logo");
    const nowPlayingInput = container.querySelector("#nowPlaying");
    const editStationIdInput = container.querySelector("#editStationId") || container.querySelector("#editIndex");
    const submitBtn = container.querySelector("#submitBtn");
    const resetBtn = container.querySelector("#resetBtn");
    const genreButtons = container.querySelector("#genreButtons");
    const genreContainer = container.querySelector("#genreContainer");
    const totalCountBadge = container.querySelector("#totalStationCountBadge");
    const formBody = container.querySelector("#stationFormBody");
    const formCollapseIcon = container.querySelector("#formCollapseIcon");
    const formCollapseText = container.querySelector("#formCollapseText");
    const alertEl = container.querySelector("#stationAlert");

    let currentGenre = null;

    const showAlert = (message, isSuccess = true) => {
        if (!alertEl) return;
        alertEl.className = `col-12 alert ${isSuccess ? "alert-success" : "alert-danger"} alert-dismissible fade show my-2`;
        alertEl.innerHTML = `
            <div class="d-flex align-items-center justify-content-between">
                <div class="d-flex align-items-center gap-2">
                    <i class="bi ${isSuccess ? "bi-check-circle-fill text-success" : "bi-exclamation-triangle-fill text-danger"} fs-5"></i>
                    <span>${message}</span>
                </div>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert" aria-label="Schließen"></button>
            </div>
        `;
        setTimeout(() => {
            if (alertEl) alertEl.className = "col-12 d-none";
        }, 5000);
    };

    // --- AUTO-IMPORT & SENDER-SUCHE TABS ---
    const tabRadioSearchBtn = container.querySelector("#tabRadioSearchBtn");
    const tabPodcastImportBtn = container.querySelector("#tabPodcastImportBtn");
    const tabRadioSearchContent = container.querySelector("#tabRadioSearchContent");
    const tabPodcastImportContent = container.querySelector("#tabPodcastImportContent");

    if (tabRadioSearchBtn && tabPodcastImportBtn) {
        tabRadioSearchBtn.onclick = () => {
            tabRadioSearchBtn.className = "btn btn-sm btn-primary rounded-pill px-3 fw-semibold d-flex align-items-center gap-2";
            tabPodcastImportBtn.className = "btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold d-flex align-items-center gap-2 text-white-50";
            tabRadioSearchContent.style.display = "block";
            tabPodcastImportContent.style.display = "none";
        };

        tabPodcastImportBtn.onclick = () => {
            tabPodcastImportBtn.className = "btn btn-sm btn-info rounded-pill px-3 fw-semibold d-flex align-items-center gap-2";
            tabRadioSearchBtn.className = "btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold d-flex align-items-center gap-2 text-white-50";
            tabPodcastImportContent.style.display = "block";
            tabRadioSearchContent.style.display = "none";
        };
    }

    // --- TAB 1: RADIOSENDER ONLINE SUCHEN ---
    const radioSearchInput = container.querySelector("#radioSearchInput");
    const radioSearchBtn = container.querySelector("#radioSearchBtn");
    const radioSearchFeedback = container.querySelector("#radioSearchFeedback");
    const radioSearchResults = container.querySelector("#radioSearchResults");

    const performRadioSearch = async () => {
        const query = radioSearchInput ? radioSearchInput.value.trim() : "";
        if (!query || query.length < 2) {
            radioSearchFeedback.style.display = "block";
            radioSearchFeedback.className = "small mt-2 text-warning";
            radioSearchFeedback.textContent = "Bitte mindestens 2 Zeichen für die Sendersuche eingeben.";
            return;
        }

        const origBtnHtml = radioSearchBtn.innerHTML;
        radioSearchBtn.disabled = true;
        radioSearchBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Suche...';
        radioSearchFeedback.style.display = "none";
        radioSearchResults.style.display = "none";
        radioSearchResults.innerHTML = "";

        try {
            const res = await fetch(`../backend/api/radio_search.php?q=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error(`Server-Fehler (Status ${res.status})`);
            const data = await res.json();

            if (!data.success) {
                throw new Error(data.error || "Suche konnte nicht durchgeführt werden.");
            }

            if (!data.stations || data.stations.length === 0) {
                radioSearchFeedback.style.display = "block";
                radioSearchFeedback.className = "small mt-2 text-warning";
                radioSearchFeedback.textContent = `Keine Sender für "${query}" gefunden. Bitte probiere einen anderen Begriff.`;
                return;
            }

            radioSearchFeedback.style.display = "block";
            radioSearchFeedback.className = "small mt-2 text-info";
            radioSearchFeedback.textContent = `${data.stations.length} Sender gefunden. Wähle einen Sender aus, um das Formular auszufüllen:`;

            radioSearchResults.innerHTML = data.stations.map((st, idx) => {
                const logoHtml = st.logo
                    ? `<img src="${st.logo}" alt="" class="rounded-2 flex-shrink-0 bg-dark" style="width: 38px; height: 38px; object-fit: contain;" onerror="this.outerHTML='<div class=\\'rounded-2 bg-secondary d-flex align-items-center justify-content-center flex-shrink-0 text-white-50\\' style=\\'width: 38px; height: 38px;\\'><i class=\\'bi bi-broadcast\\'></i></div>'">`
                    : `<div class="rounded-2 bg-secondary d-flex align-items-center justify-content-center flex-shrink-0 text-white-50" style="width: 38px; height: 38px;"><i class="bi bi-broadcast"></i></div>`;
                
                const qualityBadge = st.bitrate > 0 
                    ? `<span class="badge bg-secondary text-white-50" style="font-size: 0.7rem;">${st.codec || 'MP3'} ${st.bitrate}k</span>` 
                    : (st.codec ? `<span class="badge bg-secondary text-white-50" style="font-size: 0.7rem;">${st.codec}</span>` : '');

                return `
                    <div class="col-12 col-md-6">
                        <div class="card bg-dark border border-secondary p-2 rounded-3 h-100 d-flex flex-row align-items-center justify-content-between gap-2 shadow-sm">
                            <div class="d-flex align-items-center gap-2 overflow-hidden flex-grow-1">
                                ${logoHtml}
                                <div class="text-truncate">
                                    <div class="fw-bold text-white text-truncate small" title="${st.name}">${st.name}</div>
                                    <div class="text-white-50 small d-flex gap-2 align-items-center flex-wrap" style="font-size: 0.75rem;">
                                        ${qualityBadge}
                                        <span class="text-info text-truncate">${st.genre}</span>
                                    </div>
                                </div>
                            </div>
                            <button type="button" class="btn btn-outline-info btn-sm rounded-pill px-3 py-1 flex-shrink-0 apply-station-btn" data-index="${idx}">
                                Übernehmen
                            </button>
                        </div>
                    </div>
                `;
            }).join("");

            // Klick-Events für "Übernehmen" Buttons binden
            const applyButtons = radioSearchResults.querySelectorAll(".apply-station-btn");
            applyButtons.forEach(btn => {
                btn.onclick = () => {
                    const idx = parseInt(btn.getAttribute("data-index"), 10);
                    const selected = data.stations[idx];
                    if (!selected) return;

                    senderInput.value = selected.name || "";
                    urlInput.value = selected.stream_url || "";
                    genreInput.value = selected.genre || "Radio";
                    logoInput.value = selected.logo || "";
                    nowPlayingInput.value = "";

                    radioSearchFeedback.style.display = "block";
                    radioSearchFeedback.className = "small mt-2 text-success fw-semibold";
                    radioSearchFeedback.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Sender "${selected.name}" übernommen! Überprüfe die Angaben und klicke unten auf "Speichern".`;

                    // Formular sanft in den Fokus bringen
                    const formEl = container.querySelector("#radioForm");
                    if (formEl) {
                        formEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    }
                };
            });

            radioSearchResults.style.display = "flex";
        } catch (err) {
            radioSearchFeedback.style.display = "block";
            radioSearchFeedback.className = "small mt-2 text-danger";
            radioSearchFeedback.innerHTML = `<i class="bi bi-exclamation-circle-fill me-1"></i> ${err.message}`;
        } finally {
            radioSearchBtn.disabled = false;
            radioSearchBtn.innerHTML = origBtnHtml;
        }
    };

    if (radioSearchBtn && radioSearchInput) {
        radioSearchBtn.onclick = performRadioSearch;
        radioSearchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                performRadioSearch();
            }
        });
    }

    // --- TAB 2: PODCAST AUTO-IMPORT & DIRECTORY SEARCH ---
    const podcastSearchInput = container.querySelector("#podcastSearchInput");
    const podcastSearchBtn = container.querySelector("#podcastSearchBtn");
    const podcastSearchFeedback = container.querySelector("#podcastSearchFeedback");
    const podcastSearchResults = container.querySelector("#podcastSearchResults");
    const toggleManualRssLink = container.querySelector("#toggleManualRssLink");
    const toggleManualRssIcon = container.querySelector("#toggleManualRssIcon");
    const manualRssContainer = container.querySelector("#manualRssContainer");

    // Toggle für manuelle RSS-URL Eingabe
    if (toggleManualRssLink && manualRssContainer) {
        toggleManualRssLink.onclick = () => {
            const isHidden = manualRssContainer.style.display === "none";
            manualRssContainer.style.display = isHidden ? "block" : "none";
            if (toggleManualRssIcon) {
                toggleManualRssIcon.className = isHidden ? "bi bi-chevron-down" : "bi bi-chevron-right";
            }
        };
    }

    // Podcast Online-Suche via Apple Directory
    const performPodcastSearch = async () => {
        const query = podcastSearchInput ? podcastSearchInput.value.trim() : "";
        if (!query || query.length < 2) {
            podcastSearchFeedback.style.display = "block";
            podcastSearchFeedback.className = "small mt-2 text-warning";
            podcastSearchFeedback.textContent = "Bitte mindestens 2 Zeichen für die Podcast-Suche eingeben.";
            return;
        }

        const origBtnHtml = podcastSearchBtn.innerHTML;
        podcastSearchBtn.disabled = true;
        podcastSearchBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Suche...';
        podcastSearchFeedback.style.display = "none";
        podcastSearchResults.style.display = "none";
        podcastSearchResults.innerHTML = "";

        try {
            const res = await fetch(`../backend/api/podcast.php?action=search&term=${encodeURIComponent(query)}`);
            if (!res.ok) throw new Error(`Verzeichnis-Fehler (Status ${res.status})`);
            const data = await res.json();

            if (!data.success) {
                throw new Error(data.error || "Podcast-Suche fehlgeschlagen.");
            }

            if (!data.results || data.results.length === 0) {
                podcastSearchFeedback.style.display = "block";
                podcastSearchFeedback.className = "small mt-2 text-warning";
                podcastSearchFeedback.textContent = `Keine Podcasts für "${query}" gefunden. Bitte probiere einen anderen Suchbegriff.`;
                return;
            }

            podcastSearchFeedback.style.display = "block";
            podcastSearchFeedback.className = "small mt-2 text-info";
            podcastSearchFeedback.textContent = `${data.results.length} Podcast(s) gefunden. Wähle einen aus, um die Feed-Daten zu übernehmen:`;

            podcastSearchResults.innerHTML = data.results.map((pod, idx) => {
                const logoHtml = pod.logo
                    ? `<img src="${pod.logo}" alt="" class="rounded-2 flex-shrink-0 bg-dark" style="width: 44px; height: 44px; object-fit: cover;" onerror="this.outerHTML='<div class=\\'rounded-2 bg-secondary d-flex align-items-center justify-content-center flex-shrink-0 text-white-50\\' style=\\'width: 44px; height: 44px;\\'><i class=\\'bi bi-mic-fill\\'></i></div>'">`
                    : `<div class="rounded-2 bg-secondary d-flex align-items-center justify-content-center flex-shrink-0 text-white-50" style="width: 44px; height: 44px;"><i class="bi bi-mic-fill"></i></div>`;

                const countBadge = pod.track_count > 0 ? `<span class="badge bg-secondary text-white-50" style="font-size: 0.7rem;">${pod.track_count} Folgen</span>` : '';

                return `
                    <div class="col-12 col-md-6">
                        <div class="card bg-dark border border-secondary p-2 rounded-3 h-100 d-flex flex-row align-items-center justify-content-between gap-2 shadow-sm">
                            <div class="d-flex align-items-center gap-2 overflow-hidden flex-grow-1">
                                ${logoHtml}
                                <div class="text-truncate">
                                    <div class="fw-bold text-white text-truncate small" title="${pod.title}">${pod.title}</div>
                                    <div class="text-white-50 small text-truncate" style="font-size: 0.75rem;" title="${pod.artist}">${pod.artist || 'Podcast'}</div>
                                    <div class="d-flex gap-2 align-items-center flex-wrap mt-1">
                                        ${countBadge}
                                        <span class="text-info small" style="font-size: 0.7rem;">${pod.genre}</span>
                                    </div>
                                </div>
                            </div>
                            <button type="button" class="btn btn-outline-info btn-sm rounded-pill px-3 py-1 flex-shrink-0 apply-podcast-btn" data-index="${idx}">
                                Übernehmen
                            </button>
                        </div>
                    </div>
                `;
            }).join("");

            // Klick-Events für "Übernehmen" Buttons binden
            const applyBtns = podcastSearchResults.querySelectorAll(".apply-podcast-btn");
            applyBtns.forEach(btn => {
                btn.onclick = () => {
                    const idx = parseInt(btn.getAttribute("data-index"), 10);
                    const selected = data.results[idx];
                    if (!selected) return;

                    senderInput.value = selected.title || "";
                    urlInput.value = selected.feed_url || "";
                    genreInput.value = "Podcast";
                    logoInput.value = selected.logo || "";
                    nowPlayingInput.value = "";

                    podcastSearchFeedback.style.display = "block";
                    podcastSearchFeedback.className = "small mt-2 text-success fw-semibold";
                    podcastSearchFeedback.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Podcast "${selected.title}" übernommen! Überprüfe die Angaben und klicke unten auf "Speichern".`;

                    // Formular sanft in den Fokus bringen
                    const formEl = container.querySelector("#radioForm");
                    if (formEl) {
                        formEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    }
                };
            });

            podcastSearchResults.style.display = "flex";
        } catch (err) {
            podcastSearchFeedback.style.display = "block";
            podcastSearchFeedback.className = "small mt-2 text-danger";
            podcastSearchFeedback.innerHTML = `<i class="bi bi-exclamation-circle-fill me-1"></i> ${err.message}`;
        } finally {
            podcastSearchBtn.disabled = false;
            podcastSearchBtn.innerHTML = origBtnHtml;
        }
    };

    if (podcastSearchBtn && podcastSearchInput) {
        podcastSearchBtn.onclick = performPodcastSearch;
        podcastSearchInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                performPodcastSearch();
            }
        });
    }

    // --- MANUELLER FEED-IMPORT (URL) ---
    const podcastImportUrl = container.querySelector("#podcastImportUrl");
    const podcastImportBtn = container.querySelector("#podcastImportBtn");
    const podcastImportFeedback = container.querySelector("#podcastImportFeedback");

    if (podcastImportBtn && podcastImportUrl) {
        podcastImportBtn.onclick = async () => {
            const feedUrl = podcastImportUrl.value.trim();
            if (!feedUrl) {
                podcastImportFeedback.style.display = "block";
                podcastImportFeedback.className = "small mt-2 text-warning";
                podcastImportFeedback.textContent = "Bitte eine RSS-Feed-URL oder einen Podcast-Link eingeben.";
                return;
            }

            const origHtml = podcastImportBtn.innerHTML;
            podcastImportBtn.disabled = true;
            podcastImportBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Lade Feed...';
            podcastImportFeedback.style.display = "none";

            try {
                const res = await fetch(`../backend/api/podcast.php?action=info&url=${encodeURIComponent(feedUrl)}`);
                let data = null;
                try {
                    data = await res.json();
                } catch (_) {
                    // Falls die Antwort kein JSON war
                }

                if (!res.ok || !data || !data.success) {
                    const errorMsg = data?.error || `Fehler beim Laden des Podcast-Feeds (HTTP ${res.status}).`;
                    throw new Error(errorMsg);
                }

                senderInput.value = data.title || "";
                urlInput.value = data.feed_url || feedUrl;
                genreInput.value = "Podcast";
                logoInput.value = data.logo || "";
                nowPlayingInput.value = "";

                podcastImportFeedback.style.display = "block";
                podcastImportFeedback.className = "small mt-2 text-success fw-semibold";
                const latestTitle = data.latest_episode?.title ? ` (Neueste Folge: "${data.latest_episode.title}")` : "";
                podcastImportFeedback.innerHTML = `<i class="bi bi-check-circle-fill me-1"></i> Erfolgreich eingelesen: "${data.title}"${latestTitle}. Jetzt unten auf "Speichern" klicken!`;
                
                const formEl = container.querySelector("#radioForm");
                if (formEl) {
                    formEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }
            } catch (err) {
                podcastImportFeedback.style.display = "block";
                podcastImportFeedback.className = "small mt-2 text-danger";
                podcastImportFeedback.innerHTML = `<i class="bi bi-exclamation-circle-fill me-1"></i> ${err.message}`;
            } finally {
                podcastImportBtn.disabled = false;
                podcastImportBtn.innerHTML = origHtml;
            }
        };
    }

    const renderGenreButtons = () => {
        genreButtons.innerHTML = "";
        const all = stationService.getAll();
        if (totalCountBadge) {
            totalCountBadge.textContent = `${all.length} Sender`;
        }

        const genres = [...new Set(all.map((s) => s.genre ?? "Unbekannt"))].sort();
        if (!currentGenre || !genres.includes(currentGenre)) {
            currentGenre = genres[0] || null;
        }

        genres.forEach((g) => {
            const btn = document.createElement("button");
            const isActive = g === currentGenre;
            btn.className = `btn btn-sm rounded-pill px-3 ${isActive ? "btn-info text-dark fw-bold" : "btn-outline-info"}`;
            btn.textContent = g;
            btn.onclick = (e) => {
                e.stopPropagation();
                currentGenre = g;
                renderGenreButtons();
                renderStations(g);
            };
            genreButtons.appendChild(btn);
        });

        if (currentGenre) {
            renderStations(currentGenre);
        }
    };

    const renderStations = (selectedGenre) => {
        genreContainer.innerHTML = "";
        const stations = stationService.getAll()
            .map((s, i) => ({ ...s, _index: i }))
            .filter((s) => (s.genre ?? "Unbekannt") === selectedGenre);

        if (stations.length === 0) {
            genreContainer.innerHTML = `<div class="col-12 text-center text-white-50 py-3">Keine Sender in diesem Genre vorhanden.</div>`;
            return;
        }

        stations.forEach((station) => {
            const col = document.createElement("div");
            col.className = "col-6 col-md-4 col-lg-3 col-xl-2";
            col.innerHTML = `
                <div class="card h-100 bg-dark text-white border-secondary shadow-sm rounded-3">
                    <img src="${station.sender_Logo || './images/android.png'}" class="card-img-top p-2 rounded-circle mx-auto" style="width: 80px; height: 80px; object-fit: cover;" onerror="this.src='./images/android.png'">
                    <div class="card-body p-2 text-center">
                        <p class="small text-truncate mb-2 fw-semibold" title="${station.sender_Name}">${station.sender_Name}</p>
                        <div class="d-grid gap-1">
                            <button class="btn btn-xs btn-outline-primary py-0 edit-btn"><i class="bi bi-pencil me-1"></i>Edit</button>
                            <button class="btn btn-xs btn-outline-danger py-0 del-btn"><i class="bi bi-trash me-1"></i>Del</button>
                        </div>
                    </div>
                </div>`;
            
            col.querySelector(".edit-btn").onclick = (e) => {
                e.stopPropagation();
                // Ensure form area is visible and expanded
                if (formBody && formBody.classList.contains("d-none")) {
                    formBody.classList.remove("d-none");
                    if (formCollapseIcon) formCollapseIcon.className = "bi bi-chevron-up";
                    if (formCollapseText) formCollapseText.textContent = "Einklappen";
                }

                senderInput.value = station.sender_Name;
                urlInput.value = station.sender_Url;
                genreInput.value = station.genre ?? "";
                logoInput.value = station.sender_Logo ?? "";
                nowPlayingInput.value = station.now_playing_url ?? "";
                editStationIdInput.value = station.id;
                submitBtn.textContent = "Aktualisieren";
                form.scrollIntoView({ behavior: "smooth", block: "start" });
            };

            col.querySelector(".del-btn").onclick = async (e) => {
                e.stopPropagation();
                if (confirm(`Station "${station.sender_Name}" wirklich dauerhaft löschen?`)) {
                    try {
                        await stationService.remove(station.id);
                        showAlert(`Station "${station.sender_Name}" erfolgreich gelöscht.`);
                        renderGenreButtons();
                    } catch (err) {
                        showAlert(err.message || "Fehler beim Löschen des Senders.", false);
                    }
                }
            };
            genreContainer.appendChild(col);
        });
    };

    resetBtn.onclick = () => {
        form.reset();
        if (podcastImportUrl) podcastImportUrl.value = "";
        if (podcastImportFeedback) podcastImportFeedback.style.display = "none";
        editStationIdInput.value = "";
        submitBtn.textContent = "Speichern";
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        const editId = editStationIdInput.value;
        const station = {
            sender_Name: senderInput.value.trim(),
            sender_Url: urlInput.value.trim(),
            genre: genreInput.value.trim(),
            sender_Logo: logoInput.value.trim() || null,
            now_playing_url: nowPlayingInput.value.trim() || null,
        };

        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>Speichern...`;

        try {
            if (editId) {
                station.id = Number(editId);
                await stationService.update(station.id, station);
                showAlert(`Sender "${station.sender_Name}" erfolgreich aktualisiert.`);
            } else {
                await stationService.add(station);
                showAlert(`Sender "${station.sender_Name}" erfolgreich hinzugefügt.`);
            }
            currentGenre = station.genre || currentGenre;
            renderGenreButtons();
            form.reset();
            if (podcastImportUrl) podcastImportUrl.value = "";
            if (podcastImportFeedback) podcastImportFeedback.style.display = "none";
            editStationIdInput.value = "";
            submitBtn.textContent = "Speichern";
        } catch (err) {
            showAlert(err.message || "Fehler beim Speichern des Senders.", false);
        } finally {
            submitBtn.disabled = false;
            if (editStationIdInput.value !== "") {
                submitBtn.textContent = "Aktualisieren";
            } else {
                submitBtn.textContent = "Speichern";
            }
        }
    };

    stationService.on("loaded", () => {
        renderGenreButtons();
    });

    renderGenreButtons();
}
