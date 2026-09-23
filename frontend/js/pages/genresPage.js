/**
 * SEITE 3: GENRES / SENDER-AUSWAHL (genresPage.js)
 * Mit flexibel ein-/ausklappbarer Genre-Leiste & dauerhaft sichtbarem Footer
 */
import { userStationService } from "../services/userStationService.js";
import { stationService } from "../services/stationServiceV5.js";
import { radioService } from "../services/radioServiceV2.js";
import { podcastService } from "../services/podcastService.js";

export function render(container) {
  container.innerHTML = `
        <div class="text-white pb-4">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
                <div class="d-flex align-items-center gap-3">
                    <i class="bi bi-tags display-5 text-primary"></i>
                    <div>
                        <h2 class="mb-0">Genres & Sender</h2>
                        <p class="text-white-50 small mb-0">Entdecke Sender & wähle deine Top 6 Favoriten.</p>
                    </div>
                </div>
                <a href="#radio" class="btn btn-outline-primary btn-sm rounded-pill px-3 d-flex align-items-center gap-1">
                    <i class="bi bi-play-circle"></i> <span>Zu deinen Top 6</span>
                </a>
            </div>

            <!-- Floating Toast Notification Container -->
            <div id="toastContainer" class="position-fixed bottom-0 start-50 translate-middle-x p-3" style="z-index: 1060; margin-bottom: 90px; pointer-events: none;"></div>
            
            <!-- Aktives Genre Header (erscheint wenn ein Genre gewählt ist) -->
            <div id="activeGenreBar" class="d-none bg-dark border border-secondary p-3 rounded-4 mb-3 shadow-sm d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div class="d-flex align-items-center gap-2">
                    <span class="text-white-50 small">Aktives Genre:</span>
                    <span id="activeGenreBadge" class="badge rounded-pill bg-primary px-3 py-2 fs-6"></span>
                    <span id="activeStationCount" class="text-white-50 small ms-1"></span>
                </div>
                <button id="toggleGenreButtonsBtn" class="btn btn-outline-light btn-sm rounded-pill px-3 d-flex align-items-center gap-1">
                    <i class="bi bi-chevron-down" id="toggleGenreIcon"></i> <span>Genre wechseln</span>
                </button>
            </div>

            <!-- Einklappbare Genre-Button-Auswahl mit eigenem Schließen-Button -->
            <div id="genreButtonsCard" class="card bg-dark border-secondary p-3 rounded-4 mb-4 shadow-sm">
                <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                    <span class="text-white-50 small fw-bold text-uppercase" style="letter-spacing: 0.5px;">Wähle eine Musikrichtung:</span>
                    <button id="cardCollapseBtn" class="btn btn-outline-secondary btn-sm rounded-pill px-3 py-1 text-white-50 small" style="font-size: 0.78rem;">
                        <i class="bi bi-chevron-up" id="cardCollapseIcon"></i> <span id="cardCollapseText">Einklappen</span>
                    </button>
                </div>
                <div id="genreButtons" class="d-flex flex-wrap gap-2">
                    <div class="text-white-50 small py-2">Genres werden geladen...</div>
                </div>
            </div>

            <!-- Sender-Ergebnisbereich -->
            <div id="genreContainer" class="row g-3">
                 <div class="col-12 text-center p-5 text-white-50">
                    <i class="bi bi-music-note-beamed display-3 text-primary opacity-50 mb-3 d-block"></i>
                    <p class="fs-5">Wähle oben ein Genre aus, um Sender zu entdecken.</p>
                </div>
            </div>
        </div>
    `;

  const genreButtonsContainer = container.querySelector("#genreButtons");
  const genreButtonsCard = container.querySelector("#genreButtonsCard");
  const genreContainer = container.querySelector("#genreContainer");
  const toastContainer = container.querySelector("#toastContainer");
  const activeGenreBar = container.querySelector("#activeGenreBar");
  const activeGenreBadge = container.querySelector("#activeGenreBadge");
  const activeStationCount = container.querySelector("#activeStationCount");
  const toggleGenreButtonsBtn = container.querySelector("#toggleGenreButtonsBtn");
  const cardCollapseBtn = container.querySelector("#cardCollapseBtn");
  const cardCollapseIcon = container.querySelector("#cardCollapseIcon");
  const cardCollapseText = container.querySelector("#cardCollapseText");

  let isButtonsBodyCollapsed = false;

  // Einklappen/Ausklappen direkt in der Genre-Box
  if (cardCollapseBtn) {
    cardCollapseBtn.onclick = () => {
      isButtonsBodyCollapsed = !isButtonsBodyCollapsed;
      if (isButtonsBodyCollapsed) {
        genreButtonsContainer.classList.add("d-none");
        cardCollapseIcon.className = "bi bi-chevron-down";
        cardCollapseText.textContent = "Ausklappen";
      } else {
        genreButtonsContainer.classList.remove("d-none");
        cardCollapseIcon.className = "bi bi-chevron-up";
        cardCollapseText.textContent = "Einklappen";
      }
    };
  }

  // Umschalten über die aktive Genre-Leiste
  if (toggleGenreButtonsBtn) {
    toggleGenreButtonsBtn.onclick = () => {
      genreButtonsCard.classList.remove("d-none");
      genreButtonsContainer.classList.remove("d-none");
      isButtonsBodyCollapsed = false;
      cardCollapseIcon.className = "bi bi-chevron-up";
      cardCollapseText.textContent = "Einklappen";
      activeGenreBar.classList.add("d-none");
      genreContainer.innerHTML = "";
      genreButtonsCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    };
  }

  function showToast(stationName) {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = "alert alert-success d-flex align-items-center justify-content-between gap-3 shadow-lg border-0 rounded-pill px-4 py-2";
    toast.style.pointerEvents = "auto";
    toast.style.background = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
    toast.style.color = "#ffffff";
    toast.style.boxShadow = "0 10px 25px rgba(16, 185, 129, 0.4)";
    
    toast.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-check-circle-fill fs-5"></i>
        <span><strong>"${stationName}"</strong> ist jetzt auf Platz 1!</span>
      </div>
      <a href="#radio" class="btn btn-light btn-sm rounded-pill px-3 fw-bold text-dark text-decoration-none d-inline-flex align-items-center gap-1">
        <span>Top 6 ansehen</span> <i class="bi bi-arrow-right"></i>
      </a>
    `;

    toastContainer.innerHTML = "";
    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
    }, 4000);
  }

  const renderActualContent = () => {
    const masterStations = stationService.getAll();
    if (!Array.isArray(masterStations) || masterStations.length === 0) return;

    genreButtonsContainer.innerHTML = "";
    
    // Alle Podcast-Varianten zu "Podcast" zusammenfassen
    const rawGenres = masterStations.map((s) => {
      const g = (s.genre ?? "Unbekannt").trim();
      if (podcastService.isPodcast(s) || g.toLowerCase() === "podcast" || g.toLowerCase().startsWith("podcast:") || g.toLowerCase().startsWith("podcast -")) {
        return "Podcast";
      }
      return g;
    });

    const genres = [...new Set(rawGenres)].sort((a, b) => {
      if (a === "Podcast") return 1;
      if (b === "Podcast") return -1;
      return a.localeCompare(b);
    });

    const colors = [
      "primary", "success", "info", "warning", "danger", 
      "secondary"
    ];

    genres.forEach((genre, index) => {
      const btn = document.createElement("button");
      const isPodcast = genre === "Podcast";
      const color = isPodcast ? "info" : colors[index % colors.length];
      btn.className = `btn btn-sm btn-${color} rounded-pill px-4 shadow-sm genre-btn d-inline-flex align-items-center gap-1`;
      btn.innerHTML = isPodcast ? `<i class="bi bi-mic-fill"></i> <span>Podcasts</span>` : `<span>${genre}</span>`;
      btn.onclick = () => {
        selectGenre(genre);
      };
      genreButtonsContainer.appendChild(btn);
    });

    function matchesPodcastCategory(station, category) {
      if (!category || category === "Alle") return true;
      const rawCat = podcastService.getPodcastCategory(station).toLowerCase();
      const c = category.toLowerCase();
      
      if (c.includes("politik")) {
        return rawCat.includes("politik") || rawCat.includes("geschichte") || rawCat.includes("society");
      }
      if (c.includes("finanz")) {
        return rawCat.includes("finanz") || rawCat.includes("invest") || rawCat.includes("wirtschaft") || rawCat.includes("money") || rawCat.includes("business");
      }
      if (c.includes("technik")) {
        return rawCat.includes("technik") || rawCat.includes("tech") || rawCat.includes("computer") || rawCat.includes("wissen") || rawCat.includes("science");
      }
      if (c.includes("musik")) {
        return rawCat.includes("musik") || rawCat.includes("music") || rawCat.includes("audio") || rawCat.includes("sound");
      }
      return rawCat === c;
    }

    function selectGenre(genre) {
      const isPodcastGenre = genre === "Podcast";
      const stationsInGenre = masterStations.filter((s) => {
        if (isPodcastGenre) {
          return podcastService.isPodcast(s) || (s.genre ?? "").toLowerCase().startsWith("podcast");
        }
        return (s.genre ?? "Unbekannt") === genre;
      });

      activeGenreBar.classList.remove("d-none");
      activeGenreBadge.textContent = genre;
      activeStationCount.textContent = `• ${stationsInGenre.length} ${isPodcastGenre ? "Podcasts" : "Sender"}`;

      // Nach Auswahl die große Button-Box einklappen
      genreButtonsCard.classList.add("d-none");

      renderStationsByGenre(genre, "Alle");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function renderStationsByGenre(selectedGenre, selectedCategory = "Alle") {
      genreContainer.innerHTML = "";
      const isPodcastView = selectedGenre === "Podcast";
      
      const allStationsInGenre = masterStations.filter((s) => {
        if (isPodcastView) {
          return podcastService.isPodcast(s) || (s.genre ?? "").toLowerCase().startsWith("podcast");
        }
        return (s.genre ?? "Unbekannt") === selectedGenre;
      });

      // Bei Podcasts die interaktive Sub-Filterleiste oben rendern
      if (isPodcastView) {
        const categories = [
          { id: "Alle", name: "Alle", icon: "bi-collection" },
          { id: "Politik & Geschichte", name: "Politik & Geschichte", icon: "bi-bank" },
          { id: "Finanzen", name: "Finanzen", icon: "bi-graph-up-arrow" },
          { id: "Technik", name: "Technik", icon: "bi-cpu" },
          { id: "Musik", name: "Musik", icon: "bi-music-note-beamed" }
        ];

        // Zähler für jede Kategorie berechnen
        categories.forEach((cat) => {
          cat.count = allStationsInGenre.filter((s) => matchesPodcastCategory(s, cat.id)).length;
        });

        const filterBarCol = document.createElement("div");
        filterBarCol.className = "col-12 mb-3";
        filterBarCol.innerHTML = `
          <div class="card bg-dark border-secondary p-3 rounded-4 shadow-sm">
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
              <span class="text-white-50 small fw-bold text-uppercase" style="letter-spacing: 0.5px;">
                <i class="bi bi-funnel me-1 text-info"></i> Podcast-Rubriken:
              </span>
              <span class="text-white-50 small">
                Aktive Rubrik: <strong class="text-white">${selectedCategory}</strong>
              </span>
            </div>
            <div class="d-flex flex-wrap gap-2" id="podcastSubFilterPills">
              ${categories.map((cat) => {
                const isActive = cat.id === selectedCategory;
                return `
                  <button type="button" class="btn btn-sm ${isActive ? 'btn-info fw-bold' : 'btn-outline-secondary text-white-50'} rounded-pill px-3 py-1 d-flex align-items-center gap-1 shadow-sm podcast-subfilter-btn" data-cat="${cat.id}">
                    <i class="bi ${cat.icon}"></i>
                    <span>${cat.name}</span>
                    <span class="badge ${isActive ? 'bg-dark text-info' : 'bg-secondary text-white-50'} rounded-pill ms-1" style="font-size: 0.7rem;">${cat.count}</span>
                  </button>
                `;
              }).join("")}
            </div>
          </div>
        `;

        genreContainer.appendChild(filterBarCol);

        // Klick-Events für Sub-Filter
        const filterBtns = filterBarCol.querySelectorAll(".podcast-subfilter-btn");
        filterBtns.forEach((btn) => {
          btn.onclick = () => {
            const cat = btn.getAttribute("data-cat");
            renderStationsByGenre(selectedGenre, cat);
          };
        });
      }

      // Zu filternde Sender bestimmen
      const stationsInGenre = isPodcastView
        ? allStationsInGenre.filter((s) => matchesPodcastCategory(s, selectedCategory))
        : allStationsInGenre;

      if (stationsInGenre.length === 0) {
        const emptyCol = document.createElement("div");
        emptyCol.className = "col-12 text-center py-5 text-white-50";
        emptyCol.innerHTML = `
          <i class="bi bi-info-circle display-4 text-info opacity-50 mb-3 d-block"></i>
          <p class="fs-5 mb-1">Keine Podcasts in der Rubrik "${selectedCategory}" vorhanden.</p>
          <p class="small text-white-50">Du kannst Podcasts im Admin-Bereich bearbeiten und ihnen diese Rubrik zuweisen.</p>
        `;
        genreContainer.appendChild(emptyCol);
        return;
      }

      const userStations = userStationService.getStations();
      const currentPlayingUrl = (radioService.getCurrentStation() || "").trim();
      const cleanCurrentPlayingUrl = userStationService.normalizeUrl(currentPlayingUrl);

      stationsInGenre.forEach((station) => {
        if (!station || typeof station !== "object") return;
        const url = (station.sender_Url || station.sender_url || station.url || "").trim();
        const cleanUrl = userStationService.normalizeUrl(url);
        const name = station.sender_Name || station.sender_name || station.name || "Radio";
        const logo = station.sender_Logo || station.sender_logo || station.logo || "./images/cholo_love.png";
        
        const stationIndex = userStations.findIndex((s) => {
          if (!s || typeof s !== "object") return false;
          return userStationService.normalizeUrl(s.sender_Url || s.sender_url || s.url) === cleanUrl;
        });

        const alreadyAdded = stationIndex !== -1;
        const isPlaying = cleanCurrentPlayingUrl && cleanCurrentPlayingUrl === cleanUrl;

        const isPod = podcastService.isPodcast(station);
        const podCat = isPod ? podcastService.getPodcastCategory(station) : null;
        const podBadgeHtml = (isPod && podCat && podCat !== 'Podcast') 
          ? `<div class="mb-1"><span class="badge bg-secondary text-info border border-secondary border-opacity-50" style="font-size: 0.68rem;"><i class="bi bi-tag me-1"></i>${podCat}</span></div>` 
          : '';

        const col = document.createElement("div");
        col.className = isPod ? "col-12 col-md-6 col-lg-4" : "col-6 col-md-4 col-lg-3";
        
        col.innerHTML = `
          <div class="card h-100 bg-dark text-white border-secondary shadow-sm card-glow ${alreadyAdded ? 'border-success border-2' : ''} ${isPlaying ? 'border-primary border-2' : ''}">
              <div class="position-relative overflow-hidden pt-2 text-center">
                <img src="${logo}" class="card-img-top p-2 rounded-circle mx-auto" alt="${name}" style="width: 80px; height: 80px; object-fit: cover;">
                ${isPlaying ? '<div class="playing-overlay"><div class="wave"></div></div>' : ""}
              </div>
              <div class="card-body p-2 text-center d-flex flex-column justify-content-between">
                  ${podBadgeHtml}
                  <h6 class="card-title small text-truncate mb-2" title="${name}">${name}</h6>
                  <div class="d-grid gap-1 mt-auto">
                    <button class="btn btn-sm ${isPlaying ? 'btn-success fw-bold' : 'btn-primary'} btn-genre-play rounded-pill shadow-sm">
                      <i class="bi ${isPlaying ? 'bi-volume-up-fill' : 'bi-play-fill'}"></i> ${isPlaying ? 'Läuft' : (isPod ? 'Neueste Folge' : 'Play')}
                    </button>
                    ${isPod ? `
                    <button class="btn btn-sm btn-outline-info rounded-pill btn-podcast-episodes">
                      <i class="bi bi-collection-play me-1"></i> Weitere Folgen
                    </button>
                    ` : ''}
                    <button class="btn btn-sm ${alreadyAdded ? 'btn-success fw-bold' : 'btn-outline-primary text-white'} btn-genre-add rounded-pill">
                      ${alreadyAdded ? `<i class="bi bi-check-lg me-1"></i>In Top 6 (Platz ${stationIndex + 1})` : '+ Zu Top 6'}
                    </button>
                  </div>
                  ${isPod ? `
                  <div class="podcast-episodes-panel d-none mt-2 text-start border-top border-secondary pt-2">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <span class="text-white-50" style="font-size: 0.72rem; text-transform: uppercase;">Letzte Episoden:</span>
                      <span class="badge bg-secondary" style="font-size: 0.65rem;">Feed</span>
                    </div>
                    <div class="episodes-list-content">
                      <div class="text-white-50 text-center py-2 small"><span class="spinner-border spinner-border-sm me-1"></span> Lade Episoden...</div>
                    </div>
                  </div>
                  ` : ''}
              </div>
          </div>`;

        const playBtn = col.querySelector(".btn-genre-play");
        const addBtn = col.querySelector(".btn-genre-add");
        const epBtn = col.querySelector(".btn-podcast-episodes");
        const epPanel = col.querySelector(".podcast-episodes-panel");
        const epListContent = col.querySelector(".episodes-list-content");

        playBtn.onclick = (e) => {
          if (e) e.stopPropagation();
          radioService.play(station);
          renderStationsByGenre(selectedGenre);
        };

        addBtn.onclick = (e) => {
          if (e) e.stopPropagation();
          userStationService.addStation(station, 6);
          showToast(name);
          renderStationsByGenre(selectedGenre);
        };

        if (epBtn && epPanel && epListContent) {
          epBtn.onclick = async (e) => {
            if (e) e.stopPropagation();
            const isClosed = epPanel.classList.contains("d-none");
            if (isClosed) {
              epPanel.classList.remove("d-none");
              epBtn.classList.add("active");
              epBtn.innerHTML = '<i class="bi bi-chevron-up me-1"></i> Episoden schließen';

              try {
                const episodes = await podcastService.getEpisodes(station.sender_Url || station.sender_url, 4);
                if (!episodes || episodes.length === 0) {
                  epListContent.innerHTML = '<div class="text-white-50 small text-center py-1">Keine Episoden im Feed gefunden.</div>';
                  return;
                }

                epListContent.innerHTML = episodes.map((ep, epIdx) => `
                  <div class="d-flex align-items-center justify-content-between p-2 rounded bg-secondary bg-opacity-25 mb-1 hover-highlight">
                    <div class="text-truncate me-2" style="font-size: 0.75rem;">
                      <div class="text-white fw-semibold text-truncate" title="${ep.title}">${epIdx === 0 ? '<span class="badge bg-success me-1" style="font-size: 0.65rem;">NEU</span>' : ''}${ep.title}</div>
                      <div class="text-white-50 small">${ep.pub_date || ''} ${ep.duration ? '• ' + ep.duration : ''}</div>
                    </div>
                    <button class="btn btn-primary btn-sm rounded-circle p-0 flex-shrink-0 d-flex align-items-center justify-content-center btn-play-single-ep" data-idx="${epIdx}" style="width: 28px; height: 28px;" title="Diese Folge abspielen">
                      <i class="bi bi-play-fill fs-6"></i>
                    </button>
                  </div>
                `).join("");

                // Klickhandler für jede Episode
                const epPlayButtons = epListContent.querySelectorAll(".btn-play-single-ep");
                epPlayButtons.forEach((btn) => {
                  btn.onclick = (ev) => {
                    if (ev) ev.stopPropagation();
                    const idx = parseInt(btn.getAttribute("data-idx"), 10);
                    const chosenEp = episodes[idx];
                    if (chosenEp) {
                      radioService.play(station, chosenEp);
                      renderStationsByGenre(selectedGenre);
                    }
                  };
                });

              } catch (err) {
                epListContent.innerHTML = '<div class="text-danger small text-center py-1">Fehler beim Laden der Folgen.</div>';
              }
            } else {
              epPanel.classList.add("d-none");
              epBtn.classList.remove("active");
              epBtn.innerHTML = '<i class="bi bi-collection-play me-1"></i> Weitere Folgen';
            }
          };
        }

        genreContainer.appendChild(col);
      });
    }
  };

  if (stationService.isLoaded && stationService.getAll().length > 0) {
    renderActualContent();
  } else {
    stationService.on("loaded", renderActualContent);
    stationService.on("update", renderActualContent);
  }
}
