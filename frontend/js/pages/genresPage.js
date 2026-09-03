/**
 * SEITE 3: GENRES / SENDER-AUSWAHL (genresPage.js)
 */
import { userStationService } from "../services/userStationService.js";
import { stationService } from "../services/stationServiceV5.js";

export function render(container) {
  container.innerHTML = `
        <div class="text-white">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
                <div class="d-flex align-items-center gap-3">
                    <i class="bi bi-tags display-5 text-primary"></i>
                    <div>
                        <h2 class="mb-0">Genres & Sender</h2>
                        <p class="text-white-50 small mb-0">Wähle deine Top 6 Sender (neue Sender erscheinen automatisch ganz oben).</p>
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
    let userStations = userStationService.getStations();
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
        renderStationsByGenre(genre);
        genreContainer.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      genreButtonsContainer.appendChild(btn);
    });

    function renderStationsByGenre(selectedGenre) {
      genreContainer.innerHTML = "";
      const stationsInGenre = masterStations.filter((s) => (s.genre ?? "Unbekannt") === selectedGenre);
      userStations = userStationService.getStations();

      stationsInGenre.forEach((station) => {
        const stationIndex = userStations.findIndex((s) => s.sender_Url === station.sender_Url);
        const alreadyAdded = stationIndex !== -1;
        const col = document.createElement("div");
        col.className = "col-6 col-md-3 col-lg-2";
        
        col.innerHTML = `
          <div class="card h-100 bg-dark text-white border-secondary shadow-sm ${alreadyAdded ? 'border-success' : ''}">
              <img src="${station.sender_Logo || './images/cholo_love.png'}" class="card-img-top p-2 rounded-circle mx-auto" style="width: 80px; height: 80px; object-fit: cover;">
              <div class="card-body p-2 text-center">
                  <h6 class="card-title small text-truncate mb-2">${station.sender_Name}</h6>
                  <button class="btn btn-sm ${alreadyAdded ? 'btn-outline-success' : 'btn-success'} w-100 rounded-pill">
                      ${alreadyAdded ? `✓ Platz ${stationIndex + 1}` : '+ Hinzufügen'}
                  </button>
              </div>
          </div>`;

        const addBtn = col.querySelector("button");
        addBtn.onclick = () => {
          userStationService.addStation(station, 6);
          showFeedback(`✓ "${station.sender_Name}" an Position 1 gesetzt (Top 6 aktiv)`);
          renderStationsByGenre(selectedGenre);
        };
        genreContainer.appendChild(col);
      });

      genreContainer.scrollIntoView({ behavior: 'smooth' });
    }
  };

  loadGenresWhenReady();
}
