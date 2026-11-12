import React, { useMemo, useState } from 'react';
import {
  FlatList,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { Colors, Fonts } from '../../src/theme/colors';
import { PosterCard } from '../../src/components/PosterCard';
import { ContinueWatchingCard } from '../../src/components/ContinueWatchingCard';
import { ContinueWatchingItem } from '../../src/types';
import { GENRES } from '../../src/api/mockData';

export default function HomeScreen() {
  const router = useRouter();
  const {
    medias,
    continueWatching,
    unreadNotificationsCount,
    isFavorite,
    toggleFavorite,
    removeFromContinueWatching,
    markEpisodeWatched,
    getEpisodeById,
  } = useApp();

  const [selectedGenre, setSelectedGenre] = useState<string>('Todos');
  const [cwOptionsItem, setCwOptionsItem] = useState<ContinueWatchingItem | null>(null);

  const featured = medias[0];

  const filteredMedias = useMemo(() => {
    if (selectedGenre === 'Todos') return medias;
    return medias.filter((m) => m.genres.includes(selectedGenre));
  }, [medias, selectedGenre]);

  const dubMedias = useMemo(
    () => medias.filter((m) => m.audioType === 'DUAL_AUDIO' || m.audioType === 'DUBLADO'),
    [medias]
  );

  const releasingMedias = useMemo(
    () => medias.filter((m) => m.status === 'RELEASING'),
    [medias]
  );

  const actionMedias = useMemo(
    () => medias.filter((m) => m.genres.includes('Ação')),
    [medias]
  );

  const fantasyMedias = useMemo(
    () => medias.filter((m) => m.genres.includes('Fantasia') || m.genres.includes('Aventura')),
    [medias]
  );

  const movieMedias = useMemo(
    () => medias.filter((m) => m.format === 'MOVIE' || m.totalEpisodes === 1),
    [medias]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoDot} />
          <Text style={styles.brandTitle}>SHINOKAI</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push('/tv-scanner')}
            accessibilityLabel="Conectar TV via QR Code"
          >
            <Ionicons name="tv-outline" size={21} color={Colors.text} />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            onPress={() => router.push('/notifications')}
            accessibilityLabel="Notificações"
          >
            <Ionicons name="notifications-outline" size={21} color={Colors.text} />
            {unreadNotificationsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadNotificationsCount}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        {featured && (
          <ImageBackground
            source={{ uri: featured.bannerUrl }}
            style={styles.hero}
            resizeMode="cover"
          >
            <View style={styles.heroOverlay}>
              <View style={styles.heroBadges}>
                <View style={styles.heroTagPrimary}>
                  <Text style={styles.heroTagText}>EM DESTAQUE</Text>
                </View>
                <View style={styles.heroTagAge}>
                  <Text style={styles.heroTagText}>+{featured.ageRating}</Text>
                </View>
                <View style={styles.heroTagAudio}>
                  <Text style={styles.heroTagText}>DUB | LEG</Text>
                </View>
              </View>

              <Text style={styles.heroTitle} numberOfLines={2}>
                {featured.title}
              </Text>
              <Text style={styles.heroGenres}>{featured.genres.join(' • ')}</Text>
              <Text style={styles.heroSynopsis} numberOfLines={2}>
                {featured.synopsis}
              </Text>

              <View style={styles.heroActions}>
                <Pressable
                  style={styles.watchNowBtn}
                  onPress={() => router.push(`/player/${featured.episodes[0].id}`)}
                >
                  <Ionicons name="play" size={18} color={Colors.text} />
                  <Text style={styles.watchNowText}>Assistir Agora</Text>
                </Pressable>

                <Pressable
                  style={styles.myListBtn}
                  onPress={() => toggleFavorite(featured.id)}
                >
                  <Ionicons
                    name={isFavorite(featured.id) ? 'checkmark' : 'add'}
                    size={19}
                    color={Colors.text}
                  />
                  <Text style={styles.myListText}>
                    {isFavorite(featured.id) ? 'Na Lista' : 'Minha Lista'}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.infoIconBtn}
                  onPress={() => router.push(`/media/${featured.id}`)}
                >
                  <Ionicons name="information-circle-outline" size={22} color={Colors.text} />
                </Pressable>
              </View>
            </View>
          </ImageBackground>
        )}

        {/* Continue Watching Section */}
        {continueWatching.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Continuar Assistindo</Text>
              <Pressable onPress={() => router.push('/(tabs)/library')}>
                <Text style={styles.seeAll}>Histórico</Text>
              </Pressable>
            </View>
            <FlatList
              horizontal
              data={continueWatching}
              keyExtractor={(item) => item.episodeId}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <ContinueWatchingCard
                  item={item}
                  onPress={() => router.push(`/player/${item.episodeId}`)}
                  onOptionsPress={() => setCwOptionsItem(item)}
                />
              )}
            />
          </View>
        )}

        {/* Genre Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genrePills}
        >
          {['Todos', ...GENRES.slice(0, 8)].map((genre) => {
            const active = selectedGenre === genre;
            return (
              <Pressable
                key={genre}
                style={[styles.genrePill, active && styles.genrePillActive]}
                onPress={() => setSelectedGenre(genre)}
              >
                <Text style={[styles.genrePillText, active && styles.genrePillTextActive]}>
                  {genre}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Top Trending Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedGenre === 'Todos' ? 'Animes em Alta' : `Destaques em ${selectedGenre}`}
            </Text>
          </View>
          <FlatList
            horizontal
            data={filteredMedias}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item, index }) => (
              <PosterCard
                media={item}
                rank={selectedGenre === 'Todos' ? index + 1 : undefined}
                onPress={() => router.push(`/media/${item.id}`)}
              />
            )}
          />
        </View>

        {/* Simulcast / Novos Episódios */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Simulcast • Em Lançamento</Text>
            <Pressable onPress={() => router.push('/(tabs)/calendar')}>
              <Text style={styles.seeAll}>Ver Calendário</Text>
            </Pressable>
          </View>
          <FlatList
            horizontal
            data={releasingMedias}
            keyExtractor={(item) => `rel-${item.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <PosterCard media={item} onPress={() => router.push(`/media/${item.id}`)} />
            )}
          />
        </View>

        {/* Dublados em Português */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Dublados em Português</Text>
          </View>
          <FlatList
            horizontal
            data={dubMedias}
            keyExtractor={(item) => `dub-${item.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <PosterCard media={item} onPress={() => router.push(`/media/${item.id}`)} />
            )}
          />
        </View>

        {/* Animes de Ação & Batalhas Épicas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ação e Shounen</Text>
          </View>
          <FlatList
            horizontal
            data={actionMedias}
            keyExtractor={(item) => `act-${item.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <PosterCard media={item} onPress={() => router.push(`/media/${item.id}`)} />
            )}
          />
        </View>

        {/* Fantasia e Isekai */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Fantasia e Aventura</Text>
          </View>
          <FlatList
            horizontal
            data={fantasyMedias}
            keyExtractor={(item) => `fan-${item.id}`}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={({ item }) => (
              <PosterCard media={item} onPress={() => router.push(`/media/${item.id}`)} />
            )}
          />
        </View>

        {/* Filmes e Especiais de Anime */}
        {movieMedias.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Filmes e Longas-Metragens</Text>
            </View>
            <FlatList
              horizontal
              data={movieMedias}
              keyExtractor={(item) => `mov-${item.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
              renderItem={({ item }) => (
                <PosterCard media={item} onPress={() => router.push(`/media/${item.id}`)} />
              )}
            />
          </View>
        )}
      </ScrollView>

      {/* ContinueWatchingOptionsModal */}
      <Modal
        visible={!!cwOptionsItem}
        transparent
        animationType="fade"
        onRequestClose={() => setCwOptionsItem(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setCwOptionsItem(null)}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle} numberOfLines={1}>
              {cwOptionsItem?.mediaTitle}
            </Text>
            <Text style={styles.modalSub}>Episódio {cwOptionsItem?.episodeNumber}</Text>

            <Pressable
              style={styles.modalOption}
              onPress={() => {
                const epId = cwOptionsItem?.episodeId;
                setCwOptionsItem(null);
                if (epId) router.push(`/player/${epId}`);
              }}
            >
              <Ionicons name="play-circle-outline" size={22} color={Colors.text} />
              <Text style={styles.modalOptionText}>Continuar reprodução</Text>
            </Pressable>

            <Pressable
              style={styles.modalOption}
              onPress={() => {
                const mediaId = cwOptionsItem?.mediaId;
                setCwOptionsItem(null);
                if (mediaId) router.push(`/media/${mediaId}`);
              }}
            >
              <Ionicons name="albums-outline" size={22} color={Colors.text} />
              <Text style={styles.modalOptionText}>Ver detalhes e episódios</Text>
            </Pressable>

            <Pressable
              style={styles.modalOption}
              onPress={() => {
                if (cwOptionsItem) {
                  const found = getEpisodeById(cwOptionsItem.episodeId);
                  if (found) markEpisodeWatched(found.media, found.episode);
                  removeFromContinueWatching(cwOptionsItem.episodeId);
                }
                setCwOptionsItem(null);
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={22} color={Colors.success} />
              <Text style={styles.modalOptionText}>Marcar como assistido</Text>
            </Pressable>

            <Pressable
              style={styles.modalOption}
              onPress={() => {
                if (cwOptionsItem) removeFromContinueWatching(cwOptionsItem.episodeId);
                setCwOptionsItem(null);
              }}
            >
              <Ionicons name="trash-outline" size={22} color={Colors.danger} />
              <Text style={[styles.modalOptionText, { color: Colors.danger }]}>
                Remover de Continuar Assistindo
              </Text>
            </Pressable>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  brandTitle: {
    color: Colors.text,
    fontSize: 19,
    fontFamily: Fonts.bold,
    letterSpacing: 1.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.primary,
    minWidth: 17,
    height: 17,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: Colors.text,
    fontSize: 10,
    fontFamily: Fonts.bold,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  hero: {
    height: 350,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceCard,
  },
  heroOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 14, 18, 0.58)',
    justifyContent: 'flex-end',
    padding: 18,
  },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  heroTagPrimary: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  heroTagAge: {
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  heroTagAudio: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  heroTagText: {
    color: Colors.text,
    fontSize: 10,
    fontFamily: Fonts.bold,
  },
  heroTitle: {
    color: Colors.text,
    fontSize: 22,
    fontFamily: Fonts.bold,
    lineHeight: 27,
  },
  heroGenres: {
    color: Colors.primaryAccent,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    marginTop: 4,
  },
  heroSynopsis: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 6,
    lineHeight: 17,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  watchNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  watchNowText: {
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
  myListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 5,
  },
  myListText: {
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  infoIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  genrePills: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 4,
    gap: 8,
  },
  genrePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  genrePillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genrePillText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  genrePillTextActive: {
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  section: {
    marginTop: 22,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 17,
    fontFamily: Fonts.bold,
  },
  seeAll: {
    color: Colors.primaryAccent,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  horizontalList: {
    paddingHorizontal: 16,
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
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  modalSub: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginTop: 2,
    marginBottom: 14,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceMuted,
  },
  modalOptionText: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.medium,
  },
});
