/**
 * SEITE 1: RADIO PLAYER (radioPage.js)
 * Modernisierte Ansicht mit vereinter Sticky-Bottom-Player-Bar
 */
import { radioService } from "../services/radioServiceV2.js";
import { userStationService } from "../services/userStationService.js";

export function render(container) {
  // Klasse für Ausgleichs-Padding am Seitenende aktivieren
  document.body.classList.add("has-sticky-player");

  container.innerHTML = `
    <!-- Kopfbereich: Favoriten-Übersicht -->
    <div class="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
      <div class="d-flex align-items-center gap-3">
        <img src="./images/milo.jpg" id="mobileLogo" class="logo-clickable rounded-circle shadow border border-2 border-primary" alt="Milo Radio" style="width: 50px; height: 50px; object-fit: cover;">
        <div>
          <h1 class="h3 mb-0 text-white fw-bold">Deine Radiosender</h1>
          <p class="text-white-50 small mb-0">Wähle einen Sender zum Abspielen</p>
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

    <!-- Sender-Grid -->
    <div id="stationsContainer" class="row g-3"></div>

    <!-- 
      KOMBINIERTE STICKY-BOTTOM-PLAYER-BAR
      Vereint Controls (Play/Stop/Volume) und Now-Playing / Fetch-Anzeige
    -->
    <div id="stickyPlayerBar" class="sticky-player-bar shadow-lg">
      <div class="container-fluid px-2 px-md-4">
        <div class="row align-items-center g-2">
          
          <!-- 1. Fetch / Now-Playing Bereich (Sender, Song, Interpret, Artwork) -->
          <div class="col-12 col-md-5 col-lg-5 d-flex align-items-center gap-3">
            <div class="position-relative flex-shrink-0">
              <img src="./images/milo.jpg" id="playerThumb" class="rounded-circle player-thumb shadow-sm border border-2 border-secondary" alt="Station">
              <div id="playerPlayingBadge" class="mini-wave-badge d-none">
                <span class="mini-wave"></span>
                <span class="mini-wave"></span>
                <span class="mini-wave"></span>
              </div>
            </div>
            <div class="text-truncate flex-grow-1 text-start" style="min-width: 0;">
              <div id="stationTitle" class="player-station-name text-truncate">Bereit zum Abspielen</div>
              <div id="nowPlayingText" class="player-now-playing-text text-truncate" style="min-height: 1.25em;"></div>
            </div>
          </div>

          <!-- 2. Play & Stop Controls -->
          <div class="col-6 col-md-4 col-lg-4 d-flex align-items-center justify-content-start justify-content-md-center gap-2">
            <button id="playBtn" class="btn btn-primary rounded-pill px-4 fw-semibold d-flex align-items-center gap-2 shadow-sm" disabled>
              <i class="bi bi-play-fill fs-5"></i><span>Play</span>
            </button>
            <button id="stopBtn" class="btn btn-outline-light rounded-pill px-3 fw-semibold d-flex align-items-center gap-2" disabled>
              <i class="bi bi-stop-fill fs-5"></i><span>Stop</span>
            </button>
          </div>

          <!-- 3. Lautstärke & Extras -->
          <div class="col-6 col-md-3 col-lg-3 d-flex align-items-center justify-content-end gap-2">
            <i class="bi bi-volume-up text-white-50 fs-5"></i>
            <input type="range" id="volumeSlider" min="0" max="1" step="0.01" class="form-range custom-range flex-grow-1" style="max-width: 120px;">
          </div>

        </div>
      </div>
    </div>
  `;

  const stationTitle = container.querySelector("#stationTitle");
  const nowPlayingText = container.querySelector("#nowPlayingText");
  const playBtn = container.querySelector("#playBtn");
  const stopBtn = container.querySelector("#stopBtn");
  const volumeSlider = container.querySelector("#volumeSlider");
  const stationsContainer = container.querySelector("#stationsContainer");
  const feedback = container.querySelector("#feedback");
  const mobileLogo = container.querySelector("#mobileLogo");
  const qrShareBtn = container.querySelector("#qrShareBtn");
  const playerThumb = container.querySelector("#playerThumb");
  const playerPlayingBadge = container.querySelector("#playerPlayingBadge");

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
  if (playerThumb) playerThumb.onclick = openQrModal;

  let activeStations = userStationService.getStations();
  let currentStation = null;
  let lastPlayedStation = null;
  let nowPlayingInterval = null;

  const savedVolume = localStorage.getItem("radioVolume") ?? 0.3;
  volumeSlider.value = savedVolume;
  radioService.setVolume(savedVolume);

  const lastUrl = localStorage.getItem("lastStationUrl");
  const wasPlaying = localStorage.getItem("isPlaying") === "true";

  if (lastUrl) {
    const found = activeStations.find((s) => s.sender_Url === lastUrl);
    if (found) {
      lastPlayedStation = found;
      if (wasPlaying) {
        currentStation = found;
        radioService.play(found);
        startNowPlayingUpdates(found);
      }
    }
  }

  async function fetchNowPlaying(station) {
    if (!station) {
      if (nowPlayingText) nowPlayingText.textContent = "";
      return;
    }

    let urlToFetch = "";
    if (station.now_playing_url && station.now_playing_url.trim() !== "") {
      urlToFetch = station.now_playing_url;
    } else if (station.sender_Url) {
      urlToFetch = `../backend/api/metadata.php?stream=${encodeURIComponent(station.sender_Url)}`;
    } else {
      if (nowPlayingText) nowPlayingText.textContent = "";
      return;
    }

    try {
      const response = await fetch(urlToFetch);
      const text = await response.text();
      let title = "";
      try {
        const json = JSON.parse(text);
        title = json.title || json.song || json.now_playing || json.name || json.currentSong || "";
      } catch (e) {
        title = text;
      }

      if (nowPlayingText) {
        nowPlayingText.textContent = title.trim() || `🎵 ${station.sender_Name}`;
      }
    } catch (error) {
      if (nowPlayingText) nowPlayingText.textContent = "";
    }
  }

  function startNowPlayingUpdates(station) {
    clearInterval(nowPlayingInterval);
    if (!station) return;
    fetchNowPlaying(station);
    nowPlayingInterval = setInterval(() => fetchNowPlaying(station), 15000);
  }

  function stopNowPlayingUpdates() {
    clearInterval(nowPlayingInterval);
    if (nowPlayingText) nowPlayingText.textContent = "";
  }

  function showFeedback(msg, isError = false) {
    feedback.textContent = msg;
    feedback.className = `alert alert-${isError ? "danger" : "info"} text-center mb-3`;
    feedback.classList.remove("d-none");
    setTimeout(() => feedback.classList.add("d-none"), 2000);
  }

  function updateStatus() {
    const isPlaying = !!currentStation;
    const activeObj = currentStation || lastPlayedStation;

    if (activeObj) {
      playerThumb.src = activeObj.sender_Logo || "./images/cholo_love.png";
    } else {
      playerThumb.src = "./images/milo.jpg";
    }

    if (isPlaying) {
      if (stationTitle) stationTitle.textContent = `Hört gerade: ${currentStation.sender_Name}`;
      playerThumb.classList.add("playing");
      if (playerPlayingBadge) playerPlayingBadge.classList.remove("d-none");
    } else {
      playerThumb.classList.remove("playing");
      if (playerPlayingBadge) playerPlayingBadge.classList.add("d-none");

      if (lastPlayedStation) {
        if (stationTitle) stationTitle.textContent = `Zuletzt gehört: ${lastPlayedStation.sender_Name}`;
      } else if (activeStations.length === 0) {
        if (stationTitle) stationTitle.textContent = "Keine Favoriten!";
      } else {
        if (stationTitle) stationTitle.textContent = "Bereit zum Abspielen";
      }
    }

    playBtn.disabled = activeStations.length === 0 || isPlaying;
    stopBtn.disabled = !isPlaying;
  }

  function renderRadioCards() {
    stationsContainer.innerHTML = "";
    if (activeStations.length === 0) {
      stationsContainer.innerHTML = `
        <div class="col-12 text-center p-5 text-white-50">
            <i class="bi bi-music-note-list display-1 mb-3"></i>
            <p>Deine Liste ist leer. Durchstöbere die Genres!</p>
            <a href="#genres" class="btn btn-outline-primary btn-sm rounded-pill px-4">Genres entdecken</a>
        </div>`;
      updateStatus();
      return;
    }

    activeStations.forEach((station) => {
      const col = document.createElement("div");
      col.className = "col-6 col-md-3 col-lg-2";
      
      const isActive = currentStation && currentStation.sender_Url === station.sender_Url;
      
      col.innerHTML = `
        <div class="card h-100 bg-dark text-white border-secondary shadow-sm card-glow ${isActive ? "border-primary border-2" : ""}">
            <div class="position-relative overflow-hidden pt-2 text-center">
                <img src="${station.sender_Logo || "./images/cholo_love.png"}" class="card-img-top rounded-circle p-2 mx-auto" alt="${station.sender_Name}" style="width: 100px; height: 100px; object-fit: cover;">
                ${isActive ? '<div class="playing-overlay"><div class="wave"></div></div>' : ""}
            </div>
            <div class="card-body p-2 text-center">
                <h6 class="card-title small mb-2 text-truncate">${station.sender_Name}</h6>
                <div class="d-grid gap-1">
                    <button class="btn btn-sm ${isActive ? "btn-success" : "btn-primary"} btn-play">Play</button>
                    <button class="btn btn-sm btn-outline-danger btn-remove border-0 small">×</button>
                </div>
            </div>
        </div>`;

      const playB = col.querySelector(".btn-play");
      const removeB = col.querySelector(".btn-remove");

      playB.onclick = () => {
        currentStation = station;
        lastPlayedStation = station;
        radioService.play(station);
        startNowPlayingUpdates(station);
        updateStatus();
        renderRadioCards();
      };

      removeB.onclick = (e) => {
        e.stopPropagation();
        if (confirm(`Möchtest du "${station.sender_Name}" wirklich entfernen?`)) {
          activeStations = activeStations.filter((s) => s.sender_Url !== station.sender_Url);
          userStationService.setStations(activeStations);
          if (currentStation && currentStation.sender_Url === station.sender_Url) {
            radioService.stop();
            stopNowPlayingUpdates();
            currentStation = null;
          }
          showFeedback(`"${station.sender_Name}" wurde entfernt`);
          renderRadioCards();
        }
      };

      stationsContainer.appendChild(col);
    });
    updateStatus();
  }

  volumeSlider.addEventListener("input", () => {
    radioService.setVolume(volumeSlider.value);
    localStorage.setItem("radioVolume", volumeSlider.value);
  });

  stopBtn.addEventListener("click", () => {
    radioService.stop();
    stopNowPlayingUpdates();
    currentStation = null;
    updateStatus();
    renderRadioCards();
  });

  playBtn.addEventListener("click", () => {
    if (!currentStation && lastPlayedStation) currentStation = lastPlayedStation;
    if (activeStations.length > 0 && !currentStation) currentStation = activeStations[0];
    if (currentStation) {
      radioService.play(currentStation);
      startNowPlayingUpdates(currentStation);
      updateStatus();
      renderRadioCards();
    }
  });

  userStationService.on("update", (newList) => {
    activeStations = newList;
    renderRadioCards();
  });

  renderRadioCards();
}
