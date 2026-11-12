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

export const API_BASE_URL = 'https://api-prod.shinokai.online';

async function safeFetchJson<T>(path: string, options?: RequestInit): Promise<T | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export const shinokaiApi = {
  async fetchCatalog(): Promise<Media[]> {
    const remote = await safeFetchJson<{ items?: Media[] }>('/home');
    if (remote?.items && Array.isArray(remote.items) && remote.items.length > 0) {
      return remote.items;
    }
    return INITIAL_MEDIAS;
  },

  async fetchReleaseCalendar(): Promise<CalendarReleaseItem[]> {
    const remote = await safeFetchJson<{ items?: CalendarReleaseItem[] }>('/release-calendar');
    if (remote?.items && Array.isArray(remote.items) && remote.items.length > 0) {
      return remote.items;
    }
    return INITIAL_CALENDAR;
  },

  async fetchEpisodeComments(episodeId: string): Promise<CommentItem[]> {
    const remote = await safeFetchJson<{ items?: CommentItem[] }>(`/comments?episodeId=${encodeURIComponent(episodeId)}`);
    if (remote?.items && Array.isArray(remote.items)) {
      return remote.items;
    }
    return INITIAL_COMMENTS;
  },

  async claimTvDeviceCode(code: string, token?: string): Promise<{ ok: boolean; deviceName: string }> {
    const cleanCode = code.trim().toUpperCase();
    const remote = await safeFetchJson<{ deviceName?: string }>('/auth/devices/claim', {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: JSON.stringify({ code: cleanCode }),
    });
    if (remote?.deviceName) {
      return { ok: true, deviceName: remote.deviceName };
    }
    return {
      ok: true,
      deviceName: `Smart TV Shinokai (${cleanCode.slice(0, 6)})`,
    };
  },
};
