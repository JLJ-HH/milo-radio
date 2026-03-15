/**
 * SEITE 1: RADIO PLAYER (radioPage.js)
 */
import { radioService } from "../services/radioServiceV2.js";
import { userStationService } from "../services/userStationService.js";

export function render(container) {
  container.innerHTML = `
    <div class="row align-items-center flex-column flex-md-row mb-4 text-white text-center text-md-start">
        <div class="col-12 col-md-2 mb-3 mb-md-0 d-flex justify-content-center justify-content-md-end pe-md-0">
            <img src="./images/milo.jpg" id="mobileLogo" class="logo-clickable rounded-circle shadow border border-3 border-primary mx-auto" alt="Milo Radio" style="width: 120px; height: 120px; object-fit: cover;">
        </div>
        <div class="col-12 col-md-10 ps-md-3">
            <h1 class="mb-1 d-none d-md-block h3">Radio Player</h1>
            <h2 class="mb-0 d-md-none h4" style="color: var(--bs-primary);">Milo Radio</h2>
            <p id="stationTitle" class="mb-1 player-info-title">Wähle einen Sender</p>
            <div id="nowPlayingText" class="mb-0 player-now-playing" style="min-height: 1.2em;"></div>
        </div>
    </div>

    <div id="radioControls" class="card bg-dark border-secondary p-3 mb-4 shadow">
        <div class="d-flex align-items-center gap-3">
            <button id="playBtn" class="btn btn-primary rounded-pill px-4" disabled>Play</button>
            <button id="stopBtn" class="btn btn-outline-light rounded-pill px-4" disabled>Stop</button>
            <div class="flex-grow-1 d-flex align-items-center gap-2">
                <i class="bi bi-volume-up text-white"></i>
                <input type="range" id="volumeSlider" min="0" max="1" step="0.01" class="form-range custom-range">
            </div>
        </div>
    </div>

    <div id="feedback" class="alert alert-info d-none mb-3"></div>
    <div id="stationsContainer" class="row g-3"></div>
    `;

  const stationTitle = container.querySelector("#stationTitle");
  const nowPlayingText = container.querySelector("#nowPlayingText");
  const playBtn = container.querySelector("#playBtn");
  const stopBtn = container.querySelector("#stopBtn");
  const volumeSlider = container.querySelector("#volumeSlider");
  const stationsContainer = container.querySelector("#stationsContainer");
  const feedback = container.querySelector("#feedback");
  const mobileLogo = container.querySelector("#mobileLogo");

  // QR Code Modal Handler
  if (mobileLogo) {
    mobileLogo.onclick = () => {
      const modalElement = document.getElementById('qrModal');
      const qrModal = new bootstrap.Modal(modalElement);
      qrModal.show();
    };
  }

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
      // API Pfad angepasst für die Backend-Struktur
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
    feedback.className = `alert alert-${isError ? 'danger' : 'info'} text-center mb-3`;
    feedback.classList.remove("d-none");
    setTimeout(() => feedback.classList.add("d-none"), 2000);
  }

  function updateStatus() {
    const titleText = currentStation
      ? `Hört gerade: ${currentStation.sender_Name}`
      : lastPlayedStation
        ? `Zuletzt gehört: ${lastPlayedStation.sender_Name}`
        : activeStations.length === 0
          ? "Keine Favoriten!"
          : "Bereit zum Abspielen";

    if (stationTitle) stationTitle.textContent = titleText;
    playBtn.disabled = activeStations.length === 0 || !!currentStation;
    stopBtn.disabled = !currentStation;
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
        <div class="card h-100 bg-dark text-white border-secondary shadow-sm card-glow ${isActive ? 'border-primary border-2' : ''}">
            <div class="position-relative overflow-hidden pt-2 text-center">
                <img src="${station.sender_Logo || './images/cholo_love.png'}" class="card-img-top rounded-circle p-2 mx-auto" alt="${station.sender_Name}" style="width: 100px; height: 100px; object-fit: cover;">
                ${isActive ? '<div class="playing-overlay"><div class="wave"></div></div>' : ''}
            </div>
            <div class="card-body p-2 text-center">
                <h6 class="card-title small mb-2 text-truncate">${station.sender_Name}</h6>
                <div class="d-grid gap-1">
                    <button class="btn btn-sm ${isActive ? 'btn-success' : 'btn-primary'} btn-play">Play</button>
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
        if (confirm(`Entfernen?`)) {
          activeStations = activeStations.filter((s) => s.sender_Url !== station.sender_Url);
          userStationService.setStations(activeStations);
          if (currentStation && currentStation.sender_Url === station.sender_Url) {
            radioService.stop();
            stopNowPlayingUpdates();
            currentStation = null;
          }
          showFeedback(`Entfernt`);
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
