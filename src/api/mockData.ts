import {
  CalendarReleaseItem,
  CommentItem,
  ContinueWatchingItem,
  FriendUser,
  Media,
  NotificationItem,
  UserProfile,
} from '../types';

export const GENRES = [
  'Ação',
  'Aventura',
  'Fantasia',
  'Ficção Científica',
  'Romance',
  'Comédia',
  'Drama',
  'Suspense',
  'Sobrenatural',
  'Seinen',
  'Shounen',
  'Isekai',
];

const SAMPLE_HLS_STREAM = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

function buildEpisodes(mediaId: string, mediaTitle: string, count: number, bannerUrl: string) {
  return Array.from({ length: count }, (_, idx) => {
    const epNum = idx + 1;
    return {
      id: `${mediaId}-ep-${epNum}`,
      mediaId,
      seasonNumber: epNum > 12 ? 2 : 1,
      number: epNum,
      title: `Episódio ${epNum} — O Despertar da Jornada`,
      synopsis: `Em ${mediaTitle}, eventos decisivos colocam os protagonistas diante de um novo desafio no episódio ${epNum}.`,
      thumbnail: bannerUrl,
      durationSec: 1420,
      introStartSec: 85,
      introEndSec: 175,
      releaseDate: '2026-10-15',
      streamUrl: SAMPLE_HLS_STREAM,
      audioTracks: [
        { id: 'jp', label: 'Japonês (Original)', language: 'ja-JP' },
        { id: 'pt', label: 'Português (Dublado)', language: 'pt-BR' },
      ],
      subtitleTracks: [
        { id: 'pt-br', label: 'Português (Brasil)', language: 'pt-BR' },
        { id: 'off', label: 'Desativado', language: 'none' },
      ],
      likesCount: 340 + idx * 29,
    };
  });
}

export const INITIAL_MEDIAS: Media[] = [
  {
    id: 'solo-leveling-s2',
    title: 'Solo Leveling: Arise from the Shadow',
    originalTitle: 'Ore dake Level Up na Ken Season 2',
    synopsis:
      'Após conquistar o Castelo Demoníaco e dominar o poder das sombras, Sung Jinwoo enfrenta ameaças de nível Monarca enquanto tenta proteger sua família e desvendar a origem do Sistema.',
    posterUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    rating: 4.9,
    releaseYear: 2026,
    format: 'TV',
    status: 'RELEASING',
    audioType: 'DUAL_AUDIO',
    ageRating: '16',
    studio: 'A-1 Pictures',
    genres: ['Ação', 'Fantasia', 'Aventura', 'Shounen'],
    totalEpisodes: 13,
    seasons: [1, 2],
    episodes: buildEpisodes(
      'solo-leveling-s2',
      'Solo Leveling: Arise from the Shadow',
      13,
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80'
    ),
  },
  {
    id: 'frieren-beyond',
    title: 'Frieren e a Jornada para o Além',
    originalTitle: 'Sousou no Frieren',
    synopsis:
      'Após derrotar o Rei Demônio ao lado do grupo de heróis, a maga elfa Frieren inicia uma nova jornada para compreender melhor os humanos e o valor das memórias deixadas pelo tempo.',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    rating: 4.95,
    releaseYear: 2025,
    format: 'TV',
    status: 'FINISHED',
    audioType: 'DUAL_AUDIO',
    ageRating: '12',
    studio: 'Madhouse',
    genres: ['Aventura', 'Fantasia', 'Drama'],
    totalEpisodes: 16,
    seasons: [1, 2],
    episodes: buildEpisodes(
      'frieren-beyond',
      'Frieren e a Jornada para o Além',
      16,
      'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80'
    ),
  },
  {
    id: 'dandadan-tv',
    title: 'DAN DA DAN',
    originalTitle: 'Dandadan',
    synopsis:
      'Momo Ayase acredita em fantasmas, mas não em alienígenas. Seu colega Okarun acredita em alienígenas, mas não em fantasmas. Em uma aposta para provar quem está certo, ambos entram em um caos sobrenatural.',
    posterUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200&auto=format&fit=crop&q=80',
    rating: 4.8,
    releaseYear: 2026,
    format: 'TV',
    status: 'RELEASING',
    audioType: 'DUAL_AUDIO',
    ageRating: '16',
    studio: 'Science SARU',
    genres: ['Ação', 'Comédia', 'Sobrenatural', 'Shounen'],
    totalEpisodes: 12,
    seasons: [1],
    episodes: buildEpisodes(
      'dandadan-tv',
      'DAN DA DAN',
      12,
      'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80'
    ),
  },
  {
    id: 'kaiju-no-8',
    title: 'Kaiju No. 8',
    originalTitle: 'Kaijuu 8-gou',
    synopsis:
      'Em um Japão constantemente atacado por monstros gigantes chamados Kaiju, Kafka Hibino ganha a habilidade de se transformar em um Kaiju poderoso enquanto tenta entrar na Força de Defesa.',
    posterUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
    rating: 4.7,
    releaseYear: 2025,
    format: 'TV',
    status: 'RELEASING',
    audioType: 'DUAL_AUDIO',
    ageRating: '14',
    studio: 'Production I.G',
    genres: ['Ação', 'Ficção Científica', 'Shounen'],
    totalEpisodes: 12,
    seasons: [1],
    episodes: buildEpisodes(
      'kaiju-no-8',
      'Kaiju No. 8',
      12,
      'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80'
    ),
  },
  {
    id: 'apothecary-diaries',
    title: 'Diários de uma Apotecária',
    originalTitle: 'Kusuriya no Hitorigoto',
    synopsis:
      'Maomao, uma jovem com profundo conhecimento de ervas e venenos, trabalha no palácio imperial resolvendo mistérios médicos e intrigas da corte.',
    posterUrl: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1200&auto=format&fit=crop&q=80',
    rating: 4.85,
    releaseYear: 2025,
    format: 'TV',
    status: 'FINISHED',
    audioType: 'LEGENDADO',
    ageRating: '14',
    studio: 'TOHO animation STUDIO',
    genres: ['Drama', 'Suspense', 'Romance', 'Seinen'],
    totalEpisodes: 24,
    seasons: [1, 2],
    episodes: buildEpisodes(
      'apothecary-diaries',
      'Diários de uma Apotecária',
      14,
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&auto=format&fit=crop&q=80'
    ),
  },
  {
    id: 'rezero-s3',
    title: 'Re:ZERO — Começando uma Vida em Outro Mundo (3ª Temporada)',
    originalTitle: 'Re:Zero kara Hajimeru Isekai Seikatsu 3rd Season',
    synopsis:
      'Subaru Natsuki e seus aliados viajam até a cidade das comportas de Priestella, onde o Culto da Bruxa prepara um ataque coordenado liderado pelos Arcebispos do Pecado.',
    posterUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    rating: 4.9,
    releaseYear: 2026,
    format: 'TV',
    status: 'RELEASING',
    audioType: 'DUAL_AUDIO',
    ageRating: '16',
    studio: 'White Fox',
    genres: ['Fantasia', 'Isekai', 'Drama', 'Suspense'],
    totalEpisodes: 16,
    seasons: [1, 2, 3],
    episodes: buildEpisodes(
      'rezero-s3',
      'Re:ZERO 3ª Temporada',
      16,
      'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80'
    ),
  },
];

export const INITIAL_CONTINUE_WATCHING: ContinueWatchingItem[] = [
  {
    episodeId: 'solo-leveling-s2-ep-4',
    mediaId: 'solo-leveling-s2',
    mediaTitle: 'Solo Leveling: Arise from the Shadow',
    episodeNumber: 4,
    episodeTitle: 'Episódio 4 — O Despertar da Jornada',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    watchedSec: 890,
    durationSec: 1420,
    updatedAt: 'Há 2 horas',
  },
  {
    episodeId: 'dandadan-tv-ep-2',
    mediaId: 'dandadan-tv',
    mediaTitle: 'DAN DA DAN',
    episodeNumber: 2,
    episodeTitle: 'Episódio 2 — O Despertar da Jornada',
    thumbnail: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=800&auto=format&fit=crop&q=80',
    watchedSec: 520,
    durationSec: 1420,
    updatedAt: 'Ontem',
  },
];

export const INITIAL_CALENDAR: CalendarReleaseItem[] = [
  {
    id: 'cal-1',
    mediaId: 'solo-leveling-s2',
    mediaTitle: 'Solo Leveling: Arise from the Shadow',
    posterUrl: INITIAL_MEDIAS[0].posterUrl,
    episodeNumber: 14,
    dayOfWeek: 6, // Sábado
    releaseTime: '14:30',
    audioType: 'DUAL_AUDIO',
    released: false,
  },
  {
    id: 'cal-2',
    mediaId: 'dandadan-tv',
    mediaTitle: 'DAN DA DAN',
    posterUrl: INITIAL_MEDIAS[2].posterUrl,
    episodeNumber: 13,
    dayOfWeek: 4, // Quinta
    releaseTime: '13:00',
    audioType: 'DUAL_AUDIO',
    released: true,
  },
  {
    id: 'cal-3',
    mediaId: 'rezero-s3',
    mediaTitle: 'Re:ZERO — 3ª Temporada',
    posterUrl: INITIAL_MEDIAS[5].posterUrl,
    episodeNumber: 17,
    dayOfWeek: 3, // Quarta
    releaseTime: '11:30',
    audioType: 'LEGENDADO',
    released: false,
  },
  {
    id: 'cal-4',
    mediaId: 'kaiju-no-8',
    mediaTitle: 'Kaiju No. 8',
    posterUrl: INITIAL_MEDIAS[3].posterUrl,
    episodeNumber: 13,
    dayOfWeek: 5, // Sexta
    releaseTime: '12:00',
    audioType: 'DUAL_AUDIO',
    released: false,
  },
  {
    id: 'cal-5',
    mediaId: 'frieren-beyond',
    mediaTitle: 'Frieren e a Jornada para o Além (Especial)',
    posterUrl: INITIAL_MEDIAS[1].posterUrl,
    episodeNumber: 17,
    dayOfWeek: 0, // Domingo
    releaseTime: '16:00',
    audioType: 'DUAL_AUDIO',
    released: false,
  },
];

export const INITIAL_COMMENTS: CommentItem[] = [
  {
    id: 'c-1',
    episodeId: 'solo-leveling-s2-ep-1',
    userId: 'u-101',
    username: 'akira_k',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
    content: 'A animação da A-1 Pictures nessa cena final ficou absurda! A trilha sonora do Hiroyuki Sawano arrepia demais.',
    isSpoiler: false,
    likesCount: 84,
    likedByMe: false,
    createdAt: 'Há 3 horas',
  },
  {
    id: 'c-2',
    episodeId: 'solo-leveling-s2-ep-1',
    userId: 'u-102',
    username: 'yoru_otaku',
    avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=200&auto=format&fit=crop&q=80',
    content: 'Quando o comandante das sombras surge no minuto 18 e salva todo o esquadrão rank B foi o ponto alto do episódio!',
    isSpoiler: true,
    likesCount: 39,
    likedByMe: true,
    createdAt: 'Há 5 horas',
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'Novo Episódio Disponível!',
    body: 'O Episódio 13 de Solo Leveling: Arise from the Shadow já está disponível para assistir.',
    mediaId: 'solo-leveling-s2',
    episodeId: 'solo-leveling-s2-ep-13',
    read: false,
    createdAt: 'Há 25 min',
  },
  {
    id: 'n-2',
    title: 'Lembrete de Lançamento',
    body: 'DAN DA DAN receberá novo episódio hoje às 13:00.',
    mediaId: 'dandadan-tv',
    read: false,
    createdAt: 'Há 2 horas',
  },
  {
    id: 'n-3',
    title: 'Download Concluído',
    body: 'Seus episódios baixados estão prontos para reprodução offline.',
    read: true,
    createdAt: 'Ontem',
  },
];

export const INITIAL_FRIENDS: FriendUser[] = [
  {
    id: 'f-1',
    username: 'kenji_sato',
    displayName: 'Kenji Sato',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=200&auto=format&fit=crop&q=80',
    statusText: 'Maratonando Solo Leveling',
    currentlyWatching: 'Solo Leveling • Ep. 11',
    isOnline: true,
    relation: 'FRIEND',
  },
  {
    id: 'f-2',
    username: 'mina_chan',
    displayName: 'Mina Takahashi',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    statusText: 'Frieren 10/10',
    currentlyWatching: 'Frieren • Ep. 8',
    isOnline: true,
    relation: 'FRIEND',
  },
  {
    id: 'f-3',
    username: 'lucas_vfx',
    displayName: 'Lucas Oliveira',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    statusText: 'Curtindo animes de temporada',
    isOnline: false,
    relation: 'PENDING_RECEIVED',
  },
];

export const DEFAULT_USER_PROFILE: UserProfile = {
  id: 'usr-shinokai-01',
  username: 'shinokai_viewer',
  displayName: 'Otaku Shinokai',
  email: 'viewer@shinokai.app',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
  bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=80',
  isGuest: false,
  episodesWatched: 142,
  hoursWatched: 56,
  completedAnimes: 18,
};
