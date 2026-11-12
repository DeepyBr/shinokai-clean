import React from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../src/context/AppContext';
import { Colors, Fonts } from '../src/theme/colors';

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markNotificationRead, markAllNotificationsRead } = useApp();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color={Colors.text} />
        </Pressable>
        <Text style={styles.title}>Notificações</Text>
        <Pressable onPress={markAllNotificationsRead}>
          <Text style={styles.readAllText}>Ler todas</Text>
        </Pressable>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, !item.read && styles.cardUnread]}
            onPress={() => {
              markNotificationRead(item.id);
              if (item.episodeId) {
                router.replace(`/player/${item.episodeId}`);
              } else if (item.mediaId) {
                router.replace(`/media/${item.mediaId}`);
              }
            }}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name={item.read ? 'notifications-outline' : 'notifications'}
                size={20}
                color={item.read ? Colors.textMuted : Colors.primaryAccent}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.topRow}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.timeText}>{item.createdAt}</Text>
              </View>
              <Text style={styles.cardBody}>{item.body}</Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </Pressable>
        )}
      />
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
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  readAllText: {
    color: Colors.primaryAccent,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceMuted,
    gap: 12,
  },
  cardUnread: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceElevated,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  timeText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
  cardBody: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 4,
    lineHeight: 17,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
});
