import { stationService } from '../js/services/stationService.js';

export function render(container) {
    container.innerHTML = `
        <div class="container mt-4">
            <h1 class="mb-3">Radio Sender Verwaltung (Admin)</h1>
            <button class="btn btn-outline-danger mb-4" id="logoutBtn">Admin abmelden</button>
            <form id="radioForm" class="mb-4">
                <input type="text" id="sender" class="form-control mb-2" placeholder="Radio Sender" required>
                <input type="url" id="url" class="form-control mb-2" placeholder="Radio URL" required>
                <input type="text" id="genre" class="form-control mb-2" placeholder="Genre" required>
                <input type="url" id="logo" class="form-control mb-2" placeholder="Logo URL (optional)">
                <input type="hidden" id="editIndex">
                <button type="submit" class="btn btn-primary me-2" id="submitBtn">Hinzufügen</button>
                <button type="button" class="btn btn-secondary" id="resetBtn">Reset</button>
            </form>
            <div id="genreButtons" class="d-flex flex-wrap gap-2 mb-3"></div>
            <div id="genreContainer" class="d-flex flex-wrap gap-3"></div>
        </div>
    `;

    const logoutBtn = container.querySelector('#logoutBtn');
    const form = container.querySelector('#radioForm');
    const senderInput = container.querySelector('#sender');
    const urlInput = container.querySelector('#url');
    const genreInput = container.querySelector('#genre');
    const logoInput = container.querySelector('#logo');
    const editIndexInput = container.querySelector('#editIndex');
    const submitBtn = container.querySelector('#submitBtn');
    const resetBtn = container.querySelector('#resetBtn');
    const genreButtons = container.querySelector('#genreButtons');
    const genreContainer = container.querySelector('#genreContainer');

    logoutBtn.onclick = () => {
        sessionStorage.removeItem('isAdmin');
        location.reload();
    };

    resetBtn.onclick = () => {
        form.reset();
        editIndexInput.value = '';
        submitBtn.textContent = 'Hinzufügen';
    };

    function getGenres() {
        return [...new Set(stationService.getAll().map(s => s.genre ?? 'Unbekannt'))].sort();
    }

    function renderGenreButtons() {
        genreButtons.innerHTML = '';
        getGenres().forEach(g => {
            const btn = document.createElement('button');
            btn.className = 'genre-btn btn btn-sm';
            btn.textContent = g;
            btn.onclick = () => renderStations(g);
            genreButtons.appendChild(btn);
        });
    }

    function renderStations(selectedGenre) {
        genreContainer.innerHTML = '';
        const allStations = stationService.getAll();
        const stations = allStations
            .map((s, i) => ({ ...s, _index: i }))
            .filter(s => (s.genre ?? 'Unbekannt') === selectedGenre);

        if (!stations.length) {
            genreContainer.innerHTML = '<p class="text-muted">Keine Sender.</p>';
            return;
        }

        stations.forEach(station => {
    const card = document.createElement('div');
    card.className = 'card text-center';
    card.style.width = '150px';

    // 🔹 Dynamischer Image-Fallback für Admin
    const img = document.createElement('img');
    img.className = 'card-img-top rounded-circle mx-auto mt-2';
    img.style.width = '80px';
    img.style.height = '80px';
    img.style.objectFit = 'cover';
    img.src = station.sender_Logo && station.sender_Logo.trim() !== ""
              ? station.sender_Logo
              : './images/cholo_love.png';
    img.onerror = () => { img.onerror = null; img.src = '/images/cholo_love.png'; };
    card.appendChild(img);

    const body = document.createElement('div');
    body.className = 'card-body p-2';
    body.innerHTML = `
        <p class="card-text small mb-2">${station.sender_Name}</p>
        <button class="btn btn-sm btn-primary w-100 mb-1">Bearbeiten</button>
        <button class="btn btn-sm btn-danger w-100">Löschen</button>
    `;
    card.appendChild(body);

    const [editBtn, deleteBtn] = body.querySelectorAll('button');

    // EDIT
    editBtn.onclick = () => {
        senderInput.value = station.sender_Name;
        urlInput.value = station.sender_Url;
        genreInput.value = station.genre ?? '';
        logoInput.value = station.sender_Logo ?? '';
        editIndexInput.value = station._index;
        submitBtn.textContent = 'Aktualisieren';
    };

    // DELETE
    deleteBtn.onclick = () => {
        if (confirm(`"${station.sender_Name}" wirklich löschen?`)) {
            stationService.remove(station._index);
            renderGenreButtons();
            renderStations(selectedGenre);
            resetForm();
        }
    };

    genreContainer.appendChild(card);
});

    }

    form.onsubmit = (e) => {
        e.preventDefault();
        const station = {
            sender_Name: senderInput.value.trim(),
            sender_Url: urlInput.value.trim(),
            genre: genreInput.value.trim(),
            sender_Logo: logoInput.value.trim() || null
        };
        const editIndex = editIndexInput.value;

        if (editIndex !== '') stationService.update(Number(editIndex), station);
        else stationService.add(station);

        renderGenreButtons();
        renderStations(station.genre);
        form.reset();
        submitBtn.textContent = 'Hinzufügen';
    };

    renderGenreButtons();
}
