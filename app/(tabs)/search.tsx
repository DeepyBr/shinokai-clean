import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { Colors, Fonts } from '../../src/theme/colors';
import { GENRES } from '../../src/api/mockData';
import { shinokaiApi } from '../../src/api/shinokaiApi';
import { AudioLanguage, MediaStatus, Media } from '../../src/types';

type CategoryType = 'ALL' | 'SERIES' | 'MOVIES' | 'AIRING' | 'DUBLADO';
type YearFilter = 'ALL' | '2026' | '2025' | '2024' | '2023' | '2020-2022' | 'CLASSIC';

const CATEGORIES: { key: CategoryType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'ALL', label: 'Todos os Animes', icon: 'grid-outline' },
  { key: 'SERIES', label: 'Séries de TV', icon: 'tv-outline' },
  { key: 'MOVIES', label: 'Filmes & Longas', icon: 'film-outline' },
  { key: 'AIRING', label: 'Em Lançamento', icon: 'flash-outline' },
  { key: 'DUBLADO', label: 'Dublados PT-BR', icon: 'mic-outline' },
];

const YEAR_OPTIONS: { key: YearFilter; label: string }[] = [
  { key: 'ALL', label: 'Todos os Anos' },
  { key: '2026', label: '2026' },
  { key: '2025', label: '2025' },
  { key: '2024', label: '2024' },
  { key: '2023', label: '2023' },
  { key: '2020-2022', label: '2020 a 2022' },
  { key: 'CLASSIC', label: 'Clássicos (Antes de 2020)' },
];

export default function SearchScreen() {
  const router = useRouter();
  const { medias } = useApp();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<CategoryType>('ALL');
  const [genre, setGenre] = useState<string | null>(null);
  const [yearFilter, setYearFilter] = useState<YearFilter>('ALL');
  const [status, setStatus] = useState<MediaStatus | null>(null);
  const [audio, setAudio] = useState<AudioLanguage | null>(null);
  const [sortBy, setSortBy] = useState<'POPULAR' | 'RATING' | 'RECENT' | 'AZ'>('POPULAR');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('LIST');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const activeFiltersCount =
    (category !== 'ALL' ? 1 : 0) +
    (genre ? 1 : 0) +
    (yearFilter !== 'ALL' ? 1 : 0) +
    (status ? 1 : 0) +
    (audio ? 1 : 0) +
    (sortBy !== 'POPULAR' ? 1 : 0);

  const [liveResults, setLiveResults] = useState<Media[]>([]);
  const [isSearchingLive, setIsSearchingLive] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setLiveResults([]);
      setIsSearchingLive(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingLive(true);
      try {
        const found = await shinokaiApi.searchCatalog(q);
        setLiveResults(found);
      } catch {
        // Keep local results
      } finally {
        setIsSearchingLive(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sourcePool = q && liveResults.length > 0 ? liveResults : medias;
    const filtered = sourcePool.filter((m) => {
      // Query filter
      if (q) {
        const matchesTitle =
          m.title.toLowerCase().includes(q) ||
          m.originalTitle.toLowerCase().includes(q) ||
          m.genres.some((g) => g.toLowerCase().includes(q));
        if (!matchesTitle) return false;
      }

      // Category filter
      if (category === 'MOVIES') {
        const hasMovies = (m.movies && m.movies.length > 0) || m.format === 'FILME';
        if (!hasMovies) return false;
      } else if (category === 'SERIES') {
        if (m.format === 'FILME' && (!m.episodes || m.episodes.length <= 1)) return false;
      } else if (category === 'AIRING') {
        if (m.status !== 'AIRING') return false;
      } else if (category === 'DUBLADO') {
        if (m.audioType !== 'DUBLADO' && m.audioType !== 'AMBOS') return false;
      }

      // Genre filter
      if (genre && !m.genres.includes(genre)) return false;

      // Year filter
      if (yearFilter === '2026' && m.releaseYear !== 2026) return false;
      if (yearFilter === '2025' && m.releaseYear !== 2025) return false;
      if (yearFilter === '2024' && m.releaseYear !== 2024) return false;
      if (yearFilter === '2023' && m.releaseYear !== 2023) return false;
      if (yearFilter === '2020-2022' && (m.releaseYear < 2020 || m.releaseYear > 2022)) return false;
      if (yearFilter === 'CLASSIC' && m.releaseYear >= 2020) return false;

      // Status filter
      if (status && m.status !== status) return false;

      // Audio filter
      if (audio) {
        if (audio === 'DUBLADO' && m.audioType === 'LEGENDADO') return false;
        if (audio === 'LEGENDADO' && m.audioType === 'DUBLADO') return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'RATING') return b.rating - a.rating;
      if (sortBy === 'RECENT') return b.releaseYear - a.releaseYear;
      if (sortBy === 'AZ') return a.title.localeCompare(b.title);
      return b.totalEpisodes - a.totalEpisodes;
    });
  }, [medias, liveResults, query, category, genre, yearFilter, status, audio, sortBy]);

  const clearFilters = () => {
    setQuery('');
    setCategory('ALL');
    setGenre(null);
    setYearFilter('ALL');
    setStatus(null);
    setAudio(null);
    setSortBy('POPULAR');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Catálogo de Animes</Text>
          <View style={styles.headerIcons}>
            <Pressable
              style={styles.viewModeBtn}
              onPress={() => setViewMode((m) => (m === 'LIST' ? 'GRID' : 'LIST'))}
            >
              <Ionicons
                name={viewMode === 'LIST' ? 'grid-outline' : 'list-outline'}
                size={20}
                color={Colors.text}
              />
            </Pressable>
            <Pressable
              style={[styles.filterBtn, activeFiltersCount > 0 && styles.filterBtnActive]}
              onPress={() => setFilterModalVisible(true)}
            >
              <Ionicons name="options-outline" size={20} color={Colors.text} />
              {activeFiltersCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
                </View>
              )}
            </Pressable>
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Buscar título, sinopse, estúdio..."
              placeholderTextColor={Colors.textMuted}
              value={query}
              onChangeText={setQuery}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Categories Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const active = category === cat.key;
            return (
              <Pressable
                key={cat.key}
                style={[styles.catBtn, active && styles.catBtnActive]}
                onPress={() => setCategory(cat.key)}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={active ? Colors.text : Colors.textMuted}
                />
                <Text style={[styles.catBtnText, active && styles.catBtnTextActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Quick Genre Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickGenres}
        >
          <Pressable
            style={[styles.chip, !genre && styles.chipActive]}
            onPress={() => setGenre(null)}
          >
            <Text style={[styles.chipText, !genre && styles.chipTextActive]}>Todos Gêneros</Text>
          </Pressable>
          {GENRES.map((g) => {
            const active = genre === g;
            return (
              <Pressable
                key={g}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setGenre(active ? null : g)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{g}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Results Bar */}
      <View style={styles.resultsMetaBar}>
        <Text style={styles.resultsCount}>
          {results.length} {results.length === 1 ? 'anime disponível' : 'animes disponíveis'}
          {genre ? ` em ${genre}` : ''}
          {yearFilter !== 'ALL' ? ` (${yearFilter})` : ''}
        </Text>
        {activeFiltersCount > 0 && (
          <Pressable onPress={clearFilters} hitSlop={6}>
            <Text style={styles.clearQuickText}>Limpar filtros</Text>
          </Pressable>
        )}
      </View>

      {/* Anime List / Grid */}
      {viewMode === 'LIST' ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="search-outline" size={46} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Nenhum anime encontrado</Text>
              <Text style={styles.emptySub}>
                Tente ajustar os filtros ou pesquisar por outro termo.
              </Text>
              <Pressable style={styles.resetBtn} onPress={clearFilters}>
                <Text style={styles.resetBtnText}>Redefinir Filtros</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => {
            const hasMovies = item.movies && item.movies.length > 0;
            const seasonCount = item.seasons.length;
            return (
              <Pressable
                style={styles.resultCard}
                onPress={() => router.push(`/media/${item.id}`)}
              >
                <Image source={{ uri: item.posterUrl }} style={styles.poster} />
                <View style={styles.cardInfo}>
                  <View style={styles.metaTop}>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={13} color={Colors.warning} />
                      <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
                    </View>
                    <Text style={styles.yearText}>
                      {item.releaseYear} • {item.studio}
                    </Text>
                  </View>

                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>

                  <View style={styles.badgeLine}>
                    <View style={styles.infoBadge}>
                      <Text style={styles.infoBadgeText}>
                        {seasonCount > 1 ? `${seasonCount} Temporadas` : '1 Temporada'}
                      </Text>
                    </View>
                    {hasMovies && (
                      <View style={styles.movieBadge}>
                        <Text style={styles.movieBadgeText}>
                          🎬 {item.movies?.length} {item.movies?.length === 1 ? 'Filme' : 'Filmes'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.audioBadge}>
                      <Text style={styles.audioBadgeText}>{item.audioType}</Text>
                    </View>
                  </View>

                  <Text style={styles.cardGenres} numberOfLines={1}>
                    {item.genres.join(' • ')}
                  </Text>
                  <Text style={styles.cardSynopsis} numberOfLines={2}>
                    {item.synopsis}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="search-outline" size={46} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Nenhum anime encontrado</Text>
              <Text style={styles.emptySub}>
                Tente ajustar os filtros ou pesquisar por outro termo.
              </Text>
              <Pressable style={styles.resetBtn} onPress={clearFilters}>
                <Text style={styles.resetBtnText}>Redefinir Filtros</Text>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.gridCard}
              onPress={() => router.push(`/media/${item.id}`)}
            >
              <Image source={{ uri: item.posterUrl }} style={styles.gridPoster} />
              <View style={styles.gridOverlay}>
                <View style={styles.gridRating}>
                  <Ionicons name="star" size={11} color={Colors.warning} />
                  <Text style={styles.gridRatingText}>{item.rating.toFixed(1)}</Text>
                </View>
                <Text style={styles.gridYear}>{item.releaseYear}</Text>
              </View>
              <Text style={styles.gridTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.gridSub} numberOfLines={1}>
                {item.seasons.length > 1
                  ? `${item.seasons.length} Teps`
                  : `${item.totalEpisodes} eps`}
                {item.movies && item.movies.length > 0 ? ` + ${item.movies.length} filme` : ''}
              </Text>
            </Pressable>
          )}
        />
      )}

      {/* Advanced Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros Avançados</Text>
              <Pressable onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              {/* Release Year Filter */}
              <Text style={styles.filterLabel}>Ano / Período de Lançamento</Text>
              <View style={styles.filterGroup}>
                {YEAR_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.key}
                    style={[styles.optBtn, yearFilter === opt.key && styles.optBtnActive]}
                    onPress={() => setYearFilter(opt.key)}
                  >
                    <Text
                      style={[styles.optText, yearFilter === opt.key && styles.optTextActive]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Order By */}
              <Text style={styles.filterLabel}>Ordenar por</Text>
              <View style={styles.filterGroup}>
                {[
                  { key: 'POPULAR', label: 'Mais Populares' },
                  { key: 'RATING', label: 'Melhor Avaliação' },
                  { key: 'RECENT', label: 'Mais Recentes' },
                  { key: 'AZ', label: 'Ordem Alfabética (A-Z)' },
                ].map((opt) => (
                  <Pressable
                    key={opt.key}
                    style={[styles.optBtn, sortBy === opt.key && styles.optBtnActive]}
                    onPress={() => setSortBy(opt.key as typeof sortBy)}
                  >
                    <Text style={[styles.optText, sortBy === opt.key && styles.optTextActive]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Status */}
              <Text style={styles.filterLabel}>Status da Obra</Text>
              <View style={styles.filterGroup}>
                <Pressable
                  style={[styles.optBtn, !status && styles.optBtnActive]}
                  onPress={() => setStatus(null)}
                >
                  <Text style={[styles.optText, !status && styles.optTextActive]}>Todos</Text>
                </Pressable>
                <Pressable
                  style={[styles.optBtn, status === 'AIRING' && styles.optBtnActive]}
                  onPress={() => setStatus('AIRING')}
                >
                  <Text style={[styles.optText, status === 'AIRING' && styles.optTextActive]}>
                    Em Lançamento
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.optBtn, status === 'COMPLETED' && styles.optBtnActive]}
                  onPress={() => setStatus('COMPLETED')}
                >
                  <Text style={[styles.optText, status === 'COMPLETED' && styles.optTextActive]}>
                    Finalizado
                  </Text>
                </Pressable>
              </View>

              {/* Audio */}
              <Text style={styles.filterLabel}>Opções de Áudio</Text>
              <View style={styles.filterGroup}>
                <Pressable
                  style={[styles.optBtn, !audio && styles.optBtnActive]}
                  onPress={() => setAudio(null)}
                >
                  <Text style={[styles.optText, !audio && styles.optTextActive]}>Todos</Text>
                </Pressable>
                <Pressable
                  style={[styles.optBtn, audio === 'DUBLADO' && styles.optBtnActive]}
                  onPress={() => setAudio('DUBLADO')}
                >
                  <Text style={[styles.optText, audio === 'DUBLADO' && styles.optTextActive]}>
                    Dublado PT-BR
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.optBtn, audio === 'LEGENDADO' && styles.optBtnActive]}
                  onPress={() => setAudio('LEGENDADO')}
                >
                  <Text style={[styles.optText, audio === 'LEGENDADO' && styles.optTextActive]}>
                    Legendado (Japonês)
                  </Text>
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.clearBtn}
                onPress={() => {
                  clearFilters();
                  setFilterModalVisible(false);
                }}
              >
                <Text style={styles.clearBtnText}>Redefinir</Text>
              </Pressable>
              <Pressable
                style={styles.applyBtn}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyBtnText}>
                  Ver {results.length} {results.length === 1 ? 'Anime' : 'Animes'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
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
    backgroundColor: Colors.surface,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMuted,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  title: {
    color: Colors.text,
    fontSize: 22,
    fontFamily: Fonts.extraBold,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewModeBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.primaryAccent,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: Colors.background,
    fontSize: 10,
    fontFamily: Fonts.bold,
  },
  searchRow: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  catBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  catBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catBtnText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  catBtnTextActive: {
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  quickGenres: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
  },
  chipActive: {
    backgroundColor: Colors.primaryAccent,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  chipTextActive: {
    color: Colors.background,
    fontFamily: Fonts.bold,
  },
  resultsMetaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.background,
  },
  resultsCount: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  clearQuickText: {
    color: Colors.primaryAccent,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    paddingBottom: 36,
    gap: 12,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  poster: {
    width: 95,
    height: 135,
    backgroundColor: Colors.surfaceElevated,
  },
  cardInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  metaTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: Colors.warning,
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  yearText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.bold,
    marginTop: 4,
  },
  badgeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  infoBadge: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  infoBadgeText: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontFamily: Fonts.medium,
  },
  movieBadge: {
    backgroundColor: 'rgba(235, 77, 75, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  movieBadgeText: {
    color: Colors.primary,
    fontSize: 10,
    fontFamily: Fonts.bold,
  },
  audioBadge: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  audioBadgeText: {
    color: Colors.primaryAccent,
    fontSize: 10,
    fontFamily: Fonts.semiBold,
  },
  cardGenres: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: Fonts.medium,
    marginTop: 4,
  },
  cardSynopsis: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 4,
    lineHeight: 15,
  },
  gridContent: {
    padding: 12,
    paddingBottom: 36,
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gridPoster: {
    width: '100%',
    height: 190,
    backgroundColor: Colors.surfaceElevated,
  },
  gridOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(10, 14, 18, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gridRatingText: {
    color: Colors.warning,
    fontSize: 10,
    fontFamily: Fonts.bold,
  },
  gridYear: {
    color: Colors.text,
    fontSize: 10,
    fontFamily: Fonts.semiBold,
    backgroundColor: 'rgba(10, 14, 18, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  gridTitle: {
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.bold,
    marginTop: 8,
    marginHorizontal: 8,
  },
  gridSub: {
    color: Colors.primaryAccent,
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginHorizontal: 8,
    marginBottom: 10,
    marginTop: 2,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 56,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginTop: 12,
  },
  emptySub: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  resetBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  resetBtnText: {
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surfaceElevated,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  filterLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    marginTop: 14,
    marginBottom: 8,
  },
  filterGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  optText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  optTextActive: {
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  clearBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.surfaceCard,
    alignItems: 'center',
  },
  clearBtnText: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  applyBtnText: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
});
