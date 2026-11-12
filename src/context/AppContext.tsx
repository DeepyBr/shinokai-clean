import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppSettings,
  CalendarReleaseItem,
  CommentItem,
  ContinueWatchingItem,
  DownloadItem,
  DownloadQuality,
  Episode,
  FriendUser,
  Media,
  NotificationItem,
  Playlist,
  UserProfile,
} from '../types';
import {
  DEFAULT_USER_PROFILE,
  INITIAL_CALENDAR,
  INITIAL_COMMENTS,
  INITIAL_CONTINUE_WATCHING,
  INITIAL_FRIENDS,
  INITIAL_MEDIAS,
  INITIAL_NOTIFICATIONS,
} from '../api/mockData';
import { shinokaiApi } from '../api/shinokaiApi';

const STORAGE_KEYS = {
  FAVORITES: '@shinokai/favorites',
  CONTINUE_WATCHING: '@shinokai/continue_watching',
  WATCHED_EPISODES: '@shinokai/watched_episodes',
  DOWNLOADS: '@shinokai/downloads',
  REMINDERS: '@shinokai/reminders',
  SETTINGS: '@shinokai/settings',
  USER: '@shinokai/user',
  RATINGS: '@shinokai/ratings',
  PLAYLISTS: '@shinokai/playlists',
};

const DEFAULT_SETTINGS: AppSettings = {
  autoPlayNext: true,
  autoSkipIntro: false,
  defaultQuality: '1080p',
  defaultAudio: 'LEGENDADO',
  showAdultContent: false,
  pushNotifications: true,
  episodeReleaseAlerts: true,
  commentReplyAlerts: true,
  cloudSyncEnabled: true,
};

interface AppContextValue {
  medias: Media[];
  calendar: CalendarReleaseItem[];
  favorites: string[];
  continueWatching: ContinueWatchingItem[];
  watchedEpisodes: string[];
  downloads: DownloadItem[];
  reminders: string[];
  comments: CommentItem[];
  notifications: NotificationItem[];
  friends: FriendUser[];
  user: UserProfile;
  settings: AppSettings;
  userRatings: Record<string, number>;
  playlists: Playlist[];
  unreadNotificationsCount: number;

  toggleFavorite: (mediaId: string) => void;
  isFavorite: (mediaId: string) => boolean;
  toggleReminder: (mediaId: string) => void;
  hasReminder: (mediaId: string) => boolean;
  rateMedia: (mediaId: string, stars: number) => void;

  updateWatchProgress: (media: Media, episode: Episode, watchedSec: number) => void;
  markEpisodeWatched: (media: Media, episode: Episode) => void;
  removeFromContinueWatching: (episodeId: string) => void;
  clearWatchHistory: () => void;

  startDownload: (media: Media, episode: Episode, quality?: DownloadQuality) => void;
  removeDownload: (episodeId: string) => void;
  togglePauseDownload: (episodeId: string) => void;

  addComment: (episodeId: string, content: string, isSpoiler: boolean) => void;
  toggleLikeComment: (commentId: string) => void;
  reportComment: (commentId: string, reason: string) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  acceptFriendRequest: (friendId: string) => void;
  removeFriendOrRequest: (friendId: string) => void;
  sendFriendRequest: (username: string) => void;

  // Playlists
  createPlaylist: (name: string, description: string) => void;
  deletePlaylist: (playlistId: string) => void;
  addMediaToPlaylist: (playlistId: string, mediaId: string) => void;
  removeMediaFromPlaylist: (playlistId: string, mediaId: string) => void;

  updateUserProfile: (patch: Partial<UserProfile>) => void;
  signInWithGoogle: () => void;
  signInAnonymously: () => void;
  syncWithGoogle: () => Promise<boolean>;
  signOut: () => void;
  connectTvWithCode: (code: string) => Promise<{ ok: boolean; deviceName: string }>;
  disconnectTv: () => void;

  updateSettings: (patch: Partial<AppSettings>) => void;
  getMediaById: (id: string) => Media | undefined;
  getEpisodeById: (episodeId: string) => { media: Media; episode: Episode } | undefined;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [medias, setMedias] = useState<Media[]>(INITIAL_MEDIAS);
  const [calendar, setCalendar] = useState<CalendarReleaseItem[]>(INITIAL_CALENDAR);
  const [favorites, setFavorites] = useState<string[]>(['solo-leveling', 'demon-slayer', 'frieren']);
  const [continueWatching, setContinueWatching] = useState<ContinueWatchingItem[]>(INITIAL_CONTINUE_WATCHING);
  const [watchedEpisodes, setWatchedEpisodes] = useState<string[]>([
    'solo-leveling-s1-ep1',
    'solo-leveling-s1-ep2',
    'demon-slayer-s1-ep1',
  ]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([
    {
      episodeId: 'solo-leveling-s1-ep1',
      mediaId: 'solo-leveling',
      mediaTitle: 'Solo Leveling',
      episodeNumber: 1,
      episodeTitle: 'Temporada 1 • Episódio 1 — A Batalha Decisiva',
      thumbnail: INITIAL_MEDIAS[0].bannerUrl,
      quality: '1080p',
      sizeMb: 312,
      progress: 100,
      status: 'COMPLETED',
      localUri: INITIAL_MEDIAS[0].episodes[0].streamUrl,
      downloadedAt: 'Hoje',
    },
  ]);
  const [reminders, setReminders] = useState<string[]>(['solo-leveling', 'one-piece']);
  const [comments, setComments] = useState<CommentItem[]>(INITIAL_COMMENTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [friends, setFriends] = useState<FriendUser[]>(INITIAL_FRIENDS);
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER_PROFILE);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [playlists, setPlaylists] = useState<Playlist[]>(DEFAULT_USER_PROFILE.playlists);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({
    'solo-leveling': 5,
    'demon-slayer': 5,
    'frieren': 5,
  });

  useEffect(() => {
    (async () => {
      try {
        const [favRaw, cwRaw, watchedRaw, dlRaw, remRaw, setRaw, usrRaw, ratRaw, plRaw] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
          AsyncStorage.getItem(STORAGE_KEYS.CONTINUE_WATCHING),
          AsyncStorage.getItem(STORAGE_KEYS.WATCHED_EPISODES),
          AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADS),
          AsyncStorage.getItem(STORAGE_KEYS.REMINDERS),
          AsyncStorage.getItem(STORAGE_KEYS.SETTINGS),
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.RATINGS),
          AsyncStorage.getItem(STORAGE_KEYS.PLAYLISTS),
        ]);
        if (favRaw) setFavorites(JSON.parse(favRaw));
        if (cwRaw) setContinueWatching(JSON.parse(cwRaw));
        if (watchedRaw) setWatchedEpisodes(JSON.parse(watchedRaw));
        if (dlRaw) setDownloads(JSON.parse(dlRaw));
        if (remRaw) setReminders(JSON.parse(remRaw));
        if (setRaw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(setRaw) });
        if (usrRaw) setUser(JSON.parse(usrRaw));
        if (ratRaw) setUserRatings(JSON.parse(ratRaw));
        if (plRaw) setPlaylists(JSON.parse(plRaw));
      } catch {
        // Keep initial defaults if storage is empty
      }

      const [remoteCatalog, remoteCalendar] = await Promise.all([
        shinokaiApi.fetchCatalog(),
        shinokaiApi.fetchReleaseCalendar(),
      ]);
      setMedias(remoteCatalog);
      setCalendar(remoteCalendar);
    })();
  }, []);

  // Simulate active downloads progressing smoothly
  useEffect(() => {
    const hasActive = downloads.some((d) => d.status === 'DOWNLOADING');
    if (!hasActive) return;

    const timer = setInterval(() => {
      setDownloads((prev) => {
        const next = prev.map((item) => {
          if (item.status !== 'DOWNLOADING') return item;
          const nextProg = Math.min(100, item.progress + 20);
          return {
            ...item,
            progress: nextProg,
            status: nextProg >= 100 ? ('COMPLETED' as const) : ('DOWNLOADING' as const),
          };
        });
        AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify(next)).catch(() => {});
        return next;
      });
    }, 900);

    return () => clearInterval(timer);
  }, [downloads]);

  const toggleFavorite = (mediaId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(mediaId) ? prev.filter((id) => id !== mediaId) : [mediaId, ...prev];
      AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const isFavorite = (mediaId: string) => favorites.includes(mediaId);

  const toggleReminder = (mediaId: string) => {
    setReminders((prev) => {
      const next = prev.includes(mediaId) ? prev.filter((id) => id !== mediaId) : [...prev, mediaId];
      AsyncStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const hasReminder = (mediaId: string) => reminders.includes(mediaId);

  const rateMedia = (mediaId: string, stars: number) => {
    setUserRatings((prev) => {
      const next = { ...prev, [mediaId]: stars };
      AsyncStorage.setItem(STORAGE_KEYS.RATINGS, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const updateWatchProgress = (media: Media, episode: Episode, watchedSec: number) => {
    setContinueWatching((prev) => {
      const filtered = prev.filter((item) => item.episodeId !== episode.id);
      const entry: ContinueWatchingItem = {
        episodeId: episode.id,
        mediaId: media.id,
        mediaTitle: media.title,
        episodeNumber: episode.number,
        episodeTitle: episode.title,
        thumbnail: episode.thumbnail || media.bannerUrl,
        watchedSec: Math.min(watchedSec, episode.durationSec),
        durationSec: episode.durationSec,
        updatedAt: 'Agora mesmo',
      };
      const next = [entry, ...filtered];
      AsyncStorage.setItem(STORAGE_KEYS.CONTINUE_WATCHING, JSON.stringify(next)).catch(() => {});
      return next;
    });

    if (watchedSec / episode.durationSec >= 0.85) {
      markEpisodeWatched(media, episode);
    }
  };

  const markEpisodeWatched = (_media: Media, episode: Episode) => {
    setWatchedEpisodes((prev) => {
      if (prev.includes(episode.id)) return prev;
      const next = [...prev, episode.id];
      AsyncStorage.setItem(STORAGE_KEYS.WATCHED_EPISODES, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const removeFromContinueWatching = (episodeId: string) => {
    setContinueWatching((prev) => {
      const next = prev.filter((item) => item.episodeId !== episodeId);
      AsyncStorage.setItem(STORAGE_KEYS.CONTINUE_WATCHING, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const clearWatchHistory = () => {
    setContinueWatching([]);
    setWatchedEpisodes([]);
    AsyncStorage.removeItem(STORAGE_KEYS.CONTINUE_WATCHING).catch(() => {});
    AsyncStorage.removeItem(STORAGE_KEYS.WATCHED_EPISODES).catch(() => {});
  };

  const startDownload = (media: Media, episode: Episode, quality?: DownloadQuality) => {
    const selectedQuality = quality || settings.defaultQuality;
    const sizeByQuality: Record<DownloadQuality, number> = {
      '1080p': 320,
      '720p': 185,
      '480p': 95,
    };

    setDownloads((prev) => {
      const existing = prev.find((d) => d.episodeId === episode.id);
      if (existing) return prev;
      const newItem: DownloadItem = {
        episodeId: episode.id,
        mediaId: media.id,
        mediaTitle: media.title,
        episodeNumber: episode.number,
        episodeTitle: episode.title,
        thumbnail: episode.thumbnail || media.bannerUrl,
        quality: selectedQuality,
        sizeMb: sizeByQuality[selectedQuality],
        progress: 15,
        status: 'DOWNLOADING',
        localUri: episode.streamUrl,
        downloadedAt: 'Hoje',
      };
      const next = [newItem, ...prev];
      AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const removeDownload = (episodeId: string) => {
    setDownloads((prev) => {
      const next = prev.filter((d) => d.episodeId !== episodeId);
      AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const togglePauseDownload = (episodeId: string) => {
    setDownloads((prev) => {
      const next = prev.map((d) => {
        if (d.episodeId !== episodeId || d.status === 'COMPLETED') return d;
        return {
          ...d,
          status: d.status === 'PAUSED' ? ('DOWNLOADING' as const) : ('PAUSED' as const),
        };
      });
      AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADS, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const addComment = (episodeId: string, content: string, isSpoiler: boolean) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const newComment: CommentItem = {
      id: `c-${Date.now()}`,
      episodeId,
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      content: trimmed,
      isSpoiler,
      likesCount: 0,
      likedByMe: false,
      createdAt: 'Agora mesmo',
    };
    setComments((prev) => [newComment, ...prev]);
  };

  const toggleLikeComment = (commentId: string) => {
    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const nextLiked = !c.likedByMe;
        return {
          ...c,
          likedByMe: nextLiked,
          likesCount: nextLiked ? c.likesCount + 1 : Math.max(0, c.likesCount - 1),
        };
      })
    );
  };

  const reportComment = (_commentId: string, _reason: string) => {};

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const acceptFriendRequest = (friendId: string) => {
    setFriends((prev) =>
      prev.map((f) => (f.id === friendId ? { ...f, relation: 'FRIEND' as const, isOnline: true } : f))
    );
  };

  const removeFriendOrRequest = (friendId: string) => {
    setFriends((prev) => prev.filter((f) => f.id !== friendId));
  };

  const sendFriendRequest = (username: string) => {
    const clean = username.trim().replace(/^@/, '');
    if (!clean) return;
    const newFriend: FriendUser = {
      id: `f-${Date.now()}`,
      username: clean.toLowerCase(),
      displayName: clean,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
      statusText: 'Convite enviado',
      isOnline: false,
      relation: 'PENDING_SENT',
    };
    setFriends((prev) => [newFriend, ...prev]);
  };

  // Playlists Management
  const createPlaylist = (name: string, description: string) => {
    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      name: name.trim() || 'Minha Playlist',
      description: description.trim() || 'Lista personalizada de animes',
      mediaIds: [],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setPlaylists((prev) => {
      const next = [newPl, ...prev];
      AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => {
      const next = prev.filter((p) => p.id !== playlistId);
      AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const addMediaToPlaylist = (playlistId: string, mediaId: string) => {
    setPlaylists((prev) => {
      const next = prev.map((p) => {
        if (p.id !== playlistId) return p;
        if (p.mediaIds.includes(mediaId)) return p;
        return {
          ...p,
          mediaIds: [mediaId, ...p.mediaIds],
          updatedAt: new Date().toISOString().split('T')[0],
        };
      });
      AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const removeMediaFromPlaylist = (playlistId: string, mediaId: string) => {
    setPlaylists((prev) => {
      const next = prev.map((p) => {
        if (p.id !== playlistId) return p;
        return {
          ...p,
          mediaIds: p.mediaIds.filter((id) => id !== mediaId),
          updatedAt: new Date().toISOString().split('T')[0],
        };
      });
      AsyncStorage.setItem(STORAGE_KEYS.PLAYLISTS, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const updateUserProfile = (patch: Partial<UserProfile>) => {
    setUser((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const signInWithGoogle = () => {
    updateUserProfile({
      isGuest: false,
      isGoogleLinked: true,
      googleEmail: 'gianprivadobr@gmail.com',
      displayName: 'Gian (Google)',
      username: 'gian_shinokai',
      lastSyncedAt: 'Agora mesmo',
    });
  };

  const syncWithGoogle = async (): Promise<boolean> => {
    // Save snapshot of all user state
    const cloudPayload = {
      user,
      favorites,
      playlists,
      settings,
      continueWatching,
      watchedEpisodes,
      userRatings,
      syncedAt: new Date().toISOString(),
    };
    await AsyncStorage.setItem('@shinokai/cloud_backup', JSON.stringify(cloudPayload));
    updateUserProfile({ lastSyncedAt: 'Agora mesmo' });
    return true;
  };

  const signInAnonymously = () => {
    updateUserProfile({
      isGuest: true,
      isGoogleLinked: false,
      displayName: 'Visitante Anônimo',
      username: 'guest_shinokai',
      email: undefined,
    });
  };

  const signOut = () => {
    signInAnonymously();
  };

  const connectTvWithCode = async (code: string) => {
    const result = await shinokaiApi.claimTvDeviceCode(code);
    if (result.ok) {
      updateUserProfile({ connectedTvName: result.deviceName });
    }
    return result;
  };

  const disconnectTv = () => {
    updateUserProfile({ connectedTvName: undefined });
  };

  const updateSettings = (patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const getMediaById = (id: string) => medias.find((m) => m.id === id);

  const getEpisodeById = (episodeId: string) => {
    for (const media of medias) {
      const ep =
        media.episodes.find((e) => e.id === episodeId) ||
        media.movies?.find((m) => m.id === episodeId);
      if (ep) return { media, episode: ep };
    }
    return undefined;
  };

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return (
    <AppContext.Provider
      value={{
        medias,
        calendar,
        favorites,
        continueWatching,
        watchedEpisodes,
        downloads,
        reminders,
        comments,
        notifications,
        friends,
        user,
        settings,
        userRatings,
        playlists,
        unreadNotificationsCount,
        toggleFavorite,
        isFavorite,
        toggleReminder,
        hasReminder,
        rateMedia,
        updateWatchProgress,
        markEpisodeWatched,
        removeFromContinueWatching,
        clearWatchHistory,
        startDownload,
        removeDownload,
        togglePauseDownload,
        addComment,
        toggleLikeComment,
        reportComment,
        markNotificationRead,
        markAllNotificationsRead,
        acceptFriendRequest,
        removeFriendOrRequest,
        sendFriendRequest,
        createPlaylist,
        deletePlaylist,
        addMediaToPlaylist,
        removeMediaFromPlaylist,
        updateUserProfile,
        signInWithGoogle,
        signInAnonymously,
        syncWithGoogle,
        signOut,
        connectTvWithCode,
        disconnectTv,
        updateSettings,
        getMediaById,
        getEpisodeById,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
