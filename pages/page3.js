/**
 * SEITE 3: GENRES / SENDER-AUSWAHL (page3.js)
 *
 * Hier sucht sich der Benutzer seine Lieblingssender aus der Master-Liste
 * aus und fügt diese seinem persönlichen Player hinzu.
 */
import { userStationService } from "../js/services/userStationService.js";
import { stationService } from "../js/services/stationService.js";

export function render(container) {
  // --- 1. LADEZUSTAND ANZEIGEN ---
  // Da die Master-Liste asynchron aus einer JSON-Datei kommt, müssen wir kurz warten.
  container.innerHTML = `
        <div class="text-center p-5">
            <div class="spinner-border text-primary" style="width: 4rem; height: 4rem;" role="status">
                <span class="visually-hidden">Genres werden geladen...</span>
            </div>
            <p class="mt-3 text-muted">Senderliste wird geladen...</p>
        </div>
    `;

  /**
   * Wartet asynchron, bis der StationService fertig geladen hat.
   */
  const loadGenresWhenReady = () => {
    if (stationService.isLoaded || stationService.getAll().length > 0) {
      renderActualContent();
    } else {
      // Wenn noch nicht fertig, in 50ms nochmal schauen
      setTimeout(loadGenresWhenReady, 50);
    }
  };

  /**
   * Rendert den eigentlichen Inhalt, sobald die Daten bereit sind.
   */
  const renderActualContent = () => {
    container.innerHTML = `
            <h1>Genres & Sender</h1>
            <p>Wähle ein Genre aus und füge Sender deiner persönlichen Liste hinzu:</p>
            <div id="genreButtons" class="mb-3 d-flex gap-2 flex-wrap"></div>
            <div id="genreContainer" class="d-flex flex-wrap gap-3"></div>
        `;

    const genreButtonsContainer = container.querySelector("#genreButtons");
    const genreContainer = container.querySelector("#genreContainer");

    // Daten aus den Services holen
    const masterStations = stationService.getAll();
    let userStations = userStationService.getStations();

    // Alle verfügbaren Genres sammeln
    const genres = [
      ...new Set(masterStations.map((s) => s.genre ?? "Unbekannt")),
    ].sort();

    // Genre-Buttons erstellen
    genres.forEach((genre) => {
      const btn = document.createElement("button");
      btn.className = "genre-btn btn btn-sm btn-outline-primary";
      btn.textContent = genre;
      btn.onclick = () => renderStationsByGenre(genre);
      genreButtonsContainer.appendChild(btn);
    });

    /**
     * Zeigt alle Sender des gewählten Genres an.
     */
    function renderStationsByGenre(selectedGenre) {
      genreContainer.innerHTML = "";

      const stationsInGenre = masterStations.filter(
        (s) => (s.genre ?? "Unbekannt") === selectedGenre,
      );

      if (!stationsInGenre.length) {
        genreContainer.innerHTML =
          '<p class="text-muted">Keine Sender verfügbar.</p>';
      }

      stationsInGenre.forEach((station) => {
        // Prüfen, ob der Sender bereits in der Liste des Nutzers ist
        const alreadyAdded = userStations.find(
          (s) => s.sender_Url === station.sender_Url,
        );

        const card = document.createElement("div");
        card.className = "card shadow-sm text-center";
        card.style.width = "140px";
        // Ausgegraut, wenn bereits hinzugefügt
        card.style.opacity = alreadyAdded ? "0.6" : "1";

        // Logo-Vorschau
        const img = document.createElement("img");
        img.className = "card-img-top rounded-circle mt-2 mx-auto";
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
                    <button class="btn btn-sm ${alreadyAdded ? "btn-secondary" : "btn-success"} w-100" ${alreadyAdded ? "disabled" : ""}>
                        ${alreadyAdded ? "✓ Hinzugefügt" : "+ Hinzufügen"}
                    </button>
                `;
        card.appendChild(body);

        // Button-Klick: Sender zur Liste hinzufügen
        const addBtn = body.querySelector("button");
        addBtn.onclick = () => {
          if (!alreadyAdded) {
            userStations.push(station);
            // Liste im Service (und LocalStorage) aktualisieren
            userStationService.setStations(userStations);
            // Ansicht aktualisieren
            renderStationsByGenre(selectedGenre);
          }
        };

        genreContainer.appendChild(card);
      });
    }
  };

  // Startet das Warten auf die Daten
  loadGenresWhenReady();
}
