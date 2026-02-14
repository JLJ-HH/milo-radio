// DEINE page3.js - KOMPLETT mit FIX
import { userStationService } from '../js/services/userStationService.js';
import { stationService } from '../js/services/stationService.js';

export function render(container) {
    // 🔥 NEU: Loading-Screen ZUERST
    container.innerHTML = `
        <div class="text-center p-5">
            <div class="spinner-border text-primary" style="width: 4rem; height: 4rem;" role="status">
                <span class="visually-hidden">Genres werden geladen...</span>
            </div>
            <p class="mt-3 text-muted">Sender laden (einmalig)</p>
        </div>
    `;

    // 🔥 NEU: Prüfen ob stationService bereit ist
    const loadGenresWhenReady = () => {
        if (stationService.isLoaded || stationService.getAll().length > 0) {
            // DEIN ORIGINAL CODE - unverändert!
            renderActualContent();
        } else {
            // Noch nicht geladen? 50ms warten und erneut prüfen
            setTimeout(loadGenresWhenReady, 50);
        }
    };

    // 🔥 DEINEN Original-Code hier rein (alles unverändert)
    const renderActualContent = () => {
        container.innerHTML = `
            <h1>Genres / Sender auswählen</h1>
            <p>Wähle ein Genre, um die Sender zu sehen:</p>
            <p>Drücke Hinzufügen um ein Sender den Radio zu geben:</p>
            <div id="genreButtons" class="mb-3 d-flex gap-2 flex-wrap"></div>
            <div id="genreContainer" class="d-flex flex-wrap gap-3"></div>
        `;

        // DEIN RESTLICHER CODE - 100% UNVERÄNDERT!
        const genreButtonsContainer = container.querySelector('#genreButtons');
        const genreContainer = container.querySelector('#genreContainer');

        const masterStations = stationService.getAll();
        let userStations = userStationService.getStations();

        const genres = [...new Set(masterStations.map(s => s.genre ?? 'Unbekannt'))].sort((a, b) => a.localeCompare(b));

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

            if (stationsInGenre.length === 0) {
                genreContainer.innerHTML = '<p class="text-muted">Keine Sender in diesem Genre verfügbar.</p>';
                return;
            }

            stationsInGenre.forEach(station => {
                const alreadyAdded = userStations.find(s => s.sender_Url === station.sender_Url);

                const card = document.createElement('div');
                card.className = 'card shadow-sm text-center';
                card.style.width = '140px';
                card.style.opacity = alreadyAdded ? '0.6' : '1';

                card.innerHTML = `
                    <img src="${station.sender_Logo ?? 'images/cholo_love.png'}" class="card-img-top rounded-circle mt-2 mx-auto" style="height:80px; width:80px; object-fit:cover;">
                    <div class="card-body p-2">
                        <p class="card-text small mb-1">${station.sender_Name}</p>
                        <button class="btn btn-sm ${alreadyAdded ? 'btn-secondary' : 'btn-success'} w-100" ${alreadyAdded ? 'disabled' : ''}>
                            ${alreadyAdded ? '✓ Hinzugefügt' : '+ Hinzufügen'}
                        </button>
                    </div>
                `;

                const addBtn = card.querySelector('button');
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

    // 🔥 START: Loading prüfen
    loadGenresWhenReady();
}
