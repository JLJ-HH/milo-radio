import { radioService } from "../js/services/radioService.js";
import { userStationService } from "../js/services/userStationService.js";

export function render(container) {
    //  KOMPLETTE HTML – Logo + ALLE Elemente
    container.innerHTML = `
    <!-- 🔥 HEADER: LOGO + TITLE nebeneinander -->
    <div class="row align-items-center mb-4">
        <!-- LOGO (immer sichtbar, rechts auf Mobil) -->
        <div class="col-4 col-md-2 text-end pe-0">
            <img src="./images/milo.jpg" id="mobileLogo" class="logo-clickable" alt="Milo Radio">
        </div>
        
        <!-- TITEL (linke Seite) -->
        <div class="col-8 col-md-10 ps-3">
            <h1 class="mb-1 d-none d-md-block">Radio Player</h1>
            <h2 class="mb-0 d-md-none" style="color: var(--primary);">Radio Player</h2>
            <p id="stationTitle" class="mb-0">Keine Sender ausgewählt</p>
        </div>
    </div>

    <!-- Radio Controls -->
    <div id="radioControls" class="mb-4">
        <button id="playBtn" class="btn btn-primary me-2" disabled>Play</button>
        <button id="stopBtn" class="btn btn-secondary me-2" disabled>Stop</button>
        <input type="range" id="volumeSlider" min="0" max="1" step="0.01" class="form-range">
    </div>

    <!-- Feedback -->
    <div id="feedback" class="hidden mb-3"></div>

    <!-- Stations Container -->
    <div id="stationsContainer"></div>
`;




    //  Logo-Effekt
    const mobileLogo = container.querySelector('#mobileLogo');
    if (mobileLogo) {
        mobileLogo.style.height = '120px';  // GRÖßER!
        mobileLogo.addEventListener('click', function() {
            this.style.transform = 'scale(1.1)';
            setTimeout(() => this.style.transform = '', 300);
        });
    }

    //  SAFE DOM-Selektion
    const stationTitle = container.querySelector("#stationTitle") || container.querySelector("p");
    const playBtn = container.querySelector("#playBtn");
    const stopBtn = container.querySelector("#stopBtn");
    const volumeSlider = container.querySelector("#volumeSlider");
    const stationsContainer = container.querySelector("#stationsContainer");
    const feedback = container.querySelector("#feedback");

    //  State
    let activeStations = userStationService.getStations();
    let currentStation = null;  // Fix: null statt URL
    let lastPlayedStation = null;

    //  Lautstärke
    const savedVolume = localStorage.getItem("radioVolume") ?? 0.3;
    volumeSlider.value = savedVolume;
    radioService.setVolume(savedVolume);

    //  Feedback-Funktion
    function showFeedback(msg, color = "green") {
        feedback.textContent = msg;
        feedback.style.color = color;
        feedback.classList.remove("hidden");
        setTimeout(() => feedback.classList.add("hidden"), 2000);
    }

    //  Update Status (BEIDE Titel!)
    function updateStatus() {
        const titleText = currentStation ? 
            `Du hörst: ${currentStation.sender_Name}` :
            lastPlayedStation ? 
            `Zuletzt gehört: ${lastPlayedStation.sender_Name}` :
            activeStations.length === 0 ? 
            "Keine Sender ausgewählt" : "Gestoppt";

        if (stationTitle) stationTitle.textContent = titleText;
        

        playBtn.disabled = activeStations.length === 0 || !!currentStation;
        stopBtn.disabled = !currentStation;
    }

    //  Render Cards (DEIN Code unverändert)
    function renderRadioCards() {
        stationsContainer.innerHTML = "";
        if (activeStations.length === 0) {
            stationsContainer.innerHTML = '<p class="text-muted">Keine Sender ausgewählt. Gehe zu „Genres" um welche hinzuzufügen.</p>';
            updateStatus();
            return;
        }

        activeStations.forEach((station) => {
            const card = document.createElement("div");
            card.className = "card text-center";
            if (currentStation && currentStation.sender_Url === station.sender_Url) {
                card.classList.add("active");
            }

            card.innerHTML = `
                <img src="${station.sender_Logo ?? "images/cholo_love.png"}" class="card-img-top mx-auto mt-2">
                <div class="card-body p-2">
                    <p class="card-text small mb-1">${station.sender_Name}</p>
                    <button class="btn btn-sm btn-primary w-100 mb-1">Play</button>
                    <button class="btn btn-sm btn-danger w-100">Entfernen</button>
                </div>
            `;

            const playBtnCard = card.querySelector("button:nth-of-type(1)");
            const removeBtnCard = card.querySelector("button:nth-of-type(2)");

            playBtnCard.onclick = () => {
                currentStation = station;
                lastPlayedStation = station;
                radioService.play(station.sender_Url);
                updateStatus();
                renderRadioCards();
            };

            removeBtnCard.onclick = () => {
                if (confirm(`"${station.sender_Name}" aus deiner Liste entfernen?`)) {
                    activeStations = activeStations.filter(s => s.sender_Url !== station.sender_Url);
                    userStationService.setStations(activeStations);
                    if (currentStation && currentStation.sender_Url === station.sender_Url) {
                        radioService.stop();
                        currentStation = null;
                    }
                    showFeedback(`Sender "${station.sender_Name}" entfernt`, "red");
                    renderRadioCards();
                }
            };

            stationsContainer.appendChild(card);
        });
        updateStatus();
    }

    //  Event Listeners (DEIN Code unverändert)
    volumeSlider.addEventListener("input", () => {
        radioService.setVolume(volumeSlider.value);
        localStorage.setItem("radioVolume", volumeSlider.value);
    });

    stopBtn.addEventListener("click", () => {
        radioService.stop();
        currentStation = null;
        renderRadioCards();
    });

    playBtn.addEventListener("click", () => {
        if (!currentStation && lastPlayedStation) {
            currentStation = lastPlayedStation;
        }
        if (currentStation) {
            radioService.play(currentStation.sender_Url);
            lastPlayedStation = currentStation;
            updateStatus();
            renderRadioCards();
        }
    });

    userStationService.on("update", (newList) => {
        activeStations = newList;
        renderRadioCards();
        showFeedback("Liste aktualisiert");
    });

    //  Initial Render
    renderRadioCards();
}
