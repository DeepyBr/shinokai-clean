import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../theme/colors';
import { Media } from '../types';

interface PosterCardProps {
  media: Media;
  rank?: number;
  width?: number;
  onPress: () => void;
}

export const PosterCard: React.FC<PosterCardProps> = ({
  media,
  rank,
  width = 138,
  onPress,
}) => {
  const height = Math.round(width * 1.46);
  const audioLabel =
    media.audioType === 'DUAL_AUDIO'
      ? 'DUB | LEG'
      : media.audioType === 'DUBLADO'
      ? 'DUBLADO'
      : 'LEGENDADO';

  return (
    <Pressable style={[styles.container, { width }]} onPress={onPress}>
      <View style={[styles.imageWrap, { width, height }]}>
        <Image source={{ uri: media.posterUrl }} style={styles.image} resizeMode="cover" />
        <View style={styles.topRow}>
          <View style={styles.ratingBadge}>
            <Ionicons name="star" size={11} color={Colors.warning} />
            <Text style={styles.ratingText}>{media.rating.toFixed(1)}</Text>
          </View>
          <View style={styles.audioBadge}>
            <Text style={styles.audioText}>{audioLabel}</Text>
          </View>
        </View>
        {typeof rank === 'number' && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{rank}</Text>
          </View>
        )}
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {media.title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {media.genres.slice(0, 2).join(' • ')}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 14,
  },
  imageWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceCard,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topRow: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 14, 18, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  ratingText: {
    color: Colors.text,
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },
  audioBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  audioText: {
    color: Colors.text,
    fontSize: 9,
    fontFamily: Fonts.bold,
  },
  rankBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(226, 18, 33, 0.92)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rankText: {
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
  title: {
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    marginTop: 7,
    lineHeight: 17,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
});
