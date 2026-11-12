import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../theme/colors';
import { ContinueWatchingItem } from '../types';

interface ContinueWatchingCardProps {
  item: ContinueWatchingItem;
  onPress: () => void;
  onOptionsPress: () => void;
}

export const ContinueWatchingCard: React.FC<ContinueWatchingCardProps> = ({
  item,
  onPress,
  onOptionsPress,
}) => {
  const pct = Math.min(100, Math.max(5, Math.round((item.watchedSec / item.durationSec) * 100)));
  const remainingMin = Math.max(1, Math.ceil((item.durationSec - item.watchedSec) / 60));

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.thumbWrap}>
        <Image source={{ uri: item.thumbnail }} style={styles.thumb} resizeMode="cover" />
        <View style={styles.playOverlay}>
          <View style={styles.playCircle}>
            <Ionicons name="play" size={18} color={Colors.text} />
          </View>
        </View>
        <Pressable style={styles.menuBtn} onPress={onOptionsPress} hitSlop={10}>
          <Ionicons name="ellipsis-vertical" size={16} color={Colors.text} />
        </Pressable>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${pct}%` }]} />
        </View>
      </View>
      <View style={styles.info}>
        <Text style={styles.mediaTitle} numberOfLines={1}>
          {item.mediaTitle}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.epLabel}>Episódio {item.episodeNumber}</Text>
          <Text style={styles.remaining}>Restam {remainingMin} min</Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 235,
    marginRight: 14,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceMuted,
  },
  thumbWrap: {
    width: '100%',
    height: 128,
    position: 'relative',
    backgroundColor: Colors.surfaceCard,
  },
  thumb: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 18, 0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(226, 18, 33, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  menuBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(10, 14, 18, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressTrack: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  info: {
    padding: 10,
  },
  mediaTitle: {
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  epLabel: {
    color: Colors.primaryAccent,
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  remaining: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
});
