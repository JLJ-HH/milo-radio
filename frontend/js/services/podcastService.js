/**
 * PODCAST SERVICE (podcastService.js)
 * 
 * Behandelt die Kommunikation mit der Podcast-API (podcast.php),
 * das Abrufen von Metadaten/Episoden und die automatische Ermittlung
 * des neuesten Audio-Streams für Podcasts.
 */

class PodcastService {
  constructor() {
    this.apiBase = "../backend/api/podcast.php";
    this.cache = new Map();
  }

  /**
   * Prüft, ob ein Sender als Podcast behandelt werden soll
   */
  isPodcast(station) {
    if (!station) return false;
    const genre = (station.genre || "").trim().toLowerCase();
    if (genre === "podcast") return true;

    const url = (station.sender_Url || station.sender_url || station.url || "").trim().toLowerCase();
    if (url.includes("/feed") || url.endsWith(".xml") || url.includes("podigee.io") || url.includes("rss")) {
      return true;
    }

    return false;
  }

  /**
   * Prüft, ob eine URL ein RSS-Feed ist
   */
  isFeedUrl(url) {
    if (!url) return false;
    const u = url.trim().toLowerCase();
    return u.includes("/feed") || u.endsWith(".xml") || u.includes("podigee.io") || u.includes("rss");
  }

  /**
   * Lädt Podcast-Kanal-Informationen (z. B. für Admin Auto-Fill)
   */
  async getPodcastInfo(url) {
    if (!url) throw new Error("Keine URL übergeben.");
    try {
      const res = await fetch(`${this.apiBase}?action=info&url=${encodeURIComponent(url)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Fehler beim Laden des Feeds");
      return data;
    } catch (e) {
      console.error("Fehler bei getPodcastInfo:", e);
      throw e;
    }
  }

  /**
   * Lädt die neuesten Episoden eines Podcasts
   */
  async getEpisodes(url, limit = 5) {
    if (!url) return [];
    const cacheKey = `${url}_${limit}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const res = await fetch(`${this.apiBase}?action=episodes&url=${encodeURIComponent(url)}&limit=${limit}`);
      if (!res.ok) return [];
      const data = await res.json();
      if (data.success && Array.isArray(data.episodes)) {
        this.cache.set(cacheKey, data.episodes);
        return data.episodes;
      }
    } catch (e) {
      console.warn("Fehler beim Abrufen der Episoden:", e);
    }
    return [];
  }

  /**
   * Löst die tatsächliche Audio-Stream-URL der neuesten Folge für einen Podcast auf
   */
  async resolvePlayableEpisode(station) {
    if (!station) return null;
    const rawUrl = (station.sender_Url || station.sender_url || station.url || "").trim();

    // Wenn es kein Feed ist (z. B. bereits eine direkte MP3-URL), direkt abspielen
    if (!this.isFeedUrl(rawUrl)) {
      return {
        audioUrl: rawUrl,
        title: station.sender_Name || station.sender_name || "Podcast",
        episodeTitle: null,
        duration: null
      };
    }

    // Wenn es ein Feed ist: Neueste Episode abrufen
    const episodes = await this.getEpisodes(rawUrl, 1);
    if (episodes.length > 0) {
      const latest = episodes[0];
      return {
        audioUrl: latest.audio_url,
        title: station.sender_Name || station.sender_name || "Podcast",
        episodeTitle: latest.title,
        duration: latest.duration,
        pubDate: latest.pub_date
      };
    }

    // Fallback auf rawUrl
    return {
      audioUrl: rawUrl,
      title: station.sender_Name || station.sender_name || "Podcast",
      episodeTitle: null,
      duration: null
    };
  }
}

export const podcastService = new PodcastService();
