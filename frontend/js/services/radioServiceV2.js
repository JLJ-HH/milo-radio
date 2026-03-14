/**
 * RADIOSERVICE (radioServiceV2.js)
 *
 * Diese Klasse kümmert sich um die eigentliche Audio-Wiedergabe.
 * Sie steuert das Abspielen, Stoppen und die Lautstärke.
 */
class RadioService {
  constructor() {
    this.audio = new Audio();
    this.currentStation = null;
    this.events = {};
    this.pingInterval = null;
    this.currentStationData = null;
  }

  play(station) {
    if (!station) return;
    const url = station.sender_Url;

    this.audio.src = url; 
    this.currentStation = url;
    localStorage.setItem("lastStationUrl", url);
    localStorage.setItem("isPlaying", "true");

    this.audio.play().then(() => {
      // Wiedergabe erfolgreich
    }).catch((err) => {
      console.error("Audio-Wiedergabe-Fehler:", err);
      this.emit("error", err);
    });

    this.emit("play", this.currentStation);
    this.currentStationData = station;
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
      // API Pfad angepasst
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
    this.audio.pause();
    this.audio.currentTime = 0;
    localStorage.setItem("isPlaying", "false");
    this.stopPing();
    this.emit("stop");
  }

  setVolume(value) {
    this.audio.volume = value;
    this.emit("volumeChange", value);
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
