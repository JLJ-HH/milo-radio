// Klasse zur Verwaltung einer temporären Liste von Benutzersendern
class UserStationService {
  constructor() {
    this.stations = this.loadFromStorage(); // Aktuelle Benutzerstationen laden
    this.events = {}; // Objekt für Event-Callbacks
  }

  // Stationsliste aus localStorage laden
  loadFromStorage() {
    try {
      const saved = localStorage.getItem("userStations");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.warn("Fehler beim Laden der userStations aus localStorage:", e);
      return [];
    }
  }

  // Stationsliste setzen und Event auslösen
  setStations(list) {
    this.stations = [...list]; // Kopie der Liste speichern
    localStorage.setItem("userStations", JSON.stringify(this.stations)); // Dauerhaft speichern
    this.emit("update", this.stations); // Event, dass sich die Liste geändert hat
  }

  // Stationsliste abrufen (Kopie)
  getStations() {
    return [...this.stations];
  }

  // Event-Listener registrieren
  on(event, callback) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(callback);
  }

  // Event-Listener entfernen
  off(event, callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  // Event auslösen und alle registrierten Callback-Funktionen aufrufen
  emit(event, data) {
    if (!this.events[event]) return;
    this.events[event].forEach((cb) => cb(data));
  }
}

// Singleton-Instanz exportieren
export const userStationService = new UserStationService();
