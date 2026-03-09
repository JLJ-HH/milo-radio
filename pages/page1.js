/**
 * SEITE 1: RADIO PLAYER (page1.js)
 *
 * Diese Seite ist das Herzstück der App. Sie zeigt den Player,
 * die Senderliste des Nutzers und die aktuellen Song-Infos (Now Playing).
 */
import { radioService } from "../js/services/radioService.js";
import { userStationService } from "../js/services/userStationService.js";

export function render(container) {
  // --- 1. HTML-LAYOUT RENDERN ---
  container.innerHTML = `
    <div class="row align-items-center mb-4">
        <div class="col-4 col-md-2 text-end pe-0">
            <img src="./images/milo.jpg" id="mobileLogo" class="logo-clickable" alt="Milo Radio">
        </div>
        <div class="col-8 col-md-10 ps-3">
            <h1 class="mb-1 d-none d-md-block">Radio Player</h1>
            <h2 class="mb-0 d-md-none" style="color: var(--primary);">Radio Player</h2>
            <p id="stationTitle" class="mb-1 fw-bold fs-5">Keine Sender ausgewählt</p>
            <p id="nowPlayingText" class="mb-0 d-block" style="min-height: 28px;"></p>
        </div>
    </div>

    <div id="radioControls" class="mb-4">
        <button id="playBtn" class="btn btn-primary me-2" disabled>Play</button>
        <button id="stopBtn" class="btn btn-secondary me-2" disabled>Stop</button>
        <input type="range" id="volumeSlider" min="0" max="1" step="0.01" class="form-range">
    </div>

    <div id="feedback" class="hidden mb-3"></div>
    <div id="stationsContainer"></div>
    `;

  // --- 2. ELEMENTE REFERENZIEREN ---
  const mobileLogo = container.querySelector("#mobileLogo");
  const stationTitle = container.querySelector("#stationTitle");
  const nowPlayingText = container.querySelector("#nowPlayingText");
  const playBtn = container.querySelector("#playBtn");
  const stopBtn = container.querySelector("#stopBtn");
  const volumeSlider = container.querySelector("#volumeSlider");
  const stationsContainer = container.querySelector("#stationsContainer");
  const feedback = container.querySelector("#feedback");

  // Lokale Zustände
  let activeStations = userStationService.getStations();
  let currentStation = null;
  let lastPlayedStation = null;
  let nowPlayingInterval = null;

  // --- 3. INITIALISIERUNG (VOLLUME & PERSISTENZ) ---
  const savedVolume = localStorage.getItem("radioVolume") ?? 0.3;
  volumeSlider.value = savedVolume;
  radioService.setVolume(savedVolume);

  // Letzte Sitzung wiederherstellen
  const lastUrl = localStorage.getItem("lastStationUrl");
  const wasPlaying = localStorage.getItem("isPlaying") === "true";

  if (lastUrl) {
    const found = activeStations.find((s) => s.sender_Url === lastUrl);
    if (found) {
      lastPlayedStation = found;
      if (wasPlaying) {
        currentStation = found;
        radioService.play(found.sender_Url);
        startNowPlayingUpdates(found);
      }
    }
  }

  // --- 4. FUNKTIONEN (LOGIK) ---

  /**
   * Holt die aktuellen Song-Informationen über den PHP-Proxy.
   */
  async function fetchNowPlaying(station) {
    if (!station) {
      if (nowPlayingText) nowPlayingText.textContent = "";
      return;
    }

    let urlToFetch = "";

    // PHP-Proxy nutzen, um CORS-Probleme zu umgehen
    if (station.now_playing_url && station.now_playing_url.trim() !== "") {
      urlToFetch = station.now_playing_url;
    } else if (station.sender_Url) {
      urlToFetch = `./api/metadata.php?stream=${encodeURIComponent(station.sender_Url)}`;
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
        title =
          json.title ||
          json.song ||
          json.now_playing ||
          json.name ||
          json.currentSong ||
          "";
      } catch (e) {
        title = text;
      }

      // UI mit Song-Titel aktualisieren
      if (nowPlayingText) {
        if (title.trim()) {
          nowPlayingText.textContent = title.trim();
          nowPlayingText.classList.add("has-title");
          nowPlayingText.classList.remove("live-station");
        } else {
          // Fallback: Nur Sendername anzeigen
          nowPlayingText.textContent = `🎵 ${station.sender_Name}`;
          nowPlayingText.classList.add("live-station");
          nowPlayingText.classList.remove("has-title");
        }
      }
    } catch (error) {
      console.warn("Fehler beim Abrufen der Metadaten:", error);
      if (nowPlayingText) nowPlayingText.textContent = "";
    }
  }

  /**
   * Startet die regelmäßige Abfrage (Intervall) der Song-Infos.
   */
  function startNowPlayingUpdates(station) {
    clearInterval(nowPlayingInterval);
    if (!station) return;

    fetchNowPlaying(station);
    // Alle 15 Sekunden aktualisieren
    nowPlayingInterval = setInterval(() => {
      fetchNowPlaying(station);
    }, 15000);
  }

  function stopNowPlayingUpdates() {
    clearInterval(nowPlayingInterval);
    if (nowPlayingText) nowPlayingText.textContent = "";
  }

  /**
   * Zeigt eine kurze Bestätigungsmeldung an.
   */
  function showFeedback(msg, color = "green") {
    feedback.textContent = msg;
    feedback.style.color = color;
    feedback.classList.remove("hidden");
    setTimeout(() => feedback.classList.add("hidden"), 2000);
  }

  /**
   * Aktualisiert den Anzeigetext (Du hörst: ...) und die Button-Zustände.
   */
  function updateStatus() {
    const titleText = currentStation
      ? `Du hörst: ${currentStation.sender_Name}`
      : lastPlayedStation
        ? `Zuletzt gehört: ${lastPlayedStation.sender_Name}`
        : activeStations.length === 0
          ? "Keine Sender ausgewählt"
          : "Gestoppt";

    if (stationTitle) stationTitle.textContent = titleText;

    // Buttons aktivieren/deaktivieren
    playBtn.disabled = activeStations.length === 0 || !!currentStation;
    stopBtn.disabled = !currentStation;
  }

  /**
   * Erstellt die Kachel-Ansicht der vom Nutzer gewählten Sender.
   */
  function renderRadioCards() {
    stationsContainer.innerHTML = "";

    if (activeStations.length === 0) {
      stationsContainer.innerHTML =
        '<p class="text-muted">Keine Sender ausgewählt. Gehe zu „Genres", um welche hinzuzufügen.</p>';
      updateStatus();
      return;
    }

    activeStations.forEach((station) => {
      const card = document.createElement("div");
      card.className = "card text-center";
      // Aktiven Sender optisch hervorheben
      if (currentStation && currentStation.sender_Url === station.sender_Url)
        card.classList.add("active");

      // Sender-Logo (mit Fallback)
      const img = document.createElement("img");
      img.className = "card-img-top mx-auto mt-2";
      img.src =
        station.sender_Logo && station.sender_Logo.trim() !== ""
          ? station.sender_Logo
          : "./images/cholo_love.png";

      img.onerror = () => {
        img.onerror = null;
        img.src = "./images/cholo_love.png";
      };

      card.appendChild(img);

      const body = document.createElement("div");
      body.className = "card-body p-2";
      body.innerHTML = `
        <p class="card-text small mb-1">${station.sender_Name}</p>
        <button class="btn btn-sm btn-primary w-100 mb-1">Play</button>
        <button class="btn btn-sm btn-danger w-100">Entfernen</button>
    `;
      card.appendChild(body);

      const [playBtnCard, removeBtnCard] = body.querySelectorAll("button");

      // Klick auf eine Sender-Kachel
      playBtnCard.onclick = () => {
        currentStation = station;
        lastPlayedStation = station;
        radioService.play(station.sender_Url);
        startNowPlayingUpdates(station);
        updateStatus();
        renderRadioCards();
      };

      // Klick auf "Entfernen"
      removeBtnCard.onclick = () => {
        if (confirm(`"${station.sender_Name}" aus deiner Liste entfernen?`)) {
          activeStations = activeStations.filter(
            (s) => s.sender_Url !== station.sender_Url,
          );
          userStationService.setStations(activeStations);

          if (
            currentStation &&
            currentStation.sender_Url === station.sender_Url
          ) {
            radioService.stop();
            stopNowPlayingUpdates();
            currentStation = null;
          }
          showFeedback(`Sender "${station.sender_Name}" entfernt`, "red");
          renderRadioCards();
        }
      };

      stationsContainer.appendChild(card);
    });
    updateStatus();
  }

  // --- 5. EVENT-LISTENER (INTERAKTION) ---

  // Logo-Klick öffnet den QR-Code (Modal)
  if (mobileLogo) {
    mobileLogo.addEventListener("click", function () {
      this.style.transform = "scale(1.1)";
      setTimeout(() => (this.style.transform = ""), 300);

      const qrModalEl = document.getElementById("qrModal");
      if (qrModalEl) {
        const qrModal = new bootstrap.Modal(qrModalEl);
        qrModal.show();
      }
    });
  }

  // Lautstärke-Slider
  volumeSlider.addEventListener("input", () => {
    radioService.setVolume(volumeSlider.value);
    localStorage.setItem("radioVolume", volumeSlider.value);
  });

  // Globaler Stop-Button
  stopBtn.addEventListener("click", () => {
    radioService.stop();
    stopNowPlayingUpdates();
    currentStation = null;
    updateStatus();
    renderRadioCards();
  });

  // Globaler Play-Button
  playBtn.addEventListener("click", () => {
    if (!currentStation && lastPlayedStation)
      currentStation = lastPlayedStation;
    if (currentStation) {
      radioService.play(currentStation.sender_Url);
      startNowPlayingUpdates(currentStation);
      updateStatus();
      renderRadioCards();
    }
  });

  // Wenn sich die Liste über den Genre-Tab ändert
  userStationService.on("update", (newList) => {
    activeStations = newList;
    renderRadioCards();
  });

  // Ansicht beim Laden aufbauen
  renderRadioCards();
}
