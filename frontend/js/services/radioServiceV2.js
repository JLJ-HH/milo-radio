/**
 * RADIOSERVICE (radioServiceV2.js)
 *
 * Robuste Audio-Engine für Desktop & Mobile (iOS / Android)
 * Unterstützt Live-Radio-Streams sowie Podcasts (inkl. Pause, Resume, Spulen & Episoden)
 */
import { podcastService } from "./podcastService.js";

class RadioService {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = "none";
    this.currentStation = null;
    this.currentStationData = null;
    this.currentEpisode = null;
    this.isPodcast = false;
    this.isPlaying = false;
    this.isPaused = false;
    this.events = {};
    this.pingInterval = null;

    // Sauberes Handling für Audio-Events
    this.audio.addEventListener("play", () => {
      this.isPlaying = true;
      this.isPaused = false;
    });

    this.audio.addEventListener("pause", () => {
      if (this.currentStation) {
        this.isPlaying = false;
        this.isPaused = true;
      }
    });

    this.audio.addEventListener("ended", () => {
      this.stop();
    });

    this.audio.addEventListener("error", (e) => {
      console.warn("Audio Element Fehler:", e);
      this.stop();
    });

    this.audio.addEventListener("timeupdate", () => {
      if (this.isPodcast && Number.isFinite(this.audio.duration) && this.audio.duration > 0) {
        this.emit("timeupdate", {
          currentTime: this.audio.currentTime,
          duration: this.audio.duration,
          progress: (this.audio.currentTime / this.audio.duration) * 100
        });
      }
    });

    this.audio.addEventListener("loadedmetadata", () => {
      if (this.isPodcast && Number.isFinite(this.audio.duration)) {
        this.emit("durationchange", {
          duration: this.audio.duration
        });
      }
    });
  }

  async play(station, episodeOverride = null) {
    if (!station) return;

    this.isPodcast = podcastService.isPodcast(station);
    let url = (station.sender_Url || station.sender_url || station.url || "").trim();

    // Falls ein Podcast abgespielt wird: Episode ermitteln
    if (this.isPodcast) {
      if (episodeOverride && episodeOverride.audio_url) {
        url = episodeOverride.audio_url;
        this.currentEpisode = episodeOverride;
      } else {
        try {
          const resolved = await podcastService.resolvePlayableEpisode(station);
          if (resolved && resolved.audioUrl) {
            url = resolved.audioUrl;
            this.currentEpisode = {
              title: resolved.episodeTitle,
              duration: resolved.duration,
              pubDate: resolved.pubDate
            };
          }
        } catch (err) {
          console.warn("Konnte Podcast-Episode nicht auflösen, versuche Direkt-URL:", err);
        }
      }
    } else {
      this.currentEpisode = null;
    }

    if (!url) {
      console.error("Keine gültige Stream-/Audio-URL:", station);
      return;
    }

    // Falls dieselbe URL bereits pausiert ist, einfach fortsetzen
    if (this.audio.src === url && this.isPaused) {
      this.resume();
      return;
    }

    try {
      this.audio.pause();
      this.audio.src = url;
      this.audio.load();
    } catch (e) {
      console.warn("Audio reset Warnung:", e);
    }

    this.currentStation = url;
    this.currentStationData = station;
    this.isPlaying = true;
    this.isPaused = false;

    localStorage.setItem("lastStationUrl", url);
    localStorage.setItem("isPlaying", "true");

    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.error("Audio-Wiedergabe Fehler:", err);
        this.isPlaying = false;
        this.isPaused = true;
        this.emit("error", err);
      });
    }

    this.emit("play", {
      stationUrl: this.currentStation,
      station: this.currentStationData,
      episode: this.currentEpisode,
      isPodcast: this.isPodcast
    });

    this.startPing();
  }

  pause() {
    if (!this.audio.src || !this.currentStation) return;
    try {
      this.audio.pause();
    } catch (e) {
      console.warn("Audio pause Warnung:", e);
    }
    this.isPlaying = false;
    this.isPaused = true;
    localStorage.setItem("isPlaying", "false");
    this.stopPing();
    this.emit("pause", {
      stationUrl: this.currentStation,
      station: this.currentStationData,
      episode: this.currentEpisode,
      isPodcast: this.isPodcast
    });
  }

  resume() {
    if (!this.audio.src || !this.currentStation) {
      if (this.currentStationData) {
        this.play(this.currentStationData);
      }
      return;
    }
    this.isPlaying = true;
    this.isPaused = false;
    localStorage.setItem("isPlaying", "true");
    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.error("Audio-Resume Fehler:", err);
        this.isPlaying = false;
        this.isPaused = true;
      });
    }
    this.emit("play", {
      stationUrl: this.currentStation,
      station: this.currentStationData,
      episode: this.currentEpisode,
      isPodcast: this.isPodcast
    });
    this.startPing();
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else if (this.isPaused) {
      this.resume();
    } else if (this.currentStationData) {
      this.play(this.currentStationData);
    }
  }

  seek(seconds) {
    if (!this.audio || !Number.isFinite(this.audio.duration)) return;
    const target = Math.max(0, Math.min(this.audio.duration, seconds));
    this.audio.currentTime = target;
  }

  seekPercent(percent) {
    if (!this.audio || !Number.isFinite(this.audio.duration)) return;
    const p = Math.max(0, Math.min(100, percent));
    const target = (p / 100) * this.audio.duration;
    this.seek(target);
  }

  skip(deltaSeconds) {
    if (!this.audio) return;
    const cur = this.audio.currentTime || 0;
    const max = Number.isFinite(this.audio.duration) ? this.audio.duration : cur + deltaSeconds;
    const target = Math.max(0, Math.min(max, cur + deltaSeconds));
    this.audio.currentTime = target;
  }

  startPing() {
    this.stopPing();
    if (!this.currentStationData || !this.currentStationData.id) return;
    this.sendPing(this.currentStationData.id);
    this.pingInterval = setInterval(() => {
      this.sendPing(this.currentStationData.id);
    }, 30000);
  }

  stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  async sendPing(stationId) {
    try {
      await fetch("../backend/api/ping.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ station_id: stationId }),
      });
    } catch (err) {
      console.warn("Ping fehlgeschlagen:", err);
    }
  }

  stop() {
    try {
      this.audio.pause();
      this.audio.removeAttribute("src");
      this.audio.load();
    } catch (e) {
      console.warn("Audio stop Warnung:", e);
    }

    this.currentStation = null;
    this.isPlaying = false;
    this.isPaused = false;
    this.currentEpisode = null;
    localStorage.setItem("isPlaying", "false");
    this.stopPing();
    this.emit("stop");
  }

  setVolume(value) {
    const num = Math.max(0, Math.min(1, parseFloat(value) || 0));
    this.audio.volume = num;
    this.emit("volumeChange", num);
  }

  getVolume() {
    return this.audio.volume;
  }

  getCurrentStation() {
    return this.currentStation;
  }

  getCurrentStationData() {
    return this.currentStationData;
  }

  getCurrentEpisode() {
    return this.currentEpisode;
  }

  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  emit(event, data) {
    if (!this.events[event]) return;
    setTimeout(() => {
      if (this.events[event]) {
        this.events[event].forEach((cb) => {
          try {
            cb(data);
          } catch (err) {
            console.error("Audio Event Error:", err);
          }
        });
      }
    }, 0);
  }
}

export const radioService = new RadioService();
