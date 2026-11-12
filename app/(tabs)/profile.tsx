import React, { useState } from 'react';
import {
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
import { DownloadQuality } from '../../src/types';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user,
    watchedEpisodes,
    favorites,
    friends,
    settings,
    updateSettings,
    updateUserProfile,
    signInWithGoogle,
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

  const saveProfile = () => {
    if (nameInput.trim()) {
      updateUserProfile({
        displayName: nameInput.trim(),
        username: usernameInput.trim().replace(/^@/, '') || user.username,
      });
    }
    setEditModal(false);
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

          {/* Stats Row (Zero economy/gamification — only pure anime stats) */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{ user.episodesWatched + watchedEpisodes.length }</Text>
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
          </View>
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
          <Text style={styles.sectionTitle}>Reprodução e Downloads</Text>

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
        </View>

        {/* Notifications & Content Filter */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificações e Conteúdo</Text>

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

        {/* Account Section */}
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

      {/* AdultContentModal */}
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
    gap: 10,
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
    fontSize: 18,
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
  linkText: {
    color: Colors.primaryAccent,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  tvCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.surfaceMuted,
    gap: 12,
  },
  tvIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tvTitle: {
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.bold,
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
    gap: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
  },
  tvConnectText: {
    color: Colors.text,
    fontSize: 12,
    fontFamily: Fonts.bold,
  },
  tvDisconnectBtn: {
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 10,
    paddingVertical: 7,
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
    backgroundColor: Colors.surface,
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
    gap: 10,
  },
  friendAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.surfaceCard,
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
    fontSize: 12,
    fontFamily: Fonts.regular,
    marginTop: 2,
  },
  acceptBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
  },
  acceptBtnText: {
    color: Colors.text,
    fontSize: 11,
    fontFamily: Fonts.bold,
  },
  removeFriendBtn: {
    padding: 6,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
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
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: Colors.surfaceCard,
  },
  qPillActive: {
    backgroundColor: Colors.primary,
  },
  qPillText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontFamily: Fonts.semiBold,
  },
  qPillTextActive: {
    color: Colors.text,
    fontFamily: Fonts.bold,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 13,
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
    backgroundColor: Colors.surface,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.surfaceMuted,
  },
  logoutBtnText: {
    color: Colors.danger,
    fontSize: 14,
    fontFamily: Fonts.semiBold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 18,
    padding: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: Colors.text,
    fontSize: 17,
    fontFamily: Fonts.bold,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontFamily: Fonts.medium,
    marginTop: 12,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    color: Colors.text,
    fontFamily: Fonts.regular,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addFriendRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  addFriendBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adultWarningText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: Fonts.regular,
    marginTop: 10,
    lineHeight: 19,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: Colors.surfaceCard,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.semiBold,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  saveBtnText: {
    color: Colors.text,
    fontSize: 13,
    fontFamily: Fonts.bold,
  },
});
