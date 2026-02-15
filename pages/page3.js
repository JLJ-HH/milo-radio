import { userStationService } from '../js/services/userStationService.js';
import { stationService } from '../js/services/stationService.js';

export function render(container) {
    container.innerHTML = `
        <div class="text-center p-5">
            <div class="spinner-border text-primary" style="width: 4rem; height: 4rem;" role="status">
                <span class="visually-hidden">Genres werden geladen...</span>
            </div>
            <p class="mt-3 text-muted">Sender laden (einmalig)</p>
        </div>
    `;

    const loadGenresWhenReady = () => {
        if (stationService.isLoaded || stationService.getAll().length > 0) renderActualContent();
        else setTimeout(loadGenresWhenReady, 50);
    };

    const renderActualContent = () => {
        container.innerHTML = `
            <h1>Genres / Sender auswählen</h1>
            <p>Wähle ein Genre, um die Sender zu sehen:</p>
            <p>Drücke Hinzufügen um ein Sender den Radio zu geben:</p>
            <div id="genreButtons" class="mb-3 d-flex gap-2 flex-wrap"></div>
            <div id="genreContainer" class="d-flex flex-wrap gap-3"></div>
        `;

        const genreButtonsContainer = container.querySelector('#genreButtons');
        const genreContainer = container.querySelector('#genreContainer');

        const masterStations = stationService.getAll();
        let userStations = userStationService.getStations();
        const genres = [...new Set(masterStations.map(s => s.genre ?? 'Unbekannt'))].sort();

        genres.forEach(genre => {
            const btn = document.createElement('button');
            btn.className = 'genre-btn btn btn-sm btn-outline-primary';
            btn.textContent = genre;
            btn.onclick = () => renderStationsByGenre(genre);
            genreButtonsContainer.appendChild(btn);
        });

        function renderStationsByGenre(selectedGenre) {
            genreContainer.innerHTML = '';

            const stationsInGenre = masterStations.filter(s => (s.genre ?? 'Unbekannt') === selectedGenre);
            if (!stationsInGenre.length) genreContainer.innerHTML = '<p class="text-muted">Keine Sender in diesem Genre verfügbar.</p>';

            stationsInGenre.forEach(station => {
    const alreadyAdded = userStations.find(s => s.sender_Url === station.sender_Url);

    const card = document.createElement('div');
    card.className = 'card shadow-sm text-center';
    card.style.width = '140px';
    card.style.opacity = alreadyAdded ? '0.6' : '1';

    // 🔹 Dynamischer Image-Fallback für Benutzer-Genres
    const img = document.createElement('img');
    img.className = 'card-img-top rounded-circle mt-2 mx-auto';
    img.style.height = '80px';
    img.style.width = '80px';
    img.style.objectFit = 'cover';
    img.src = station.sender_Logo && station.sender_Logo.trim() !== ""
              ? station.sender_Logo
              : './images/cholo_love.png';
    img.onerror = () => { img.onerror = null; img.src = '../images/cholo_love.png'; };
    card.appendChild(img);

    const body = document.createElement('div');
    body.className = 'card-body p-2';
    body.innerHTML = `
        <p class="card-text small mb-1">${station.sender_Name}</p>
        <button class="btn btn-sm ${alreadyAdded ? 'btn-secondary' : 'btn-success'} w-100" ${alreadyAdded ? 'disabled' : ''}>
            ${alreadyAdded ? '✓ Hinzugefügt' : '+ Hinzufügen'}
        </button>
    `;
    card.appendChild(body);

    const addBtn = body.querySelector('button');
    addBtn.onclick = () => {
        if (!alreadyAdded) {
            userStations.push(station);
            userStationService.setStations(userStations);
            renderStationsByGenre(selectedGenre);
        }
    };

    genreContainer.appendChild(card);
});

        }
    };

    loadGenresWhenReady();
}
