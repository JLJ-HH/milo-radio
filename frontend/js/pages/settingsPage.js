/**
 * SEITE 2: ADMIN-VERWALTUNG (settingsPage.js)
 */
import { stationService } from "../services/stationServiceV5.js";
import { isAdmin } from "../main.js";

export function render(container) {
  container.innerHTML = `
        <div class="text-white">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Menü & Einstellungen</h2>
                <button class="btn btn-danger btn-sm rounded-pill px-4 ${isAdmin() ? '' : 'd-none'}" id="logoutBtn">Abmelden</button>
            </div>

            <!-- Quick Navigation Menu -->
            <div class="card bg-dark border-secondary shadow p-3 mb-4">
                <h5 class="card-title text-primary mb-3">Schnellzugriff</h5>
                <div class="row g-2">
                    <div class="col-6">
                        <a href="#radio" class="btn btn-outline-light w-100 py-3 d-flex flex-column align-items-center gap-2">
                            <i class="bi bi-play-circle fs-3"></i>
                            <span>Radio</span>
                        </a>
                    </div>
                    <div class="col-6">
                        <a href="#genres" class="btn btn-outline-light w-100 py-3 d-flex flex-column align-items-center gap-2">
                            <i class="bi bi-tags fs-3"></i>
                            <span>Genres</span>
                        </a>
                    </div>
                    <div class="col-6">
                        <a href="#stats" class="btn btn-outline-light w-100 py-3 d-flex flex-column align-items-center gap-2">
                            <i class="bi bi-graph-up fs-3"></i>
                            <span>Statistiken</span>
                        </a>
                    </div>
                    <div class="col-6">
                        <a href="#settings" class="btn btn-primary w-100 py-3 d-flex flex-column align-items-center gap-2">
                            <i class="bi bi-gear fs-3"></i>
                            <span>Einstellungen</span>
                        </a>
                    </div>
                </div>
            </div>
            
            <div id="adminSection" class="${isAdmin() ? '' : 'd-none'}">
                <div class="card bg-dark border-secondary shadow p-3 mb-4">
                    <h5 class="card-title text-primary mb-3">Sender hinzufügen / bearbeiten</h5>
                    <form id="radioForm" class="row g-2">
                        <div class="col-md-6">
                            <input type="text" id="sender" class="form-control bg-secondary text-white border-0" placeholder="Name des Senders" required>
                        </div>
                        <div class="col-md-6">
                            <input type="url" id="url" class="form-control bg-secondary text-white border-0" placeholder="Stream-URL" required>
                        </div>
                        <div class="col-md-4">
                            <input type="text" id="genre" class="form-control bg-secondary text-white border-0" placeholder="Genre" required>
                        </div>
                        <div class="col-md-4">
                            <input type="url" id="logo" class="form-control bg-secondary text-white border-0" placeholder="Logo-URL">
                        </div>
                        <div class="col-md-4">
                            <input type="url" id="nowPlaying" class="form-control bg-secondary text-white border-0" placeholder="Metadata-URL">
                        </div>
                        
                        <input type="hidden" id="editIndex">
                        
                        <div class="col-12 mt-3">
                            <button type="submit" class="btn btn-primary px-4" id="submitBtn">Speichern</button>
                            <button type="button" class="btn btn-outline-light px-4 ms-2" id="resetBtn">Reset</button>
                        </div>
                    </form>
                </div>

                <div id="genreButtons" class="d-flex flex-wrap gap-2 mb-3"></div>
                <div id="genreContainer" class="row g-3"></div>
            </div>

            <div id="adminLoginPrompt" class="text-center p-5 ${isAdmin() ? 'd-none' : ''}">
                <i class="bi bi-shield-lock display-4 text-warning mb-3"></i>
                <p class="text-white-50">Admin-Funktionen sind passwortgeschützt.</p>
                <button class="btn btn-outline-primary" onclick="location.hash='#settings'; location.reload();">Admin Login</button>
            </div>
        </div>
    `;

  const logoutBtn = container.querySelector("#logoutBtn");
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

  logoutBtn.onclick = () => {
    sessionStorage.removeItem("isAdmin");
    window.location.hash = "radio";
    window.location.reload();
  };

  resetBtn.onclick = () => {
    form.reset();
    editIndexInput.value = "";
    submitBtn.textContent = "Speichern";
  };

  function getGenres() {
    return [
      ...new Set(stationService.getAll().map((s) => s.genre ?? "Unbekannt")),
    ].sort();
  }

  function renderGenreButtons() {
    genreButtons.innerHTML = "";
    getGenres().forEach((g) => {
      const btn = document.createElement("button");
      btn.className = "btn btn-sm btn-outline-info rounded-pill px-3";
      btn.textContent = g;
      btn.onclick = () => renderStations(g);
      genreButtons.appendChild(btn);
    });
  }

  function renderStations(selectedGenre) {
    genreContainer.innerHTML = "";
    const allStations = stationService.getAll();

    const stations = allStations
      .map((s, i) => ({ ...s, _index: i }))
      .filter((s) => (s.genre ?? "Unbekannt") === selectedGenre);

    stations.forEach((station) => {
      const col = document.createElement("div");
      col.className = "col-6 col-md-3 col-lg-2";
      col.innerHTML = `
        <div class="card h-100 bg-dark text-white border-secondary">
            <img src="${station.sender_Logo || './images/cholo_love.png'}" class="card-img-top p-2 rounded-circle mx-auto" style="width: 80px; height: 80px; object-fit: cover;">
            <div class="card-body p-2 text-center">
                <p class="small text-truncate mb-2">${station.sender_Name}</p>
                <div class="d-grid gap-1">
                    <button class="btn btn-xs btn-outline-primary py-0">Edit</button>
                    <button class="btn btn-xs btn-outline-danger py-0">Del</button>
                </div>
            </div>
        </div>`;

      const [editB, deleteB] = col.querySelectorAll("button");

      editB.onclick = () => {
        senderInput.value = station.sender_Name;
        urlInput.value = station.sender_Url;
        genreInput.value = station.genre ?? "";
        logoInput.value = station.sender_Logo ?? "";
        nowPlayingInput.value = station.now_playing_url ?? "";
        editIndexInput.value = station._index;
        submitBtn.textContent = "Aktualisieren";
        form.scrollIntoView({ behavior: "smooth" });
      };

      deleteB.onclick = () => {
        if (confirm(`Löschen?`)) {
          stationService.remove(station._index);
          renderGenreButtons();
          renderStations(selectedGenre);
        }
      };

      genreContainer.appendChild(col);
    });
  }

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
    renderStations(station.genre);
    form.reset();
    editIndexInput.value = "";
    submitBtn.textContent = "Speichern";
  };

  renderGenreButtons();
}
