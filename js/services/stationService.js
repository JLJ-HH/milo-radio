// js/services/stationService.js
class StationService {
    constructor() {
        this.stations = [];
        this.isLoaded = false;
        this.init(); // läuft im Hintergrund
    }

    async init() {
        await this.loadFromJSON();
        this.isLoaded = true;
        this.loadFromStorage();
    }

    async loadFromJSON() {
        try {
            const response = await fetch('./json/sender_daten.json');
            const jsonStations = await response.json();
            this.stations = jsonStations;
        } catch(e) {
            console.warn('JSON nicht ladbar:', e);
        }
    }

    loadFromStorage() {
        try {
            const saved = localStorage.getItem('masterStations');
            if (saved) {
                this.stations = JSON.parse(saved);
            }
        } catch(e) {
            console.warn('localStorage Fehler:', e);
        }
    }

    // Sofort verfügbar - auch wenn noch ladend
    getAll() {
        return this.isLoaded ? [...this.stations] : [];
    }

    add(station) {
        const newStation = { 
            ...station, 
            id: Date.now() 
        };
        this.stations.push(newStation);
        this.save();
        return newStation;
    }

    update(index, station) {
        this.stations[index] = { ...station };
        this.save();
    }

    remove(index) {
        this.stations.splice(index, 1);
        this.save();
    }

    save() {
        localStorage.setItem('masterStations', JSON.stringify(this.stations));
    }
}

export const stationService = new StationService();
