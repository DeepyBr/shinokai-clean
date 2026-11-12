import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { Colors, Fonts } from '../../src/theme/colors';
import { StreamServer } from '../../src/types';

const REPORT_REASONS = [
  'Uso de linguagem ou símbolos que promovem discriminação ou violência.',
  'Envio excessivo de mensagens ou comentários repetitivos.',
  'Compartilhamento de conteúdo sexualmente explícito ou sugestivo.',
  'Postagem de links ou produtos sem autorização.',
  'Publicação de material que não é adequado para a plataforma.',
];

const DEFAULT_SERVERS: StreamServer[] = [
  {
    id: 'srv-1',
    name: 'Servidor 1 (Ultra HD Fast CDN)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    type: 'MP4',
    quality: '1080p',
  },
  {
    id: 'srv-2',
    name: 'Servidor 2 (Dublado PT-BR)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    type: 'MP4',
    quality: '720p',
  },
  {
    id: 'srv-3',
    name: 'Servidor 3 (Legendado HLS)',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    type: 'MP4',
    quality: '1080p',
  },
  {
    id: 'srv-4',
    name: 'Servidor 4 (Alternativo / Backup)',
    url: 'https://vjs.zencdn.net/v/oceans.mp4',
    type: 'MP4',
    quality: '1080p',
  },
];

export default function PlayerScreen() {
  const { episodeId } = useLocalSearchParams<{ episodeId: string }>();
  const router = useRouter();
  const {
    medias,
    getEpisodeById,
    updateWatchProgress,
    startDownload,
    comments,
    addComment,
    toggleLikeComment,
    reportComment,
    user,
  } = useApp();

  const resolved = getEpisodeById(episodeId || '') || {
    media: medias[0],
    episode: medias[0].episodes[0],
  };
  const { media, episode } = resolved;

  const availableServers = episode.servers && episode.servers.length > 0 ? episode.servers : DEFAULT_SERVERS;
  const [currentServer, setCurrentServer] = useState<StreamServer>(availableServers[0]);

  const videoRef = useRef<Video>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [posSec, setPosSec] = useState(0);
  const [durSec, setDurSec] = useState(episode.durationSec || 1420);
  const [selectedAudio, setSelectedAudio] = useState(episode.audioTracks[0]?.id || 'jp');
  const [selectedSub, setSelectedSub] = useState(episode.subtitleTracks[0]?.id || 'pt-br');
  const [playbackRate, setPlaybackRate] = useState(1.0);

  const [tracksModal, setTracksModal] = useState(false);
  const [serverModal, setServerModal] = useState(false);
  const [castModal, setCastModal] = useState(false);
  const [nextEpModal, setNextEpModal] = useState(false);

  // Comments state
  const [commentText, setCommentText] = useState('');
  const [isSpoilerInput, setIsSpoilerInput] = useState(false);
  const [revealedSpoilers, setRevealedSpoilers] = useState<string[]>([]);
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);

  const nextEpisode = useMemo(() => {
    const list = media.episodes;
    const idx = list.findIndex((e) => e.id === episode.id);
    if (idx >= 0 && idx + 1 < list.length) {
      return list[idx + 1];
    }
    return null;
  }, [media, episode.id]);

  useEffect(() => {
    return () => {
      if (posSec > 5) {
        updateWatchProgress(media, episode, posSec);
      }
    };
  }, [posSec, media, episode]);

  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        setHasError(true);
      }
      return;
    }
    setIsLoaded(true);
    setHasError(false);
    setIsPlaying(status.isPlaying);
    const currentSec = Math.floor(status.positionMillis / 1000);
    setPosSec(currentSec);
    if (status.durationMillis) {
      setDurSec(Math.max(1, Math.floor(status.durationMillis / 1000)));
    }
    if (status.didJustFinish && nextEpisode) {
      setNextEpModal(true);
    }
  };

  const seekBy = async (deltaSec: number) => {
    const nextPos = Math.max(0, Math.min(durSec, posSec + deltaSec));
    setPosSec(nextPos);
    try {
      await videoRef.current?.setPositionAsync(nextPos * 1000);
    } catch {}
  };

  const skipIntro = async () => {
    const target = episode.introEndSec || 175;
    setPosSec(target);
    try {
      await videoRef.current?.setPositionAsync(target * 1000);
    } catch {}
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const showSkipIntro =
    episode.introStartSec !== undefined &&
    episode.introEndSec !== undefined &&
    posSec >= episode.introStartSec &&
    posSec <= episode.introEndSec;

  const openExternalWebVideoCast = async () => {
    setCastModal(false);
    try {
      await Linking.openURL(currentServer.url);
    } catch {}
  };

  const switchServer = (srv: StreamServer) => {
    setCurrentServer(srv);
    setHasError(false);
    setIsLoaded(false);
    setServerModal(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Video Player Surface */}
      <View style={styles.playerBox}>
        <Video
          ref={videoRef}
          source={{ uri: currentServer.url }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay={isPlaying}
          useNativeControls={Platform.OS === 'web'}
          rate={playbackRate}
          onPlaybackStatusUpdate={onPlaybackStatusUpdate}
          onError={() => setHasError(true)}
        />

        {/* Fallback if error / server issue */}
        {hasError && (
          <View style={styles.errorOverlay}>
            <Ionicons name="alert-circle-outline" size={38} color={Colors.warning} />
            <Text style={styles.errorTitle}>Falha ao carregar este servidor de vídeo</Text>
            <Text style={styles.errorSub}>Toque abaixo para trocar de servidor de streaming</Text>
            <Pressable style={styles.switchSrvBtn} onPress={() => setServerModal(true)}>
              <Text style={styles.switchSrvBtnText}>Trocar Servidor</Text>
            </Pressable>
          </View>
        )}

        {/* Player Overlay Controls (When not on Web native controls) */}
        {Platform.OS !== 'web' && (
          <View style={styles.overlay} pointerEvents="box-none">
            {/* Top Bar */}
            <View style={styles.topBar}>
              <Pressable style={styles.iconBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={20} color={Colors.text} />
              </Pressable>
              <View style={{ flex: 1, marginHorizontal: 10 }}>
                <Text style={styles.topMediaTitle} numberOfLines={1}>
                  {media.title}
                </Text>
                <Text style={styles.topEpTitle} numberOfLines={1}>
                  {episode.isMovie ? 'Filme' : `T${episode.seasonNumber} • Ep. ${episode.number}`} — {episode.title}
                </Text>
              </View>
              <Pressable style={styles.iconBtn} onPress={() => setServerModal(true)}>
                <Ionicons name="server-outline" size={19} color={Colors.text} />
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={() => setCastModal(true)}>
                <Ionicons name="tv-outline" size={19} color={Colors.text} />
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={() => setTracksModal(true)}>
                <Ionicons name="settings-outline" size={19} color={Colors.text} />
              </Pressable>
            </View>

            {/* Center Controls */}
            <View style={styles.centerControls} pointerEvents="box-none">
              <Pressable style={styles.seekBtn} onPress={() => seekBy(-10)}>
                <Ionicons name="play-back" size={24} color={Colors.text} />
                <Text style={styles.seekText}>10s</Text>
              </Pressable>

              <Pressable
                style={styles.playPauseBtn}
                onPress={async () => {
                  try {
                    if (isPlaying) {
                      await videoRef.current?.pauseAsync();
                    } else {
                      await videoRef.current?.playAsync();
                    }
                  } catch {
                    setIsPlaying((p) => !p);
                  }
                }}
              >
                <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color={Colors.text} />
              </Pressable>

              <Pressable style={styles.seekBtn} onPress={() => seekBy(10)}>
                <Ionicons name="play-forward" size={24} color={Colors.text} />
                <Text style={styles.seekText}>10s</Text>
              </Pressable>
            </View>

            {/* Skip Intro Button */}
            {(showSkipIntro || (posSec < 180 && !episode.isMovie)) && (
              <Pressable style={styles.skipIntroBtn} onPress={skipIntro}>
                <Ionicons name="play-skip-forward" size={15} color={Colors.text} />
                <Text style={styles.skipIntroText}>Pular Abertura</Text>
              </Pressable>
            )}

            {/* Bottom Progress Bar */}
            <View style={styles.bottomBar}>
              <Text style={styles.timeText}>{formatTime(posSec)}</Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${Math.min(100, (posSec / durSec) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.timeText}>{formatTime(durSec)}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Web Player Controls & Quick Server Switch Bar */}
      <View style={styles.serverQuickBar}>
        <View style={styles.serverInfo}>
          <View style={styles.liveGreenDot} />
          <Text style={styles.currentServerText}>{currentServer.name}</Text>
        </View>
        <Pressable style={styles.serverChangeBtn} onPress={() => setServerModal(true)}>
          <Ionicons name="swap-horizontal" size={16} color={Colors.primaryAccent} />
          <Text style={styles.serverChangeText}>Trocar Servidor</Text>
        </Pressable>
      </View>

      {/* Episode Details, Actions & Comments */}
      <ScrollView contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.epMetaSection}>
          <Text style={styles.epFullTitle}>
            {episode.isMovie ? '🎬 Longa-Metragem' : `Temporada ${episode.seasonNumber} • Episódio ${episode.number}`} — {episode.title}
          </Text>
          <Text style={styles.epSynopsis}>{episode.synopsis}</Text>

          <View style={styles.epActionsRow}>
            <Pressable
              style={styles.epActionBtn}
              onPress={() => startDownload(media, episode)}
            >
              <Ionicons name="download-outline" size={18} color={Colors.text} />
              <Text style={styles.epActionText}>Baixar Offline</Text>
            </Pressable>

            <Pressable style={styles.epActionBtn} onPress={() => setCastModal(true)}>
              <Ionicons name="tv-outline" size={18} color={Colors.text} />
              <Text style={styles.epActionText}>Assistir na TV</Text>
            </Pressable>

            <Pressable style={styles.epActionBtn} onPress={() => setTracksModal(true)}>
              <Ionicons name="options-outline" size={18} color={Colors.text} />
              <Text style={styles.epActionText}>Áudio / Legenda</Text>
            </Pressable>

            {nextEpisode && (
              <Pressable
                style={[styles.epActionBtn, styles.nextEpBtn]}
                onPress={() => router.replace(`/player/${nextEpisode.id}`)}
              >
                <Ionicons name="play-skip-forward" size={18} color={Colors.text} />
                <Text style={styles.epActionText}>Próximo Ep.</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsHeader}>
            Comentários do Episódio ({comments.length})
          </Text>

          <View style={styles.commentComposer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Escreva um comentário sobre o episódio..."
              placeholderTextColor={Colors.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <View style={styles.composerBottom}>
              <View style={styles.spoilerSwitchWrap}>
                <Switch
                  value={isSpoilerInput}
                  onValueChange={setIsSpoilerInput}
                  trackColor={{ false: Colors.surfaceCard, true: Colors.primary }}
                  thumbColor={Colors.text}
                />
                <Text style={styles.spoilerLabel}>Marcar como Spoiler</Text>
              </View>
              <Pressable
                style={styles.sendCommentBtn}
                onPress={() => {
                  addComment(episode.id, commentText, isSpoilerInput);
                  setCommentText('');
                  setIsSpoilerInput(false);
                }}
              >
                <Text style={styles.sendCommentText}>Publicar</Text>
              </Pressable>
            </View>
          </View>

          {comments.map((c) => {
            const hiddenBySpoiler = c.isSpoiler && !revealedSpoilers.includes(c.id);
            return (
              <View key={c.id} style={styles.commentCard}>
                <View style={styles.commentTop}>
                  <Image source={{ uri: c.avatarUrl }} style={styles.commentAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.commentUser}>@{c.username}</Text>
                    <Text style={styles.commentTime}>{c.createdAt}</Text>
                  </View>
                  <Pressable onPress={() => setReportTargetId(c.id)} hitSlop={8}>
                    <Ionicons name="flag-outline" size={16} color={Colors.textMuted} />
                  </Pressable>
                </View>

                {hiddenBySpoiler ? (
                  <Pressable
                    style={styles.spoilerBox}
                    onPress={() => setRevealedSpoilers((prev) => [...prev, c.id])}
                  >
                    <Ionicons name="eye-off-outline" size={18} color={Colors.primaryAccent} />
                    <Text style={styles.spoilerBoxText}>
                      Alerta de Spoiler — Toque para revelar o comentário
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={styles.commentBody}>{c.content}</Text>
                )}

                <View style={styles.commentFooter}>
                  <Pressable
                    style={styles.likeBtn}
                    onPress={() => toggleLikeComment(c.id)}
                  >
                    <Ionicons
                      name={c.likedByMe ? 'heart' : 'heart-outline'}
                      size={16}
                      color={c.likedByMe ? Colors.primary : Colors.textMuted}
                    />
                    <Text style={styles.likeCount}>{c.likesCount}</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Server Selection Modal */}
      <Modal
        visible={serverModal}
        transparent
        animationType="slide"
        onRequestClose={() => setServerModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setServerModal(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Selecione o Servidor de Streaming</Text>
            <Text style={styles.modalSub}>Se o vídeo travar ou não carregar, troque de servidor:</Text>
            {availableServers.map((srv) => {
              const active = currentServer.id === srv.id;
              return (
                <Pressable
                  key={srv.id}
                  style={[styles.castOption, active && styles.serverOptionActive]}
                  onPress={() => switchServer(srv)}
                >
                  <Ionicons
                    name="server-outline"
                    size={22}
                    color={active ? Colors.primary : Colors.textSecondary}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.castOptionTitle, active && { color: Colors.primaryAccent }]}>
                      {srv.name}
                    </Text>
                    <Text style={styles.castOptionSub}>Qualidade: {srv.quality} • Tipo: {srv.type}</Text>
                  </View>
                  {active && <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      {/* Audio / Subtitle / Speed Modal (OptionReproductionModal) */}
      <Modal
        visible={tracksModal}
        transparent
        animationType="slide"
        onRequestClose={() => setTracksModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setTracksModal(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Opções de Reprodução</Text>

            <Text style={styles.groupLabel}>Faixa de Áudio</Text>
            <View style={styles.pillsRow}>
              {episode.audioTracks.map((t) => (
                <Pressable
                  key={t.id}
                  style={[styles.pill, selectedAudio === t.id && styles.pillActive]}
                  onPress={() => setSelectedAudio(t.id)}
                >
                  <Text
                    style={[styles.pillText, selectedAudio === t.id && styles.pillTextActive]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.groupLabel}>Legendas</Text>
            <View style={styles.pillsRow}>
              {episode.subtitleTracks.map((t) => (
                <Pressable
                  key={t.id}
                  style={[styles.pill, selectedSub === t.id && styles.pillActive]}
                  onPress={() => setSelectedSub(t.id)}
                >
                  <Text
                    style={[styles.pillText, selectedSub === t.id && styles.pillTextActive]}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.groupLabel}>Velocidade de Reprodução</Text>
            <View style={styles.pillsRow}>
              {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                <Pressable
                  key={rate}
                  style={[styles.pill, playbackRate === rate && styles.pillActive]}
                  onPress={() => setPlaybackRate(rate)}
                >
                  <Text
                    style={[styles.pillText, playbackRate === rate && styles.pillTextActive]}
                  >
                    {rate}x
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* CastDeviceModal */}
      <Modal
        visible={castModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCastModal(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setCastModal(false)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Transmitir para TV / Player Externo</Text>
            <Text style={styles.modalSub}>
              Assista em seu player favorito ou conecte sua Smart TV:
            </Text>

            <Pressable
              style={styles.castOption}
              onPress={() => {
                setCastModal(false);
                router.push('/tv-scanner');
              }}
            >
              <Ionicons name="qr-code-outline" size={22} color={Colors.primaryAccent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.castOptionTitle}>
                  {user.connectedTvName || 'Parear Smart TV via QR Code'}
                </Text>
                <Text style={styles.castOptionSub}>
                  Sincronizar reprodução direto no app Shinokai TV
                </Text>
              </View>
            </Pressable>

            <Pressable style={styles.castOption} onPress={openExternalWebVideoCast}>
              <Ionicons name="share-outline" size={22} color={Colors.info} />
              <View style={{ flex: 1 }}>
                <Text style={styles.castOptionTitle}>Web Video Caster / Player Externo</Text>
                <Text style={styles.castOptionSub}>
                  Enviar stream para Chromecast, DLNA, Roku ou VLC
                </Text>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* ModalNextEpisode */}
      <Modal
        visible={nextEpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setNextEpModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Próximo Episódio Pronto</Text>
            <Text style={styles.modalSub}>
              Deseja iniciar o Episódio {nextEpisode?.number} agora?
            </Text>
            <View style={styles.pillsRow}>
              <Pressable
                style={[styles.pill, { flex: 1, alignItems: 'center' }]}
                onPress={() => setNextEpModal(false)}
              >
                <Text style={styles.pillText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.pill, styles.pillActive, { flex: 1, alignItems: 'center' }]}
                onPress={() => {
                  setNextEpModal(false);
                  if (nextEpisode) router.replace(`/player/${nextEpisode.id}`);
                }}
              >
                <Text style={styles.pillTextActive}>Reproduzir Agora</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ReportCommentModal */}
      <Modal
        visible={!!reportTargetId}
        transparent
        animationType="slide"
        onRequestClose={() => setReportTargetId(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setReportTargetId(null)}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Denunciar Comentário</Text>
            <Text style={styles.modalSub}>Selecione o motivo da denúncia:</Text>
            {REPORT_REASONS.map((reason) => (
              <Pressable
                key={reason}
                style={styles.castOption}
                onPress={() => {
                  if (reportTargetId) reportComment(reportTargetId, reason);
                  setReportTargetId(null);
                }}
              >
                <Ionicons name="alert-circle-outline" size={18} color={Colors.danger} />
                <Text style={[styles.castOptionSub, { flex: 1, color: Colors.text }]}>
                  {reason}
                </Text>
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
  playerBox: {
    width: '100%',
    height: 250,
    backgroundColor: Colors.backgroundDeep,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 10, 15, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 10,
  },
  errorTitle: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.bold,
    marginTop: 8,
    textAlign: 'center',
  },
  errorSub: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 4,
    textAlign: 'center',
  },
  switchSrvBtn: {
    marginTop: 12,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  switchSrvBtnText: {
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 10, 15, 0.38)',
    justifyContent: 'space-between',
    padding: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(10, 14, 18, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  topMediaTitle: {
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
  topEpTitle: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
  },
  seekBtn: {
    alignItems: 'center',
  },
  seekText: {
    color: Colors.text,
    fontSize: 10,
    fontFamily: Fonts.bold,
    marginTop: 2,
  },
  playPauseBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipIntroBtn: {
    position: 'absolute',
    right: 14,
    bottom: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  skipIntroText: {
    color: Colors.text,
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    color: Colors.text,
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  serverQuickBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMuted,
  },
  serverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  currentServerText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  serverChangeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  serverChangeText: {
    color: Colors.primaryAccent,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 36,
  },
  epMetaSection: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMuted,
    paddingBottom: 16,
  },
  epFullTitle: {
    color: Colors.text,
    fontSize: 17,
    fontFamily: Fonts.bold,
  },
  epSynopsis: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginTop: 6,
    lineHeight: 18,
  },
  epActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  epActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nextEpBtn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  epActionText: {
    color: Colors.text,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  commentsSection: {
    marginTop: 18,
  },
  commentsHeader: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginBottom: 12,
  },
  commentComposer: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceMuted,
    marginBottom: 16,
  },
  commentInput: {
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.regular,
    minHeight: 54,
  },
  composerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceMuted,
    paddingTop: 8,
  },
  spoilerSwitchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  spoilerLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  sendCommentBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  sendCommentText: {
    color: Colors.text,
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  commentCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.surfaceMuted,
  },
  commentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.surfaceCard,
  },
  commentUser: {
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
  commentTime: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: Fonts.regular,
  },
  spoilerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.spoilerBg,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  spoilerBoxText: {
    color: Colors.primaryAccent,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  commentBody: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginTop: 8,
    lineHeight: 18,
  },
  commentFooter: {
    flexDirection: 'row',
    marginTop: 8,
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.medium,
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
    marginTop: 4,
    marginBottom: 12,
  },
  serverOptionActive: {
    backgroundColor: 'rgba(226, 18, 33, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  groupLabel: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    marginTop: 14,
    marginBottom: 8,
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  pillTextActive: {
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  castOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceMuted,
  },
  castOptionTitle: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  castOptionSub: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
});
