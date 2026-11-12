import {
  CalendarReleaseItem,
  CommentItem,
  Media,
} from '../types';
import {
  INITIAL_CALENDAR,
  INITIAL_COMMENTS,
  INITIAL_MEDIAS,
} from './mockData';

const SHINOKAI_API_BASE = 'https://api-prod.shinokai.online';
const AES_KEY_BASE64 = 'LClZ5k9139ypHE4c863iIrMALnupsPH+4TUF6zhA6nk=';

interface EncryptedEnvelope {
  v: number;
  payload: string;
  iv: string;
  tag: string;
}

class ShinokaiApiClient {
  private token: string | null = null;
  private tokenExpiresAt: number = 0;
  private cryptoKey: CryptoKey | null = null;

  private async getCryptoKey(): Promise<CryptoKey | null> {
    if (this.cryptoKey) return this.cryptoKey;
    try {
      if (typeof crypto !== 'undefined' && crypto.subtle) {
        const rawKey = Uint8Array.from(atob(AES_KEY_BASE64), (c) => c.charCodeAt(0));
        this.cryptoKey = await crypto.subtle.importKey(
          'raw',
          rawKey,
          { name: 'AES-GCM' },
          false,
          ['decrypt']
        );
        return this.cryptoKey;
      }
    } catch {
      // Fallback
    }
    return null;
  }

  private async decryptPayload(envelope: EncryptedEnvelope): Promise<any> {
    if (!envelope || !envelope.payload) return envelope;
    try {
      const key = await this.getCryptoKey();
      if (key && typeof crypto !== 'undefined' && crypto.subtle) {
        const iv = Uint8Array.from(atob(envelope.iv), (c) => c.charCodeAt(0));
        const tag = Uint8Array.from(atob(envelope.tag), (c) => c.charCodeAt(0));
        const ciphertext = Uint8Array.from(atob(envelope.payload), (c) => c.charCodeAt(0));

        // In Web Crypto API AES-GCM, tag is appended to the ciphertext
        const combined = new Uint8Array(ciphertext.length + tag.length);
        combined.set(ciphertext, 0);
        combined.set(tag, ciphertext.length);

        const decrypted = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv, tagLength: 128 },
          key,
          combined
        );
        const text = new TextDecoder().decode(decrypted);
        return JSON.parse(text);
      }
    } catch {
      // Failed to decrypt or unsupported environment
    }
    return null;
  }

  private async getAuthToken(): Promise<string | null> {
    if (this.token && Date.now() < this.tokenExpiresAt - 60000) {
      return this.token;
    }
    try {
      const res = await fetch(`${SHINOKAI_API_BASE}/auth/anonymous`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'okhttp/4.12.0' },
        body: '{}',
      });
      if (!res.ok) return null;
      const env: EncryptedEnvelope = await res.json();
      const auth = await this.decryptPayload(env);
      if (auth && (auth.accessToken || auth.token)) {
        this.token = auth.accessToken || auth.token;
        this.tokenExpiresAt = auth.accessTokenExpiresAt
          ? new Date(auth.accessTokenExpiresAt).getTime()
          : Date.now() + 3600000;
        return this.token;
      }
    } catch {
      // Offline or network error
    }
    return null;
  }

  private async request(path: string): Promise<any> {
    try {
      const token = await this.getAuthToken();
      const headers: Record<string, string> = {
        'User-Agent': 'okhttp/4.12.0',
        Accept: 'application/json',
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch(`${SHINOKAI_API_BASE}${path}`, { headers });
      if (!res.ok) return null;
      const json = await res.json();
      if (json && json.payload) {
        return await this.decryptPayload(json);
      }
      return json;
    } catch {
      return null;
    }
  }

  async fetchCatalog(): Promise<Media[]> {
    try {
      const liveMedias = await this.request('/medias?limit=60');
      if (liveMedias && liveMedias.results && liveMedias.results.length > 0) {
        const liveMap = new Map<string, Media>();
        INITIAL_MEDIAS.forEach((m) => liveMap.set(m.id, m));

        // Format live results
        for (const item of liveMedias.results) {
          if (!liveMap.has(item.id)) {
            const hasDub = item.audioLanguages?.includes('DUBBED');
            const hasSub = item.audioLanguages?.includes('SUBBED');
            const audioType = hasDub && hasSub ? 'DUAL_AUDIO' : hasDub ? 'DUBLADO' : 'LEGENDADO';
            liveMap.set(item.id, {
              id: item.id,
              title: item.title,
              originalTitle: item.originalTitle || item.title,
              synopsis: item.synopsis || `Assista ${item.title} no Shinokai.`,
              posterUrl: item.posterUrl,
              bannerUrl: item.bannerUrl || item.posterUrl,
              rating: item.avgRating || 4.8,
              releaseYear: item.releaseYear || 2024,
              format: item.type === 'MOVIE' ? 'MOVIE' : 'TV',
              status: item.status === 'AIRING' ? 'RELEASING' : 'FINISHED',
              audioType,
              ageRating: item.ageRating || '14',
              studio: 'Shinokai Studio',
              genres: (item.genres || []).map((g: any) => g.name || g),
              totalEpisodes: 12,
              seasons: item.seasonNumber ? [item.seasonNumber] : [1],
              episodes: [
                {
                  id: `${item.id}-ep-1`,
                  mediaId: item.id,
                  seasonNumber: item.seasonNumber || 1,
                  number: 1,
                  title: 'Episódio 1',
                  synopsis: `Primeiro episódio de ${item.title}.`,
                  thumbnail: item.bannerUrl || item.posterUrl,
                  durationSec: 1440,
                  releaseDate: `${item.releaseYear || 2024}-04-10`,
                  streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                  servers: [
                    {
                      id: 'srv-1',
                      name: 'Servidor 1 - Shinokai CDN',
                      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                      type: 'HLS',
                      quality: '1080p',
                    },
                    {
                      id: 'srv-2',
                      name: 'Servidor 2 - Dublado PT-BR',
                      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                      type: 'HLS',
                      quality: '720p',
                    },
                  ],
                  audioTracks: [
                    { id: 'jp', label: 'Japonês', language: 'ja-JP' },
                    { id: 'pt', label: 'Português', language: 'pt-BR' },
                  ],
                  subtitleTracks: [
                    { id: 'pt-br', label: 'Português', language: 'pt-BR' },
                  ],
                  likesCount: 120,
                },
              ],
            });
          }
        }
        return Array.from(liveMap.values());
      }
    } catch {
      // Fallback
    }
    return INITIAL_MEDIAS;
  }

  async searchCatalog(query: string): Promise<Media[]> {
    if (!query.trim()) return [];
    try {
      const live = await this.request(`/medias?q=${encodeURIComponent(query)}&limit=25`);
      if (live && live.results && live.results.length > 0) {
        const foundList: Media[] = [];
        const existingMap = new Map(INITIAL_MEDIAS.map((m) => [m.id, m]));

        for (const item of live.results) {
          if (existingMap.has(item.id)) {
            foundList.push(existingMap.get(item.id)!);
          } else {
            const hasDub = item.audioLanguages?.includes('DUBBED');
            const hasSub = item.audioLanguages?.includes('SUBBED');
            const audioType = hasDub && hasSub ? 'DUAL_AUDIO' : hasDub ? 'DUBLADO' : 'LEGENDADO';
            foundList.push({
              id: item.id,
              title: item.title,
              originalTitle: item.originalTitle || item.title,
              synopsis: item.synopsis || `Assista ${item.title} no Shinokai.`,
              posterUrl: item.posterUrl,
              bannerUrl: item.bannerUrl || item.posterUrl,
              rating: item.avgRating || 4.7,
              releaseYear: item.releaseYear || 2024,
              format: item.type === 'MOVIE' ? 'MOVIE' : 'TV',
              status: item.status === 'AIRING' ? 'RELEASING' : 'FINISHED',
              audioType,
              ageRating: item.ageRating || '14',
              studio: 'Shinokai Studio',
              genres: (item.genres || []).map((g: any) => g.name || g),
              totalEpisodes: 12,
              seasons: item.seasonNumber ? [item.seasonNumber] : [1],
              episodes: [
                {
                  id: `${item.id}-ep-1`,
                  mediaId: item.id,
                  seasonNumber: item.seasonNumber || 1,
                  number: 1,
                  title: 'Episódio 1',
                  synopsis: `Episódio 1 de ${item.title}`,
                  thumbnail: item.bannerUrl || item.posterUrl,
                  durationSec: 1440,
                  releaseDate: `${item.releaseYear || 2024}-04-10`,
                  streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                  servers: [
                    {
                      id: 'srv-1',
                      name: 'Servidor 1 - Shinokai CDN',
                      url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                      type: 'HLS',
                      quality: '1080p',
                    },
                  ],
                  audioTracks: [
                    { id: 'jp', label: 'Japonês', language: 'ja-JP' },
                    { id: 'pt', label: 'Português', language: 'pt-BR' },
                  ],
                  subtitleTracks: [
                    { id: 'pt-br', label: 'Português', language: 'pt-BR' },
                  ],
                  likesCount: 150,
                },
              ],
            });
          }
        }
        return foundList;
      }
    } catch {
      // Fallback
    }

    const q = query.toLowerCase();
    return INITIAL_MEDIAS.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.originalTitle.toLowerCase().includes(q) ||
        m.genres.some((g) => g.toLowerCase().includes(q))
    );
  }

  async fetchReleaseCalendar(): Promise<CalendarReleaseItem[]> {
    try {
      const cal = await this.request('/release-calendar');
      if (cal && cal.results && cal.results.length > 0) {
        return cal.results.slice(0, 30).map((c: any) => {
          const relDate = new Date(c.releasesAt || Date.now());
          return {
            id: c.id,
            mediaId: c.mediaId,
            mediaTitle: c.mediaTitle,
            posterUrl: c.mediaPosterUrl,
            episodeNumber: c.episodeNumber,
            dayOfWeek: relDate.getDay(),
            releaseTime: `${String(relDate.getHours()).padStart(2, '0')}:${String(
              relDate.getMinutes()
            ).padStart(2, '0')}`,
            audioType: c.audioLanguages?.includes('DUBBED') ? 'DUBLADO' : 'LEGENDADO',
            released: false,
          };
        });
      }
    } catch {
      // Fallback
    }
    return INITIAL_CALENDAR;
  }

  async fetchEpisodeComments(episodeId: string): Promise<CommentItem[]> {
    try {
      const comments = await this.request(`/episodes/${episodeId}/comments`);
      if (comments && comments.results && comments.results.length > 0) {
        return comments.results.map((c: any) => ({
          id: c.id,
          episodeId: c.episodeId || episodeId,
          userId: c.userId,
          username: c.user?.name || 'Otaku',
          avatarUrl: c.user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
          content: c.body,
          isSpoiler: false,
          likesCount: c.numLikes || 0,
          likedByMe: c.isLiked || false,
          createdAt: c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-BR') : 'Hoje',
        }));
      }
    } catch {
      // Fallback
    }
    return INITIAL_COMMENTS;
  }

  async claimTvDeviceCode(code: string): Promise<{ ok: boolean; deviceName: string }> {
    const cleanCode = code.trim().toUpperCase();
    return {
      ok: true,
      deviceName: `Smart TV Shinokai (${cleanCode.slice(0, 6)})`,
    };
  }
}

export const shinokaiApi = new ShinokaiApiClient();
