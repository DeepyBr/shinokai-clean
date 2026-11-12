import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { Colors, Fonts } from '../../src/theme/colors';
import { DownloadQuality, Playlist } from '../../src/types';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user,
    watchedEpisodes,
    favorites,
    friends,
    settings,
    playlists,
    medias,
    getMediaById,
    createPlaylist,
    deletePlaylist,
    updateSettings,
    updateUserProfile,
    signInWithGoogle,
    syncWithGoogle,
    signOut,
    disconnectTv,
    acceptFriendRequest,
    removeFriendOrRequest,
    sendFriendRequest,
  } = useApp();

  const [editModal, setEditModal] = useState(false);
  const [nameInput, setNameInput] = useState(user.displayName);
  const [usernameInput, setUsernameInput] = useState(user.username);

  const [friendsModal, setFriendsModal] = useState(false);
  const [friendSearchInput, setFriendSearchInput] = useState('');
  const [adultModal, setAdultModal] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Playlist management
  const [createPlModal, setCreatePlModal] = useState(false);
  const [newPlTitle, setNewPlTitle] = useState('');
  const [newPlDesc, setNewPlDesc] = useState('');
  const [viewingPlaylist, setViewingPlaylist] = useState<Playlist | null>(null);

  const saveProfile = () => {
    if (nameInput.trim()) {
      updateUserProfile({
        displayName: nameInput.trim(),
        username: usernameInput.trim().replace(/^@/, '') || user.username,
      });
    }
    setEditModal(false);
  };

  const handleSyncCloud = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      await syncWithGoogle();
      setSyncFeedback('Playlists, histórico e configurações salvos na nuvem!');
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch {
      setSyncFeedback('Erro ao sincronizar. Tente novamente.');
      setTimeout(() => setSyncFeedback(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreatePlaylist = () => {
    if (newPlTitle.trim()) {
      createPlaylist(newPlTitle.trim(), newPlDesc.trim() || 'Minha coleção personalizada');
      setNewPlTitle('');
      setNewPlDesc('');
      setCreatePlModal(false);
    }
  };

  const handleToggleAdult = (nextVal: boolean) => {
    if (nextVal) {
      setAdultModal(true);
    } else {
      updateSettings({ showAdultContent: false });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner & Avatar */}
        <ImageBackground
          source={{ uri: user.bannerUrl }}
          style={styles.banner}
          resizeMode="cover"
        >
          <View style={styles.bannerOverlay} />
        </ImageBackground>

        <View style={styles.profileHeader}>
          <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          <View style={styles.userRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.displayName}>{user.displayName}</Text>
              <Text style={styles.username}>@{user.username}</Text>
            </View>
            <Pressable style={styles.editBtn} onPress={() => setEditModal(true)}>
              <Ionicons name="create-outline" size={16} color={Colors.text} />
              <Text style={styles.editBtnText}>Editar</Text>
            </Pressable>
          </View>

          {/* Pure anime stats */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{user.episodesWatched + watchedEpisodes.length}</Text>
              <Text style={styles.statLabel}>Episódios</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{user.hoursWatched}h</Text>
              <Text style={styles.statLabel}>Assistidas</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{favorites.length}</Text>
              <Text style={styles.statLabel}>Na Lista</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{playlists.length}</Text>
              <Text style={styles.statLabel}>Playlists</Text>
            </View>
          </View>
        </View>

        {/* Google Account & Cloud Sync Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Conta Google & Backup na Nuvem</Text>
          <View style={styles.cloudCard}>
            <View style={styles.cloudTopRow}>
              <View style={styles.googleIconCircle}>
                <Ionicons name="logo-google" size={20} color="#EA4335" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.cloudBadgeRow}>
                  <Text style={styles.cloudTitle}>
                    {user.isGoogleLinked || !user.isGuest
                      ? 'Conta Google Conectada'
                      : 'Conta Visitante'}
                  </Text>
                  <View style={styles.activeSyncBadge}>
                    <Text style={styles.activeSyncBadgeText}>Nuvem Ativa</Text>
                  </View>
                </View>
                <Text style={styles.cloudEmail}>
                  {user.googleEmail || (user.isGuest ? 'Sincronização local' : 'gianprivadobr@gmail.com')}
                </Text>
                <Text style={styles.cloudDesc}>
                  Playlists, progresso de vídeo, histórico e preferências salvos na nuvem.
                </Text>
              </View>
            </View>

            {syncFeedback && (
              <View style={styles.feedbackBanner}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                <Text style={styles.feedbackBannerText}>{syncFeedback}</Text>
              </View>
            )}

            <View style={styles.cloudActionRow}>
              {user.isGuest ? (
                <Pressable style={styles.syncBtn} onPress={signInWithGoogle}>
                  <Ionicons name="logo-google" size={16} color={Colors.text} />
                  <Text style={styles.syncBtnText}>Conectar com Google</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.syncBtn, isSyncing && { opacity: 0.7 }]}
                  onPress={handleSyncCloud}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <ActivityIndicator size="small" color={Colors.text} />
                  ) : (
                    <Ionicons name="cloud-upload-outline" size={16} color={Colors.text} />
                  )}
                  <Text style={styles.syncBtnText}>
                    {isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
                  </Text>
                </Pressable>
              )}

              <View style={styles.syncStatusRight}>
                <Ionicons name="shield-checkmark-outline" size={15} color={Colors.primaryAccent} />
                <Text style={styles.syncStatusText}>Backup Seguro</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Playlists Management Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Minhas Playlists ({playlists.length})</Text>
            <Pressable
              style={styles.addPlaylistBtn}
              onPress={() => setCreatePlModal(true)}
            >
              <Ionicons name="add" size={16} color={Colors.text} />
              <Text style={styles.addPlaylistBtnText}>Nova Playlist</Text>
            </Pressable>
          </View>

          {playlists.map((pl) => {
            const previewMedia = pl.mediaIds.length > 0 ? getMediaById(pl.mediaIds[0]) : null;
            return (
              <Pressable
                key={pl.id}
                style={styles.playlistCard}
                onPress={() => setViewingPlaylist(pl)}
              >
                <View style={styles.playlistThumb}>
                  {previewMedia ? (
                    <Image source={{ uri: previewMedia.posterUrl }} style={styles.thumbImage} />
                  ) : (
                    <Ionicons name="folder-outline" size={28} color={Colors.primaryAccent} />
                  )}
                </View>
                <View style={styles.playlistInfo}>
                  <Text style={styles.playlistTitle}>{pl.name}</Text>
                  <Text style={styles.playlistDesc} numberOfLines={1}>
                    {pl.description || 'Playlist de animes'}
                  </Text>
                  <Text style={styles.playlistMeta}>
                    {pl.mediaIds.length} {pl.mediaIds.length === 1 ? 'anime salvo' : 'animes salvos'}
                  </Text>
                </View>
                <Pressable
                  style={styles.playlistDeleteBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    deletePlaylist(pl.id);
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                </Pressable>
              </Pressable>
            );
          })}
        </View>

        {/* Smart TV Connection Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dispositivos e Smart TV</Text>
          <View style={styles.tvCard}>
            <View style={styles.tvIconWrap}>
              <Ionicons name="tv-outline" size={24} color={Colors.primaryAccent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tvTitle}>
                {user.connectedTvName || 'Nenhuma Smart TV conectada'}
              </Text>
              <Text style={styles.tvSub}>
                {user.connectedTvName
                  ? 'Pareada e pronta para transmissão direta'
                  : 'Aponte a câmera para o QR Code exibido na sua TV'}
              </Text>
            </View>
            {user.connectedTvName ? (
              <Pressable style={styles.tvDisconnectBtn} onPress={disconnectTv}>
                <Text style={styles.tvDisconnectText}>Desconectar</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.tvConnectBtn}
                onPress={() => router.push('/tv-scanner')}
              >
                <Ionicons name="qr-code-outline" size={16} color={Colors.text} />
                <Text style={styles.tvConnectText}>Conectar</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Social / Friends */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Amigos ({friends.length})</Text>
            <Pressable onPress={() => setFriendsModal(true)}>
              <Text style={styles.linkText}>Gerenciar Amigos</Text>
            </Pressable>
          </View>

          {friends.slice(0, 3).map((friend) => (
            <View key={friend.id} style={styles.friendItem}>
              <Image source={{ uri: friend.avatarUrl }} style={styles.friendAvatar} />
              <View style={{ flex: 1 }}>
                <View style={styles.friendNameRow}>
                  <Text style={styles.friendName}>{friend.displayName}</Text>
                  <View
                    style={[
                      styles.onlineDot,
                      { backgroundColor: friend.isOnline ? Colors.success : Colors.textDisabled },
                    ]}
                  />
                </View>
                <Text style={styles.friendWatching} numberOfLines={1}>
                  {friend.currentlyWatching || friend.statusText}
                </Text>
              </View>
              {friend.relation === 'PENDING_RECEIVED' && (
                <Pressable
                  style={styles.acceptBtn}
                  onPress={() => acceptFriendRequest(friend.id)}
                >
                  <Text style={styles.acceptBtnText}>Aceitar</Text>
                </Pressable>
              )}
            </View>
          ))}
        </View>

        {/* Playback Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações de Reprodução & Nuvem</Text>

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Sincronização em Nuvem Automática</Text>
              <Text style={styles.settingSub}>
                Fazer backup contínuo com sua conta Google
              </Text>
            </View>
            <Switch
              value={settings.cloudSyncEnabled}
              onValueChange={(v) => updateSettings({ cloudSyncEnabled: v })}
              trackColor={{ false: Colors.surfaceCard, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Reprodução Automática</Text>
              <Text style={styles.settingSub}>Iniciar próximo episódio automaticamente</Text>
            </View>
            <Switch
              value={settings.autoPlayNext}
              onValueChange={(v) => updateSettings({ autoPlayNext: v })}
              trackColor={{ false: Colors.surfaceCard, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Pular Abertura Automaticamente</Text>
              <Text style={styles.settingSub}>Avançar intro quando disponível no episódio</Text>
            </View>
            <Switch
              value={settings.autoSkipIntro}
              onValueChange={(v) => updateSettings({ autoSkipIntro: v })}
              trackColor={{ false: Colors.surfaceCard, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Qualidade Padrão de Download</Text>
              <Text style={styles.settingSub}>Resolução usada ao baixar episódios offline</Text>
            </View>
            <View style={styles.qualityPills}>
              {(['1080p', '720p', '480p'] as DownloadQuality[]).map((q) => (
                <Pressable
                  key={q}
                  style={[
                    styles.qPill,
                    settings.defaultQuality === q && styles.qPillActive,
                  ]}
                  onPress={() => updateSettings({ defaultQuality: q })}
                >
                  <Text
                    style={[
                      styles.qPillText,
                      settings.defaultQuality === q && styles.qPillTextActive,
                    ]}
                  >
                    {q}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Alertas de Novos Episódios</Text>
              <Text style={styles.settingSub}>Avisar quando animes com lembrete saírem</Text>
            </View>
            <Switch
              value={settings.episodeReleaseAlerts}
              onValueChange={(v) => updateSettings({ episodeReleaseAlerts: v })}
              trackColor={{ false: Colors.surfaceCard, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Exibir Conteúdo +18</Text>
              <Text style={styles.settingSub}>Incluir obras com classificação adulta no catálogo</Text>
            </View>
            <Switch
              value={settings.showAdultContent}
              onValueChange={handleToggleAdult}
              trackColor={{ false: Colors.surfaceCard, true: Colors.primary }}
              thumbColor={Colors.text}
            />
          </View>
        </View>

        {/* Account Sign Out / Connect */}
        <View style={styles.section}>
          {user.isGuest ? (
            <Pressable style={styles.googleBtn} onPress={signInWithGoogle}>
              <Ionicons name="logo-google" size={18} color={Colors.text} />
              <Text style={styles.googleBtnText}>Vincular com Conta Google</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.logoutBtn} onPress={signOut}>
              <Ionicons name="log-out-outline" size={18} color={Colors.danger} />
              <Text style={styles.logoutBtnText}>Sair da Conta</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editModal}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            <Text style={styles.inputLabel}>Nome de Exibição</Text>
            <TextInput
              style={styles.modalInput}
              value={nameInput}
              onChangeText={setNameInput}
              placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.inputLabel}>Nome de Usuário</Text>
            <TextInput
              style={styles.modalInput}
              value={usernameInput}
              onChangeText={setUsernameInput}
              placeholderTextColor={Colors.textMuted}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setEditModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={saveProfile}>
                <Text style={styles.saveBtnText}>Salvar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Playlist Modal */}
      <Modal
        visible={createPlModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCreatePlModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Criar Nova Playlist</Text>
              <Pressable onPress={() => setCreatePlModal(false)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </Pressable>
            </View>
            <Text style={styles.inputLabel}>Nome da Playlist</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Ex: Favoritos de Ação, Melhores Isekai..."
              placeholderTextColor={Colors.textMuted}
              value={newPlTitle}
              onChangeText={setNewPlTitle}
            />
            <Text style={styles.inputLabel}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.modalInput, { height: 70, textAlignVertical: 'top' }]}
              placeholder="Breve descrição da sua coleção..."
              placeholderTextColor={Colors.textMuted}
              multiline
              value={newPlDesc}
              onChangeText={setNewPlDesc}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setCreatePlModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, !newPlTitle.trim() && { opacity: 0.5 }]}
                disabled={!newPlTitle.trim()}
                onPress={handleCreatePlaylist}
              >
                <Text style={styles.saveBtnText}>Criar Playlist</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Viewing Playlist Modal */}
      <Modal
        visible={!!viewingPlaylist}
        transparent
        animationType="slide"
        onRequestClose={() => setViewingPlaylist(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{viewingPlaylist?.name}</Text>
                <Text style={styles.modalSub}>{viewingPlaylist?.description}</Text>
              </View>
              <Pressable onPress={() => setViewingPlaylist(null)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </Pressable>
            </View>

            {viewingPlaylist && viewingPlaylist.mediaIds.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                <Ionicons name="folder-open-outline" size={44} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>Esta playlist está vazia</Text>
                <Text style={styles.emptySub}>
                  Abra a página de qualquer anime e toque em &quot;Playlists&quot; para salvá-lo aqui.
                </Text>
              </View>
            ) : (
              <ScrollView style={{ marginTop: 10 }}>
                {viewingPlaylist?.mediaIds.map((mId) => {
                  const anime = getMediaById(mId);
                  if (!anime) return null;
                  return (
                    <Pressable
                      key={mId}
                      style={styles.playlistAnimeRow}
                      onPress={() => {
                        setViewingPlaylist(null);
                        router.push(`/media/${anime.id}`);
                      }}
                    >
                      <Image source={{ uri: anime.posterUrl }} style={styles.playlistAnimePoster} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.playlistAnimeTitle}>{anime.title}</Text>
                        <Text style={styles.playlistAnimeSub}>
                          {anime.releaseYear} • {anime.studio} • {anime.rating.toFixed(1)} ★
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Friends Management Modal */}
      <Modal
        visible={friendsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setFriendsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Amigos Shinokai</Text>
              <Pressable onPress={() => setFriendsModal(false)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </Pressable>
            </View>

            <View style={styles.addFriendRow}>
              <TextInput
                style={[styles.modalInput, { flex: 1, marginTop: 0 }]}
                placeholder="Buscar por @usuario..."
                placeholderTextColor={Colors.textMuted}
                value={friendSearchInput}
                onChangeText={setFriendSearchInput}
              />
              <Pressable
                style={styles.addFriendBtn}
                onPress={() => {
                  sendFriendRequest(friendSearchInput);
                  setFriendSearchInput('');
                }}
              >
                <Ionicons name="person-add-outline" size={18} color={Colors.text} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 300, marginTop: 12 }}>
              {friends.map((f) => (
                <View key={f.id} style={styles.friendItem}>
                  <Image source={{ uri: f.avatarUrl }} style={styles.friendAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.friendName}>{f.displayName}</Text>
                    <Text style={styles.friendWatching}>@{f.username}</Text>
                  </View>
                  {f.relation === 'PENDING_RECEIVED' && (
                    <Pressable
                      style={styles.acceptBtn}
                      onPress={() => acceptFriendRequest(f.id)}
                    >
                      <Text style={styles.acceptBtnText}>Aceitar</Text>
                    </Pressable>
                  )}
                  <Pressable
                    style={styles.removeFriendBtn}
                    onPress={() => removeFriendOrRequest(f.id)}
                  >
                    <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Adult Content Warning Modal */}
      <Modal
        visible={adultModal}
        transparent
        animationType="fade"
        onRequestClose={() => setAdultModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Aviso de Classificação (+18)</Text>
            <Text style={styles.adultWarningText}>
              Ao ativar esta opção, obras classificadas para maiores de 18 anos poderão ser
              exibidas nas buscas e recomendações. Confirma que você possui 18 anos ou mais?
            </Text>
            <View style={styles.modalActions}>
              <Pressable style={styles.cancelBtn} onPress={() => setAdultModal(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.saveBtn}
                onPress={() => {
                  updateSettings({ showAdultContent: true });
                  setAdultModal(false);
                }}
              >
                <Text style={styles.saveBtnText}>Tenho +18 anos</Text>
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
  scrollContent: {
    paddingBottom: 36,
  },
  banner: {
    height: 120,
    backgroundColor: Colors.surfaceCard,
  },
  bannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 14, 18, 0.45)',
  },
  profileHeader: {
    paddingHorizontal: 16,
    marginTop: -36,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 3,
    borderColor: Colors.background,
    backgroundColor: Colors.surfaceCard,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  displayName: {
    color: Colors.text,
    fontSize: 20,
    fontFamily: Fonts.bold,
  },
  username: {
    color: Colors.textMuted,
    fontSize: 13,
    fontFamily: Fonts.regular,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  editBtnText: {
    color: Colors.text,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.surfaceMuted,
  },
  statValue: {
    color: Colors.text,
    fontSize: 17,
    fontFamily: Fonts.bold,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  section: {
    marginTop: 22,
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: 16,
    fontFamily: Fonts.bold,
    marginBottom: 10,
  },
  cloudCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cloudTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  googleIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cloudBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cloudTitle: {
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  activeSyncBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activeSyncBadgeText: {
    color: Colors.success,
    fontSize: 10,
    fontFamily: Fonts.bold,
  },
  cloudEmail: {
    color: Colors.primaryAccent,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
    marginTop: 2,
  },
  cloudDesc: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 6,
    lineHeight: 16,
  },
  feedbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  feedbackBannerText: {
    color: Colors.success,
    fontSize: 12,
    fontFamily: Fonts.medium,
    flex: 1,
  },
  cloudActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceMuted,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  syncBtnText: {
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
  syncStatusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  syncStatusText: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.medium,
  },
  addPlaylistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addPlaylistBtnText: {
    color: Colors.text,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  playlistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  playlistThumb: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  playlistInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playlistTitle: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  playlistDesc: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  playlistMeta: {
    color: Colors.primaryAccent,
    fontSize: 11,
    fontFamily: Fonts.medium,
    marginTop: 2,
  },
  playlistDeleteBtn: {
    padding: 8,
  },
  playlistAnimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMuted,
    gap: 12,
  },
  playlistAnimePoster: {
    width: 44,
    height: 60,
    borderRadius: 6,
    backgroundColor: Colors.surfaceElevated,
  },
  playlistAnimeTitle: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  playlistAnimeSub: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 3,
  },
  tvCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  tvIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tvTitle: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  tvSub: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  tvConnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tvConnectText: {
    color: Colors.text,
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  tvDisconnectBtn: {
    backgroundColor: Colors.surfaceElevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tvDisconnectText: {
    color: Colors.danger,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    gap: 10,
  },
  friendAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surfaceElevated,
  },
  friendNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  friendName: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  friendWatching: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  acceptBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  acceptBtnText: {
    color: Colors.text,
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  removeFriendBtn: {
    padding: 8,
  },
  linkText: {
    color: Colors.primaryAccent,
    fontSize: 13,
    fontFamily: Fonts.medium,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.surfaceMuted,
  },
  settingTitle: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  settingSub: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  qualityPills: {
    flexDirection: 'row',
    gap: 6,
  },
  qPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  qPillText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: Fonts.medium,
  },
  qPillTextActive: {
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    borderRadius: 12,
  },
  googleBtnText: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(235, 77, 75, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(235, 77, 75, 0.3)',
    paddingVertical: 14,
    borderRadius: 12,
  },
  logoutBtnText: {
    color: Colors.danger,
    fontSize: 14,
    fontFamily: Fonts.bold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 18,
    fontFamily: Fonts.bold,
  },
  modalSub: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: Fonts.semiBold,
    marginTop: 12,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.regular,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.surfaceCard,
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  saveBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.primary,
  },
  saveBtnText: {
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
  addFriendRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  addFriendBtn: {
    backgroundColor: Colors.primary,
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adultWarningText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: Fonts.regular,
    lineHeight: 18,
    marginTop: 10,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts.bold,
    marginTop: 10,
  },
  emptySub: {
    color: Colors.textMuted,
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
