/**
 * SEITE 3: GENRES / SENDER-AUSWAHL (genresPage.js)
 */
import { userStationService } from "../services/userStationService.js";
import { stationService } from "../services/stationServiceV5.js";

export function render(container) {
  container.innerHTML = `
        <div class="text-white">
            <div class="d-flex align-items-center gap-3 mb-4">
                <i class="bi bi-tags display-5 text-primary"></i>
                <div>
                    <h2 class="mb-0">Genres & Sender</h2>
                    <p class="text-white-50 small mb-0">Entdecke neue Radiosender für deine Liste.</p>
                </div>
            </div>
            
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
        // Smooth scroll to the results container
        genreContainer.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      genreButtonsContainer.appendChild(btn);
    });

    function renderStationsByGenre(selectedGenre) {
      genreContainer.innerHTML = "";
      const stationsInGenre = masterStations.filter((s) => (s.genre ?? "Unbekannt") === selectedGenre);

      stationsInGenre.forEach((station) => {
        const alreadyAdded = userStations.find((s) => s.sender_Url === station.sender_Url);
        const col = document.createElement("div");
        col.className = "col-6 col-md-3 col-lg-2";
        
        col.innerHTML = `
          <div class="card h-100 bg-dark text-white border-secondary shadow-sm ${alreadyAdded ? 'opacity-50' : ''}">
              <img src="${station.sender_Logo || './images/cholo_love.png'}" class="card-img-top p-2 rounded-circle mx-auto" style="width: 80px; height: 80px; object-fit: cover;">
              <div class="card-body p-2 text-center">
                  <h6 class="card-title small text-truncate mb-2">${station.sender_Name}</h6>
                  <button class="btn btn-sm ${alreadyAdded ? 'btn-outline-success disabled' : 'btn-success'} w-100 rounded-pill">
                      ${alreadyAdded ? '✓' : '+'}
                  </button>
              </div>
          </div>`;

        const addBtn = col.querySelector("button");
        addBtn.onclick = () => {
          if (!alreadyAdded) {
            userStations.push(station);
            userStationService.setStations(userStations);
            renderStationsByGenre(selectedGenre);
          }
        };
        genreContainer.appendChild(col);
      });

      // Auto-Scroll: Scroll to results
      genreContainer.scrollIntoView({ behavior: 'smooth' });
    }
  };

  loadGenresWhenReady();
}
