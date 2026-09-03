/**
 * STATIONSERVICE (stationServiceV5.js)
 *
 * Verwaltet die "Master-Liste" aller verfügbaren Radiosender.
 * Lädt Daten aus der DB und speichert Änderungen im LocalStorage.
 */
class StationService {
  constructor() {
    this.stations = [];
    this.isLoaded = false;
    this.listeners = {};
    this.initPromise = this.init();
  }

  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach((cb) => cb(data));
    }
  }

  async init() {
    await this.loadFromAPI();
    this.loadFromStorage();
    this.isLoaded = true;
    this.emit("loaded", this.stations);
    return this.stations;
  }

  async loadFromAPI() {
    let loaded = false;
    try {
      const response = await fetch("../backend/api/get_stations.php");
      if (response.ok) {
        const text = await response.text();
        if (text && text.trim().startsWith("[")) {
          const data = JSON.parse(text);
          if (Array.isArray(data) && data.length > 0) {
            this.stations = data;
            loaded = true;
          }
        }
      }
    } catch (e) {
      console.warn("API get_stations.php nicht erreichbar, nutze Fallback:", e);
    }

    if (!loaded) {
      try {
        const fallbackRes = await fetch("./json/sender_daten.json");
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          if (Array.isArray(fallbackData) && fallbackData.length > 0) {
            this.stations = fallbackData;
            loaded = true;
          }
        }
      } catch (err) {
        console.error("Fallback auf sender_daten.json fehlgeschlagen:", err);
      }
    }
  }

  loadFromStorage() {
    try {
      const saved = localStorage.getItem("masterStations");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.stations = parsed;
        }
      }
    } catch (e) {
      console.warn("Fehler beim Laden aus LocalStorage:", e);
    }
  }

  getAll() {
    return [...this.stations];
  }

  add(station) {
    const newStation = {
      ...station,
      id: Date.now(),
    };
    this.stations.push(newStation);
    this.save();
    this.emit("update", this.stations);
    return newStation;
  }

  update(index, station) {
    this.stations[index] = { ...station };
    this.save();
    this.emit("update", this.stations);
  }

  remove(index) {
    this.stations.splice(index, 1);
    this.save();
    this.emit("update", this.stations);
  }

  save() {
    localStorage.setItem("masterStations", JSON.stringify(this.stations));
  }
}

export const stationService = new StationService();
