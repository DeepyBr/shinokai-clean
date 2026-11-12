export type MediaFormat = 'TV' | 'MOVIE' | 'OVA' | 'ONA';
export type MediaStatus = 'RELEASING' | 'FINISHED' | 'UPCOMING';
export type AudioLanguage = 'LEGENDADO' | 'DUBLADO' | 'DUAL_AUDIO';
export type DownloadQuality = '1080p' | '720p' | '480p';

export interface StreamServer {
  id: string;
  name: string;
  url: string;
  type: 'MP4' | 'HLS' | 'EMBED';
  quality: string;
}

export interface Episode {
  id: string;
  mediaId: string;
  seasonNumber: number; // 1, 2, 3... or 0 for Movies/OVAs
  number: number;
  title: string;
  synopsis: string;
  thumbnail: string;
  durationSec: number;
  introStartSec?: number;
  introEndSec?: number;
  releaseDate: string;
  streamUrl: string;
  servers?: StreamServer[];
  isMovie?: boolean;
  audioTracks: { id: string; label: string; language: string }[];
  subtitleTracks: { id: string; label: string; language: string }[];
  likesCount: number;
}

export interface Media {
  id: string;
  title: string;
  originalTitle: string;
  synopsis: string;
  posterUrl: string;
  bannerUrl: string;
  rating: number;
  releaseYear: number;
  format: MediaFormat;
  status: MediaStatus;
  audioType: AudioLanguage;
  ageRating: 'L' | '12' | '14' | '16' | '18';
  isAdult?: boolean;
  studio: string;
  genres: string[];
  totalEpisodes: number;
  seasons: number[]; // e.g. [1, 2, 3]
  episodes: Episode[];
  movies?: Episode[]; // Consolidated movies/OVAs for this anime
}

export interface ContinueWatchingItem {
  episodeId: string;
  mediaId: string;
  mediaTitle: string;
  episodeNumber: number;
  episodeTitle: string;
  thumbnail: string;
  watchedSec: number;
  durationSec: number;
  updatedAt: string;
}

export interface CalendarReleaseItem {
  id: string;
  mediaId: string;
  mediaTitle: string;
  posterUrl: string;
  episodeNumber: number;
  dayOfWeek: number; // 0 (Dom) - 6 (Sab)
  releaseTime: string; // e.g. "14:30"
  audioType: AudioLanguage;
  released: boolean;
}

export interface CommentItem {
  id: string;
  episodeId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  content: string;
  isSpoiler: boolean;
  likesCount: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface DownloadItem {
  episodeId: string;
  mediaId: string;
  mediaTitle: string;
  episodeNumber: number;
  episodeTitle: string;
  thumbnail: string;
  quality: DownloadQuality;
  sizeMb: number;
  progress: number;
  status: 'DOWNLOADING' | 'COMPLETED' | 'PAUSED' | 'ERROR';
  localUri: string;
  downloadedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  mediaId?: string;
  episodeId?: string;
  read: boolean;
  createdAt: string;
}

export interface FriendUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  statusText: string;
  currentlyWatching?: string;
  isOnline: boolean;
  relation: 'FRIEND' | 'PENDING_RECEIVED' | 'PENDING_SENT' | 'NONE';
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverUrl?: string;
  mediaIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatarUrl: string;
  bannerUrl: string;
  isGuest: boolean;
  isGoogleLinked: boolean;
  googleEmail?: string;
  lastSyncedAt?: string;
  episodesWatched: number;
  hoursWatched: number;
  completedAnimes: number;
  connectedTvName?: string;
  playlists: Playlist[];
}

export interface AppSettings {
  autoPlayNext: boolean;
  autoSkipIntro: boolean;
  defaultQuality: DownloadQuality;
  defaultAudio: 'LEGENDADO' | 'DUBLADO';
  showAdultContent: boolean;
  pushNotifications: boolean;
  episodeReleaseAlerts: boolean;
  commentReplyAlerts: boolean;
  cloudSyncEnabled: boolean;
}

export interface SearchFilters {
  query: string;
  genre: string | null;
  format: MediaFormat | null;
  status: MediaStatus | null;
  audioType: AudioLanguage | null;
  releaseYear: number | null;
  sortBy: 'POPULAR' | 'RATING' | 'RECENT' | 'AZ';
}
