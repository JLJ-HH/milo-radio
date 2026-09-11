/**
 * GLOBAL PLAYER BAR COMPONENT (playerBar.js)
 * Verwaltet die permanente Sticky-Bottom-Player-Bar über alle Seiten (Radio, Genres, Stats, etc.) hinweg.
 */
import { radioService } from "../services/radioServiceV2.js";
import { userStationService } from "../services/userStationService.js";

class PlayerBar {
  constructor() {
    this.barElement = null;
    this.stationTitle = null;
    this.nowPlayingText = null;
    this.playBtn = null;
    this.stopBtn = null;
    this.volumeSlider = null;
    this.volumeIcon = null;
    this.previousVolume = 0.3;
    this.playerThumb = null;
    this.playerPlayingBadge = null;
    this.nowPlayingInterval = null;
    this.currentStation = null;
    this.lastPlayedStation = null;
    this.isInitialized = false;
  }

  init() {
    if (this.isInitialized) return;

    this.barElement = document.getElementById("stickyPlayerBar");
    if (!this.barElement) return;

    this.stationTitle = document.getElementById("stationTitle");
    this.nowPlayingText = document.getElementById("nowPlayingText");
    this.playBtn = document.getElementById("playBtn");
    this.stopBtn = document.getElementById("stopBtn");
    this.volumeSlider = document.getElementById("volumeSlider");
    this.volumeIcon = document.getElementById("volumeIcon");
    this.playerThumb = document.getElementById("playerThumb");
    this.playerPlayingBadge = document.getElementById("playerPlayingBadge");

    // Body mit Padding-Klasse versehen
    document.body.classList.add("has-sticky-player");

    // QR Code Handler
    const qrModalHandler = () => {
      const modalElement = document.getElementById("qrModal");
      if (modalElement && typeof bootstrap !== "undefined") {
        const qrModal = new bootstrap.Modal(modalElement);
        qrModal.show();
      }
    };

    if (this.playerThumb) {
      this.playerThumb.style.cursor = "pointer";
      this.playerThumb.title = "QR Code teilen";
      this.playerThumb.onclick = qrModalHandler;
    }

    // Lautstärke initialisieren
    const savedVolume = parseFloat(localStorage.getItem("radioVolume") ?? "0.3");
    this.previousVolume = savedVolume > 0.01 ? savedVolume : 0.3;

    if (this.volumeSlider) {
      this.volumeSlider.value = savedVolume;
      this.volumeSlider.addEventListener("input", () => {
        const val = parseFloat(this.volumeSlider.value);
        radioService.setVolume(val);
        localStorage.setItem("radioVolume", val);
        if (val > 0.01) {
          this.previousVolume = val;
        }
        this.updateVolumeIcon(val);
      });
    }

    if (this.volumeIcon) {
      this.volumeIcon.addEventListener("click", () => {
        const currentVal = this.volumeSlider ? parseFloat(this.volumeSlider.value) : (savedVolume ?? 0.3);
        if (currentVal > 0.01) {
          this.previousVolume = currentVal;
          if (this.volumeSlider) this.volumeSlider.value = 0;
          radioService.setVolume(0);
          localStorage.setItem("radioVolume", 0);
          this.updateVolumeIcon(0);
        } else {
          const restoreVal = this.previousVolume > 0.05 ? this.previousVolume : 0.3;
          if (this.volumeSlider) this.volumeSlider.value = restoreVal;
          radioService.setVolume(restoreVal);
          localStorage.setItem("radioVolume", restoreVal);
          this.updateVolumeIcon(restoreVal);
        }
      });
    }

    radioService.setVolume(savedVolume);
    this.updateVolumeIcon(savedVolume);

    // Play & Stop Buttons
    if (this.playBtn) {
      this.playBtn.addEventListener("click", () => {
        const activeStations = userStationService.getStations();
        if (!this.currentStation && this.lastPlayedStation) {
          this.currentStation = this.lastPlayedStation;
        } else if (!this.currentStation && activeStations.length > 0) {
          this.currentStation = activeStations[0];
        }

        if (this.currentStation) {
          radioService.play(this.currentStation);
        }
      });
    }

    if (this.stopBtn) {
      this.stopBtn.addEventListener("click", () => {
        radioService.stop();
      });
    }

    // Events von RadioService abonnieren
    radioService.on("play", () => {
      this.currentStation = radioService.currentStationData;
      if (this.currentStation) {
        this.lastPlayedStation = this.currentStation;
      }
      this.startNowPlayingUpdates(this.currentStation);
      this.updateUI();
    });

    radioService.on("stop", () => {
      this.stopNowPlayingUpdates();
      this.currentStation = null;
      this.updateUI();
    });

    // Events von UserStationService abonnieren
    userStationService.on("update", () => {
      this.updateUI();
    });

    // Letzten Status wiederherstellen
    const lastUrl = localStorage.getItem("lastStationUrl");
    const wasPlaying = localStorage.getItem("isPlaying") === "true";
    const activeStations = userStationService.getStations();

    if (lastUrl) {
      const found = activeStations.find((s) => (s.sender_Url || s.sender_url) === lastUrl);
      if (found) {
        this.lastPlayedStation = found;
        if (wasPlaying) {
          this.currentStation = found;
          radioService.play(found);
        }
      }
    }

    this.updateUI();
    this.isInitialized = true;
  }

  async fetchNowPlaying(station) {
    if (!station) {
      if (this.nowPlayingText) this.nowPlayingText.textContent = "";
      return;
    }

    const url = station.sender_Url || station.sender_url;
    let urlToFetch = "";
    if (station.now_playing_url && station.now_playing_url.trim() !== "") {
      urlToFetch = station.now_playing_url;
    } else if (url) {
      urlToFetch = `../backend/api/metadata.php?stream=${encodeURIComponent(url)}`;
    } else {
      if (this.nowPlayingText) this.nowPlayingText.textContent = "";
      return;
    }

    try {
      const response = await fetch(urlToFetch);
      const text = await response.text();
      let title = "";
      try {
        const json = JSON.parse(text);
        title = json.title || json.song || json.now_playing || json.name || json.currentSong || "";
      } catch (e) {
        title = text;
      }

      const senderName = station.sender_Name || station.sender_name || "Radio";
      if (this.nowPlayingText) {
        this.nowPlayingText.textContent = title.trim() || `🎵 ${senderName}`;
      }
    } catch (error) {
      if (this.nowPlayingText) this.nowPlayingText.textContent = "";
    }
  }

  startNowPlayingUpdates(station) {
    this.stopNowPlayingUpdates();
    if (!station) return;
    this.fetchNowPlaying(station);
    this.nowPlayingInterval = setInterval(() => this.fetchNowPlaying(station), 15000);
  }

  stopNowPlayingUpdates() {
    if (this.nowPlayingInterval) {
      clearInterval(this.nowPlayingInterval);
      this.nowPlayingInterval = null;
    }
    if (this.nowPlayingText) {
      this.nowPlayingText.textContent = "";
    }
  }

  updateUI() {
    const isPlaying = !!this.currentStation;
    const activeObj = this.currentStation || this.lastPlayedStation;
    const activeStations = userStationService.getStations();

    if (this.playerThumb) {
      const logo = activeObj ? (activeObj.sender_Logo || activeObj.sender_logo || "./images/cholo_love.png") : "./images/milo.jpg";
      this.playerThumb.src = logo;
      if (isPlaying) {
        this.playerThumb.classList.add("playing");
      } else {
        this.playerThumb.classList.remove("playing");
      }
    }

    if (this.playerPlayingBadge) {
      if (isPlaying) {
        this.playerPlayingBadge.classList.remove("d-none");
      } else {
        this.playerPlayingBadge.classList.add("d-none");
      }
    }

    if (this.stationTitle) {
      if (isPlaying && this.currentStation) {
        const name = this.currentStation.sender_Name || this.currentStation.sender_name || "Radio";
        this.stationTitle.textContent = `Hört gerade: ${name}`;
      } else if (this.lastPlayedStation) {
        const name = this.lastPlayedStation.sender_Name || this.lastPlayedStation.sender_name || "Radio";
        this.stationTitle.textContent = `Zuletzt gehört: ${name}`;
      } else if (activeStations.length === 0) {
        this.stationTitle.textContent = "Keine Favoriten gewählt";
      } else {
        this.stationTitle.textContent = "Bereit zum Abspielen";
      }
    }

    if (this.playBtn) {
      this.playBtn.disabled = (activeStations.length === 0 && !this.lastPlayedStation) || isPlaying;
    }

    if (this.stopBtn) {
      this.stopBtn.disabled = !isPlaying;
    }
  }

  updateVolumeIcon(vol) {
    if (!this.volumeIcon) return;
    this.volumeIcon.className = "fs-5 flex-shrink-0";
    if (vol <= 0.01) {
      this.volumeIcon.classList.add("bi", "bi-volume-mute-fill", "text-danger");
      this.volumeIcon.title = "Ton einschalten";
    } else if (vol < 0.5) {
      this.volumeIcon.classList.add("bi", "bi-volume-down-fill", "text-white-50");
      this.volumeIcon.title = "Stummschalten";
    } else {
      this.volumeIcon.classList.add("bi", "bi-volume-up-fill", "text-white-50");
      this.volumeIcon.title = "Stummschalten";
    }
  }
}

export const playerBar = new PlayerBar();
