import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { Colors, Fonts } from '../../src/theme/colors';
import { DownloadQuality, Episode } from '../../src/types';
import { PosterCard } from '../../src/components/PosterCard';

export default function MediaDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    medias,
    getMediaById,
    isFavorite,
    toggleFavorite,
    hasReminder,
    toggleReminder,
    watchedEpisodes,
    downloads,
    startDownload,
    userRatings,
    rateMedia,
    playlists,
    createPlaylist,
    addMediaToPlaylist,
    removeMediaFromPlaylist,
  } = useApp();

  const media = getMediaById(id || '') || medias[0];
  const [selectedSeason, setSelectedSeason] = useState<number | 'MOVIES'>(media?.seasons[0] || 1);
  const [sortDesc, setSortDesc] = useState(false);
  const [coverModal, setCoverModal] = useState(false);
  const [downloadTargetEp, setDownloadTargetEp] = useState<Episode | null>(null);
  const [playlistModal, setPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    if (media?.seasons?.length) {
      setSelectedSeason(media.seasons[0]);
    }
  }, [media?.id]);

  const seasonEpisodes = useMemo(() => {
    if (selectedSeason === 'MOVIES') {
      const list = media.movies || [];
      return sortDesc ? [...list].reverse() : list;
    }
    const list = media.episodes.filter((ep) => ep.seasonNumber === selectedSeason);
    const base = list.length > 0 ? list : media.episodes;
    return sortDesc ? [...base].reverse() : base;
  }, [media, selectedSeason, sortDesc]);

  const relatedMedias = useMemo(
    () => medias.filter((m) => m.id !== media.id),
    [medias, media.id]
  );

  const myStars = userRatings[media.id] || 0;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Estou assistindo "${media.title}" no Shinokai e lembrei de você! 🍿`,
      });
    } catch {
      // Ignore cancel
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Banner */}
        <ImageBackground
          source={{ uri: media.bannerUrl }}
          style={styles.banner}
          resizeMode="cover"
        >
          <View style={styles.bannerOverlay}>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={22} color={Colors.text} />
            </Pressable>
          </View>
        </ImageBackground>

        {/* Poster + Title Info */}
        <View style={styles.mainHeader}>
          <Pressable onPress={() => setCoverModal(true)}>
            <Image source={{ uri: media.posterUrl }} style={styles.poster} />
          </Pressable>
          <View style={styles.headerMeta}>
            <View style={styles.badgesRow}>
              <View style={styles.ageBadge}>
                <Text style={styles.badgeText}>+{media.ageRating}</Text>
              </View>
              <View style={styles.formatBadge}>
                <Text style={styles.badgeText}>{media.format}</Text>
              </View>
              <View style={styles.ratingChip}>
                <Ionicons name="star" size={12} color={Colors.warning} />
                <Text style={styles.ratingText}>{media.rating.toFixed(2)}</Text>
              </View>
            </View>

            <Text style={styles.title}>{media.title}</Text>
            <Text style={styles.originalTitle} numberOfLines={1}>
              {media.originalTitle}
            </Text>
            <Text style={styles.studioText}>
              {media.studio} • {media.releaseYear}
            </Text>
          </View>
        </View>

        {/* Primary Play & Action Buttons */}
        <View style={styles.actionsSection}>
          <Pressable
            style={styles.playMainBtn}
            onPress={() => router.push(`/player/${media.episodes[0].id}`)}
          >
            <Ionicons name="play" size={20} color={Colors.text} />
            <Text style={styles.playMainText}>Assistir Episódio 1</Text>
          </Pressable>

          <View style={styles.quickActionRow}>
            <Pressable
              style={styles.quickActionItem}
              onPress={() => toggleFavorite(media.id)}
            >
              <Ionicons
                name={isFavorite(media.id) ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={isFavorite(media.id) ? Colors.primary : Colors.text}
              />
              <Text style={styles.quickActionLabel}>
                {isFavorite(media.id) ? 'Na Lista' : 'Minha Lista'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.quickActionItem}
              onPress={() => toggleReminder(media.id)}
            >
              <Ionicons
                name={hasReminder(media.id) ? 'notifications' : 'notifications-outline'}
                size={22}
                color={hasReminder(media.id) ? Colors.primaryAccent : Colors.text}
              />
              <Text style={styles.quickActionLabel}>
                {hasReminder(media.id) ? 'Lembrete' : 'Lembrar'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.quickActionItem}
              onPress={() => setPlaylistModal(true)}
            >
              <Ionicons name="folder-outline" size={22} color={Colors.text} />
              <Text style={styles.quickActionLabel}>Playlists</Text>
            </Pressable>

            <Pressable style={styles.quickActionItem} onPress={handleShare}>
              <Ionicons name="share-social-outline" size={22} color={Colors.text} />
              <Text style={styles.quickActionLabel}>Compartilhar</Text>
            </Pressable>
          </View>
        </View>

        {/* Synopsis & Genres */}
        <View style={styles.synopsisBox}>
          <View style={styles.genresRow}>
            {media.genres.map((g) => (
              <View key={g} style={styles.genreTag}>
                <Text style={styles.genreTagText}>{g}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.synopsisText}>{media.synopsis}</Text>

          {/* User Star Rating */}
          <View style={styles.rateBox}>
            <Text style={styles.rateLabel}>Sua avaliação:</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => rateMedia(media.id, star)}
                  hitSlop={6}
                >
                  <Ionicons
                    name={star <= myStars ? 'star' : 'star-outline'}
                    size={22}
                    color={Colors.warning}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Season & Movies Selector Header */}
        <View style={styles.episodesHeader}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.seasonTabs}
          >
            {media.seasons.map((s) => {
              const active = selectedSeason === s;
              return (
                <Pressable
                  key={s}
                  style={[styles.seasonBtn, active && styles.seasonBtnActive]}
                  onPress={() => setSelectedSeason(s)}
                >
                  <Text style={[styles.seasonBtnText, active && styles.seasonBtnTextActive]}>
                    Temporada {s}
                  </Text>
                </Pressable>
              );
            })}

            {media.movies && media.movies.length > 0 && (
              <Pressable
                style={[styles.seasonBtn, selectedSeason === 'MOVIES' && styles.seasonBtnActive]}
                onPress={() => setSelectedSeason('MOVIES')}
              >
                <Text
                  style={[
                    styles.seasonBtnText,
                    selectedSeason === 'MOVIES' && styles.seasonBtnTextActive,
                  ]}
                >
                  🎬 Filmes ({media.movies.length})
                </Text>
              </Pressable>
            )}
          </ScrollView>

          <Pressable style={styles.sortBtn} onPress={() => setSortDesc((v) => !v)}>
            <Ionicons name="swap-vertical" size={16} color={Colors.textSecondary} />
            <Text style={styles.sortBtnText}>{sortDesc ? 'Recentes' : 'Ordem'}</Text>
          </Pressable>
        </View>

        {/* Episode List */}
        <View style={styles.epList}>
          {seasonEpisodes.map((ep) => {
            const watched = watchedEpisodes.includes(ep.id);
            const dlItem = downloads.find((d) => d.episodeId === ep.id);
            return (
              <Pressable
                key={ep.id}
                style={styles.epCard}
                onPress={() => router.push(`/player/${ep.id}`)}
              >
                <View style={styles.epThumbWrap}>
                  <Image source={{ uri: ep.thumbnail }} style={styles.epThumb} />
                  <View style={styles.epPlayIcon}>
                    <Ionicons name="play" size={16} color={Colors.text} />
                  </View>
                  {watched && (
                    <View style={styles.watchedPill}>
                      <Text style={styles.watchedPillText}>ASSISTIDO</Text>
                    </View>
                  )}
                </View>

                <View style={styles.epInfo}>
                  <Text style={styles.epTitle} numberOfLines={1}>
                    {ep.isMovie ? '🎬 ' : `${ep.number}. `}{ep.title}
                  </Text>
                  <Text style={styles.epDuration}>
                    {Math.round(ep.durationSec / 60)} min • {ep.isMovie ? 'Filme / Especial' : 'Dub / Leg'}
                  </Text>
                  <Text style={styles.epDesc} numberOfLines={2}>
                    {ep.synopsis}
                  </Text>
                </View>

                <Pressable
                  style={styles.dlBtn}
                  onPress={() => setDownloadTargetEp(ep)}
                  hitSlop={8}
                >
                  <Ionicons
                    name={
                      dlItem?.status === 'COMPLETED'
                        ? 'checkmark-circle'
                        : dlItem
                        ? 'cloud-download'
                        : 'download-outline'
                    }
                    size={22}
                    color={dlItem ? Colors.success : Colors.textSecondary}
                  />
                </Pressable>
              </Pressable>
            );
          })}
        </View>

        {/* Related Animes */}
        <View style={styles.relatedSection}>
          <Text style={styles.relatedTitle}>Obras Semelhantes</Text>
          <FlatList
            horizontal
            data={relatedMedias}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <PosterCard media={item} onPress={() => router.push(`/media/${item.id}`)} />
            )}
          />
        </View>
      </ScrollView>

      {/* CoverPreviewModal */}
      <Modal
        visible={coverModal}
        transparent
        animationType="fade"
        onRequestClose={() => setCoverModal(false)}
      >
        <Pressable style={styles.coverModalBg} onPress={() => setCoverModal(false)}>
          <Image
            source={{ uri: media.posterUrl }}
            style={styles.coverFullImage}
            resizeMode="contain"
          />
        </Pressable>
      </Modal>

      {/* PlaylistManagementBottomSheet */}
      <Modal
        visible={playlistModal}
        transparent
        animationType="slide"
        onRequestClose={() => setPlaylistModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPlaylistModal(false)}>
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitle}>Salvar em Playlist</Text>
                <Text style={styles.modalSub}>
                  Adicione &quot;{media.title}&quot; a uma ou mais playlists
                </Text>
              </View>
              <Pressable onPress={() => setPlaylistModal(false)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </Pressable>
            </View>

            {/* Existing Playlists */}
            <ScrollView style={{ maxHeight: 220, marginBottom: 12 }}>
              {playlists.map((pl) => {
                const isInPlaylist = pl.mediaIds.includes(media.id);
                return (
                  <Pressable
                    key={pl.id}
                    style={styles.playlistRow}
                    onPress={() => {
                      if (isInPlaylist) {
                        removeMediaFromPlaylist(pl.id, media.id);
                      } else {
                        addMediaToPlaylist(pl.id, media.id);
                      }
                    }}
                  >
                    <View style={styles.playlistLeft}>
                      <Ionicons
                        name={isInPlaylist ? 'checkbox' : 'square-outline'}
                        size={22}
                        color={isInPlaylist ? Colors.primary : Colors.textMuted}
                      />
                      <View>
                        <Text style={styles.playlistName}>{pl.name}</Text>
                        <Text style={styles.playlistCount}>
                          {pl.mediaIds.length} {pl.mediaIds.length === 1 ? 'anime' : 'animes'}
                        </Text>
                      </View>
                    </View>
                    {isInPlaylist && (
                      <Ionicons name="checkmark" size={18} color={Colors.primary} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Create New Playlist Inline */}
            <View style={styles.newPlaylistRow}>
              <TextInput
                style={styles.newPlaylistInput}
                placeholder="Nova playlist (ex: Favoritos da Madrugada)..."
                placeholderTextColor={Colors.textMuted}
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
              />
              <Pressable
                style={[
                  styles.newPlaylistBtn,
                  !newPlaylistName.trim() && { opacity: 0.5 },
                ]}
                disabled={!newPlaylistName.trim()}
                onPress={() => {
                  if (newPlaylistName.trim()) {
                    createPlaylist(newPlaylistName.trim(), 'Criada pelo usuário');
                    setNewPlaylistName('');
                  }
                }}
              >
                <Ionicons name="add" size={18} color={Colors.text} />
                <Text style={styles.newPlaylistBtnText}>Criar</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* DownloadOptionBottomSheet */}
      <Modal
        visible={!!downloadTargetEp}
        transparent
        animationType="slide"
        onRequestClose={() => setDownloadTargetEp(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setDownloadTargetEp(null)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Baixar para Assistir Offline</Text>
            <Text style={styles.modalSub}>
              Episódio {downloadTargetEp?.number} — Escolha a qualidade do vídeo:
            </Text>

            {(
              [
                { q: '1080p', label: 'Full HD (1080p)', size: '~320 MB' },
                { q: '720p', label: 'HD (720p)', size: '~185 MB' },
                { q: '480p', label: 'Leve / Economia de Espaço (480p)', size: '~95 MB' },
              ] as { q: DownloadQuality; label: string; size: string }[]
            ).map((opt) => (
              <Pressable
                key={opt.q}
                style={styles.qualityRow}
                onPress={() => {
                  if (downloadTargetEp) {
                    startDownload(media, downloadTargetEp, opt.q);
                  }
                  setDownloadTargetEp(null);
                }}
              >
                <View style={styles.qualityLeft}>
                  <Ionicons name="film-outline" size={20} color={Colors.primaryAccent} />
                  <Text style={styles.qualityLabel}>{opt.label}</Text>
                </View>
                <Text style={styles.qualitySize}>{opt.size}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 36,
  },
  banner: {
    height: 210,
    backgroundColor: Colors.surfaceCard,
  },
  bannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 18, 0.5)',
    padding: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 14, 18, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: -55,
    gap: 14,
  },
  poster: {
    width: 112,
    height: 162,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.surfaceElevated,
    backgroundColor: Colors.surfaceCard,
  },
  headerMeta: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  ageBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  formatBadge: {
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeText: {
    color: Colors.text,
    fontSize: 10,
    fontFamily: Fonts.bold,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  ratingText: {
    color: Colors.text,
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontFamily: Fonts.bold,
    lineHeight: 23,
  },
  originalTitle: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  studioText: {
    color: Colors.primaryAccent,
    fontSize: 12,
    fontFamily: Fonts.medium,
    marginTop: 4,
  },
  actionsSection: {
    paddingHorizontal: 16,
    marginTop: 18,
  },
  playMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  playMainText: {
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceMuted,
  },
  quickActionItem: {
    alignItems: 'center',
    gap: 4,
  },
  quickActionLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  synopsisBox: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  genresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  genreTag: {
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  genreTagText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  synopsisText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 19,
  },
  rateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    backgroundColor: Colors.surface,
    padding: 12,
    borderRadius: 10,
  },
  rateLabel: {
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  episodesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 22,
    marginBottom: 10,
  },
  seasonTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  seasonBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.surfaceCard,
  },
  seasonBtnActive: {
    backgroundColor: Colors.primary,
  },
  seasonBtnText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  seasonBtnTextActive: {
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sortBtnText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  epList: {
    paddingHorizontal: 16,
    gap: 10,
  },
  epCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 9,
    borderWidth: 1,
    borderColor: Colors.surfaceMuted,
    gap: 10,
  },
  epThumbWrap: {
    width: 112,
    height: 68,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.surfaceCard,
  },
  epThumb: {
    width: '100%',
    height: '100%',
  },
  epPlayIcon: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 18, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  watchedPill: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.9)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  watchedPillText: {
    color: Colors.background,
    fontSize: 8,
    fontFamily: Fonts.bold,
  },
  epInfo: {
    flex: 1,
  },
  epTitle: {
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
  epDuration: {
    color: Colors.primaryAccent,
    fontSize: 11,
    fontFamily: Fonts.medium,
    marginTop: 2,
  },
  epDesc: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  dlBtn: {
    padding: 8,
  },
  relatedSection: {
    marginTop: 26,
  },
  relatedTitle: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: Fonts.bold,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  coverModalBg: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  coverFullImage: {
    width: '100%',
    height: '80%',
    borderRadius: 16,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 32,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 17,
    fontFamily: Fonts.bold,
  },
  modalSub: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 3,
    marginBottom: 14,
  },
  qualityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceMuted,
  },
  qualityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qualityLabel: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  qualitySize: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMuted,
  },
  playlistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playlistName: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  playlistCount: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  newPlaylistRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    alignItems: 'center',
  },
  newPlaylistInput: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    color: Colors.text,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: Fonts.regular,
    borderWidth: 1,
    borderColor: Colors.surfaceMuted,
  },
  newPlaylistBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  newPlaylistBtnText: {
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
});
