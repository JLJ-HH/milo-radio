/**
 * STATIONSERVICE (stationServiceV5.js)
 *
 * Verwaltet die "Master-Liste" aller verfügbaren Radiosender.
 * Lädt Daten primär über die REST-API aus der MySQL-Datenbank und
 * speichert Änderungen persistent auf dem Server. LocalStorage dient als Offline-Cache.
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
    const apiLoaded = await this.loadFromAPI();
    if (!apiLoaded) {
      this.loadFromStorage();
    } else {
      this.save();
    }
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

    return loaded;
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

  async add(station) {
    try {
      const response = await fetch("../backend/api/manage_station.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add",
          ...station
        })
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Fehler beim Hinzufügen des Senders.");
      }
      const newStation = result.station;
      this.stations.push(newStation);
      this.save();
      this.emit("update", this.stations);
      return newStation;
    } catch (err) {
      console.error("stationService.add error:", err);
      throw err;
    }
  }

  async update(idOrIndex, station) {
    let targetStation = { ...station };
    let id = targetStation.id;

    if (!id && typeof idOrIndex === "number") {
      if (this.stations[idOrIndex]) {
        id = this.stations[idOrIndex].id;
      } else {
        id = idOrIndex;
      }
    } else if (!id && typeof idOrIndex === "object") {
      targetStation = { ...idOrIndex };
      id = targetStation.id;
    }

    if (!id) {
      throw new Error("Sender-ID fehlt für die Aktualisierung.");
    }

    try {
      const response = await fetch("../backend/api/manage_station.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          id: id,
          ...targetStation
        })
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Fehler beim Aktualisieren des Senders.");
      }
      const updatedStation = result.station;
      const idx = this.stations.findIndex((s) => Number(s.id) === Number(id));
      if (idx !== -1) {
        this.stations[idx] = updatedStation;
      }
      this.save();
      this.emit("update", this.stations);
      return updatedStation;
    } catch (err) {
      console.error("stationService.update error:", err);
      throw err;
    }
  }

  async remove(idOrIndex) {
    let id = idOrIndex;
    let idx = this.stations.findIndex((s) => Number(s.id) === Number(idOrIndex));
    if (idx === -1 && typeof idOrIndex === "number" && this.stations[idOrIndex]) {
      id = this.stations[idOrIndex].id;
      idx = idOrIndex;
    }

    try {
      const response = await fetch("../backend/api/manage_station.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          id: id
        })
      });
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Fehler beim Löschen des Senders.");
      }
      if (idx !== -1) {
        this.stations.splice(idx, 1);
      } else {
        this.stations = this.stations.filter((s) => Number(s.id) !== Number(id));
      }
      this.save();
      this.emit("update", this.stations);
      return true;
    } catch (err) {
      console.error("stationService.remove error:", err);
      throw err;
    }
  }

  save() {
    try {
      localStorage.setItem("masterStations", JSON.stringify(this.stations));
    } catch (e) {
      console.warn("Konnte masterStations nicht im LocalStorage cachen:", e);
    }
  }
}

export const stationService = new StationService();
