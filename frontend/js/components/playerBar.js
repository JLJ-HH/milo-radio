/**
 * GLOBAL PLAYER BAR COMPONENT (playerBar.js)
 * Verwaltet die permanente Sticky-Bottom-Player-Bar über alle Seiten hinweg.
 * Unterstützt Live-Radio sowie Podcast-Modus (Play/Pause, Scrubbing, Timecode, +/- 15s).
 */
import { radioService } from "../services/radioServiceV2.js";
import { userStationService } from "../services/userStationService.js";

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "00:00";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) {
    return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  }
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

class PlayerBar {
  constructor() {
    this.barElement = null;
    this.stationTitle = null;
    this.nowPlayingText = null;
    this.playBtn = null;
    this.playBtnIcon = null;
    this.playBtnText = null;
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

    // Podcast Controls
    this.podcastBarRow = null;
    this.podcastProgressBar = null;
    this.podcastCurrentTime = null;
    this.podcastTotalTime = null;
    this.skipBack15Btn = null;
    this.skipFwd15Btn = null;
    this.isDraggingTimeline = false;
  }

  init() {
    if (this.isInitialized) return;

    this.barElement = document.getElementById("stickyPlayerBar");
    if (!this.barElement) return;

    this.stationTitle = document.getElementById("stationTitle");
    this.nowPlayingText = document.getElementById("nowPlayingText");
    this.playBtn = document.getElementById("playBtn");
    this.playBtnIcon = document.getElementById("playBtnIcon");
    this.playBtnText = document.getElementById("playBtnText");
    this.stopBtn = document.getElementById("stopBtn");
    this.volumeSlider = document.getElementById("volumeSlider");
    this.volumeIcon = document.getElementById("volumeIcon");
    this.playerThumb = document.getElementById("playerThumb");
    this.playerPlayingBadge = document.getElementById("playerPlayingBadge");

    // Podcast Elements
    this.podcastBarRow = document.getElementById("podcastBarRow");
    this.podcastProgressBar = document.getElementById("podcastProgressBar");
    this.podcastCurrentTime = document.getElementById("podcastCurrentTime");
    this.podcastTotalTime = document.getElementById("podcastTotalTime");
    this.skipBack15Btn = document.getElementById("skipBack15Btn");
    this.skipFwd15Btn = document.getElementById("skipFwd15Btn");

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
        if (radioService.isPodcast) {
          radioService.togglePlayPause();
          this.updateUI();
          return;
        }

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

    // Podcast Timeline & Skip Handlers
    if (this.podcastProgressBar) {
      this.podcastProgressBar.addEventListener("input", () => {
        this.isDraggingTimeline = true;
        const percent = parseFloat(this.podcastProgressBar.value) || 0;
        const duration = radioService.audio.duration || 0;
        if (this.podcastCurrentTime && duration > 0) {
          this.podcastCurrentTime.textContent = formatTime((percent / 100) * duration);
        }
      });

      this.podcastProgressBar.addEventListener("change", () => {
        const percent = parseFloat(this.podcastProgressBar.value) || 0;
        radioService.seekPercent(percent);
        this.isDraggingTimeline = false;
      });
    }

    if (this.skipBack15Btn) {
      this.skipBack15Btn.addEventListener("click", () => radioService.skip(-15));
    }
    if (this.skipFwd15Btn) {
      this.skipFwd15Btn.addEventListener("click", () => radioService.skip(15));
    }

    // Events von RadioService abonnieren
    radioService.on("play", (data) => {
      this.currentStation = radioService.currentStationData;
      if (this.currentStation) {
        this.lastPlayedStation = this.currentStation;
      }
      this.startNowPlayingUpdates(this.currentStation);
      this.updateUI();
    });

    radioService.on("pause", () => {
      this.updateUI();
    });

    radioService.on("stop", () => {
      this.stopNowPlayingUpdates();
      this.currentStation = null;
      this.updateUI();
    });

    radioService.on("timeupdate", ({ currentTime, duration, progress }) => {
      if (this.podcastCurrentTime) {
        this.podcastCurrentTime.textContent = formatTime(currentTime);
      }
      if (this.podcastTotalTime && duration > 0) {
        this.podcastTotalTime.textContent = formatTime(duration);
      }
      if (this.podcastProgressBar && !this.isDraggingTimeline) {
        this.podcastProgressBar.value = progress || 0;
      }
    });

    radioService.on("durationchange", ({ duration }) => {
      if (this.podcastTotalTime && duration > 0) {
        this.podcastTotalTime.textContent = formatTime(duration);
      }
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

    // Bei Podcasts: Direkten Episodentitel nutzen, kein Polling auf metadata.php
    if (radioService.isPodcast) {
      const ep = radioService.getCurrentEpisode();
      if (this.nowPlayingText) {
        this.nowPlayingText.textContent = ep?.title ? `🎙️ ${ep.title}` : `🎙️ ${station.sender_Name || station.sender_name || "Podcast"}`;
      }
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
    if (!radioService.isPodcast) {
      this.nowPlayingInterval = setInterval(() => this.fetchNowPlaying(station), 15000);
    }
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
    const isPlaying = radioService.isPlaying;
    const isPaused = radioService.isPaused;
    const isPodcast = radioService.isPodcast;
    const activeObj = this.currentStation || this.lastPlayedStation;
    const activeStations = userStationService.getStations();

    // Podcast Bar Row Ein-/Ausblenden
    if (this.podcastBarRow) {
      if (isPodcast && (isPlaying || isPaused || this.currentStation)) {
        this.podcastBarRow.classList.remove("d-none");
      } else {
        this.podcastBarRow.classList.add("d-none");
      }
    }

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
      const name = activeObj ? (activeObj.sender_Name || activeObj.sender_name || "Radio") : "Radio";
      if (isPlaying) {
        this.stationTitle.textContent = isPodcast ? `Podcast: ${name}` : `Hört gerade: ${name}`;
      } else if (isPaused) {
        this.stationTitle.textContent = `Pausiert: ${name}`;
      } else if (this.lastPlayedStation) {
        this.stationTitle.textContent = `Zuletzt gehört: ${name}`;
      } else if (activeStations.length === 0) {
        this.stationTitle.textContent = "Keine Favoriten gewählt";
      } else {
        this.stationTitle.textContent = "Bereit zum Abspielen";
      }
    }

    // Play & Stop Button Logik
    if (this.playBtn) {
      if (isPodcast) {
        this.playBtn.disabled = false;
        if (isPlaying) {
          if (this.playBtnIcon) this.playBtnIcon.className = "bi bi-pause-fill fs-5";
          if (this.playBtnText) this.playBtnText.textContent = "Pause";
          this.playBtn.classList.remove("btn-primary");
          this.playBtn.classList.add("btn-warning");
        } else {
          if (this.playBtnIcon) this.playBtnIcon.className = "bi bi-play-fill fs-5";
          if (this.playBtnText) this.playBtnText.textContent = "Play";
          this.playBtn.classList.remove("btn-warning");
          this.playBtn.classList.add("btn-primary");
        }
      } else {
        // Normaler Radio-Modus
        if (this.playBtnIcon) this.playBtnIcon.className = "bi bi-play-fill fs-5";
        if (this.playBtnText) this.playBtnText.textContent = "Play";
        this.playBtn.classList.remove("btn-warning");
        this.playBtn.classList.add("btn-primary");
        this.playBtn.disabled = (activeStations.length === 0 && !this.lastPlayedStation) || isPlaying;
      }
    }

    if (this.stopBtn) {
      this.stopBtn.disabled = !isPlaying && !isPaused && !this.currentStation;
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
