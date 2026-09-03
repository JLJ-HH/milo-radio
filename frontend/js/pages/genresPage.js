/**
 * SEITE 3: GENRES / SENDER-AUSWAHL (genresPage.js)
 * Mit einklappbarer Genre-Leiste & Touch-optimierten Buttons
 */
import { userStationService } from "../services/userStationService.js";
import { stationService } from "../services/stationServiceV5.js";
import { radioService } from "../services/radioServiceV2.js";

export function render(container) {
  container.innerHTML = `
        <div class="text-white">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <div class="d-flex align-items-center gap-3">
                    <i class="bi bi-tags display-5 text-primary"></i>
                    <div>
                        <h2 class="mb-0">Genres & Sender</h2>
                        <p class="text-white-50 small mb-0">Entdecke Sender & wähle deine Top 6 Favoriten.</p>
                    </div>
                </div>
                <a href="#radio" class="btn btn-outline-primary btn-sm rounded-pill px-3 d-flex align-items-center gap-1">
                    <i class="bi bi-play-circle"></i> <span>Zu deinen Top 6</span>
                </a>
            </div>

            <!-- Floating Toast Notification Container -->
            <div id="toastContainer" class="position-fixed bottom-0 start-50 translate-middle-x p-3" style="z-index: 1060; margin-bottom: 90px; pointer-events: none;"></div>
            
            <!-- Aktives Genre Header (erscheint wenn ein Genre gewählt ist) -->
            <div id="activeGenreBar" class="d-none bg-dark border border-secondary p-3 rounded-4 mb-3 shadow-sm d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div class="d-flex align-items-center gap-2">
                    <span class="text-white-50 small">Aktives Genre:</span>
                    <span id="activeGenreBadge" class="badge rounded-pill bg-primary px-3 py-2 fs-6"></span>
                    <span id="activeStationCount" class="text-white-50 small ms-1"></span>
                </div>
                <button id="toggleGenreButtonsBtn" class="btn btn-outline-light btn-sm rounded-pill px-3 d-flex align-items-center gap-1">
                    <i class="bi bi-chevron-down" id="toggleGenreIcon"></i> <span>Genre wechseln</span>
                </button>
            </div>

            <!-- Einklappbare Genre-Button-Auswahl -->
            <div id="genreButtonsCard" class="card bg-dark border-secondary p-3 rounded-4 mb-4 shadow-sm">
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <span class="text-white-50 small fw-bold text-uppercase" style="letter-spacing: 0.5px;">Wähle eine Musikrichtung:</span>
                </div>
                <div id="genreButtons" class="d-flex flex-wrap gap-2">
                    <div class="text-white-50 small py-2">Genres werden geladen...</div>
                </div>
            </div>

            <!-- Sender-Ergebnisbereich -->
            <div id="genreContainer" class="row g-3">
                 <div class="col-12 text-center p-5 text-white-50">
                    <i class="bi bi-music-note-beamed display-3 text-primary opacity-50 mb-3 d-block"></i>
                    <p class="fs-5">Wähle oben ein Genre aus, um Sender zu entdecken.</p>
                </div>
            </div>
        </div>
    `;

  const genreButtonsContainer = container.querySelector("#genreButtons");
  const genreButtonsCard = container.querySelector("#genreButtonsCard");
  const genreContainer = container.querySelector("#genreContainer");
  const toastContainer = container.querySelector("#toastContainer");
  const activeGenreBar = container.querySelector("#activeGenreBar");
  const activeGenreBadge = container.querySelector("#activeGenreBadge");
  const activeStationCount = container.querySelector("#activeStationCount");
  const toggleGenreButtonsBtn = container.querySelector("#toggleGenreButtonsBtn");

  let isGenreListCollapsed = false;

  // Umschalten der Genre-Buttons (Ein-/Ausklappen)
  if (toggleGenreButtonsBtn) {
    toggleGenreButtonsBtn.onclick = () => {
      isGenreListCollapsed = !isGenreListCollapsed;
      if (isGenreListCollapsed) {
        genreButtonsCard.classList.add("d-none");
        toggleGenreButtonsBtn.innerHTML = `<i class="bi bi-chevron-down"></i> <span>Genre wechseln</span>`;
      } else {
        genreButtonsCard.classList.remove("d-none");
        toggleGenreButtonsBtn.innerHTML = `<i class="bi bi-chevron-up"></i> <span>Genres einklappen</span>`;
        genreButtonsCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    };
  }

  function showToast(stationName) {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = "alert alert-success d-flex align-items-center justify-content-between gap-3 shadow-lg border-0 rounded-pill px-4 py-2";
    toast.style.pointerEvents = "auto";
    toast.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
    toast.style.color = "#ffffff";
    toast.style.boxShadow = "0 10px 25px rgba(16, 185, 129, 0.4)";
    
    toast.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-check-circle-fill fs-5"></i>
        <span><strong>"${stationName}"</strong> ist jetzt auf Platz 1!</span>
      </div>
      <a href="#radio" class="btn btn-light btn-sm rounded-pill px-3 fw-bold text-dark text-decoration-none">
        Top 6 ansehen ➔
      </a>
    `;

    toastContainer.innerHTML = "";
    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 4000);
  }

  const renderActualContent = () => {
    const masterStations = stationService.getAll();
    if (masterStations.length === 0) return;

    genreButtonsContainer.innerHTML = "";
    const genres = [...new Set(masterStations.map((s) => s.genre ?? "Unbekannt"))].sort();

    const colors = [
      "primary", "success", "info", "warning", "danger", 
      "secondary"
    ];

    genres.forEach((genre, index) => {
      const btn = document.createElement("button");
      const color = colors[index % colors.length];
      btn.className = `btn btn-sm btn-${color} rounded-pill px-4 shadow-sm genre-btn`;
      btn.textContent = genre;
      btn.onclick = () => {
        selectGenre(genre);
      };
      genreButtonsContainer.appendChild(btn);
    });

    function selectGenre(genre) {
      const stationsInGenre = masterStations.filter((s) => (s.genre ?? "Unbekannt") === genre);

      // 1. Aktive Leiste aktualisieren & einblenden
      activeGenreBar.classList.remove("d-none");
      activeGenreBadge.textContent = genre;
      activeStationCount.textContent = `• ${stationsInGenre.length} Sender`;

      // 2. Genre-Buttons einklappen für maximalen Platz
      genreButtonsCard.classList.add("d-none");
      isGenreListCollapsed = true;
      if (toggleGenreButtonsBtn) {
        toggleGenreButtonsBtn.innerHTML = `<i class="bi bi-chevron-down"></i> <span>Genre wechseln</span>`;
      }

      // 3. Sender rendern
      renderStationsByGenre(genre);

      // 4. Sanft zum Ergebnis scrollen
      genreContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function renderStationsByGenre(selectedGenre) {
      genreContainer.innerHTML = "";
      const stationsInGenre = masterStations.filter((s) => (s.genre ?? "Unbekannt") === selectedGenre);
      const userStations = userStationService.getStations();
      const currentPlayingUrl = (radioService.getCurrentStation() || "").trim();

      stationsInGenre.forEach((station) => {
        const url = (station.sender_Url || station.sender_url || station.url || "").trim();
        const name = station.sender_Name || station.sender_name || station.name || "Radio";
        const logo = station.sender_Logo || station.sender_logo || station.logo || "./images/cholo_love.png";
        
        const stationIndex = userStations.findIndex((s) => {
          const sUrl = (s.sender_Url || s.sender_url || s.url || "").trim();
          return sUrl === url;
        });

        const alreadyAdded = stationIndex !== -1;
        const isPlaying = currentPlayingUrl && currentPlayingUrl === url;

        const col = document.createElement("div");
        col.className = "col-6 col-md-4 col-lg-3";
        
        col.innerHTML = `
          <div class="card h-100 bg-dark text-white border-secondary shadow-sm card-glow ${alreadyAdded ? 'border-success border-2' : ''} ${isPlaying ? 'border-primary border-2' : ''}">
              <div class="position-relative overflow-hidden pt-2 text-center">
                <img src="${logo}" class="card-img-top p-2 rounded-circle mx-auto" alt="${name}" style="width: 80px; height: 80px; object-fit: cover;">
                ${isPlaying ? '<div class="playing-overlay"><div class="wave"></div></div>' : ""}
              </div>
              <div class="card-body p-2 text-center d-flex flex-column justify-content-between">
                  <h6 class="card-title small text-truncate mb-2" title="${name}">${name}</h6>
                  <div class="d-grid gap-1 mt-auto">
                    <button class="btn btn-sm ${isPlaying ? 'btn-success fw-bold' : 'btn-primary'} btn-genre-play rounded-pill shadow-sm">
                      <i class="bi ${isPlaying ? 'bi-volume-up-fill' : 'bi-play-fill'}"></i> ${isPlaying ? 'Läuft' : 'Play'}
                    </button>
                    <button class="btn btn-sm ${alreadyAdded ? 'btn-success fw-bold' : 'btn-outline-primary text-white'} btn-genre-add rounded-pill">
                      ${alreadyAdded ? `✓ In Top 6 (Platz ${stationIndex + 1})` : '+ Zu Top 6'}
                    </button>
                  </div>
              </div>
          </div>`;

        const playBtn = col.querySelector(".btn-genre-play");
        const addBtn = col.querySelector(".btn-genre-add");

        playBtn.onclick = (e) => {
          e.stopPropagation();
          radioService.play(station);
          renderStationsByGenre(selectedGenre);
        };

        addBtn.onclick = (e) => {
          e.stopPropagation();
          userStationService.addStation(station, 6);
          showToast(name);
          renderStationsByGenre(selectedGenre);
        };

        genreContainer.appendChild(col);
      });
    }
  };

  if (stationService.isLoaded && stationService.getAll().length > 0) {
    renderActualContent();
  } else {
    stationService.on("loaded", renderActualContent);
    stationService.on("update", renderActualContent);
  }
}
