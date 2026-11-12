import { CalendarReleaseItem, Media } from '../types';

const ANILIST_URL = 'https://graphql.anilist.co';

const GENRE_MAP: Record<string, string> = {
  Action: 'Ação',
  Adventure: 'Aventura',
  Comedy: 'Comédia',
  Drama: 'Drama',
  Fantasy: 'Fantasia',
  Horror: 'Terror',
  Mystery: 'Mistério',
  Psychological: 'Psicológico',
  Romance: 'Romance',
  'Sci-Fi': 'Ficção Científica',
  'Slice of Life': 'Cotidiano',
  Sports: 'Esportes',
  Supernatural: 'Sobrenatural',
  Thriller: 'Suspense',
};

const STREAM_URLS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
];

interface AniListRawMedia {
  id: number;
  title: {
    romaji: string;
    english: string | null;
  };
  description: string | null;
  coverImage: {
    extraLarge: string | null;
    large: string;
  };
  bannerImage: string | null;
  averageScore: number | null;
  seasonYear: number | null;
  format: string | null;
  status: string | null;
  episodes: number | null;
  genres: string[];
  studios: {
    nodes: { name: string }[];
  };
}

function mapAniListMedia(raw: AniListRawMedia, idx: number): Media {
  const title = raw.title.english || raw.title.romaji || 'Anime';
  const originalTitle = raw.title.romaji || title;
  const cleanDesc = (raw.description || `Sinopse completa de ${title}.`)
    .replace(/<[^>]+>/g, '')
    .replace(/\n+/g, ' ')
    .trim();

  const posterUrl = raw.coverImage.extraLarge || raw.coverImage.large;
  const bannerUrl = raw.bannerImage || posterUrl;
  const rating = Number(((raw.averageScore || 85) / 20.0).toFixed(2));
  const releaseYear = raw.seasonYear || 2024;

  const format =
    raw.format === 'MOVIE' || raw.format === 'OVA' || raw.format === 'ONA'
      ? raw.format
      : 'TV';

  const status =
    raw.status === 'RELEASING'
      ? 'RELEASING'
      : raw.status === 'NOT_YET_RELEASED'
      ? 'UPCOMING'
      : 'FINISHED';

  const epCount = raw.episodes || (format === 'MOVIE' ? 1 : 12);
  const displayCount = Math.max(1, Math.min(24, epCount));
  const seasons = displayCount > 12 ? [1, 2] : [1];

  const genres = (raw.genres || ['Ação']).map((g) => GENRE_MAP[g] || g);
  const studio = raw.studios?.nodes?.[0]?.name || 'Animation Studio';
  const audioType = idx % 2 === 0 ? 'DUAL_AUDIO' : 'LEGENDADO';
  const ageRating =
    genres.includes('Terror') || genres.includes('Psicológico')
      ? '16'
      : idx % 3 === 0
      ? '14'
      : '12';

  const mediaId = String(raw.id);
  const streamUrl = STREAM_URLS[idx % STREAM_URLS.length];

  const episodes = Array.from({ length: displayCount }, (_, i) => {
    const epNum = i + 1;
    const seasonNumber = epNum > 12 ? 2 : 1;
    return {
      id: `${mediaId}-ep-${epNum}`,
      mediaId,
      seasonNumber,
      number: epNum,
      title: `Episódio ${epNum} — O Despertar da Jornada`,
      synopsis: `Em ${title}, novos acontecimentos colocam os protagonistas à prova no episódio ${epNum}.`,
      thumbnail: bannerUrl,
      durationSec: format === 'MOVIE' ? 6300 : 1420,
      introStartSec: format === 'MOVIE' ? undefined : 85,
      introEndSec: format === 'MOVIE' ? undefined : 175,
      releaseDate: `${releaseYear}-04-10`,
      streamUrl,
      audioTracks: [
        { id: 'jp', label: 'Japonês (Original)', language: 'ja-JP' },
        { id: 'pt', label: 'Português (Dublado)', language: 'pt-BR' },
      ],
      subtitleTracks: [
        { id: 'pt-br', label: 'Português (Brasil)', language: 'pt-BR' },
        { id: 'off', label: 'Desativado', language: 'none' },
      ],
      likesCount: 150 + epNum * 12,
    };
  });

  return {
    id: mediaId,
    title,
    originalTitle,
    synopsis: cleanDesc,
    posterUrl,
    bannerUrl,
    rating,
    releaseYear,
    format,
    status,
    audioType,
    ageRating,
    studio,
    genres,
    totalEpisodes: epCount,
    seasons,
    episodes,
  };
}

export const anilistApi = {
  async fetchLiveCatalog(page = 1, perPage = 35): Promise<Media[]> {
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(sort: TRENDING_DESC, type: ANIME, isAdult: false) {
            id
            title {
              romaji
              english
            }
            description(asHtml: false)
            coverImage {
              extraLarge
              large
            }
            bannerImage
            averageScore
            seasonYear
            format
            status
            episodes
            genres
            studios(isMain: true) {
              nodes {
                name
              }
            }
          }
        }
      }
    `;

    try {
      const res = await fetch(ANILIST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ query, variables: { page, perPage } }),
      });

      if (!res.ok) return [];
      const json = await res.json();
      const rawList: AniListRawMedia[] = json?.data?.Page?.media || [];
      return rawList.map((item, idx) => mapAniListMedia(item, idx));
    } catch {
      return [];
    }
  },

  async searchLive(queryText: string): Promise<Media[]> {
    if (!queryText.trim()) return [];
    const query = `
      query ($search: String) {
        Page(page: 1, perPage: 25) {
          media(search: $search, type: ANIME, isAdult: false) {
            id
            title {
              romaji
              english
            }
            description(asHtml: false)
            coverImage {
              extraLarge
              large
            }
            bannerImage
            averageScore
            seasonYear
            format
            status
            episodes
            genres
            studios(isMain: true) {
              nodes {
                name
              }
            }
          }
        }
      }
    `;

    try {
      const res = await fetch(ANILIST_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ query, variables: { search: queryText } }),
      });

      if (!res.ok) return [];
      const json = await res.json();
      const rawList: AniListRawMedia[] = json?.data?.Page?.media || [];
      return rawList.map((item, idx) => mapAniListMedia(item, idx));
    } catch {
      return [];
    }
  },
};
