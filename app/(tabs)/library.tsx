import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { Colors, Fonts } from '../../src/theme/colors';

type LibraryTab = 'DOWNLOADS' | 'FAVORITES' | 'HISTORY';

export default function LibraryScreen() {
  const router = useRouter();
  const {
    medias,
    favorites,
    continueWatching,
    downloads,
    toggleFavorite,
    removeDownload,
    togglePauseDownload,
    clearWatchHistory,
  } = useApp();

  const [tab, setTab] = useState<LibraryTab>('DOWNLOADS');

  const favoriteMedias = useMemo(
    () => medias.filter((m) => favorites.includes(m.id)),
    [medias, favorites]
  );

  const totalStorageMb = useMemo(
    () => downloads.reduce((sum, item) => sum + item.sizeMb, 0),
    [downloads]
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Minha Biblioteca</Text>
        <View style={styles.tabsRow}>
          {[
            { key: 'DOWNLOADS', label: `Downloads (${downloads.length})` },
            { key: 'FAVORITES', label: `Minha Lista (${favoriteMedias.length})` },
            { key: 'HISTORY', label: `Histórico (${continueWatching.length})` },
          ].map((t) => {
            const active = tab === t.key;
            return (
              <Pressable
                key={t.key}
                style={[styles.tabBtn, active && styles.tabBtnActive]}
                onPress={() => setTab(t.key as LibraryTab)}
              >
                <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {tab === 'DOWNLOADS' && (
        <>
          <View style={styles.storageBar}>
            <View style={styles.storageLeft}>
              <Ionicons name="folder-open-outline" size={16} color={Colors.primaryAccent} />
              <Text style={styles.storageText}>
                Espaço utilizado: <Text style={styles.storageBold}>{totalStorageMb} MB</Text>
              </Text>
            </View>
            <Text style={styles.offlineBadge}>Modo Offline Liberado</Text>
          </View>

          <FlatList
            data={downloads}
            keyExtractor={(item) => item.episodeId}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Image
                  source={require('../../assets/images/offlineart.png')}
                  style={styles.offlineArt}
                  resizeMode="contain"
                />
                <Text style={styles.emptyTitle}>Nada baixado aqui</Text>
                <Text style={styles.emptySub}>
                  Baixe seus episódios favoritos e assista offline sem precisar de internet.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.dlCard}
                onPress={() => router.push(`/player/${item.episodeId}`)}
              >
                <Image source={{ uri: item.thumbnail }} style={styles.dlThumb} />
                <View style={styles.dlInfo}>
                  <Text style={styles.dlTitle} numberOfLines={1}>
                    {item.mediaTitle}
                  </Text>
                  <Text style={styles.dlSub}>
                    Episódio {item.episodeNumber} • {item.quality} • {item.sizeMb} MB
                  </Text>

                  {item.status !== 'COMPLETED' ? (
                    <View style={styles.progWrap}>
                      <View style={styles.progTrack}>
                        <View style={[styles.progFill, { width: `${item.progress}%` }]} />
                      </View>
                      <Text style={styles.progLabel}>
                        {item.status === 'PAUSED'
                          ? `Pausado (${item.progress}%)`
                          : `Baixando... ${item.progress}%`}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.completedRow}>
                      <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                      <Text style={styles.completedText}>Download concluído</Text>
                    </View>
                  )}
                </View>

                <View style={styles.dlActions}>
                  {item.status !== 'COMPLETED' && (
                    <Pressable
                      style={styles.actionIcon}
                      onPress={() => togglePauseDownload(item.episodeId)}
                    >
                      <Ionicons
                        name={item.status === 'PAUSED' ? 'play' : 'pause'}
                        size={18}
                        color={Colors.text}
                      />
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.actionIcon}
                    onPress={() => removeDownload(item.episodeId)}
                  >
                    <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                  </Pressable>
                </View>
              </Pressable>
            )}
          />
        </>
      )}

      {tab === 'FAVORITES' && (
        <FlatList
          data={favoriteMedias}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="bookmark-outline" size={46} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>Sua lista está vazia</Text>
              <Text style={styles.emptySub}>
                Adicione animes à sua lista para encontrá-los rapidamente aqui.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.dlCard}
              onPress={() => router.push(`/media/${item.id}`)}
            >
              <Image source={{ uri: item.posterUrl }} style={styles.favPoster} />
              <View style={styles.dlInfo}>
                <Text style={styles.dlTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.dlSub}>
                  {item.releaseYear} • {item.totalEpisodes} episódios
                </Text>
                <Text style={styles.favGenres}>{item.genres.join(' • ')}</Text>
              </View>
              <Pressable
                style={styles.actionIcon}
                onPress={() => toggleFavorite(item.id)}
              >
                <Ionicons name="heart-dislike-outline" size={20} color={Colors.danger} />
              </Pressable>
            </Pressable>
          )}
        />
      )}

      {tab === 'HISTORY' && (
        <>
          {continueWatching.length > 0 && (
            <View style={styles.storageBar}>
              <Text style={styles.storageText}>Episódios assistidos recentemente</Text>
              <Pressable onPress={clearWatchHistory}>
                <Text style={styles.clearHistText}>Limpar Histórico</Text>
              </Pressable>
            </View>
          )}
          <FlatList
            data={continueWatching}
            keyExtractor={(item) => item.episodeId}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Ionicons name="time-outline" size={46} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>Sem histórico recente</Text>
                <Text style={styles.emptySub}>
                  Os episódios que você assistir aparecerão aqui.
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                style={styles.dlCard}
                onPress={() => router.push(`/player/${item.episodeId}`)}
              >
                <Image source={{ uri: item.thumbnail }} style={styles.dlThumb} />
                <View style={styles.dlInfo}>
                  <Text style={styles.dlTitle} numberOfLines={1}>
                    {item.mediaTitle}
                  </Text>
                  <Text style={styles.dlSub}>
                    Episódio {item.episodeNumber} • {item.updatedAt}
                  </Text>
                  <Text style={styles.completedText}>
                    Assistido {Math.round(item.watchedSec / 60)} de{' '}
                    {Math.round(item.durationSec / 60)} min
                  </Text>
                </View>
                <Ionicons name="play-circle" size={28} color={Colors.primary} />
              </Pressable>
            )}
          />
        </>
      )}
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
    paddingBottom: 10,
  },
  title: {
    color: Colors.text,
    fontSize: 21,
    fontFamily: Fonts.bold,
    marginBottom: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.surfaceMuted,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabBtnText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  tabBtnTextActive: {
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  storageBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 10,
  },
  storageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storageText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: Fonts.regular,
  },
  storageBold: {
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  offlineBadge: {
    color: Colors.success,
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  clearHistText: {
    color: Colors.danger,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 12,
  },
  dlCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceMuted,
    gap: 12,
  },
  dlThumb: {
    width: 108,
    height: 68,
    borderRadius: 8,
    backgroundColor: Colors.surfaceCard,
  },
  favPoster: {
    width: 68,
    height: 94,
    borderRadius: 8,
    backgroundColor: Colors.surfaceCard,
  },
  dlInfo: {
    flex: 1,
  },
  dlTitle: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  dlSub: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  favGenres: {
    color: Colors.primaryAccent,
    fontSize: 11,
    fontFamily: Fonts.medium,
    marginTop: 4,
  },
  progWrap: {
    marginTop: 6,
  },
  progTrack: {
    height: 4,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progLabel: {
    color: Colors.primaryAccent,
    fontSize: 10,
    fontFamily: Fonts.medium,
    marginTop: 3,
  },
  completedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  completedText: {
    color: Colors.success,
    fontSize: 11,
    fontFamily: Fonts.medium,
    marginTop: 3,
  },
  dlActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  offlineArt: {
    width: 170,
    height: 140,
    marginBottom: 8,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginTop: 8,
  },
  emptySub: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
