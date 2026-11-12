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

export default function SearchScreen() {
  const router = useRouter();
  const { medias } = useApp();

  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<string | null>(null);
  const [status, setStatus] = useState<MediaStatus | null>(null);
  const [audio, setAudio] = useState<AudioLanguage | null>(null);
  const [sortBy, setSortBy] = useState<'POPULAR' | 'RATING' | 'RECENT' | 'AZ'>('POPULAR');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  const activeFiltersCount =
    (genre ? 1 : 0) + (status ? 1 : 0) + (audio ? 1 : 0) + (sortBy !== 'POPULAR' ? 1 : 0);

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
      if (q) {
        const matchesTitle =
          m.title.toLowerCase().includes(q) ||
          m.originalTitle.toLowerCase().includes(q) ||
          m.genres.some((g) => g.toLowerCase().includes(q));
        if (!matchesTitle) return false;
      }
      if (genre && !m.genres.includes(genre)) return false;
      if (status && m.status !== status) return false;
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
  }, [medias, liveResults, query, genre, status, audio, sortBy]);

  const clearFilters = () => {
    setGenre(null);
    setStatus(null);
    setAudio(null);
    setSortBy('POPULAR');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Explorar Catálogo</Text>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color={Colors.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Buscar anime, filme, gênero..."
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

      {/* Quick Genre Chips */}
      <View style={styles.quickGenresWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickGenres}
        >
          <Pressable
            style={[styles.chip, !genre && styles.chipActive]}
            onPress={() => setGenre(null)}
          >
            <Text style={[styles.chipText, !genre && styles.chipTextActive]}>Todos</Text>
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

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Text style={styles.resultHeader}>
            {query.trim() || activeFiltersCount > 0
              ? `${results.length} resultado(s) encontrado(s)`
              : 'Animes em Alta na Semana'}
          </Text>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="search-outline" size={46} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Nenhum anime encontrado</Text>
            <Text style={styles.emptySub}>
              Confira a escrita ou redefina os filtros aplicados.
            </Text>
            <Pressable style={styles.resetBtn} onPress={clearFilters}>
              <Text style={styles.resetBtnText}>Limpar Filtros</Text>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
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
                  {item.releaseYear} • {item.totalEpisodes} eps
                </Text>
              </View>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.cardGenres} numberOfLines={1}>
                {item.genres.join(' • ')}
              </Text>
              <Text style={styles.cardSynopsis} numberOfLines={2}>
                {item.synopsis}
              </Text>
            </View>
          </Pressable>
        )}
      />

      {/* SearchFilterModal */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filtros de Busca</Text>
              <Pressable onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </Pressable>
            </View>

            <Text style={styles.filterLabel}>Ordenar por</Text>
            <View style={styles.filterGroup}>
              {[
                { key: 'POPULAR', label: 'Mais Populares' },
                { key: 'RATING', label: 'Melhor Nota' },
                { key: 'RECENT', label: 'Mais Recentes' },
                { key: 'AZ', label: 'Ordem A-Z' },
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

            <Text style={styles.filterLabel}>Status da Obra</Text>
            <View style={styles.filterGroup}>
              {[
                { key: null, label: 'Todos' },
                { key: 'RELEASING', label: 'Em Lançamento' },
                { key: 'FINISHED', label: 'Completo' },
              ].map((opt) => (
                <Pressable
                  key={String(opt.key)}
                  style={[styles.optBtn, status === opt.key && styles.optBtnActive]}
                  onPress={() => setStatus(opt.key as MediaStatus | null)}
                >
                  <Text style={[styles.optText, status === opt.key && styles.optTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterLabel}>Idioma / Áudio</Text>
            <View style={styles.filterGroup}>
              {[
                { key: null, label: 'Todos' },
                { key: 'DUBLADO', label: 'Dublado PT-BR' },
                { key: 'LEGENDADO', label: 'Legendado' },
              ].map((opt) => (
                <Pressable
                  key={String(opt.key)}
                  style={[styles.optBtn, audio === opt.key && styles.optBtnActive]}
                  onPress={() => setAudio(opt.key as AudioLanguage | null)}
                >
                  <Text style={[styles.optText, audio === opt.key && styles.optTextActive]}>
                    {opt.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.modalFooter}>
              <Pressable style={styles.clearBtn} onPress={clearFilters}>
                <Text style={styles.clearBtnText}>Limpar</Text>
              </Pressable>
              <Pressable
                style={styles.applyBtn}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.applyBtnText}>Aplicar Filtros</Text>
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
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 21,
    fontFamily: Fonts.bold,
    marginBottom: 12,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.regular,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.text,
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
  quickGenresWrap: {
    paddingVertical: 12,
  },
  quickGenres: {
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.surfaceMuted,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  chipTextActive: {
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 12,
  },
  resultHeader: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  resultCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceMuted,
  },
  poster: {
    width: 92,
    height: 130,
    backgroundColor: Colors.surfaceCard,
  },
  cardInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  metaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    color: Colors.text,
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
    fontSize: 15,
    fontFamily: Fonts.bold,
    marginTop: 4,
  },
  cardGenres: {
    color: Colors.primaryAccent,
    fontSize: 11,
    fontFamily: Fonts.medium,
    marginTop: 3,
  },
  cardSynopsis: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 5,
    lineHeight: 16,
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
  },
  resetBtn: {
    marginTop: 14,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
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
    marginTop: 12,
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
    marginTop: 24,
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
