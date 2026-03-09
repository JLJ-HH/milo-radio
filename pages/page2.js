/**
 * SEITE 2: ADMIN-VERWALTUNG (page2.js)
 *
 * Hier kann der Administrator neue Radiosender hinzufügen,
 * bestehende bearbeiten oder diese komplett löschen.
 */
import { stationService } from "../js/services/stationService.js";

export function render(container) {
  // --- 1. HTML-LAYOUT (ADMIN-OBERFLÄCHE) ---
  container.innerHTML = `
        <div class="container mt-4">
            <h1 class="mb-3">Radio Sender Verwaltung (Admin)</h1>
            <button class="btn btn-outline-danger mb-4" id="logoutBtn">Admin abmelden</button>
            
            <form id="radioForm" class="mb-4">
                <input type="text" id="sender" class="form-control mb-2" placeholder="Name des Senders" required>
                <input type="url" id="url" class="form-control mb-2" placeholder="Stream-URL (http://...)" required>
                <input type="text" id="genre" class="form-control mb-2" placeholder="Genre (z.B. Rock, Pop)" required>
                <input type="url" id="logo" class="form-control mb-2" placeholder="Logo-URL (optional)">
                <input type="url" id="nowPlaying" class="form-control mb-2" placeholder="Now Playing URL (optional)">
                
                <!-- Verstecktes Feld, um zu wissen, welcher Sender gerade bearbeitet wird -->
                <input type="hidden" id="editIndex">
                
                <button type="submit" class="btn btn-primary me-2" id="submitBtn">Hinzufügen</button>
                <button type="button" class="btn btn-secondary" id="resetBtn">Abbrechen / Reset</button>
            </form>

            <div id="genreButtons" class="d-flex flex-wrap gap-2 mb-3"></div>
            <div id="genreContainer" class="d-flex flex-wrap gap-3"></div>
        </div>
    `;

  // --- 2. ELEMENTE REFERENZIEREN ---
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

  // --- 3. EVENT-HANDLING (INTERAKTION) ---

  // Admin Logout
  logoutBtn.onclick = () => {
    sessionStorage.removeItem("isAdmin");
    location.reload(); // Seite neu laden, um Login-Prompt zu triggern
  };

  // Formular zurücksetzen
  resetBtn.onclick = () => {
    form.reset();
    editIndexInput.value = "";
    submitBtn.textContent = "Hinzufügen";
  };

  // --- 4. FUNKTIONEN (RENDER-LOGIK) ---

  /**
   * Ermittelt alle eindeutigen Genres aus der Senderliste.
   */
  function getGenres() {
    return [
      ...new Set(stationService.getAll().map((s) => s.genre ?? "Unbekannt")),
    ].sort();
  }

  /**
   * Erstellt die Buttons für die Genre-Filterung.
   */
  function renderGenreButtons() {
    genreButtons.innerHTML = "";
    getGenres().forEach((g) => {
      const btn = document.createElement("button");
      btn.className = "genre-btn btn btn-sm";
      btn.textContent = g;
      btn.onclick = () => renderStations(g);
      genreButtons.appendChild(btn);
    });
  }

  /**
   * Zeigt alle Sender eines bestimmten Genres zur Bearbeitung an.
   * @param {string} selectedGenre Das gewählte Genre
   */
  function renderStations(selectedGenre) {
    genreContainer.innerHTML = "";
    const allStations = stationService.getAll();

    // Sender filtern und ihren ursprünglichen Index merken
    const stations = allStations
      .map((s, i) => ({ ...s, _index: i }))
      .filter((s) => (s.genre ?? "Unbekannt") === selectedGenre);

    if (!stations.length) {
      genreContainer.innerHTML =
        '<p class="text-muted">In diesem Genre sind noch keine Sender vorhanden.</p>';
      return;
    }

    stations.forEach((station) => {
      const card = document.createElement("div");
      card.className = "card text-center";
      card.style.width = "150px";

      // Vorschau-Bild
      const img = document.createElement("img");
      img.className = "card-img-top rounded-circle mx-auto mt-2";
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
                <p class="card-text small mb-2">${station.sender_Name}</p>
                <button class="btn btn-sm btn-primary w-100 mb-1">Bearbeiten</button>
                <button class="btn btn-sm btn-danger w-100">Löschen</button>
            `;
      card.appendChild(body);

      const [editBtn, deleteBtn] = body.querySelectorAll("button");

      // --- BEAREITEN-MODUS ---
      editBtn.onclick = () => {
        senderInput.value = station.sender_Name;
        urlInput.value = station.sender_Url;
        genreInput.value = station.genre ?? "";
        logoInput.value = station.sender_Logo ?? "";
        nowPlayingInput.value = station.now_playing_url ?? "";
        editIndexInput.value = station._index; // Index speichern für späteres Update
        submitBtn.textContent = "Aktualisieren";
        // Zum Formular scrollen
        form.scrollIntoView({ behavior: "smooth" });
      };

      // --- LÖSCHEN ---
      deleteBtn.onclick = () => {
        if (
          confirm(
            `"${station.sender_Name}" wirklich aus der Master-Liste löschen?`,
          )
        ) {
          stationService.remove(station._index);
          renderGenreButtons();
          renderStations(selectedGenre);
          form.reset();
          editIndexInput.value = "";
          submitBtn.textContent = "Hinzufügen";
        }
      };

      genreContainer.appendChild(card);
    });
  }

  // --- 5. FORMULAR ABSENDEN (SPEICHERN) ---
  form.onsubmit = (e) => {
    e.preventDefault();

    // Daten aus den Eingabefeldern sammeln
    const station = {
      sender_Name: senderInput.value.trim(),
      sender_Url: urlInput.value.trim(),
      genre: genreInput.value.trim(),
      sender_Logo: logoInput.value.trim() || null,
      now_playing_url: nowPlayingInput.value.trim() || null,
    };

    const editIndex = editIndexInput.value;

    if (editIndex !== "") {
      // Update an bestehendem Sender
      stationService.update(Number(editIndex), station);
    } else {
      // Neuer Sender
      stationService.add(station);
    }

    // UI aktualisieren
    renderGenreButtons();
    renderStations(station.genre);
    form.reset();
    editIndexInput.value = "";
    submitBtn.textContent = "Hinzufügen";
  };

  // Beim ersten Laden Genres anzeigen
  renderGenreButtons();
}
