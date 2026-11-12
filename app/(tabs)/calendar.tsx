import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Image,
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

const DAYS = [
  { key: -1, short: 'Todos', full: 'Semana Completa' },
  { key: 0, short: 'Dom', full: 'Domingo' },
  { key: 1, short: 'Seg', full: 'Segunda-feira' },
  { key: 2, short: 'Ter', full: 'Terça-feira' },
  { key: 3, short: 'Qua', full: 'Quarta-feira' },
  { key: 4, short: 'Qui', full: 'Quinta-feira' },
  { key: 5, short: 'Sex', full: 'Sexta-feira' },
  { key: 6, short: 'Sáb', full: 'Sábado' },
];

export default function CalendarScreen() {
  const router = useRouter();
  const { calendar, hasReminder, toggleReminder } = useApp();
  const [selectedDay, setSelectedDay] = useState<number>(-1);

  const filteredItems = useMemo(() => {
    if (selectedDay === -1) return calendar;
    return calendar.filter((item) => item.dayOfWeek === selectedDay);
  }, [calendar, selectedDay]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendário de Lançamentos</Text>
        <Text style={styles.subtitle}>
          Acompanhe o simulcast semanal e ative alertas para novos episódios
        </Text>
      </View>

      <View style={styles.dayBarWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dayBar}
        >
          {DAYS.map((d) => {
            const active = selectedDay === d.key;
            return (
              <Pressable
                key={d.key}
                style={[styles.dayTab, active && styles.dayTabActive]}
                onPress={() => setSelectedDay(d.key)}
              >
                <Text style={[styles.dayTabText, active && styles.dayTabTextActive]}>
                  {d.short}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="calendar-clear-outline" size={44} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>Nenhum lançamento neste dia</Text>
            <Text style={styles.emptySub}>
              Selecione outro dia da semana ou veja a programação completa.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const reminded = hasReminder(item.mediaId);
          const dayLabel = DAYS.find((d) => d.key === item.dayOfWeek)?.full || '';
          return (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/media/${item.mediaId}`)}
            >
              <Image source={{ uri: item.posterUrl }} style={styles.poster} />
              <View style={styles.cardBody}>
                <View style={styles.timeRow}>
                  <View style={styles.timeChip}>
                    <Ionicons name="time-outline" size={13} color={Colors.primaryAccent} />
                    <Text style={styles.timeText}>
                      {dayLabel} • {item.releaseTime}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusChip,
                      item.released ? styles.statusReleased : styles.statusUpcoming,
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {item.released ? 'Disponível' : 'Em breve'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.mediaTitle} numberOfLines={2}>
                  {item.mediaTitle}
                </Text>
                <Text style={styles.epMeta}>
                  Episódio {item.episodeNumber} •{' '}
                  {item.audioType === 'DUAL_AUDIO' ? 'Dublado e Legendado' : 'Legendado'}
                </Text>

                <View style={styles.actionsRow}>
                  <Pressable
                    style={[styles.remindBtn, reminded && styles.remindBtnActive]}
                    onPress={() => toggleReminder(item.mediaId)}
                  >
                    <Ionicons
                      name={reminded ? 'notifications' : 'notifications-outline'}
                      size={15}
                      color={Colors.text}
                    />
                    <Text style={styles.remindBtnText}>
                      {reminded ? 'Lembrete Ativo' : 'Lembrar-me'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Pressable>
          );
        }}
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
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    color: Colors.text,
    fontSize: 21,
    fontFamily: Fonts.bold,
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 3,
  },
  dayBarWrap: {
    paddingVertical: 10,
  },
  dayBar: {
    paddingHorizontal: 16,
    gap: 8,
  },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  dayTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayTabText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  dayTabTextActive: {
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.surfaceMuted,
  },
  poster: {
    width: 96,
    height: 136,
    backgroundColor: Colors.surfaceCard,
  },
  cardBody: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    color: Colors.primaryAccent,
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },
  statusChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  statusReleased: {
    backgroundColor: 'rgba(52, 211, 153, 0.18)',
  },
  statusUpcoming: {
    backgroundColor: Colors.surfaceCard,
  },
  statusText: {
    color: Colors.text,
    fontSize: 10,
    fontFamily: Fonts.bold,
  },
  mediaTitle: {
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts.bold,
    marginTop: 4,
  },
  epMeta: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  remindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  remindBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  remindBtnText: {
    color: Colors.text,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
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
  },
});
