/**
 * RADIOSERVICE (radioServiceV2.js)
 *
 * Robuste Audio-Engine für Desktop & Mobile (iOS / Android)
 */
class RadioService {
  constructor() {
    this.audio = new Audio();
    this.audio.preload = "none";
    this.currentStation = null;
    this.events = {};
    this.pingInterval = null;
    this.currentStationData = null;
  }

  play(station) {
    if (!station) return;
    const url = (station.sender_Url || station.sender_url || station.url || "").trim();
    if (!url) {
      console.error("Keine gültige Stream-URL:", station);
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
    localStorage.setItem("lastStationUrl", url);
    localStorage.setItem("isPlaying", "true");

    const playPromise = this.audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.error("Audio-Wiedergabe Fehler:", err);
        this.emit("error", err);
      });
    }

    this.emit("play", this.currentStation);
    this.startPing();
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
    this.events[event].forEach((cb) => cb(data));
  }
}

export const radioService = new RadioService();
