/**
 * SEITE 3: GENRES / SENDER-AUSWAHL (genresPage.js)
 */
import { userStationService } from "../services/userStationService.js";
import { stationService } from "../services/stationServiceV5.js";
import { radioService } from "../services/radioServiceV2.js";

export function render(container) {
  container.innerHTML = `
        <div class="text-white">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
                <div class="d-flex align-items-center gap-3">
                    <i class="bi bi-tags display-5 text-primary"></i>
                    <div>
                        <h2 class="mb-0">Genres & Sender</h2>
                        <p class="text-white-50 small mb-0">Entdecke Sender & wähle deine Top 6 Favoriten.</p>
                    </div>
                </div>
                <a href="#radio" class="btn btn-outline-primary btn-sm rounded-pill px-3 d-flex align-items-center gap-1">
                    <i class="bi bi-play-circle"></i> <span>Zum Player</span>
                </a>
            </div>

            <!-- Feedback Alert -->
            <div id="genreFeedback" class="alert alert-success d-none text-center py-2 mb-3 shadow-sm"></div>
            
            <div id="genreButtons" class="d-flex flex-wrap gap-2 mb-4 bg-dark p-3 rounded shadow-sm"></div>
            <div id="genreContainer" class="row g-3">
                 <div class="col-12 text-center p-5 text-white-50">
                    <p>Wähle ein Genre aus, um Sender zu sehen.</p>
                </div>
            </div>
        </div>
    `;

  const genreButtonsContainer = container.querySelector("#genreButtons");
  const genreContainer = container.querySelector("#genreContainer");
  const genreFeedback = container.querySelector("#genreFeedback");

  function showFeedback(msg) {
    if (!genreFeedback) return;
    genreFeedback.textContent = msg;
    genreFeedback.classList.remove("d-none");
    setTimeout(() => genreFeedback.classList.add("d-none"), 2500);
  }

  const loadGenresWhenReady = () => {
    if (stationService.isLoaded || stationService.getAll().length > 0) {
      renderActualContent();
    } else {
      setTimeout(loadGenresWhenReady, 50);
    }
  };

  const renderActualContent = () => {
    const masterStations = stationService.getAll();
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
        renderStationsByGenre(genre, true);
      };
      genreButtonsContainer.appendChild(btn);
    });

    function renderStationsByGenre(selectedGenre, shouldScroll = false) {
      genreContainer.innerHTML = "";
      const stationsInGenre = masterStations.filter((s) => (s.genre ?? "Unbekannt") === selectedGenre);
      const userStations = userStationService.getStations();
      const currentPlayingUrl = radioService.getCurrentStation();

      stationsInGenre.forEach((station) => {
        const url = station.sender_Url || station.sender_url;
        const name = station.sender_Name || station.sender_name || "Radio";
        const logo = station.sender_Logo || station.sender_logo || "./images/cholo_love.png";
        const stationIndex = userStations.findIndex((s) => (s.sender_Url || s.sender_url) === url);
        const alreadyAdded = stationIndex !== -1;
        const isPlaying = currentPlayingUrl && currentPlayingUrl === url;

        const col = document.createElement("div");
        col.className = "col-6 col-md-4 col-lg-2";
        
        col.innerHTML = `
          <div class="card h-100 bg-dark text-white border-secondary shadow-sm ${alreadyAdded ? 'border-primary' : ''} ${isPlaying ? 'border-success border-2' : ''}">
              <div class="position-relative overflow-hidden pt-2 text-center">
                <img src="${logo}" class="card-img-top p-2 rounded-circle mx-auto" alt="${name}" style="width: 80px; height: 80px; object-fit: cover;">
                ${isPlaying ? '<div class="playing-overlay"><div class="wave"></div></div>' : ""}
              </div>
              <div class="card-body p-2 text-center d-flex flex-column justify-content-between">
                  <h6 class="card-title small text-truncate mb-2" title="${name}">${name}</h6>
                  <div class="d-grid gap-1 mt-auto">
                    <button class="btn btn-sm ${isPlaying ? 'btn-success' : 'btn-outline-primary'} btn-genre-play rounded-pill">
                      <i class="bi ${isPlaying ? 'bi-volume-up-fill' : 'bi-play-fill'}"></i> ${isPlaying ? 'Läuft' : 'Play'}
                    </button>
                    <button class="btn btn-sm ${alreadyAdded ? 'btn-primary' : 'btn-outline-secondary text-white-50'} btn-genre-add rounded-pill">
                      ${alreadyAdded ? `✓ Platz ${stationIndex + 1}` : '+ Zu Top 6'}
                    </button>
                  </div>
              </div>
          </div>`;

        const playBtn = col.querySelector(".btn-genre-play");
        const addBtn = col.querySelector(".btn-genre-add");

        playBtn.onclick = (e) => {
          e.stopPropagation();
          radioService.play(station);
          renderStationsByGenre(selectedGenre, false);
        };

        addBtn.onclick = (e) => {
          e.stopPropagation();
          userStationService.addStation(station, 6);
          showFeedback(`✓ "${name}" an Position 1 der Top 6 gesetzt!`);
          renderStationsByGenre(selectedGenre, false);
        };

        genreContainer.appendChild(col);
      });

      if (shouldScroll) {
        genreContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  loadGenresWhenReady();
}
