// Klasse zur Verwaltung einer temporären Liste von Benutzersendern
class UserStationService {
    constructor() {
        this.stations = [];   // Aktuelle Benutzerstationen (temporär im Speicher)
        this.events = {};     // Objekt für Event-Callbacks
    }

    // Stationsliste setzen und Event auslösen
    setStations(list) {
        this.stations = [...list];         // Kopie der Liste speichern
        this.emit('update', this.stations); // Event, dass sich die Liste geändert hat
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
        this.events[event] = this.events[event].filter(cb => cb !== callback);
    }

    // Event auslösen und alle registrierten Callback-Funktionen aufrufen
    emit(event, data) {
        if (!this.events[event]) return;
        this.events[event].forEach(cb => cb(data));
    }
}

// Singleton-Instanz exportieren
export const userStationService = new UserStationService();
