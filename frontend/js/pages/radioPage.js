/**
 * SEITE 1: RADIO PLAYER (radioPage.js)
 * Favoriten-Übersicht (Top 6 mit MRU-Sortierung & Auto-Scroll)
 */
import { radioService } from "../services/radioServiceV2.js";
import { userStationService } from "../services/userStationService.js";

export function render(container) {
  container.innerHTML = `
    <!-- Kopfbereich: Favoriten-Übersicht -->
    <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
      <div class="d-flex align-items-center gap-3">
        <img src="./images/milo.jpg" id="mobileLogo" class="logo-clickable rounded-circle shadow border border-2 border-primary" alt="Milo Radio" style="width: 50px; height: 50px; object-fit: cover;">
        <div>
          <h1 class="h3 mb-0 text-white fw-bold">Deine Radiosender</h1>
          <p id="stationCountSubtitle" class="text-white-50 small mb-0">Wähle einen Sender (max. 6 Favoriten aktiv)</p>
        </div>
      </div>
      <div class="d-flex gap-2">
        <a href="#genres" class="btn btn-outline-primary btn-sm rounded-pill px-3 d-flex align-items-center gap-1">
          <i class="bi bi-plus-circle"></i> <span>Sender hinzufügen</span>
        </a>
        <button id="qrShareBtn" class="btn btn-outline-secondary btn-sm rounded-pill px-3 d-flex align-items-center gap-1 text-white-50">
          <i class="bi bi-qr-code"></i> <span>Teilen</span>
        </button>
      </div>
    </div>

    <!-- Feedback Message Box -->
    <div id="feedback" class="alert alert-info d-none mb-3"></div>

    <!-- Sender-Grid (Top 6) -->
    <div id="stationsContainer" class="row g-3"></div>
  `;

  const stationsContainer = container.querySelector("#stationsContainer");
  const feedback = container.querySelector("#feedback");
  const mobileLogo = container.querySelector("#mobileLogo");
  const qrShareBtn = container.querySelector("#qrShareBtn");
  const stationCountSubtitle = container.querySelector("#stationCountSubtitle");

  // QR Code Modal Handler
  const openQrModal = () => {
    const modalElement = document.getElementById("qrModal");
    if (modalElement && typeof bootstrap !== "undefined") {
      const qrModal = new bootstrap.Modal(modalElement);
      qrModal.show();
    }
  };

  if (mobileLogo) mobileLogo.onclick = openQrModal;
  if (qrShareBtn) qrShareBtn.onclick = openQrModal;

  function showFeedback(msg, isError = false) {
    feedback.textContent = msg;
    feedback.className = `alert alert-${isError ? "danger" : "info"} text-center mb-3`;
    feedback.classList.remove("d-none");
    setTimeout(() => feedback.classList.add("d-none"), 2000);
  }

  function renderRadioCards() {
    stationsContainer.innerHTML = "";
    const activeStations = userStationService.getStations();

    if (stationCountSubtitle) {
      stationCountSubtitle.textContent = `Deine Top 6 Favoriten (${activeStations.length} / 6 belegt)`;
    }

    if (activeStations.length === 0) {
      stationsContainer.innerHTML = `
        <div class="col-12 text-center p-5 text-white-50">
            <i class="bi bi-music-note-list display-1 mb-3 text-primary opacity-50"></i>
            <h4 class="text-white mb-2">Deine Favoritenliste ist leer</h4>
            <p>Durchstöbere die Genres und wähle deine Top-Sender!</p>
            <a href="#genres" class="btn btn-primary rounded-pill px-4 shadow">Genres entdecken</a>
        </div>`;
      return;
    }

    const currentUrl = (radioService.getCurrentStation() || "").trim();

    activeStations.forEach((station, index) => {
      const col = document.createElement("div");
      col.className = "col-6 col-md-4 col-lg-2";
      
      const url = (station.sender_Url || station.sender_url || station.url || "").trim();
      const isActive = currentUrl && currentUrl === url;
      const logo = station.sender_Logo || station.sender_logo || station.logo || "./images/cholo_love.png";
      const name = station.sender_Name || station.sender_name || station.name || "Radio";

      col.innerHTML = `
        <div class="card h-100 bg-dark text-white border-secondary shadow-sm card-glow ${isActive ? "border-primary border-2" : ""}">
            <div class="position-relative overflow-hidden pt-2 text-center">
                <span class="badge rounded-pill bg-dark bg-opacity-75 border border-secondary text-white-50 position-absolute top-0 start-0 m-2 px-2 py-1 small">
                  #${index + 1}
                </span>
                <img src="${logo}" class="card-img-top rounded-circle p-2 mx-auto" alt="${name}" style="width: 90px; height: 90px; object-fit: cover;">
                ${isActive ? '<div class="playing-overlay"><div class="wave"></div></div>' : ""}
            </div>
            <div class="card-body p-2 text-center d-flex flex-column justify-content-between">
                <h6 class="card-title small mb-2 text-truncate" title="${name}">${name}</h6>
                <div class="d-grid gap-1 mt-auto">
                    <button class="btn btn-sm ${isActive ? "btn-success fw-bold" : "btn-primary"} btn-play rounded-pill shadow-sm">
                      <i class="bi ${isActive ? "bi-volume-up-fill" : "bi-play-fill"}"></i> ${isActive ? "Läuft" : "Play"}
                    </button>
                    <button class="btn btn-sm btn-outline-danger btn-remove border-0 small">×</button>
                </div>
            </div>
        </div>`;

      const playB = col.querySelector(".btn-play");
      const removeB = col.querySelector(".btn-remove");

      playB.onclick = (e) => {
        if (e) e.stopPropagation();
        // 1. ZUERST den Sender im Speicher an Position 1 rücken
        userStationService.addStation(station, 6);
        // 2. Audio starten
        radioService.play(station);
        // 3. Karten sofort neu aufbauen
        renderRadioCards();
        // 4. Sanft nach oben scrollen
        window.scrollTo({ top: 0, behavior: "smooth" });
      };

      removeB.onclick = (e) => {
        if (e) e.stopPropagation();
        if (confirm(`Möchtest du "${name}" wirklich entfernen?`)) {
          const updated = activeStations.filter((s) => (s.sender_Url || s.sender_url || s.url || "").trim() !== url);
          userStationService.setStations(updated);
          if (currentUrl === url) {
            radioService.stop();
          }
          showFeedback(`"${name}" wurde entfernt`);
          renderRadioCards();
        }
      };

      stationsContainer.appendChild(col);
    });
  }

  // Update render when playback changes or user stations change
  radioService.on("play", renderRadioCards);
  radioService.on("stop", renderRadioCards);
  userStationService.on("update", renderRadioCards);

  renderRadioCards();
}
