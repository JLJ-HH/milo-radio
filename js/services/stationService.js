/**
 * STATIONSERVICE (stationService.js)
 *
 * Verwaltet die "Master-Liste" aller verfügbaren Radiosender.
 * Lädt Daten aus einer JSON-Datei und speichert Änderungen im LocalStorage.
 */
class StationService {
  constructor() {
    this.stations = []; // Die Liste aller Sender
    this.isLoaded = false; // Status: Sind die Daten schon bereit?
    this.init(); // Startet den Ladevorgang sofort im Hintergrund
  }

  /**
   * Initialisierung: Lädt Daten erst aus der Datei, dann aus dem Speicher.
   */
  async init() {
    await this.loadFromJSON(); // Schritt 1: Standard-Sender aus Datei laden
    this.isLoaded = true; // Status auf "bereit" setzen
    this.loadFromStorage(); // Schritt 2: Eigene Änderungen des Admins laden
  }

  /**
   * Lädt die vordefinierten Sender aus der Datei sender_daten.json.
   */
  async loadFromJSON() {
    try {
      const response = await fetch("./json/sender_daten.json");
      const jsonStations = await response.json();
      this.stations = jsonStations;
    } catch (e) {
      console.warn("JSON-Datei konnte nicht geladen werden:", e);
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
