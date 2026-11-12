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
import { anilistApi } from './anilistApi';

export const shinokaiApi = {
  async fetchCatalog(): Promise<Media[]> {
    try {
      const live = await anilistApi.fetchLiveCatalog(1, 35);
      if (live && live.length > 0) {
        // Merge with initial so all IDs are preserved
        const liveIds = new Set(live.map((m) => m.id));
        const merged = [...live, ...INITIAL_MEDIAS.filter((m) => !liveIds.has(m.id))];
        return merged;
      }
    } catch {
      // Fallback
    }
    return INITIAL_MEDIAS;
  },

  async searchCatalog(query: string): Promise<Media[]> {
    if (!query.trim()) return [];
    try {
      const live = await anilistApi.searchLive(query);
      if (live && live.length > 0) return live;
    } catch {}
    const q = query.toLowerCase();
    return INITIAL_MEDIAS.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.originalTitle.toLowerCase().includes(q) ||
        m.genres.some((g) => g.toLowerCase().includes(q))
    );
  },

  async fetchReleaseCalendar(): Promise<CalendarReleaseItem[]> {
    return INITIAL_CALENDAR;
  },

  async fetchEpisodeComments(episodeId: string): Promise<CommentItem[]> {
    return INITIAL_COMMENTS;
  },

  async claimTvDeviceCode(code: string): Promise<{ ok: boolean; deviceName: string }> {
    const cleanCode = code.trim().toUpperCase();
    return {
      ok: true,
      deviceName: `Smart TV Shinokai (${cleanCode.slice(0, 6)})`,
    };
  },
};
