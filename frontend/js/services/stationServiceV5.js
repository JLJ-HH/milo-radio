/**
 * STATIONSERVICE (stationService.js)
 *
 * Verwaltet die "Master-Liste" aller verfügbaren Radiosender.
 * Lädt Daten aus der DB und speichert Änderungen im LocalStorage.
 */
class StationService {
  constructor() {
    this.stations = []; // Die Liste aller Sender
    this.isLoaded = false; // Status: Sind die Daten schon bereit?
    this.listeners = {}; // Event-Listener
    this.init(); // Startet den Ladevorgang sofort im Hintergrund
  }

  /**
   * Event-Handling System
   */
  on(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb(data));
    }
  }

  /**
   * Initialisierung: Lädt Daten erst aus der Datei, dann aus dem Speicher.
   */
  async init() {
    await this.loadFromAPI(); // Schritt 1: Standard-Sender aus DB laden
    this.isLoaded = true; // Status auf "bereit" setzen
    this.loadFromStorage(); // Schritt 2: Eigene Änderungen des Admins laden
    this.emit("loaded", this.stations); // Event feuern
  }

  /**
   * Lädt die vordefinierten Sender aus der Datenbank via API.
   */
  async loadFromAPI() {
    try {
      const response = await fetch("../backend/api/get_stations.php");
      const data = await response.json();
      
      // Falls die API ein Error-Objekt statt eines Arrays schickt:
      if (Array.isArray(data)) {
        this.stations = data;
      } else {
        console.error("API Error oder ungültiges Format:", data);
        this.stations = [];
      }
    } catch (e) {
      console.warn("API konnte nicht geladen werden:", e);
      this.stations = [];
    }
  }

  /**
   * Lädt die vom Admin geänderten oder hinzugefügten Sender aus dem Browser-Speicher.
   */
  loadFromStorage() {
    try {
      const saved = localStorage.getItem("masterStations");
      if (saved) {
        this.stations = JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Fehler beim Laden aus LocalStorage:", e);
    }
  }

  /**
   * Gibt alle Sender zurück.
   */
  getAll() {
    // Falls noch geladen wird, leeres Array senden, sonst Kopie der Liste
    return this.isLoaded ? [...this.stations] : [];
  }

  /**
   * Admin-Funktion: Neuen Sender hinzufügen.
   */
  add(station) {
    const newStation = {
      ...station,
      id: Date.now(), // Eindeutige ID basierend auf der Zeit
    };
    this.stations.push(newStation);
    this.save(); // Sofort dauerhaft speichern
    return newStation;
  }

  /**
   * Admin-Funktion: Bestehenden Sender bearbeiten.
   */
  update(index, station) {
    this.stations[index] = { ...station };
    this.save();
  }

  /**
   * Admin-Funktion: Sender aus der Master-Liste löschen.
   */
  remove(index) {
    this.stations.splice(index, 1);
    this.save();
  }

  /**
   * Speichert die aktuelle Master-Liste im Browser-Speicher (LocalStorage).
   */
  save() {
    localStorage.setItem("masterStations", JSON.stringify(this.stations));
  }
}

// Singleton-Instanz exportieren
export const stationService = new StationService();
