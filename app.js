/* ================================================
   VIBE 2.5 Pro — Music & Gym Player Engine
   Web Audio 5-Band EQ, Bass Booster, Gym Rest/Tabata Timer,
   IndexedDB Uploads, Dynamic Visualizer & Theme Switcher
   ================================================ */

(function () {
  'use strict';

  // ——— Configuration & Constants ———
  const MUSIC_DIR = 'music/';
  const TRACKS_MANIFEST = MUSIC_DIR + 'tracks.json';
  const DEFAULT_COVER = 'assets/default-cover.png';
  const AUDIUS_API_BASE = 'https://api.audius.co';
  const AUDIUS_APP_NAME = 'VIBE_APP_V2';
  const DB_NAME = 'vibe_audio_db';
  const DB_STORE = 'offline_tracks';

  // ——— Internationalization & Translations (AR / EN) ———
  const TRANSLATIONS = {
    ar: {
      app_title: 'VIBE 2.5 — مشغل الموسيقى والجيم',
      nav_home: 'الرئيسية',
      nav_search: 'بحث',
      nav_library: 'مكتبتي',
      nav_gym: 'وضع الجيم',
      hero_pill: '🔥 تمارين الجيم',
      hero_title: 'طاقة وحماس بلا توقف',
      hero_subtitle: 'أقوى تراكات الفونك والهارد ستايل مع انتقال فوري 0ms بدون توقف',
      hero_play: '▶ تشغيل ميكس الجيم',
      hero_hud: '⚡ شاشة الجيم',
      chip_all: '🔥 الكل (60+)',
      chip_gym: '🏋️ جيم وتمارين',
      chip_arabic: '🇪🇬 هيتس عربي',
      chip_global: '🌍 هيتس عالمي',
      chip_local: '💾 أوفلاين ومحلي',
      mood_stations: '⚡ محطات الطاقة والمود',
      instant_mix: 'بث فوري مباشر',
      station_phonk: 'فونك الجيم',
      station_phonk_desc: 'بيز قوي لرفع الأوزان',
      station_arabic: 'طاقة عربي',
      station_arabic_desc: 'ويجز، بابلو وراب حماسي',
      station_edm: 'مهرجانات EDM',
      station_edm_desc: 'أعلى طاقة ودروب',
      station_chill: 'سهر واسترخاء',
      station_chill_desc: 'لو-فاي وهدوء وتركيز',
      station_running: 'جري وسرعة 150+ BPM',
      station_running_desc: 'خطوات كارديو سريعة',
      station_acoustic: 'قهوة وهدوء',
      station_acoustic_desc: 'نغمات جيتار هادئة',
      all_tracks: 'جميع الأغاني',
      sort_toggle: '⇅ الترتيب',
      search_placeholder: 'ابحث عن أي أغنية أو فنان عربي أو إنجليزي...',
      voice_search: 'البحث بالصوت',
      offline_pack_title: 'باقة الأوفلاين للتمارين',
      offline_pack_desc: 'حمّل كل أغانيك المفضلة بضغطة واحدة لتشغيلها في الجيم والسفر بدون إنترنت',
      download_all_btn: '⬇️ تحميل الكل أوفلاين',
      session_time: 'الوقت',
      calories_lbl: 'سعرة',
      set_lbl: 'الجولة +1',
      coach_on: 'المدرب: شغال',
      coach_off: 'المدرب: صامت',
      now_playing: 'قيد التشغيل الآن',
      btn_playlist: '➕ القوائم',
      btn_share: '🔗 مشاركة',
      btn_save_offline: 'حفظ أوفلاين',
      btn_eq: '🎚️ المعادل',
      btn_8d: 'صوت 8D',
      btn_lyrics: '🎤 الكلمات',
      btn_queue: '📋 التالي',
      spatial_8d_title: '🎧 صوت 8D المجسم (360° محيطي)',
      spatial_subtext: 'ارتدِ سماعات الرأس لتشعر بالصوت يدور بزاوية 360° حول رأسك.',
      reverb_title: '🏟️ صدى الغرفة والقاعة (Reverb)',
      queue_title: 'قائمة التشغيل التالية',
      clear_queue: 'مسح',
      infinite_radio: 'تشغيل تلقائي لا نهائي: مفعل',
      options_title: 'خيارات ومشاركة الأغنية',
      scan_camera: 'امسح الكود بكاميرا الموبايل للاستماع فوراً',
      share_apps: 'مشاركة عبر التطبيقات',
      copy_link: 'نسخ الرابط',
      play_next: 'تشغيل تالياً في القائمة'
    },
    en: {
      app_title: 'VIBE 2.5 — Music & Gym Player',
      nav_home: 'Home',
      nav_search: 'Search',
      nav_library: 'Playlists',
      nav_gym: 'Gym Mode',
      hero_pill: '🔥 GYM WORKOUT',
      hero_title: 'Beast Mode Motivation',
      hero_subtitle: 'High-tempo phonk, hardstyle & Arabic energy beats with 0ms gapless transition',
      hero_play: '▶ Play Gym Mix',
      hero_hud: '⚡ Gym HUD',
      chip_all: '🔥 All (60+)',
      chip_gym: '🏋️ Gym & Workout',
      chip_arabic: '🇪🇬 Arabic Hits',
      chip_global: '🌍 Global Hits',
      chip_local: '💾 Local / Offline',
      mood_stations: '⚡ Mood & Energy Stations',
      instant_mix: 'Instant Curated Streams',
      station_phonk: 'Gym Phonk',
      station_phonk_desc: 'Heavy lifting bass',
      station_arabic: 'Arabic Energy',
      station_arabic_desc: 'Wegz, Pablo & Trap',
      station_edm: 'EDM Festival',
      station_edm_desc: 'Peak energy drops',
      station_chill: 'Late Night Chill',
      station_chill_desc: 'Relax, Lo-Fi & Study',
      station_running: 'Running 150+ BPM',
      station_running_desc: 'Fast cardio cadence',
      station_acoustic: 'Coffee Acoustic',
      station_acoustic_desc: 'Serene acoustic calm',
      all_tracks: 'All Tracks',
      sort_toggle: '⇅ Sort',
      search_placeholder: 'Search any English or Arabic song, artist...',
      voice_search: 'Voice Search',
      offline_pack_title: 'Offline Workout Pack',
      offline_pack_desc: 'Download all your favorite tracks with one tap for zero-internet flights and workouts',
      download_all_btn: '⬇️ Download All',
      session_time: 'Session',
      calories_lbl: 'kcal',
      set_lbl: 'Set +1',
      coach_on: 'Coach ON',
      coach_off: 'Coach Mute',
      now_playing: 'NOW PLAYING',
      btn_playlist: 'Playlist',
      btn_share: 'Share',
      btn_save_offline: 'Save Offline',
      btn_eq: 'EQ & Bass',
      btn_8d: '8D Audio',
      btn_lyrics: 'Lyrics',
      btn_queue: 'Queue',
      spatial_8d_title: '🎧 8D Spatial Audio (360° Orbit)',
      spatial_subtext: 'Wear headphones to experience sound rotating 360° around your head.',
      reverb_title: '🏟️ Acoustic Space (Reverb)',
      queue_title: 'Up Next Queue',
      clear_queue: 'Clear',
      infinite_radio: 'Auto-Play Similar: ON',
      options_title: 'Track Options & Share',
      scan_camera: 'Point mobile camera to listen immediately',
      share_apps: 'Share via Apps',
      copy_link: 'Copy Link',
      play_next: 'Play Next in Queue'
    }
  };

  // ——— Global State ———
  const state = {
    allTracks: [],           // Master list from tracks.json & uploads
    activeQueue: [],         // Currently active playback queue
    queueIndex: 0,           // Current track index in activeQueue
    currentTrack: null,      // Active track object
    isPlaying: false,
    isShuffle: false,
    repeatMode: 0,           // 0 = off, 1 = all, 2 = one
    volume: 0.8,
    playbackRate: 1.0,
    lang: localStorage.getItem('vibe_lang') || 'ar',
    spatial8DEnabled: false,
    spatialSpeed: 8,
    reverbPreset: 'studio',
    infiniteRadio: true,
    gymVoiceCoach: true,
    gymSessionSeconds: 0,
    gymCalories: 0,
    gymCurrentSet: 1,
    gymSessionTimerId: null,
    activeOptionsTrack: null,
    activeTab: 'home',       // 'home', 'search', 'library', 'gym'
    activeFilter: 'all',     // Category filter on Home
    activeTheme: localStorage.getItem('vibe_theme') || 'cyber',
    likedTrackIds: new Set(JSON.parse(localStorage.getItem('vibe_likes') || '[]')),
    customPlaylists: JSON.parse(localStorage.getItem('vibe_playlists') || '[]'),
    offlineTrackIds: new Set(),
    historyTracks: JSON.parse(localStorage.getItem('vibe_history') || '[]'),
    customLyrics: JSON.parse(localStorage.getItem('vibe_custom_lyrics') || '{}'),
    eqGains: JSON.parse(localStorage.getItem('vibe_eq_gains') || '[6, 4, 0, 2, 4]'),
    gainBoost: parseFloat(localStorage.getItem('vibe_gain_boost') || '1.0'),
    crossfadeSec: parseInt(localStorage.getItem('vibe_crossfade') || '0', 10),
    activeModalPlaylist: null,
    targetTrackForPlaylist: null,
    sleepTimerId: null,
    sleepTimerEndsAt: null,
    wakeLockSentinel: null,
    isSeeking: false,
    db: null,
    gymTimer: {
      id: null,
      secondsLeft: 45,
      totalSeconds: 45,
      isRunning: false,
      mode: 'rest', // 'rest' or 'tabata'
      tabataState: 'work', // 'work' or 'rest'
      tabataRound: 1,
      totalRounds: 8,
      soundEnabled: true
    }
  };

  // ——— Dual-Audio Engine for Gapless & Crossfade Playback ———
  let primaryAudio = new Audio();
  let preloadAudio = new Audio();
  let preloadedTrack = null;
  let preloadedObjectUrl = null;

  primaryAudio.preload = 'auto';
  primaryAudio.volume = state.volume;
  preloadAudio.preload = 'auto';
  preloadAudio.volume = state.volume;

  // ——— Web Audio API Studio Engine ———
  let audioCtx = null;
  let sourceNode = null;
  let gainNode = null;
  let pannerNode = null;
  let spatialOrbitAnimationId = null;
  let spatialStartTime = 0;
  let convolverNode = null;
  let reverbGain = null;
  let dryGain = null;
  let biquadFilters = [];
  let analyserNode = null;
  let visualizerAnimFrame = null;
  const EQ_FREQS = [60, 250, 1000, 4000, 14000];
  const EQ_TYPES = ['lowshelf', 'peaking', 'peaking', 'peaking', 'highshelf'];

  // ——— DOM Elements Cache ———
  const $ = (sel, parent = document) => parent.querySelector(sel);
  const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];
  let els = {};

  // ——— Initialization ———
  document.addEventListener('DOMContentLoaded', () => {
    cacheDom();
    applyTheme(state.activeTheme);
    setLanguage(state.lang);
    initIndexedDB();
    setupAudioListeners();
    bindEvents();
    checkNetworkStatus();
    loadLibrary();
    startGymSessionTimer();
    handleUrlHash();
    window.addEventListener('hashchange', handleUrlHash);
    registerServiceWorker();
  });

  function handleUrlHash() {
    const raw = window.location.hash.replace('#', '');
    if (['home', 'search', 'library', 'gym'].includes(raw)) {
      switchTab(raw);
    } else if (raw === 'eq') {
      initWebAudio();
      openModal(els.modalEqualizer);
    } else if (raw === 'options') {
      if (state.allTracks.length > 0) openTrackOptionsModal(state.allTracks[0]);
    } else if (raw === 'player') {
      if (state.allTracks.length > 0 && !state.currentTrack) playTrack(state.allTracks[0]);
      openFullPlayer();
    } else if (raw.startsWith('track=')) {
      const trackId = decodeURIComponent(raw.replace('track=', ''));
      const track = state.allTracks.find(t => String(t.id) === String(trackId));
      if (track) {
        playTrack(track);
        openFullPlayer();
      }
    }
  }

  function cacheDom() {
    els = {
      // Views & Nav
      tabs: $$('.tab-view'),
      navItems: $$('.nav-item'),
      netStatus: $('#net-status'),
      ambientGlow: $('#ambient-glow'),

      // Header
      btnHeaderLang: $('#btn-header-lang'),
      btnHeaderShuffle: $('#btn-header-shuffle'),
      btnHeaderSleep: $('#btn-header-sleep'),
      btnHeaderEq: $('#btn-header-eq'),
      btnHeaderTheme: $('#btn-header-theme'),
      sleepIndicator: $('#sleep-indicator'),

      // Home View
      heroPlayBtn: $('#btn-hero-play'),
      heroGymViewBtn: $('#btn-hero-gym-view'),
      moodCards: $$('.mood-card'),
      filterChips: $$('.filter-chip'),
      homeTrackList: $('#home-track-list'),
      homeTrackCount: $('#home-track-count'),
      btnSortToggle: $('#btn-sort-toggle'),

      // Search View
      searchInput: $('#search-input'),
      btnVoiceSearch: $('#btn-voice-search'),
      searchClearBtn: $('#search-clear-btn'),
      searchSpinner: $('#search-spinner'),
      searchResultsList: $('#search-results-list'),
      searchResultsHeader: $('#search-results-header'),
      searchResultsCount: $('#search-results-count'),
      tagPills: $$('.tag-pill'),

      // Library View
      smartCards: $$('.smart-card'),
      btnDownloadAllFavs: $('#btn-download-all-favs'),
      customPlaylistsContainer: $('#custom-playlists-container'),
      btnCreatePlaylistModal: $('#btn-create-playlist-modal'),
      btnUploadMusicModal: $('#btn-upload-music-modal'),
      btnExportPlaylists: $('#btn-export-playlists'),
      btnImportPlaylists: $('#btn-import-playlists'),
      fileImportPlaylists: $('#file-import-playlists'),
      countSmartGym: $('#count-smart-gym'),
      countSmartFavorites: $('#count-smart-favorites'),
      countSmartLocal: $('#count-smart-local'),
      countSmartDownloaded: $('#count-smart-downloaded'),
      recentPlayedSection: $('#recent-played-section'),
      recentPlayedScroll: $('#recent-played-scroll'),
      recentPlayedCount: $('#recent-played-count'),

      // Gym Mode View
      gymCoverArt: $('#gym-cover-art'),
      gymPulseAura: $('#gym-pulse-aura'),
      gymTrackTitle: $('#gym-track-title'),
      gymTrackArtist: $('#gym-track-artist'),
      gymGaplessStatus: $('#gym-gapless-status'),
      gymSpeedChip: $('#gym-speed-chip'),
      gymSessionTime: $('#gym-session-time'),
      gymCaloriesVal: $('#gym-calories-val'),
      gymSetsVal: $('#gym-sets-val'),
      btnGymAddSet: $('#btn-gym-add-set'),
      btnGymVoiceCoach: $('#btn-gym-voice-coach'),
      voiceCoachText: $('#voice-coach-text'),
      gymBtnPlay: $('#gym-btn-play'),
      gymPlayIcon: $('#gym-play-icon'),
      gymBtnPrev: $('#gym-btn-prev'),
      gymBtnNext: $('#gym-btn-next'),
      gymBtnSkipBack: $('#gym-btn-skip-back'),
      gymBtnSkipForward: $('#gym-btn-skip-forward'),
      btnWakeLock: $('#btn-wake-lock'),
      speedBtns: $$('.speed-btn'),

      // Gym Timer Widget
      gymTimerCard: $('#gym-timer-card'),
      gymTimerCircle: $('#gym-timer-circle'),
      gymTimerTime: $('#gym-timer-time'),
      gymTimerSub: $('#gym-timer-sub'),
      gymTimerModeLabel: $('#gym-timer-mode-label'),
      timerPills: $$('.timer-pill'),
      btnTabataMode: $('#btn-tabata-mode'),
      btnTimerStart: $('#btn-timer-start'),
      btnTimerReset: $('#btn-timer-reset'),
      btnTimerSoundToggle: $('#btn-timer-sound-toggle'),

      // Mini Player
      miniPlayer: $('#mini-player'),
      miniCover: $('#mini-cover'),
      miniTitle: $('#mini-title'),
      miniArtist: $('#mini-artist'),
      miniGaplessPill: $('#mini-gapless-pill'),
      miniBtnLike: $('#mini-btn-like'),
      miniBtnPlay: $('#mini-btn-play'),
      miniBtnNext: $('#mini-btn-next'),
      miniProgressFill: $('#mini-progress-fill'),
      miniBufferedFill: $('#mini-buffered-fill'),
      miniInfoTap: $('#mini-info-tap'),

      // Full Player Modal
      fullPlayerModal: $('#full-player-modal'),
      btnMinimizePlayer: $('#btn-minimize-player'),
      sheetHandle: $('#sheet-handle'),
      fullArtWrapper: $('#full-art-wrapper'),
      heartPulseOverlay: $('#heart-pulse-overlay'),
      pill8dSpatial: $('#pill-8d-spatial'),
      btnFullOptions: $('#btn-full-options'),
      fullCoverArt: $('#full-cover-art'),
      fullTrackCategory: $('#full-track-category'),
      fullTrackTitle: $('#full-track-title'),
      fullTrackArtist: $('#full-track-artist'),
      fullBtnLike: $('#full-btn-like'),
      fullProgressBar: $('#full-progress-bar'),
      fullProgressFill: $('#full-progress-fill'),
      fullProgressBuffered: $('#full-progress-buffered'),
      fullProgressThumb: $('#full-progress-thumb'),
      fullTimeCurrent: $('#full-time-current'),
      fullTimeDuration: $('#full-time-duration'),
      fullGaplessChip: $('#full-gapless-chip'),
      fullBtnShuffle: $('#full-btn-shuffle'),
      fullBtnPrev: $('#full-btn-prev'),
      fullBtnPlay: $('#full-btn-play'),
      fullPlayIcon: $('#full-play-icon'),
      fullBtnNext: $('#full-btn-next'),
      fullBtnRepeat: $('#full-btn-repeat'),
      fullBtnAddPlaylist: $('#full-btn-add-playlist'),
      fullBtnShare: $('#full-btn-share'),
      fullBtnDownload: $('#full-btn-download'),
      downloadIcon: $('#download-icon'),
      downloadLabel: $('#download-label'),
      fullBtnSpeed: $('#full-btn-speed'),
      fullSpeedLabel: $('#full-speed-label'),
      fullBtnSleep: $('#full-btn-sleep'),
      fullBtnEq: $('#full-btn-eq'),
      fullBtn8d: $('#full-btn-8d'),
      label8dBtn: $('#label-8d-btn'),
      fullBtnLyrics: $('#full-btn-lyrics'),
      fullBtnQueue: $('#full-btn-queue'),
      volSlider: $('#vol-slider'),
      volFill: $('#vol-fill'),
      visualizerContainer: $('#visualizer-container'),
      visualizerBars: $$('.v-bar'),

      // Modals
      modalPlaylistView: $('#modal-playlist-view'),
      modalPlaylistTitle: $('#modal-playlist-title'),
      modalPlaylistHeading: $('#modal-playlist-heading'),
      modalPlaylistMeta: $('#modal-playlist-meta'),
      modalPlaylistIcon: $('#modal-playlist-icon'),
      modalPlaylistTracks: $('#modal-playlist-tracks'),
      btnDeleteActivePlaylist: $('#btn-delete-active-playlist'),
      btnModalPlaylistPlay: $('#btn-modal-playlist-play'),
      btnModalPlaylistShuffle: $('#btn-modal-playlist-shuffle'),

      modalCreatePlaylist: $('#modal-create-playlist'),
      inputPlaylistName: $('#input-playlist-name'),
      emojiOptions: $$('.emoji-opt'),
      btnConfirmCreatePlaylist: $('#btn-confirm-create-playlist'),

      modalAddToPlaylist: $('#modal-add-to-playlist'),
      targetTrackLabel: $('#target-track-label'),
      playlistsChecklist: $('#playlists-checklist'),

      modalSleepTimer: $('#modal-sleep-timer'),
      sleepStatusText: $('#sleep-status-text'),
      sleepOptionBtns: $$('.sleep-option-btn'),

      // Pro Modals
      modalEqualizer: $('#modal-equalizer'),
      eqPresetChips: $$('.eq-preset-chip'),
      sliderVolBoost: $('#slider-vol-boost'),
      volBoostVal: $('#vol-boost-val'),
      crossfadeBtns: $$('.crossfade-btn'),
      crossfadeVal: $('#crossfade-val'),
      btnToggle8d: $('#btn-toggle-8d'),
      spatialSpeeds: $('#spatial-speeds'),
      spatialSpeedBtns: $$('.spatial-speed-btn'),
      reverbVal: $('#reverb-val'),
      reverbBtns: $$('.reverb-btn'),

      modalQueue: $('#modal-queue'),
      queueNowArt: $('#queue-now-art'),
      queueNowTitle: $('#queue-now-title'),
      queueNowArtist: $('#queue-now-artist'),
      queueCount: $('#queue-count'),
      queueList: $('#queue-list'),
      btnClearQueue: $('#btn-clear-queue'),
      btnToggleInfinite: $('#btn-toggle-infinite'),
      labelInfiniteRadio: $('#label-infinite-radio'),

      modalLyrics: $('#modal-lyrics'),
      lyricsTrackArt: $('#lyrics-track-art'),
      lyricsTrackTitle: $('#lyrics-track-title'),
      lyricsTrackArtist: $('#lyrics-track-artist'),
      lyricsContainer: $('#lyrics-container'),
      lyricsText: $('#lyrics-text'),
      lyricsLoading: $('#lyrics-loading'),
      lyricsEditorBox: $('#lyrics-editor-box'),
      lyricsTextarea: $('#lyrics-textarea'),
      btnEditLyrics: $('#btn-edit-lyrics'),
      btnSaveCustomLyrics: $('#btn-save-custom-lyrics'),

      modalThemes: $('#modal-themes'),
      themeCards: $$('.theme-card'),

      modalUpload: $('#modal-upload'),
      uploadDropzone: $('#upload-dropzone'),
      btnBrowseAudioFiles: $('#btn-browse-audio-files'),
      fileAudioInput: $('#file-audio-input'),
      uploadQueueList: $('#upload-queue-list'),

      // Track Options & Share Modal
      modalTrackOptions: $('#modal-track-options'),
      optionsTrackArt: $('#options-track-art'),
      optionsTrackTitle: $('#options-track-title'),
      optionsTrackArtist: $('#options-track-artist'),
      trackQrCanvas: $('#track-qr-canvas'),
      btnShareNative: $('#btn-share-native'),
      btnCopyTrackLink: $('#btn-copy-track-link'),
      optAction8d: $('#opt-action-8d'),
      opt8dStatus: $('#opt-8d-status'),
      optActionQueue: $('#opt-action-queue'),
      optActionPlaylist: $('#opt-action-playlist'),
      optActionDownload: $('#opt-action-download'),
      optDownloadStatus: $('#opt-download-status'),
      specQualityVal: $('#spec-quality-val'),

      toastContainer: $('#toast-container')
    };
  }

  // ——— Language & Internationalization Controller ———
  function setLanguage(lang) {
    state.lang = lang;
    localStorage.setItem('vibe_lang', lang);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);

    if (els.btnHeaderLang) {
      els.btnHeaderLang.textContent = lang === 'ar' ? '🌐 EN' : '🌐 عربي';
    }

    const dict = TRANSLATIONS[lang] || TRANSLATIONS.ar;
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) el.textContent = dict[key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (dict[key]) el.setAttribute('placeholder', dict[key]);
    });

    if (els.label8dBtn) els.label8dBtn.textContent = dict.btn_8d || '8D Audio';
    if (els.labelInfiniteRadio) {
      els.labelInfiniteRadio.textContent = state.infiniteRadio ? 
        (lang === 'ar' ? 'تشغيل تلقائي لا نهائي: مفعل' : 'Auto-Play Similar: ON') : 
        (lang === 'ar' ? 'تشغيل تلقائي لا نهائي: معطل' : 'Auto-Play Similar: OFF');
    }

    updateSmartCardCounts();
    renderCustomPlaylists();
    updateGymTimerUI();
    updateGymSessionDashboard();
    if (state.currentTrack) updateTrackInfoUI(state.currentTrack);
  }

  // ——— Web Audio API (Equalizer, Bass Boost, Volume 200%, 8D Spatial, Reverb, Visualizer) ———
  function initWebAudio() {
    if (audioCtx) {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return;
    }

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();

      // Master Gain for Volume Boost (> 100%)
      gainNode = audioCtx.createGain();
      gainNode.gain.value = state.gainBoost;

      // 5-band EQ filters
      biquadFilters = EQ_FREQS.map((freq, i) => {
        const filter = audioCtx.createBiquadFilter();
        filter.type = EQ_TYPES[i];
        filter.frequency.value = freq;
        filter.gain.value = state.eqGains[i] || 0;
        return filter;
      });

      // 8D Stereo Panner Node
      if (audioCtx.createStereoPanner) {
        pannerNode = audioCtx.createStereoPanner();
        pannerNode.pan.value = 0;
      }

      // Reverb / Acoustic Space
      convolverNode = audioCtx.createConvolver();
      reverbGain = audioCtx.createGain();
      reverbGain.gain.value = 0;
      dryGain = audioCtx.createGain();
      dryGain.gain.value = 1;

      // Frequency Analyser
      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 64;
      analyserNode.smoothingTimeConstant = 0.8;

      primaryAudio.crossOrigin = 'anonymous';
      sourceNode = audioCtx.createMediaElementSource(primaryAudio);

      // Connect filter cascade: source -> EQ filters -> GainNode -> pannerNode -> [dryGain & (convolverNode -> reverbGain)] -> Analyser -> Output
      let prevNode = sourceNode;
      biquadFilters.forEach(f => {
        prevNode.connect(f);
        prevNode = f;
      });
      prevNode.connect(gainNode);

      let preSpaceNode = gainNode;
      if (pannerNode) {
        gainNode.connect(pannerNode);
        preSpaceNode = pannerNode;
      }

      preSpaceNode.connect(dryGain);
      preSpaceNode.connect(convolverNode);
      convolverNode.connect(reverbGain);

      dryGain.connect(analyserNode);
      reverbGain.connect(analyserNode);

      analyserNode.connect(audioCtx.destination);

      startVisualizerLoop();
      if (state.spatial8DEnabled) start8DOrbit();
      if (state.reverbPreset && state.reverbPreset !== 'studio') applyReverbPreset(state.reverbPreset);
    } catch (err) {
      console.warn('Web Audio routing skipped or restricted by cross-origin:', err);
    }
  }

  // 8D Spatial Audio 360° Orbit Loop
  function toggle8DAudio(force) {
    state.spatial8DEnabled = typeof force === 'boolean' ? force : !state.spatial8DEnabled;
    initWebAudio();

    if (state.spatial8DEnabled) {
      start8DOrbit();
      if (els.pill8dSpatial) els.pill8dSpatial.style.display = 'inline-block';
      if (els.btnToggle8d) {
        els.btnToggle8d.textContent = 'ON';
        els.btnToggle8d.classList.add('active');
      }
      if (els.spatialSpeeds) els.spatialSpeeds.style.display = 'flex';
      if (els.opt8dStatus) els.opt8dStatus.textContent = state.lang === 'ar' ? 'مفعل (360°)' : 'Enabled (360° Orbit)';
      showToast(state.lang === 'ar' ? '🎧 تم تفعيل صوت 8D المجسم (ارتدِ السماعات!)' : '🎧 8D Spatial Audio ON (Use headphones!)');
    } else {
      stop8DOrbit();
      if (els.pill8dSpatial) els.pill8dSpatial.style.display = 'none';
      if (els.btnToggle8d) {
        els.btnToggle8d.textContent = 'OFF';
        els.btnToggle8d.classList.remove('active');
      }
      if (els.spatialSpeeds) els.spatialSpeeds.style.display = 'none';
      if (els.opt8dStatus) els.opt8dStatus.textContent = state.lang === 'ar' ? 'غير مفعل' : 'Turn 360° Orbit ON';
      showToast(state.lang === 'ar' ? 'تم إيقاف صوت 8D' : '8D Audio OFF');
    }
  }

  function start8DOrbit() {
    if (!audioCtx) initWebAudio();
    if (!pannerNode) return;
    state.spatial8DEnabled = true;
    spatialStartTime = performance.now();

    function orbitLoop(now) {
      if (!state.spatial8DEnabled) {
        if (pannerNode && audioCtx && audioCtx.state === 'running') pannerNode.pan.setValueAtTime(0, audioCtx.currentTime);
        return;
      }
      const elapsed = (now - spatialStartTime) / 1000;
      // Smooth sinusoidal pan from -0.92 (left) to +0.92 (right)
      const pan = Math.sin((elapsed * 2 * Math.PI) / state.spatialSpeed) * 0.92;
      if (pannerNode && audioCtx && audioCtx.state === 'running') {
        pannerNode.pan.setValueAtTime(pan, audioCtx.currentTime);
      }
      spatialOrbitAnimationId = requestAnimationFrame(orbitLoop);
    }

    cancelAnimationFrame(spatialOrbitAnimationId);
    spatialOrbitAnimationId = requestAnimationFrame(orbitLoop);
  }

  function stop8DOrbit() {
    state.spatial8DEnabled = false;
    cancelAnimationFrame(spatialOrbitAnimationId);
    if (pannerNode && audioCtx && audioCtx.state === 'running') {
      pannerNode.pan.setValueAtTime(0, audioCtx.currentTime);
    }
  }

  // Synthetic Reverb Impulse Generator
  function createSyntheticReverbBuffer(context, duration = 2.0, decay = 2.0) {
    const sampleRate = context.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const impulse = context.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = length - i;
      const mult = Math.pow(n / length, decay);
      left[i] = (Math.random() * 2 - 1) * mult;
      right[i] = (Math.random() * 2 - 1) * mult;
    }
    return impulse;
  }

  function applyReverbPreset(preset) {
    state.reverbPreset = preset;
    initWebAudio();
    if (!audioCtx || !convolverNode || !reverbGain || !dryGain) return;

    if (preset === 'studio' || !preset) {
      reverbGain.gain.setValueAtTime(0, audioCtx.currentTime);
      dryGain.gain.setValueAtTime(1, audioCtx.currentTime);
      if (els.reverbVal) els.reverbVal.textContent = 'Studio (Flat)';
      return;
    }

    let duration = 2.0;
    let decay = 2.0;
    let wet = 0.32;
    let label = 'Club Arena';

    if (preset === 'club') {
      duration = 2.2;
      decay = 2.2;
      wet = 0.35;
      label = 'Club Arena';
    } else if (preset === 'gym') {
      duration = 1.6;
      decay = 2.8;
      wet = 0.28;
      label = 'Gym Hall';
    } else if (preset === 'concert') {
      duration = 3.2;
      decay = 1.8;
      wet = 0.42;
      label = 'Concert';
    }

    convolverNode.buffer = createSyntheticReverbBuffer(audioCtx, duration, decay);
    reverbGain.gain.setValueAtTime(wet, audioCtx.currentTime);
    dryGain.gain.setValueAtTime(1 - (wet * 0.3), audioCtx.currentTime);
    if (els.reverbVal) els.reverbVal.textContent = label;
  }

  function startVisualizerLoop() {
    if (!analyserNode || !els.visualizerBars.length) return;
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function renderFrame() {
      visualizerAnimFrame = requestAnimationFrame(renderFrame);
      if (!state.isPlaying) return;

      analyserNode.getByteFrequencyData(dataArray);

      // Map frequencies to the visualizer bars
      const numBars = els.visualizerBars.length;
      for (let i = 0; i < numBars; i++) {
        const dataIndex = Math.floor((i / numBars) * (bufferLength / 2));
        const val = dataArray[dataIndex] || 0;
        const height = Math.max(4, Math.floor((val / 255) * 26));
        els.visualizerBars[i].style.height = `${height}px`;
      }
    }
    renderFrame();
  }

  function setEqBandGain(index, gainDb) {
    state.eqGains[index] = gainDb;
    localStorage.setItem('vibe_eq_gains', JSON.stringify(state.eqGains));
    if (biquadFilters[index]) {
      biquadFilters[index].gain.value = gainDb;
    }
    const valEl = $(`#eq-val-${index}`);
    if (valEl) valEl.textContent = (gainDb > 0 ? '+' : '') + gainDb + 'dB';
  }

  function applyEqPreset(presetName) {
    let gains = [0, 0, 0, 0, 0];
    if (presetName === 'bass') {
      gains = [8, 5, 0, 2, 4]; // Gym Bass Boost
    } else if (presetName === 'vocal') {
      gains = [-2, 1, 5, 3, 1]; // Vocal Clarity
    } else if (presetName === 'electronic') {
      gains = [6, 3, -1, 4, 5]; // Electronic Dance
    } else if (presetName === 'flat') {
      gains = [0, 0, 0, 0, 0];
    }

    gains.forEach((g, i) => {
      setEqBandGain(i, g);
      const slider = $(`#eq-band-${i}`);
      if (slider) slider.value = g;
    });

    els.eqPresetChips.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.preset === presetName);
    });

    showToast(`Equalizer preset: ${presetName.toUpperCase()} applied 🎚️`);
  }

  function setVolumeBoost(percentage) {
    state.gainBoost = percentage / 100;
    localStorage.setItem('vibe_gain_boost', state.gainBoost.toString());
    if (gainNode) {
      gainNode.gain.value = state.gainBoost;
    }
    els.volBoostVal.textContent = `${percentage}%`;
    els.sliderVolBoost.value = percentage;
  }

  // Synthesize Gym Chime / Bell via Web Audio Oscillator
  function playGymChime(highPitch = true) {
    if (!state.gymTimer.soundEnabled) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      const freq = highPitch ? 980 : 520;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq / 2, audioCtx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.6, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  // ——— Gym Mode Rest & Tabata Timer Controller ———
  function updateGymTimerUI() {
    const min = Math.floor(state.gymTimer.secondsLeft / 60);
    const sec = state.gymTimer.secondsLeft % 60;
    const timeStr = `${min < 10 ? '0' : ''}${min}:${sec < 10 ? '0' : ''}${sec}`;
    els.gymTimerTime.textContent = timeStr;

    if (state.gymTimer.mode === 'tabata') {
      els.gymTimerModeLabel.textContent = `Tabata R${state.gymTimer.tabataRound}/${state.gymTimer.totalRounds}`;
      els.gymTimerSub.textContent = state.gymTimer.tabataState === 'work' ? '🔥 WORK HARD' : '💤 REST';
      els.gymTimerCircle.style.borderColor = state.gymTimer.tabataState === 'work' ? '#f43f5e' : '#10b981';
    } else {
      els.gymTimerModeLabel.textContent = 'Rest Countdown';
      els.gymTimerSub.textContent = 'REST TIME';
      els.gymTimerCircle.style.borderColor = '#10b981';
    }
  }

  function startGymTimer() {
    initWebAudio();
    if (state.gymTimer.isRunning) {
      pauseGymTimer();
      return;
    }

    state.gymTimer.isRunning = true;
    els.btnTimerStart.textContent = '⏸ Pause';
    els.gymTimerCircle.classList.add('running');

    state.gymTimer.id = setInterval(() => {
      state.gymTimer.secondsLeft--;
      updateGymTimerUI();

      if (state.gymTimer.secondsLeft <= 0) {
        if (state.gymTimer.mode === 'tabata') {
          // Switch between Tabata Work and Rest
          if (state.gymTimer.tabataState === 'work') {
            state.gymTimer.tabataState = 'rest';
            state.gymTimer.secondsLeft = state.gymTimer.tabataRest;
            playGymChime(false); // Rest chime
            showToast('💤 Rest period started!');
          } else {
            state.gymTimer.tabataRound++;
            if (state.gymTimer.tabataRound > state.gymTimer.totalRounds) {
              // Finished all rounds
              resetGymTimer();
              playGymChime(true);
              speakVoiceCoach(state.lang === 'ar' ? 'أحسنت! اكتمل تمرين التاباتا بالكامل' : 'Workout completed! Great job!');
              showToast('🏆 Tabata workout complete!');
              return;
            }
            state.gymTimer.tabataState = 'work';
            state.gymTimer.secondsLeft = state.gymTimer.tabataWork;
            playGymChime(true); // Work chime
            speakVoiceCoach(state.lang === 'ar' ? `الجولة ${state.gymTimer.tabataRound} ابدأ بقوة!` : `Round ${state.gymTimer.tabataRound}, let's go!`);
            showToast(`🔥 Round ${state.gymTimer.tabataRound} - WORK!`);
          }
        } else {
          // Standard Rest Timer finished
          playGymChime(true);
          speakVoiceCoach(state.lang === 'ar' ? 'انتهت الراحة! ابدأ مجموعتك' : 'Rest time is up! Let\'s go!');
          resetGymTimer();
          showToast(state.lang === 'ar' ? '🔔 انتهت فترة الراحة! ابدأ التمرين 💪' : '🔔 Rest time up! Next set ready 💪');
        }
      } else if (state.gymTimer.secondsLeft <= 3 && state.gymTimer.secondsLeft > 0) {
        // 3, 2, 1 warning tick
        playGymChime(false);
        speakVoiceCoach(String(state.gymTimer.secondsLeft));
      }
    }, 1000);
  }

  // Voice Coach Controller (Web Speech API Synthesis)
  function speakVoiceCoach(text) {
    if (!('speechSynthesis' in window) || !state.gymVoiceCoach) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = state.lang === 'ar' ? 'ar-SA' : 'en-US';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Voice coach error:', e);
    }
  }

  function toggleGymVoiceCoach() {
    state.gymVoiceCoach = !state.gymVoiceCoach;
    if (els.btnGymVoiceCoach) {
      els.btnGymVoiceCoach.classList.toggle('active', state.gymVoiceCoach);
    }
    if (els.voiceCoachText) {
      els.voiceCoachText.textContent = state.gymVoiceCoach ? 
        (state.lang === 'ar' ? 'المدرب: شغال' : 'Coach ON') : 
        (state.lang === 'ar' ? 'المدرب: صامت' : 'Coach Mute');
    }
    showToast(state.gymVoiceCoach ? 
      (state.lang === 'ar' ? '🗣️ تم تفعيل التوجيه الصوتي للتمارين' : '🗣️ Workout Voice Coach ON') : 
      (state.lang === 'ar' ? 'تم كتم التوجيه الصوتي' : 'Voice Coach Muted'));
  }

  function startGymSessionTimer() {
    if (state.gymSessionTimerId) return;
    state.gymSessionTimerId = setInterval(() => {
      if (state.isPlaying || state.activeTab === 'gym') {
        state.gymSessionSeconds++;
        updateGymSessionDashboard();
      }
    }, 1000);
  }

  function updateGymSessionDashboard() {
    const m = Math.floor(state.gymSessionSeconds / 60);
    const s = state.gymSessionSeconds % 60;
    const timeStr = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    if (els.gymSessionTime) els.gymSessionTime.textContent = timeStr;
    state.gymCalories = Math.floor(state.gymSessionSeconds * 0.12);
    if (els.gymCaloriesVal) els.gymCaloriesVal.textContent = state.gymCalories;
    if (els.gymSetsVal) els.gymSetsVal.textContent = state.gymCurrentSet;
  }

  function pauseGymTimer() {
    clearInterval(state.gymTimer.id);
    state.gymTimer.id = null;
    state.gymTimer.isRunning = false;
    els.btnTimerStart.textContent = '▶ Resume';
    els.gymTimerCircle.classList.remove('running');
  }

  function resetGymTimer() {
    clearInterval(state.gymTimer.id);
    state.gymTimer.id = null;
    state.gymTimer.isRunning = false;
    state.gymTimer.secondsLeft = state.gymTimer.totalSeconds;
    state.gymTimer.tabataRound = 1;
    state.gymTimer.tabataState = 'work';
    els.btnTimerStart.textContent = '▶ Start';
    els.gymTimerCircle.classList.remove('running');
    updateGymTimerUI();
  }

  function setGymTimerPreset(seconds) {
    state.gymTimer.mode = 'rest';
    state.gymTimer.totalSeconds = seconds;
    state.gymTimer.secondsLeft = seconds;
    els.timerPills.forEach(p => p.classList.remove('active'));
    els.btnTabataMode.classList.remove('active');
    const pill = $(`[data-seconds="${seconds}"]`);
    if (pill) pill.classList.add('active');
    resetGymTimer();
  }

  function activateTabataMode() {
    state.gymTimer.mode = 'tabata';
    state.gymTimer.tabataWork = 45;
    state.gymTimer.tabataRest = 15;
    state.gymTimer.tabataRound = 1;
    state.gymTimer.tabataState = 'work';
    state.gymTimer.totalSeconds = 45;
    state.gymTimer.secondsLeft = 45;
    els.timerPills.forEach(p => p.classList.remove('active'));
    els.btnTabataMode.classList.add('active');
    resetGymTimer();
    showToast('Tabata interval set (45s Work / 15s Rest) 🔥');
  }

  // ——— IndexedDB Audio Storage Manager ———
  function initIndexedDB() {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => {
      state.db = e.target.result;
      refreshOfflineTrackKeys();
      loadUserUploadedTracks();
    };
    request.onerror = (e) => {
      console.warn('IndexedDB unavailable:', e);
    };
  }

  function refreshOfflineTrackKeys() {
    if (!state.db) return;
    try {
      const tx = state.db.transaction(DB_STORE, 'readonly');
      const store = tx.objectStore(DB_STORE);
      const req = store.getAllKeys();
      req.onsuccess = () => {
        state.offlineTrackIds = new Set(req.result || []);
        updateSmartCardCounts();
        updateDownloadButtonState();
      };
    } catch (err) {
      console.warn('Error reading offline tracks:', err);
    }
  }

  function loadUserUploadedTracks() {
    if (!state.db) return;
    try {
      const tx = state.db.transaction(DB_STORE, 'readonly');
      const store = tx.objectStore(DB_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const uploads = (req.result || []).filter(item => item.isUpload);
        uploads.forEach(u => {
          if (!state.allTracks.some(t => t.id === u.track.id)) {
            state.allTracks.unshift(u.track);
          }
        });
        if (uploads.length > 0) {
          renderHomeTrackList(state.allTracks);
          updateSmartCardCounts();
        }
      };
    } catch (e) {
      console.warn('Error loading uploads:', e);
    }
  }

  async function getOfflineAudioBlob(trackId) {
    if (!state.db) return null;
    return new Promise((resolve) => {
      try {
        const tx = state.db.transaction(DB_STORE, 'readonly');
        const store = tx.objectStore(DB_STORE);
        const req = store.get(trackId);
        req.onsuccess = () => {
          if (req.result && req.result.blob) {
            resolve(req.result.blob);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  async function toggleOfflineSave(track) {
    if (!state.db) {
      showToast('IndexedDB offline storage not supported in this browser.');
      return;
    }
    const isSaved = state.offlineTrackIds.has(track.id);

    if (isSaved) {
      try {
        const tx = state.db.transaction(DB_STORE, 'readwrite');
        const store = tx.objectStore(DB_STORE);
        store.delete(track.id);
        tx.oncomplete = () => {
          state.offlineTrackIds.delete(track.id);
          updateDownloadButtonState();
          updateSmartCardCounts();
          showToast(`Removed "${track.title}" from offline storage.`);
        };
      } catch (err) {
        showToast('Error removing offline file.');
      }
    } else {
      showToast(`Downloading "${track.title}" for offline playback…`);
      els.downloadLabel.textContent = 'Saving…';
      try {
        const streamUrl = getTrackStreamUrl(track);
        const res = await fetch(streamUrl);
        if (!res.ok) throw new Error('Fetch failed: ' + res.status);
        const blob = await res.blob();

        const tx = state.db.transaction(DB_STORE, 'readwrite');
        const store = tx.objectStore(DB_STORE);
        store.put({
          id: track.id,
          track: track,
          blob: blob,
          savedAt: Date.now()
        });
        tx.oncomplete = () => {
          state.offlineTrackIds.add(track.id);
          updateDownloadButtonState();
          updateSmartCardCounts();
          showToast(`"${track.title}" saved offline! 💾`);
        };
      } catch (err) {
        console.error('Download error:', err);
        showToast('Could not save track offline (Check connection).');
        updateDownloadButtonState();
      }
    }
  }

  function updateDownloadButtonState() {
    if (!state.currentTrack) return;
    const isDownloaded = state.offlineTrackIds.has(state.currentTrack.id);
    if (isDownloaded) {
      els.fullBtnDownload.classList.add('downloaded');
      els.downloadIcon.textContent = '✅';
      els.downloadLabel.textContent = 'Offline Ready';
    } else {
      els.fullBtnDownload.classList.remove('downloaded');
      els.downloadIcon.textContent = '⬇️';
      els.downloadLabel.textContent = 'Save Offline';
    }
  }

  // ——— Upload Audio Files Dropzone ———
  async function handleAudioFilesUpload(files) {
    if (!files || files.length === 0) return;
    if (!state.db) {
      showToast('Offline database not ready.');
      return;
    }

    let uploadCount = 0;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('audio/') && !/\.(mp3|m4a|wav|flac|aac|ogg)$/i.test(file.name)) continue;

      const baseName = file.name.replace(/\.[^/.]+$/, '');
      let title = baseName;
      let artist = 'Local Artist';

      if (baseName.includes(' - ')) {
        const parts = baseName.split(' - ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      }

      const trackId = `upload_${Date.now()}_${i}`;
      const newTrack = {
        id: trackId,
        title: title,
        artist: artist,
        category: 'My Uploads',
        tag: 'local',
        cover: DEFAULT_COVER,
        isLocal: true,
        isUpload: true,
        duration: 0
      };

      try {
        const tx = state.db.transaction(DB_STORE, 'readwrite');
        const store = tx.objectStore(DB_STORE);
        store.put({
          id: trackId,
          track: newTrack,
          blob: file,
          isUpload: true,
          savedAt: Date.now()
        });
        await new Promise(res => tx.oncomplete = res);

        state.offlineTrackIds.add(trackId);
        state.allTracks.unshift(newTrack);
        uploadCount++;
      } catch (err) {
        console.warn('Upload error for', file.name, err);
      }
    }

    if (uploadCount > 0) {
      renderHomeTrackList(state.allTracks);
      updateSmartCardCounts();
      closeModal(els.modalUpload);
      showToast(`🎉 Imported ${uploadCount} audio file(s) to library!`);
    } else {
      showToast('No valid audio files selected.');
    }
  }

  // ——— Track URL Resolver ———
  function getTrackStreamUrl(track) {
    if (!track) return '';
    if (track.isLocal && track.file) {
      return MUSIC_DIR + encodeURIComponent(track.file);
    }
    if (track.streamUrl) {
      return track.streamUrl;
    }
    if (track.audiusId) {
      return `${AUDIUS_API_BASE}/v1/tracks/${track.audiusId}/stream?app_name=${AUDIUS_APP_NAME}`;
    }
    return '';
  }

  // ——— Dual-Audio Engine for 0ms Gapless & DJ Crossfade ———
  function setupAudioListeners() {
    primaryAudio.addEventListener('timeupdate', onPrimaryTimeUpdate);
    primaryAudio.addEventListener('progress', onPrimaryProgress);
    primaryAudio.addEventListener('ended', onPrimaryEnded);
    primaryAudio.addEventListener('play', () => setPlayingState(true));
    primaryAudio.addEventListener('pause', () => setPlayingState(false));
    primaryAudio.addEventListener('error', onPrimaryError);

    preloadAudio.addEventListener('canplaythrough', () => {
      if (preloadedTrack) {
        updateGaplessStatusUI(`⚡ 0ms Ready: "${preloadedTrack.title.substring(0, 18)}…"`);
      }
    });
  }

  async function playTrack(track, queue = null, index = null) {
    if (!track) return;
    initWebAudio();

    if (queue) {
      state.activeQueue = queue;
      state.queueIndex = index !== null ? index : state.activeQueue.findIndex(t => t.id === track.id);
    } else if (!state.activeQueue.some(t => t.id === track.id)) {
      state.activeQueue = [track];
      state.queueIndex = 0;
    } else {
      state.queueIndex = state.activeQueue.findIndex(t => t.id === track.id);
    }

    state.currentTrack = track;
    updateTrackInfoUI(track);
    logTrackHistory(track);

    // Resolve Audio Source (Check IndexedDB first for instant offline speed)
    const offlineBlob = await getOfflineAudioBlob(track.id);
    let audioUrl = '';
    if (offlineBlob) {
      audioUrl = URL.createObjectURL(offlineBlob);
    } else {
      audioUrl = getTrackStreamUrl(track);
    }

    primaryAudio.src = audioUrl;
    primaryAudio.playbackRate = state.playbackRate;
    primaryAudio.volume = state.volume;

    try {
      await primaryAudio.play();
      setPlayingState(true);
      updateMediaSession(track);
    } catch (err) {
      console.warn('Playback interrupted or user gesture needed:', err);
    }

    preloadedTrack = null;
    updateGaplessStatusUI('⚡ Buffering audio…');
  }

  function togglePlayPause() {
    initWebAudio();
    if (!state.currentTrack && state.activeQueue.length > 0) {
      playTrack(state.activeQueue[0]);
      return;
    }
    if (!state.currentTrack && state.allTracks.length > 0) {
      playTrack(state.allTracks[0]);
      return;
    }
    if (primaryAudio.paused) {
      primaryAudio.play().then(() => setPlayingState(true)).catch(console.warn);
    } else {
      primaryAudio.pause();
      setPlayingState(false);
    }
  }

  function playNextTrack() {
    if (state.activeQueue.length === 0) return;

    let nextIdx = 0;
    if (state.isShuffle) {
      nextIdx = Math.floor(Math.random() * state.activeQueue.length);
    } else {
      nextIdx = state.queueIndex + 1;
      if (nextIdx >= state.activeQueue.length) {
        if (state.infiniteRadio && state.currentTrack) {
          fetchSimilarTracksForInfiniteRadio(state.currentTrack);
          return;
        }
        if (state.repeatMode === 0) {
          primaryAudio.pause();
          setPlayingState(false);
          return;
        }
        nextIdx = 0;
      }
    }

    const targetTrack = state.activeQueue[nextIdx];
    if (preloadedTrack && targetTrack && preloadedTrack.id === targetTrack.id) {
      performSeamlessAudioSwap(targetTrack, nextIdx);
    } else {
      playTrack(targetTrack, state.activeQueue, nextIdx);
    }
  }

  // Infinite Smart Radio (Auto-streams matching tracks when playlist finishes)
  async function fetchSimilarTracksForInfiniteRadio(currentTrack) {
    showToast(state.lang === 'ar' ? '♾️ جاري بث أغانٍ جديدة مشابهة تلقائياً...' : '♾️ Auto-streaming similar tracks...');
    const query = (currentTrack.tags && currentTrack.tags[0]) || currentTrack.artist || 'gym workout';
    try {
      const res = await fetch(`${AUDIUS_API_BASE}/v1/tracks/search?query=${encodeURIComponent(query)}&limit=10&app_name=${AUDIUS_APP_NAME}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          const newTracks = json.data
            .map(t => ({
              id: 'audius_' + t.id,
              audiusId: t.id,
              title: t.title.replace(/[\r\n]+/g, ' ').trim(),
              artist: t.user?.name || 'Artist',
              duration: t.duration || 180,
              cover: t.artwork?.['480x480'] || t.artwork?.['150x150'] || DEFAULT_COVER,
              streamUrl: `${AUDIUS_API_BASE}/v1/tracks/${t.id}/stream?app_name=${AUDIUS_APP_NAME}`,
              tags: ['audius', 'stream', 'infinite']
            }))
            .filter(nt => !state.activeQueue.some(q => q.id === nt.id));
          if (newTracks.length > 0) {
            state.activeQueue.push(...newTracks.slice(0, 6));
            renderQueueModal();
            playNextTrack();
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Infinite radio fetch error:', e);
    }
    // Fallback: loop to index 0
    playTrack(state.activeQueue[0], state.activeQueue, 0);
  }

  function toggleInfiniteRadio() {
    state.infiniteRadio = !state.infiniteRadio;
    if (els.btnToggleInfinite) {
      els.btnToggleInfinite.classList.toggle('active', state.infiniteRadio);
    }
    if (els.labelInfiniteRadio) {
      els.labelInfiniteRadio.textContent = state.infiniteRadio ? 
        (state.lang === 'ar' ? 'تشغيل تلقائي لا نهائي: مفعل' : 'Auto-Play Similar: ON') : 
        (state.lang === 'ar' ? 'تشغيل تلقائي لا نهائي: معطل' : 'Auto-Play Similar: OFF');
    }
    showToast(state.infiniteRadio ? 
      (state.lang === 'ar' ? '♾️ تم تفعيل الراديو التلقائي اللانهائي' : '♾️ Auto-Play Similar ON') : 
      (state.lang === 'ar' ? 'تم إيقاف الراديو التلقائي' : 'Auto-Play Similar OFF'));
  }

  function playPrevTrack() {
    if (primaryAudio.currentTime > 3) {
      primaryAudio.currentTime = 0;
      return;
    }
    if (state.activeQueue.length === 0) return;

    let prevIdx = state.queueIndex - 1;
    if (prevIdx < 0) {
      prevIdx = state.activeQueue.length - 1;
    }
    playTrack(state.activeQueue[prevIdx], state.activeQueue, prevIdx);
  }

  async function schedulePreloadNextTrack() {
    if (preloadedTrack || state.activeQueue.length <= 1) return;

    let nextIdx = state.queueIndex + 1;
    if (state.isShuffle) {
      nextIdx = Math.floor(Math.random() * state.activeQueue.length);
    } else if (nextIdx >= state.activeQueue.length) {
      if (state.repeatMode === 0) return;
      nextIdx = 0;
    }

    const nextTrack = state.activeQueue[nextIdx];
    if (!nextTrack || nextTrack.id === state.currentTrack?.id) return;

    preloadedTrack = nextTrack;
    const blob = await getOfflineAudioBlob(nextTrack.id);
    let nextUrl = '';
    if (blob) {
      if (preloadedObjectUrl) URL.revokeObjectURL(preloadedObjectUrl);
      preloadedObjectUrl = URL.createObjectURL(blob);
      nextUrl = preloadedObjectUrl;
    } else {
      nextUrl = getTrackStreamUrl(nextTrack);
    }

    preloadAudio.src = nextUrl;
    preloadAudio.playbackRate = state.playbackRate;
    preloadAudio.load();
  }

  function performSeamlessAudioSwap(nextTrack, nextIndex) {
    primaryAudio.pause();

    const temp = primaryAudio;
    primaryAudio = preloadAudio;
    preloadAudio = temp;

    temp.removeEventListener('timeupdate', onPrimaryTimeUpdate);
    temp.removeEventListener('progress', onPrimaryProgress);
    temp.removeEventListener('ended', onPrimaryEnded);

    setupAudioListeners();

    state.currentTrack = nextTrack;
    state.queueIndex = nextIndex;
    updateTrackInfoUI(nextTrack);
    logTrackHistory(nextTrack);

    primaryAudio.play().then(() => {
      setPlayingState(true);
      updateMediaSession(nextTrack);
    }).catch(console.warn);

    preloadedTrack = null;
    updateGaplessStatusUI('⚡ Track playing (0ms delay)');
  }

  function onPrimaryTimeUpdate() {
    if (state.isSeeking || !primaryAudio.duration) return;

    const current = primaryAudio.currentTime;
    const duration = primaryAudio.duration;
    const pct = (current / duration) * 100;

    els.fullProgressFill.style.width = pct + '%';
    els.fullProgressThumb.style.left = pct + '%';
    els.miniProgressFill.style.width = pct + '%';

    els.fullTimeCurrent.textContent = formatTime(current);
    els.fullTimeDuration.textContent = formatTime(duration);

    // Preload next track when 20s remain or > 65% played
    if ((duration - current <= 20 || pct > 65) && !preloadedTrack) {
      schedulePreloadNextTrack();
    }
  }

  function onPrimaryProgress() {
    if (!primaryAudio.duration || primaryAudio.buffered.length === 0) return;
    try {
      const bufferedEnd = primaryAudio.buffered.end(primaryAudio.buffered.length - 1);
      const bufferedPct = (bufferedEnd / primaryAudio.duration) * 100;
      els.fullProgressBuffered.style.width = bufferedPct + '%';
      els.miniBufferedFill.style.width = bufferedPct + '%';
    } catch (e) {}
  }

  function onPrimaryEnded() {
    if (state.repeatMode === 2) {
      primaryAudio.currentTime = 0;
      primaryAudio.play();
    } else {
      playNextTrack();
    }
  }

  function onPrimaryError(e) {
    console.warn('Audio stream error, skipping to next track:', e);
    showToast('Track stream unavailable, playing next…');
    setTimeout(() => playNextTrack(), 1000);
  }

  function setPlayingState(isPlaying) {
    state.isPlaying = isPlaying;

    const playSymbol = isPlaying ? '⏸' : '▶';
    els.miniBtnPlay.textContent = playSymbol;
    els.fullPlayIcon.textContent = playSymbol;
    els.gymPlayIcon.textContent = playSymbol;

    if (isPlaying) {
      els.fullPlayerModal.classList.add('playing');
      els.gymPulseAura.classList.add('pulsing');
      els.gymCoverArt.classList.add('spinning');
    } else {
      els.fullPlayerModal.classList.remove('playing');
      els.gymPulseAura.classList.remove('pulsing');
      els.gymCoverArt.classList.remove('spinning');
    }

    highlightPlayingTrackInLists();
  }

  function updateTrackInfoUI(track) {
    const title = track.title || 'Unknown Title';
    const artist = track.artist || 'Unknown Artist';
    const cover = track.cover || DEFAULT_COVER;
    const category = track.category || 'VIBE Engine';

    els.miniTitle.textContent = title;
    els.miniArtist.textContent = artist;
    els.miniCover.src = cover;

    els.fullTrackTitle.textContent = title;
    els.fullTrackArtist.textContent = artist;
    els.fullCoverArt.src = cover;
    els.fullTrackCategory.textContent = category;

    els.gymTrackTitle.textContent = title;
    els.gymTrackArtist.textContent = artist;
    els.gymCoverArt.src = cover;

    const isLiked = state.likedTrackIds.has(track.id);
    const likeIcon = isLiked ? '❤️' : '🤍';
    els.miniBtnLike.textContent = likeIcon;
    els.miniBtnLike.classList.toggle('liked', isLiked);
    els.fullBtnLike.textContent = likeIcon;
    els.fullBtnLike.classList.toggle('liked', isLiked);

    updateDownloadButtonState();
    highlightPlayingTrackInLists();
  }

  function updateGaplessStatusUI(text) {
    els.gymGaplessStatus.textContent = text;
    els.fullGaplessChip.textContent = text;
    els.miniGaplessPill.textContent = '0ms';
  }

  // ——— Recently Played History ———
  function logTrackHistory(track) {
    if (!track) return;
    state.historyTracks = [track, ...state.historyTracks.filter(t => t.id !== track.id)].slice(0, 20);
    localStorage.setItem('vibe_history', JSON.stringify(state.historyTracks));
    renderRecentlyPlayed();
  }

  function renderRecentlyPlayed() {
    if (!state.historyTracks.length) {
      els.recentPlayedSection.style.display = 'none';
      return;
    }
    els.recentPlayedSection.style.display = 'block';
    els.recentPlayedCount.textContent = `${state.historyTracks.length} tracks`;
    els.recentPlayedScroll.innerHTML = '';

    state.historyTracks.forEach(t => {
      const card = document.createElement('div');
      card.className = 'recent-card';
      card.innerHTML = `
        <img class="recent-art" src="${t.cover || DEFAULT_COVER}" alt="Cover" loading="lazy">
        <div class="recent-title" dir="auto">${escapeHtml(t.title)}</div>
        <div class="recent-artist" dir="auto">${escapeHtml(t.artist)}</div>
      `;
      card.addEventListener('click', () => playTrack(t));
      els.recentPlayedScroll.appendChild(card);
    });
  }

  // ——— Library Loading & Rendering ———
  async function loadLibrary() {
    try {
      const res = await fetch(TRACKS_MANIFEST);
      if (!res.ok) throw new Error('Failed to load tracks manifest');
      const data = await res.json();
      state.allTracks = data;
      state.activeQueue = [...state.allTracks];

      renderHomeTrackList(state.allTracks);
      updateSmartCardCounts();
      renderCustomPlaylists();
      renderRecentlyPlayed();
      els.homeTrackCount.textContent = `${state.allTracks.length} tracks`;
      handleUrlHash();
    } catch (err) {
      console.error('Error loading library:', err);
      els.homeTrackCount.textContent = 'Offline ready';
    }
  }

  function renderHomeTrackList(tracks) {
    els.homeTrackList.innerHTML = '';
    if (tracks.length === 0) {
      els.homeTrackList.innerHTML = `
        <div class="empty-search-state">
          <div class="empty-search-icon">🎶</div>
          <h4>No tracks in this category</h4>
        </div>
      `;
      return;
    }

    tracks.forEach((track) => {
      const el = createTrackItemElement(track, () => {
        playTrack(track, tracks);
      });
      els.homeTrackList.appendChild(el);
    });

    highlightPlayingTrackInLists();
  }

  function createTrackItemElement(track, onClick) {
    const item = document.createElement('div');
    item.className = 'track-item';
    item.dataset.id = track.id;

    const isLiked = state.likedTrackIds.has(track.id);
    const tagClass = track.tag || 'global';
    const tagLabel = track.category ? track.category.split(' ')[0] : 'Music';

    item.innerHTML = `
      <img class="track-item-art" src="${track.cover || DEFAULT_COVER}" alt="Cover" loading="lazy">
      <div class="track-item-info">
        <div class="track-item-title" dir="auto">${escapeHtml(track.title)}</div>
        <div class="track-item-meta">
          <span class="track-item-artist" dir="auto">${escapeHtml(track.artist)}</span>
          <span class="tag-badge ${tagClass}">${escapeHtml(tagLabel)}</span>
        </div>
      </div>
      <div class="track-item-actions">
        <button class="track-action-btn ${isLiked ? 'liked' : ''}" data-action="like" title="Favorite">
          ${isLiked ? '❤️' : '🤍'}
        </button>
        <button class="track-action-btn" data-action="add-playlist" title="Add to Playlist">
          ➕
        </button>
      </div>
    `;

    item.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'like') {
        e.stopPropagation();
        toggleLikeTrack(track);
      } else if (action === 'add-playlist') {
        e.stopPropagation();
        openAddToPlaylistModal(track);
      } else {
        onClick();
      }
    });

    return item;
  }

  function highlightPlayingTrackInLists() {
    $$('.track-item').forEach(item => {
      const isCur = state.currentTrack && item.dataset.id === state.currentTrack.id;
      item.classList.toggle('playing', isCur);

      const existingEq = item.querySelector('.playing-eq-mini');
      if (isCur && state.isPlaying) {
        if (!existingEq) {
          const meta = item.querySelector('.track-item-meta');
          if (meta) {
            const eq = document.createElement('div');
            eq.className = 'playing-eq-mini';
            eq.innerHTML = '<span></span><span></span><span></span>';
            meta.appendChild(eq);
          }
        }
      } else if (existingEq) {
        existingEq.remove();
      }
    });
  }

  // ——— Category Filter Pills ———
  function setHomeFilter(filter) {
    state.activeFilter = filter;
    els.filterChips.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.filter === filter);
    });

    let filtered = [];
    if (filter === 'all') {
      filtered = state.allTracks;
    } else if (filter === 'gym') {
      filtered = state.allTracks.filter(t => t.tag === 'gym' || (t.category && /gym|phonk|hardstyle|motivation|workout|bass/i.test(t.category)));
    } else if (filter === 'arabic') {
      filtered = state.allTracks.filter(t => t.tag === 'arabic' || (t.category && /arabic/i.test(t.category)) || /[\u0600-\u06FF]/.test(t.title));
    } else if (filter === 'global') {
      filtered = state.allTracks.filter(t => t.tag === 'global');
    } else if (filter === 'local') {
      filtered = state.allTracks.filter(t => t.isLocal);
    }

    renderHomeTrackList(filtered);
    els.homeTrackCount.textContent = `${filtered.length} tracks`;
  }

  // ——— Online Search Engine (Audius API) ———
  let searchDebounceTimer = null;

  async function handleSearchInput(query) {
    query = query.trim();
    if (!query) {
      els.searchClearBtn.style.display = 'none';
      els.searchResultsHeader.style.display = 'none';
      els.searchResultsList.innerHTML = `
        <div class="empty-search-state">
          <div class="empty-search-icon">🎧</div>
          <h4>Search Millions of Songs</h4>
          <p>Type any song name, Egyptian artist, or tap a workout tag above to stream instantly.</p>
        </div>
      `;
      return;
    }

    els.searchClearBtn.style.display = 'flex';
    els.searchSpinner.style.display = 'block';

    const localMatches = state.allTracks.filter(t => {
      const q = query.toLowerCase();
      return (t.title && t.title.toLowerCase().includes(q)) || (t.artist && t.artist.toLowerCase().includes(q));
    });

    renderSearchResults(localMatches, true);

    try {
      const url = `${AUDIUS_API_BASE}/v1/tracks/search?query=${encodeURIComponent(query)}&limit=16&app_name=${AUDIUS_APP_NAME}`;
      const res = await fetch(url);
      const data = await res.json();
      els.searchSpinner.style.display = 'none';

      const onlineTracks = (data.data || []).map(t => ({
        id: 'audius_' + t.id,
        audiusId: t.id,
        title: t.title.replace(/[\r\n]+/g, ' ').trim(),
        artist: t.user?.name || 'Artist',
        duration: t.duration,
        category: 'Online Stream',
        tag: 'global',
        cover: t.artwork?.['480x480'] || t.artwork?.['150x150'] || DEFAULT_COVER,
        streamUrl: `${AUDIUS_API_BASE}/v1/tracks/${t.id}/stream?app_name=${AUDIUS_APP_NAME}`,
        isOnline: true,
        isLocal: false
      }));

      const combined = [...localMatches];
      const seen = new Set(localMatches.map(t => t.id));
      onlineTracks.forEach(t => {
        if (!seen.has(t.id)) {
          combined.push(t);
          seen.add(t.id);
        }
      });

      renderSearchResults(combined, false);
    } catch (err) {
      els.searchSpinner.style.display = 'none';
      console.warn('Audius search error:', err);
    }
  }

  function renderSearchResults(tracks, isPartial) {
    els.searchResultsHeader.style.display = 'flex';
    els.searchResultsCount.textContent = `${tracks.length} found ${isPartial ? '(searching…)' : ''}`;
    els.searchResultsList.innerHTML = '';

    if (tracks.length === 0) {
      els.searchResultsList.innerHTML = `
        <div class="empty-search-state">
          <div class="empty-search-icon">🔍</div>
          <h4>No tracks found</h4>
          <p>Try searching for a different keyword or artist.</p>
        </div>
      `;
      return;
    }

    tracks.forEach(track => {
      const el = createTrackItemElement(track, () => {
        playTrack(track, tracks);
      });
      els.searchResultsList.appendChild(el);
    });

    highlightPlayingTrackInLists();
  }

  // ——— Favorites / Likes ———
  function toggleLikeTrack(track) {
    const isLiked = state.likedTrackIds.has(track.id);
    if (isLiked) {
      state.likedTrackIds.delete(track.id);
      showToast(state.lang === 'ar' ? 'تمت الإزالة من المفضلة 🤍' : 'Removed from Liked Songs 🤍');
    } else {
      state.likedTrackIds.add(track.id);
      showToast(state.lang === 'ar' ? 'تمت الإضافة للمفضلة ❤️' : 'Added to Liked Songs ❤️');
    }
    localStorage.setItem('vibe_likes', JSON.stringify([...state.likedTrackIds]));

    if (state.currentTrack && state.currentTrack.id === track.id) {
      updateTrackInfoUI(track);
    }
    updateSmartCardCounts();
    highlightPlayingTrackInLists();
  }

  // ——— Voice Search Controller (Speech Recognition) ———
  function startVoiceSearch() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      showToast(state.lang === 'ar' ? 'البحث الصوتي غير مدعوم في هذا المتصفح' : 'Voice recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRec();
    recognition.lang = state.lang === 'ar' ? 'ar-EG' : 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    if (els.btnVoiceSearch) {
      els.btnVoiceSearch.classList.add('listening');
    }
    showToast(state.lang === 'ar' ? '🎙️ جاري الاستماع... تحدث الآن' : '🎙️ Listening... Speak now');

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      if (els.searchInput) {
        els.searchInput.value = transcript;
        if (els.searchClearBtn) els.searchClearBtn.style.display = 'flex';
      }
      showToast(`${state.lang === 'ar' ? 'بحث عن' : 'Searching'}: "${transcript}"`);
      handleSearchInput(transcript);
    };

    recognition.onerror = (err) => {
      console.warn('Voice recognition error:', err);
      showToast(state.lang === 'ar' ? 'لم يتم التعرف على الصوت بوضوح، حاول ثانية' : 'Could not hear clearly, try again');
    };

    recognition.onend = () => {
      if (els.btnVoiceSearch) {
        els.btnVoiceSearch.classList.remove('listening');
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.warn('Recognition start error:', e);
    }
  }

  // ——— Mood & Energy Stations Controller ———
  const MOOD_STATION_QUERIES = {
    phonk: 'gym phonk hardstyle workout bass',
    arabic_energy: 'wegz marwan pablo trap arabic',
    edm: 'edm festival house bounce rave',
    chill: 'lofi chill beats study relax',
    running: 'running cardio tempo 150 bpm',
    acoustic: 'acoustic guitar coffee morning calm'
  };

  async function playMoodStation(stationKey) {
    showToast(state.lang === 'ar' ? '⚡ جاري تشغيل محطة الطاقة والمود...' : '⚡ Loading live energy station...');
    
    let matchingTracks = [];
    if (stationKey === 'phonk') {
      matchingTracks = state.allTracks.filter(t => /gym|phonk|hardstyle|workout|bass/i.test(t.title + ' ' + (t.category || '')));
    } else if (stationKey === 'arabic_energy') {
      matchingTracks = state.allTracks.filter(t => /arabic|wegz|marwan|pablo|amr|trap/i.test(t.title + ' ' + t.artist + ' ' + (t.category || '')));
    } else if (stationKey === 'edm') {
      matchingTracks = state.allTracks.filter(t => /edm|club|dance|electronic/i.test(t.title + ' ' + (t.category || '')));
    } else if (stationKey === 'chill') {
      matchingTracks = state.allTracks.filter(t => /lofi|chill|relax|sleep|calm/i.test(t.title + ' ' + (t.category || '')));
    }

    const query = MOOD_STATION_QUERIES[stationKey] || 'workout gym';
    try {
      const res = await fetch(`${AUDIUS_API_BASE}/v1/tracks/search?query=${encodeURIComponent(query)}&limit=12&app_name=${AUDIUS_APP_NAME}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data && json.data.length > 0) {
          const apiTracks = json.data.map(t => ({
            id: 'audius_' + t.id,
            audiusId: t.id,
            title: t.title.replace(/[\r\n]+/g, ' ').trim(),
            artist: t.user?.name || 'Artist',
            duration: t.duration || 180,
            cover: t.artwork?.['480x480'] || t.artwork?.['150x150'] || DEFAULT_COVER,
            streamUrl: `${AUDIUS_API_BASE}/v1/tracks/${t.id}/stream?app_name=${AUDIUS_APP_NAME}`,
            category: 'Live Energy Station',
            isLocal: false
          }));
          matchingTracks = [...apiTracks, ...matchingTracks];
        }
      }
    } catch (err) {
      console.warn('Station fetch fallback:', err);
    }

    if (matchingTracks.length === 0) {
      matchingTracks = state.allTracks.slice(0, 10);
    }

    playTrack(matchingTracks[0], matchingTracks, 0);
    openFullPlayer();
  }

  // ——— Track Options & QR Code / Share Controller ———
  function openTrackOptionsModal(track) {
    state.activeOptionsTrack = track || state.currentTrack;
    if (!state.activeOptionsTrack) return;

    const t = state.activeOptionsTrack;
    if (els.optionsTrackArt) els.optionsTrackArt.src = t.cover || DEFAULT_COVER;
    if (els.optionsTrackTitle) els.optionsTrackTitle.textContent = t.title;
    if (els.optionsTrackArtist) els.optionsTrackArtist.textContent = t.artist;

    const shareUrl = `${window.location.origin}${window.location.pathname}#track=${encodeURIComponent(t.id)}`;

    const canvas = document.getElementById('track-qr-canvas');
    if (canvas && window.qrcode) {
      try {
        const qr = window.qrcode(0, 'M');
        qr.addData(shareUrl);
        qr.make();
        const count = qr.getModuleCount();
        const ctx = canvas.getContext('2d');
        const size = canvas.width;
        const cellSize = size / count;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#0a0a12';
        for (let r = 0; r < count; r++) {
          for (let c = 0; c < count; c++) {
            if (qr.isDark(r, c)) {
              ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
            }
          }
        }
      } catch (err) {
        console.warn('QR render error:', err);
      }
    }

    if (els.opt8dStatus) {
      els.opt8dStatus.textContent = state.spatial8DEnabled ? 
        (state.lang === 'ar' ? 'مفعل حالياً (360°)' : 'Currently ON') : 
        (state.lang === 'ar' ? 'اضغط للتفعيل' : 'Turn 360° Orbit ON');
    }

    if (els.optDownloadStatus) {
      const isSaved = state.offlineTrackIds.has(t.id);
      els.optDownloadStatus.textContent = isSaved ? 
        (state.lang === 'ar' ? 'محفوظة في أوفلاين الجهاز ✓' : 'Saved in device ✓') : 
        (state.lang === 'ar' ? 'حفظ في ذاكرة الجهاز' : 'Save to IndexedDB');
    }

    openModal(els.modalTrackOptions);
  }

  function shareTrackNative(track) {
    const shareUrl = `${window.location.origin}${window.location.pathname}#track=${encodeURIComponent(track.id)}`;
    if (navigator.share) {
      navigator.share({
        title: track.title,
        text: `Listen to "${track.title}" by ${track.artist} on VIBE Music! ⚡`,
        url: shareUrl
      }).catch(console.warn);
    } else {
      copyTrackShareLink(track);
    }
  }

  function copyTrackShareLink(track) {
    const shareUrl = `${window.location.origin}${window.location.pathname}#track=${encodeURIComponent(track.id)}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast(state.lang === 'ar' ? 'تم نسخ رابط الأغنية للحافظة! 📋' : 'Link copied to clipboard! 📋');
      }).catch(() => {
        prompt('Copy song link:', shareUrl);
      });
    } else {
      prompt('Copy song link:', shareUrl);
    }
  }

  // ——— Batch Download All Favorites for Offline ———
  async function downloadAllFavoritesOffline() {
    if (!state.db) {
      showToast(state.lang === 'ar' ? 'التخزين الأوفلاين غير مدعوم في هذا المتصفح' : 'IndexedDB offline storage not supported.');
      return;
    }

    const favIds = [...state.likedTrackIds];
    if (favIds.length === 0) {
      showToast(state.lang === 'ar' ? 'لا توجد أغانٍ في المفضلة بعد!' : 'No favorite tracks to download yet!');
      return;
    }

    const toDownload = [];
    favIds.forEach(id => {
      if (!state.offlineTrackIds.has(id)) {
        const track = state.allTracks.find(t => t.id === id);
        if (track) toDownload.push(track);
      }
    });

    if (toDownload.length === 0) {
      showToast(state.lang === 'ar' ? 'جميع أغانيك المفضلة محفوظة أوفلاين بالفعل! ✓' : 'All favorite tracks already saved offline! ✓');
      return;
    }

    showToast(`${state.lang === 'ar' ? 'بدء تحميل' : 'Downloading'} ${toDownload.length} ${state.lang === 'ar' ? 'أغنية للأوفلاين...' : 'tracks for offline...'}`);

    let downloadedCount = 0;
    for (const track of toDownload) {
      try {
        const streamUrl = getTrackStreamUrl(track);
        const res = await fetch(streamUrl);
        if (res.ok) {
          const blob = await res.blob();
          const tx = state.db.transaction(DB_STORE, 'readwrite');
          const store = tx.objectStore(DB_STORE);
          store.put({
            id: track.id,
            track: track,
            blob: blob,
            savedAt: Date.now()
          });
          state.offlineTrackIds.add(track.id);
          downloadedCount++;
        }
      } catch (err) {
        console.warn('Batch download item error:', track.title, err);
      }
    }

    updateSmartCardCounts();
    updateDownloadButtonState();
    showToast(`${state.lang === 'ar' ? 'اكتمل التحميل! تم حفظ' : 'Done! Saved'} ${downloadedCount} ${state.lang === 'ar' ? 'أغنية أوفلاين بنجاح 🎉' : 'tracks offline 🎉'}`);
  }

  // ——— Double-Tap Heart Burst & Haptic Feedback ———
  function handleArtDoubleTap() {
    if (!state.currentTrack) return;
    toggleLikeTrack(state.currentTrack);
    triggerHaptic(30);

    if (els.heartPulseOverlay) {
      els.heartPulseOverlay.classList.remove('animate');
      void els.heartPulseOverlay.offsetWidth;
      els.heartPulseOverlay.classList.add('animate');
    }
  }

  function triggerHaptic(duration = 15) {
    if ('vibrate' in navigator) {
      try { navigator.vibrate(duration); } catch (_) {}
    }
  }

  // ——— Custom Playlists System ———
  function getSmartPlaylistTracks(type) {
    if (type === 'smart_gym') {
      return state.allTracks.filter(t => t.tag === 'gym' || (t.category && /gym|phonk|hardstyle|motivation|workout|bass/i.test(t.category)));
    }
    if (type === 'smart_favorites') {
      return state.allTracks.filter(t => state.likedTrackIds.has(t.id));
    }
    if (type === 'smart_local') {
      return state.allTracks.filter(t => t.isLocal);
    }
    if (type === 'smart_downloaded') {
      return state.allTracks.filter(t => state.offlineTrackIds.has(t.id));
    }
    return [];
  }

  function updateSmartCardCounts() {
    els.countSmartGym.textContent = `${getSmartPlaylistTracks('smart_gym').length} tracks`;
    els.countSmartFavorites.textContent = `${state.likedTrackIds.size} songs`;
    els.countSmartLocal.textContent = `${getSmartPlaylistTracks('smart_local').length} tracks`;
    els.countSmartDownloaded.textContent = `${state.offlineTrackIds.size} saved`;
  }

  function renderCustomPlaylists() {
    els.customPlaylistsContainer.innerHTML = '';
    if (state.customPlaylists.length === 0) {
      els.customPlaylistsContainer.innerHTML = `
        <div style="text-align: center; padding: 18px; color: var(--text-muted); font-size: 0.85rem;">
          No custom playlists yet. Tap "➕ New Playlist" to create one!
        </div>
      `;
      return;
    }

    state.customPlaylists.forEach(pl => {
      const item = document.createElement('div');
      item.className = 'custom-playlist-item';
      item.innerHTML = `
        <div class="custom-pl-left">
          <div class="custom-pl-emoji">${pl.emoji || '🎵'}</div>
          <div>
            <div class="custom-pl-name">${escapeHtml(pl.name)}</div>
            <div class="custom-pl-count">${pl.trackIds.length} tracks</div>
          </div>
        </div>
        <button class="icon-btn" data-action="play-pl" title="Play Playlist">▶</button>
      `;

      item.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="play-pl"]')) {
          e.stopPropagation();
          playCustomPlaylist(pl);
        } else {
          openPlaylistDetailView(pl);
        }
      });

      els.customPlaylistsContainer.appendChild(item);
    });
  }

  function createCustomPlaylist(name, emoji) {
    if (!name.trim()) return;
    const pl = {
      id: 'pl_' + Date.now(),
      name: name.trim(),
      emoji: emoji || '🎵',
      trackIds: []
    };
    state.customPlaylists.push(pl);
    savePlaylists();
    renderCustomPlaylists();
    showToast(`Playlist "${pl.name}" created! 🎉`);
  }

  function savePlaylists() {
    localStorage.setItem('vibe_playlists', JSON.stringify(state.customPlaylists));
  }

  function playCustomPlaylist(pl) {
    const tracks = pl.trackIds.map(id => state.allTracks.find(t => t.id === id)).filter(Boolean);
    if (tracks.length === 0) {
      showToast(`Playlist "${pl.name}" is empty. Add songs first!`);
      return;
    }
    playTrack(tracks[0], tracks, 0);
  }

  function openPlaylistDetailView(plOrSmartType) {
    let title = '';
    let icon = '';
    let tracks = [];

    if (typeof plOrSmartType === 'string') {
      if (plOrSmartType === 'smart_gym') {
        title = 'Gym Beast Mode';
        icon = '🏋️‍♂️';
        tracks = getSmartPlaylistTracks('smart_gym');
      } else if (plOrSmartType === 'smart_favorites') {
        title = 'Liked Songs';
        icon = '❤️';
        tracks = getSmartPlaylistTracks('smart_favorites');
      } else if (plOrSmartType === 'smart_local') {
        title = 'Local Files';
        icon = '📱';
        tracks = getSmartPlaylistTracks('smart_local');
      } else if (plOrSmartType === 'smart_downloaded') {
        title = 'Saved Offline';
        icon = '⬇️';
        tracks = getSmartPlaylistTracks('smart_downloaded');
      }
      els.btnDeleteActivePlaylist.style.display = 'none';
      state.activeModalPlaylist = { isSmart: true, type: plOrSmartType, tracks };
    } else {
      title = plOrSmartType.name;
      icon = plOrSmartType.emoji;
      tracks = plOrSmartType.trackIds.map(id => state.allTracks.find(t => t.id === id)).filter(Boolean);
      els.btnDeleteActivePlaylist.style.display = 'block';
      state.activeModalPlaylist = plOrSmartType;
    }

    els.modalPlaylistTitle.textContent = title;
    els.modalPlaylistHeading.textContent = title;
    els.modalPlaylistIcon.textContent = icon;
    els.modalPlaylistMeta.textContent = `${tracks.length} tracks`;

    els.modalPlaylistTracks.innerHTML = '';
    if (tracks.length === 0) {
      els.modalPlaylistTracks.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-muted);">
          No songs found in this playlist.
        </div>
      `;
    } else {
      tracks.forEach(track => {
        const item = createTrackItemElement(track, () => {
          playTrack(track, tracks);
        });
        els.modalPlaylistTracks.appendChild(item);
      });
    }

    openModal(els.modalPlaylistView);
  }

  function openAddToPlaylistModal(track) {
    state.targetTrackForPlaylist = track;
    els.targetTrackLabel.textContent = `Add "${track.title}" to:`;
    els.playlistsChecklist.innerHTML = '';

    if (state.customPlaylists.length === 0) {
      els.playlistsChecklist.innerHTML = `
        <p style="color: var(--text-muted); font-size: 0.85rem; padding: 10px 0;">
          No custom playlists yet. Create a playlist first from the Playlists tab!
        </p>
      `;
      openModal(els.modalAddToPlaylist);
      return;
    }

    state.customPlaylists.forEach(pl => {
      const hasTrack = pl.trackIds.includes(track.id);
      const row = document.createElement('div');
      row.className = 'playlist-check-item';
      row.innerHTML = `
        <span>${pl.emoji} ${escapeHtml(pl.name)}</span>
        <input type="checkbox" ${hasTrack ? 'checked' : ''} data-pl-id="${pl.id}">
      `;

      row.querySelector('input').addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!pl.trackIds.includes(track.id)) {
            pl.trackIds.push(track.id);
            showToast(`Added to "${pl.name}"`);
          }
        } else {
          pl.trackIds = pl.trackIds.filter(id => id !== track.id);
          showToast(`Removed from "${pl.name}"`);
        }
        savePlaylists();
        renderCustomPlaylists();
      });

      els.playlistsChecklist.appendChild(row);
    });

    openModal(els.modalAddToPlaylist);
  }

  // ——— Up Next Queue Management ———
  function openQueueModal() {
    if (!state.currentTrack) {
      showToast('No active track playing');
      return;
    }

    els.queueNowArt.src = state.currentTrack.cover || DEFAULT_COVER;
    els.queueNowTitle.textContent = state.currentTrack.title;
    els.queueNowArtist.textContent = state.currentTrack.artist;

    const upcoming = state.activeQueue.slice(state.queueIndex + 1);
    els.queueCount.textContent = `${upcoming.length} tracks`;
    els.queueList.innerHTML = '';

    if (upcoming.length === 0) {
      els.queueList.innerHTML = `
        <div style="text-align: center; padding: 25px; color: var(--text-muted); font-size: 0.85rem;">
          End of queue. Tap shuffle or select an album/playlist!
        </div>
      `;
    } else {
      upcoming.forEach((track, idx) => {
        const item = document.createElement('div');
        item.className = 'track-item';
        item.innerHTML = `
          <img class="track-item-art" src="${track.cover || DEFAULT_COVER}" alt="Cover">
          <div class="track-item-info">
            <div class="track-item-title" dir="auto">${escapeHtml(track.title)}</div>
            <div class="track-item-meta">
              <span class="track-item-artist" dir="auto">${escapeHtml(track.artist)}</span>
            </div>
          </div>
          <div class="track-item-actions">
            <button class="track-action-btn" data-action="remove-queue" title="Remove">✕</button>
          </div>
        `;
        item.addEventListener('click', (e) => {
          if (e.target.closest('[data-action="remove-queue"]')) {
            e.stopPropagation();
            state.activeQueue.splice(state.queueIndex + 1 + idx, 1);
            openQueueModal();
          } else {
            playTrack(track, state.activeQueue, state.queueIndex + 1 + idx);
            closeModal(els.modalQueue);
          }
        });
        els.queueList.appendChild(item);
      });
    }

    openModal(els.modalQueue);
  }

  // ——— Sing-Along & Lyrics Controller ———
  async function openLyricsModal() {
    if (!state.currentTrack) {
      showToast('No active track playing');
      return;
    }

    const track = state.currentTrack;
    els.lyricsTrackArt.src = track.cover || DEFAULT_COVER;
    els.lyricsTrackTitle.textContent = track.title;
    els.lyricsTrackArtist.textContent = track.artist;
    els.lyricsEditorBox.style.display = 'none';
    els.lyricsContainer.style.display = 'block';

    openModal(els.modalLyrics);

    // Check if custom lyrics saved in localStorage
    if (state.customLyrics[track.id]) {
      els.lyricsLoading.style.display = 'none';
      els.lyricsText.textContent = state.customLyrics[track.id];
      return;
    }

    els.lyricsLoading.style.display = 'block';
    els.lyricsText.textContent = '';

    // Search lyrics from free lrclib API
    try {
      const cleanTitle = encodeURIComponent(track.title.replace(/[\(\[].*?[\)\]]/g, '').trim());
      const cleanArtist = encodeURIComponent(track.artist.replace(/[\(\[].*?[\)\]]/g, '').trim());
      const res = await fetch(`https://lrclib.net/api/get?track_name=${cleanTitle}&artist_name=${cleanArtist}`);
      if (res.ok) {
        const data = await res.json();
        els.lyricsLoading.style.display = 'none';
        if (data.plainLyrics) {
          els.lyricsText.textContent = data.plainLyrics;
          return;
        }
      }
    } catch (e) {
      console.warn('Lyrics fetch warning:', e);
    }

    els.lyricsLoading.style.display = 'none';
    els.lyricsText.innerHTML = `
      <p style="color: var(--text-muted); font-size: 0.95rem;">No lyrics found automatically for this track.</p>
      <p style="font-size: 0.85rem; margin-top: 10px; color: var(--accent-cyan);">Tap the ✏️ pencil icon at top to paste your own lyrics!</p>
    `;
  }

  function saveCustomLyrics() {
    if (!state.currentTrack) return;
    const text = els.lyricsTextarea.value.trim();
    if (!text) return;
    state.customLyrics[state.currentTrack.id] = text;
    localStorage.setItem('vibe_custom_lyrics', JSON.stringify(state.customLyrics));
    els.lyricsText.textContent = text;
    els.lyricsEditorBox.style.display = 'none';
    els.lyricsContainer.style.display = 'block';
    showToast('Lyrics saved! 🎤');
  }

  // ——— Theme Switcher Controller ———
  function applyTheme(themeName) {
    state.activeTheme = themeName;
    document.body.dataset.theme = themeName;
    localStorage.setItem('vibe_theme', themeName);

    els.themeCards.forEach(c => {
      c.classList.toggle('active', c.dataset.theme === themeName);
    });

    if (themeName === 'volt') {
      els.ambientGlow.style.background = 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)';
    } else if (themeName === 'fire') {
      els.ambientGlow.style.background = 'radial-gradient(circle, rgba(244, 63, 94, 0.28) 0%, rgba(249, 115, 22, 0.15) 50%, transparent 70%)';
    } else if (themeName === 'oled') {
      els.ambientGlow.style.background = 'none';
    } else {
      els.ambientGlow.style.background = 'radial-gradient(circle, rgba(139, 92, 246, 0.22) 0%, rgba(6, 182, 212, 0.12) 40%, transparent 70%)';
    }
  }

  // ——— Gym Mode HUD ———
  function activateGymMode() {
    switchTab('gym');
    if (!state.isPlaying && state.currentTrack) {
      primaryAudio.play();
    } else if (!state.isPlaying) {
      const gymTracks = getSmartPlaylistTracks('smart_gym');
      if (gymTracks.length > 0) {
        playTrack(gymTracks[0], gymTracks, 0);
      }
    }
    requestScreenWakeLock();
  }

  function setWorkoutSpeed(speed) {
    state.playbackRate = parseFloat(speed);
    primaryAudio.playbackRate = state.playbackRate;
    preloadAudio.playbackRate = state.playbackRate;

    els.gymSpeedChip.textContent = `${speed}x SPEED`;
    els.fullSpeedLabel.textContent = `${speed}x`;
    els.speedBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.speed === speed);
    });

    showToast(`Tempo set to ${speed}x`);
  }

  async function requestScreenWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        state.wakeLockSentinel = await navigator.wakeLock.request('screen');
        els.btnWakeLock.classList.add('active');
        showToast('Screen Wake Lock active (Screen won\'t sleep in gym) ⚡');
        state.wakeLockSentinel.addEventListener('release', () => {
          els.btnWakeLock.classList.remove('active');
        });
      } catch (err) {
        console.warn('Wake Lock error:', err);
      }
    } else {
      showToast('Wake Lock not supported on this browser.');
    }
  }

  function toggleScreenWakeLock() {
    if (state.wakeLockSentinel) {
      state.wakeLockSentinel.release();
      state.wakeLockSentinel = null;
      els.btnWakeLock.classList.remove('active');
      showToast('Screen Wake Lock disabled');
    } else {
      requestScreenWakeLock();
    }
  }

  // ——— Sleep Timer ———
  function setSleepTimer(minutes) {
    if (state.sleepTimerId) {
      clearInterval(state.sleepTimerId);
      state.sleepTimerId = null;
      state.sleepTimerEndsAt = null;
    }

    if (minutes === 0) {
      els.sleepIndicator.style.display = 'none';
      els.sleepStatusText.textContent = 'Sleep timer turned off.';
      showToast('Sleep timer turned off');
      closeModal(els.modalSleepTimer);
      return;
    }

    state.sleepTimerEndsAt = Date.now() + (minutes * 60 * 1000);
    els.sleepIndicator.style.display = 'block';

    state.sleepTimerId = setInterval(() => {
      const remainingMs = state.sleepTimerEndsAt - Date.now();
      if (remainingMs <= 0) {
        clearInterval(state.sleepTimerId);
        state.sleepTimerId = null;
        els.sleepIndicator.style.display = 'none';
        primaryAudio.pause();
        setPlayingState(false);
        showToast('⏱️ Sleep timer finished: Playback paused.');
      } else if (remainingMs < 60000) {
        primaryAudio.volume = Math.max(0.05, state.volume * (remainingMs / 60000));
      }
    }, 1000);

    showToast(`⏱️ Sleep timer set for ${minutes} minutes`);
    closeModal(els.modalSleepTimer);
  }

  // ——— Media Session API (Lock screen integration) ———
  function updateMediaSession(track) {
    if (!('mediaSession' in navigator) || !track) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: 'VIBE 2.0 Music',
      artwork: [
        { src: track.cover || DEFAULT_COVER, sizes: '512x512', type: 'image/png' }
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => primaryAudio.play());
    navigator.mediaSession.setActionHandler('pause', () => primaryAudio.pause());
    navigator.mediaSession.setActionHandler('previoustrack', playPrevTrack);
    navigator.mediaSession.setActionHandler('nexttrack', playNextTrack);
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) primaryAudio.currentTime = details.seekTime;
    });
  }

  // ——— Event Listeners & Binding ———
  function bindEvents() {
    // Navigation Tabs
    els.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.dataset.tab;
        switchTab(tab);
      });
    });

    // Hero Card Actions
    els.heroPlayBtn.addEventListener('click', () => {
      const gymTracks = getSmartPlaylistTracks('smart_gym');
      if (gymTracks.length > 0) playTrack(gymTracks[0], gymTracks, 0);
    });

    els.heroGymViewBtn.addEventListener('click', () => {
      activateGymMode();
    });

    // Filter Chips
    els.filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        setHomeFilter(chip.dataset.filter);
      });
    });

    // Search input
    els.searchInput.addEventListener('input', (e) => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        handleSearchInput(e.target.value);
      }, 350);
    });

    els.searchClearBtn.addEventListener('click', () => {
      els.searchInput.value = '';
      handleSearchInput('');
    });

    // Quick tag pills
    els.tagPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const query = pill.dataset.query;
        els.searchInput.value = query;
        handleSearchInput(query);
      });
    });

    // Smart Cards Clicks in Library
    els.smartCards.forEach(card => {
      const plType = card.dataset.playlist;
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-play-smart]')) {
          e.stopPropagation();
          const tracks = getSmartPlaylistTracks(plType);
          if (tracks.length > 0) playTrack(tracks[0], tracks, 0);
        } else {
          openPlaylistDetailView(plType);
        }
      });
    });

    // Create Playlist Modal
    els.btnCreatePlaylistModal.addEventListener('click', () => {
      els.inputPlaylistName.value = '';
      openModal(els.modalCreatePlaylist);
    });

    els.emojiOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        els.emojiOptions.forEach(o => o.classList.remove('active'));
        opt.classList.add('active');
      });
    });

    els.btnConfirmCreatePlaylist.addEventListener('click', () => {
      const name = els.inputPlaylistName.value;
      const activeEmoji = $('.emoji-opt.active')?.dataset.emoji || '🎵';
      createCustomPlaylist(name, activeEmoji);
      closeModal(els.modalCreatePlaylist);
    });

    // Delete custom playlist
    els.btnDeleteActivePlaylist.addEventListener('click', () => {
      if (state.activeModalPlaylist && !state.activeModalPlaylist.isSmart) {
        state.customPlaylists = state.customPlaylists.filter(pl => pl.id !== state.activeModalPlaylist.id);
        savePlaylists();
        renderCustomPlaylists();
        closeModal(els.modalPlaylistView);
        showToast('Playlist deleted.');
      }
    });

    // Play all in active modal playlist
    els.btnModalPlaylistPlay.addEventListener('click', () => {
      if (state.activeModalPlaylist) {
        const tracks = state.activeModalPlaylist.isSmart 
          ? state.activeModalPlaylist.tracks 
          : state.activeModalPlaylist.trackIds.map(id => state.allTracks.find(t => t.id === id)).filter(Boolean);
        if (tracks.length > 0) playTrack(tracks[0], tracks, 0);
      }
    });

    // Shuffle in active modal playlist
    els.btnModalPlaylistShuffle.addEventListener('click', () => {
      if (state.activeModalPlaylist) {
        const tracks = state.activeModalPlaylist.isSmart 
          ? state.activeModalPlaylist.tracks 
          : state.activeModalPlaylist.trackIds.map(id => state.allTracks.find(t => t.id === id)).filter(Boolean);
        if (tracks.length > 0) {
          state.isShuffle = true;
          const randomIdx = Math.floor(Math.random() * tracks.length);
          playTrack(tracks[randomIdx], tracks, randomIdx);
        }
      }
    });

    // Export / Import Playlists
    els.btnExportPlaylists.addEventListener('click', exportPlaylistsJson);
    els.btnImportPlaylists.addEventListener('click', () => els.fileImportPlaylists.click());
    els.fileImportPlaylists.addEventListener('change', importPlaylistsJson);

    // Mini Player Controls
    els.miniBtnPlay.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlayPause();
    });
    els.miniBtnNext.addEventListener('click', (e) => {
      e.stopPropagation();
      playNextTrack();
    });
    els.miniBtnLike.addEventListener('click', (e) => {
      e.stopPropagation();
      if (state.currentTrack) toggleLikeTrack(state.currentTrack);
    });
    els.miniInfoTap.addEventListener('click', openFullPlayer);

    // Full Player Modal Controls
    els.btnMinimizePlayer.addEventListener('click', closeFullPlayer);
    els.sheetHandle.addEventListener('click', closeFullPlayer);
    els.fullBtnPlay.addEventListener('click', togglePlayPause);
    els.fullBtnNext.addEventListener('click', playNextTrack);
    els.fullBtnPrev.addEventListener('click', playPrevTrack);
    els.fullBtnLike.addEventListener('click', () => {
      if (state.currentTrack) toggleLikeTrack(state.currentTrack);
    });

    els.fullBtnShuffle.addEventListener('click', () => {
      state.isShuffle = !state.isShuffle;
      els.fullBtnShuffle.classList.toggle('active', state.isShuffle);
      showToast(state.isShuffle ? 'Shuffle ON 🔀' : 'Shuffle OFF');
    });

    els.fullBtnRepeat.addEventListener('click', () => {
      state.repeatMode = (state.repeatMode + 1) % 3;
      if (state.repeatMode === 0) {
        els.fullBtnRepeat.textContent = '🔁';
        els.fullBtnRepeat.classList.remove('active');
        showToast('Repeat OFF');
      } else if (state.repeatMode === 1) {
        els.fullBtnRepeat.textContent = '🔁';
        els.fullBtnRepeat.classList.add('active');
        showToast('Repeat ALL 🔁');
      } else if (state.repeatMode === 2) {
        els.fullBtnRepeat.textContent = '🔂';
        els.fullBtnRepeat.classList.add('active');
        showToast('Repeat ONE 🔂');
      }
    });

    els.fullBtnAddPlaylist.addEventListener('click', () => {
      if (state.currentTrack) openAddToPlaylistModal(state.currentTrack);
    });

    els.fullBtnDownload.addEventListener('click', () => {
      if (state.currentTrack) toggleOfflineSave(state.currentTrack);
    });

    els.fullBtnSpeed.addEventListener('click', () => {
      const speeds = [1.0, 1.2, 1.5];
      const next = speeds[(speeds.indexOf(state.playbackRate) + 1) % speeds.length];
      setWorkoutSpeed(next.toString());
    });

    els.fullBtnSleep.addEventListener('click', () => openModal(els.modalSleepTimer));
    els.btnHeaderSleep.addEventListener('click', () => openModal(els.modalSleepTimer));

    // Pro Toolbar Controls
    els.fullBtnEq.addEventListener('click', () => {
      initWebAudio();
      openModal(els.modalEqualizer);
    });
    els.btnHeaderEq.addEventListener('click', () => {
      initWebAudio();
      openModal(els.modalEqualizer);
    });

    els.fullBtnLyrics.addEventListener('click', openLyricsModal);
    els.fullBtnQueue.addEventListener('click', openQueueModal);
    els.btnClearQueue.addEventListener('click', () => {
      if (state.currentTrack) {
        state.activeQueue = [state.currentTrack];
        state.queueIndex = 0;
        openQueueModal();
        showToast('Queue cleared');
      }
    });

    // Theme Switcher Modal
    els.btnHeaderTheme.addEventListener('click', () => openModal(els.modalThemes));
    els.themeCards.forEach(card => {
      card.addEventListener('click', () => {
        applyTheme(card.dataset.theme);
        showToast(`Theme changed to ${card.querySelector('.theme-card-name').textContent}`);
      });
    });

    // Equalizer Controls
    els.eqPresetChips.forEach(chip => {
      chip.addEventListener('click', () => applyEqPreset(chip.dataset.preset));
    });

    EQ_FREQS.forEach((freq, idx) => {
      const slider = $(`#eq-band-${idx}`);
      if (slider) {
        slider.value = state.eqGains[idx] || 0;
        const valEl = $(`#eq-val-${idx}`);
        if (valEl) valEl.textContent = (slider.value > 0 ? '+' : '') + slider.value + 'dB';

        slider.addEventListener('input', (e) => {
          initWebAudio();
          setEqBandGain(idx, parseFloat(e.target.value));
        });
      }
    });

    els.sliderVolBoost.addEventListener('input', (e) => {
      initWebAudio();
      setVolumeBoost(parseInt(e.target.value, 10));
    });

    els.crossfadeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.crossfadeSec = parseInt(btn.dataset.crossfade, 10);
        localStorage.setItem('vibe_crossfade', state.crossfadeSec.toString());
        els.crossfadeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        els.crossfadeVal.textContent = state.crossfadeSec === 0 ? '0s (Gapless)' : `${state.crossfadeSec}s Smooth`;
        showToast(`Crossfade: ${state.crossfadeSec}s`);
      });
    });

    // Upload & Dropzone Controls
    els.btnUploadMusicModal.addEventListener('click', () => openModal(els.modalUpload));
    els.btnBrowseAudioFiles.addEventListener('click', () => els.fileAudioInput.click());
    els.fileAudioInput.addEventListener('change', (e) => handleAudioFilesUpload(e.target.files));

    els.uploadDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      els.uploadDropzone.classList.add('dragover');
    });
    els.uploadDropzone.addEventListener('dragleave', () => {
      els.uploadDropzone.classList.remove('dragover');
    });
    els.uploadDropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      els.uploadDropzone.classList.remove('dragover');
      handleAudioFilesUpload(e.dataTransfer.files);
    });

    // Lyrics Editor
    els.btnEditLyrics.addEventListener('click', () => {
      const isEditing = els.lyricsEditorBox.style.display !== 'none';
      if (isEditing) {
        els.lyricsEditorBox.style.display = 'none';
        els.lyricsContainer.style.display = 'block';
      } else {
        els.lyricsEditorBox.style.display = 'block';
        els.lyricsContainer.style.display = 'none';
        els.lyricsTextarea.value = state.customLyrics[state.currentTrack?.id] || els.lyricsText.textContent || '';
      }
    });
    els.btnSaveCustomLyrics.addEventListener('click', saveCustomLyrics);

    // Gym Workout Timer Controls
    els.btnTimerStart.addEventListener('click', startGymTimer);
    els.btnTimerReset.addEventListener('click', resetGymTimer);
    els.btnTimerSoundToggle.addEventListener('click', () => {
      state.gymTimer.soundEnabled = !state.gymTimer.soundEnabled;
      els.btnTimerSoundToggle.textContent = state.gymTimer.soundEnabled ? '🔔 Chime ON' : '🔕 Mute';
      showToast(state.gymTimer.soundEnabled ? 'Timer chime enabled' : 'Timer muted');
    });

    els.timerPills.forEach(pill => {
      pill.addEventListener('click', () => {
        setGymTimerPreset(parseInt(pill.dataset.seconds, 10));
      });
    });
    els.btnTabataMode.addEventListener('click', activateTabataMode);

    // Header Random Shuffle
    els.btnHeaderShuffle.addEventListener('click', () => {
      if (state.allTracks.length > 0) {
        state.isShuffle = true;
        els.fullBtnShuffle.classList.add('active');
        const randIdx = Math.floor(Math.random() * state.allTracks.length);
        playTrack(state.allTracks[randIdx], state.allTracks, randIdx);
      }
    });

    // Seek bar drag / scrub
    setupSeekbar(els.fullProgressBar, (pct) => {
      if (primaryAudio.duration) {
        primaryAudio.currentTime = primaryAudio.duration * pct;
      }
    });

    // Volume slider
    setupSeekbar(els.volSlider, (pct) => {
      state.volume = Math.max(0, Math.min(1, pct));
      primaryAudio.volume = state.volume;
      preloadAudio.volume = state.volume;
      els.volFill.style.width = (state.volume * 100) + '%';
    });

    // Gym View Controls
    els.gymBtnPlay.addEventListener('click', togglePlayPause);
    els.gymBtnPrev.addEventListener('click', playPrevTrack);
    els.gymBtnNext.addEventListener('click', playNextTrack);
    els.gymBtnSkipBack.addEventListener('click', () => {
      primaryAudio.currentTime = Math.max(0, primaryAudio.currentTime - 15);
      showToast('↺ -15s');
    });
    els.gymBtnSkipForward.addEventListener('click', () => {
      if (primaryAudio.duration) {
        primaryAudio.currentTime = Math.min(primaryAudio.duration, primaryAudio.currentTime + 15);
        showToast('↻ +15s');
      }
    });
    els.btnWakeLock.addEventListener('click', toggleScreenWakeLock);
    els.speedBtns.forEach(btn => {
      btn.addEventListener('click', () => setWorkoutSpeed(btn.dataset.speed));
    });

    // Modal Close buttons
    $$('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.closeModal;
        closeModal($('#' + targetId));
      });
    });

    // Sleep options
    els.sleepOptionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        setSleepTimer(parseInt(btn.dataset.minutes, 10));
      });
    });

    // Language Toggle
    if (els.btnHeaderLang) {
      els.btnHeaderLang.addEventListener('click', () => {
        setLanguage(state.lang === 'ar' ? 'en' : 'ar');
        triggerHaptic(15);
      });
    }

    // Mood & Energy Stations Clicks
    els.moodCards.forEach(card => {
      card.addEventListener('click', () => {
        playMoodStation(card.dataset.station);
        triggerHaptic(20);
      });
    });

    // Voice Search Button
    if (els.btnVoiceSearch) {
      els.btnVoiceSearch.addEventListener('click', () => {
        startVoiceSearch();
        triggerHaptic(20);
      });
    }

    // Batch Download All Favorites in Library
    if (els.btnDownloadAllFavs) {
      els.btnDownloadAllFavs.addEventListener('click', () => {
        downloadAllFavoritesOffline();
        triggerHaptic(20);
      });
    }

    // Gym Live Tracker Dashboard (Sets Counter & Voice Coach)
    if (els.btnGymAddSet) {
      els.btnGymAddSet.addEventListener('click', () => {
        state.gymCurrentSet++;
        updateGymSessionDashboard();
        triggerHaptic(25);
        showToast(`${state.lang === 'ar' ? 'المجموعة رقم' : 'Set number'} ${state.gymCurrentSet} 💪`);
      });
    }
    if (els.btnGymVoiceCoach) {
      els.btnGymVoiceCoach.addEventListener('click', () => {
        toggleGymVoiceCoach();
        triggerHaptic(15);
      });
    }

    // Double-tap & Gestures on Full Player Artwork
    if (els.fullArtWrapper) {
      let lastArtTap = 0;
      els.fullArtWrapper.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastArtTap < 300 && now - lastArtTap > 0) {
          e.preventDefault();
          handleArtDoubleTap();
        }
        lastArtTap = now;
      });
      els.fullArtWrapper.addEventListener('dblclick', handleArtDoubleTap);

      // Horizontal swipe on album art
      let artTouchStartX = 0;
      let artTouchStartY = 0;
      els.fullArtWrapper.addEventListener('touchstart', (e) => {
        artTouchStartX = e.changedTouches[0].screenX;
        artTouchStartY = e.changedTouches[0].screenY;
      }, { passive: true });
      els.fullArtWrapper.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].screenX - artTouchStartX;
        const dy = e.changedTouches[0].screenY - artTouchStartY;
        if (Math.abs(dx) > 50 && Math.abs(dy) < 40) {
          if (dx < 0) playNextTrack();
          else playPrevTrack();
          triggerHaptic(15);
        }
      }, { passive: true });
    }

    // Swipe down on sheet handle to close full player
    if (els.sheetHandle) {
      let sheetStartY = 0;
      els.sheetHandle.addEventListener('touchstart', (e) => {
        sheetStartY = e.changedTouches[0].screenY;
      }, { passive: true });
      els.sheetHandle.addEventListener('touchend', (e) => {
        const dy = e.changedTouches[0].screenY - sheetStartY;
        if (dy > 60) {
          closeFullPlayer();
          triggerHaptic(15);
        }
      }, { passive: true });
    }

    // Track Options & Share / QR Code Modal Triggers
    if (els.fullBtnShare) {
      els.fullBtnShare.addEventListener('click', () => {
        openTrackOptionsModal(state.currentTrack);
        triggerHaptic(15);
      });
    }
    if (els.btnFullOptions) {
      els.btnFullOptions.addEventListener('click', () => {
        openTrackOptionsModal(state.currentTrack);
        triggerHaptic(15);
      });
    }
    if (els.btnShareNative) {
      els.btnShareNative.addEventListener('click', () => {
        if (state.activeOptionsTrack) shareTrackNative(state.activeOptionsTrack);
      });
    }
    if (els.btnCopyTrackLink) {
      els.btnCopyTrackLink.addEventListener('click', () => {
        if (state.activeOptionsTrack) copyTrackShareLink(state.activeOptionsTrack);
      });
    }
    if (els.optAction8d) {
      els.optAction8d.addEventListener('click', () => {
        toggle8DAudio();
        closeModal(els.modalTrackOptions);
      });
    }
    if (els.optActionQueue) {
      els.optActionQueue.addEventListener('click', () => {
        if (state.activeOptionsTrack) {
          state.activeQueue.splice(state.queueIndex + 1, 0, state.activeOptionsTrack);
          renderQueueModal();
          showToast(state.lang === 'ar' ? 'تمت إضافة الأغنية للتالي في القائمة 📋' : 'Added to play next 📋');
          closeModal(els.modalTrackOptions);
        }
      });
    }
    if (els.optActionPlaylist) {
      els.optActionPlaylist.addEventListener('click', () => {
        closeModal(els.modalTrackOptions);
        if (state.activeOptionsTrack) openAddToPlaylistModal(state.activeOptionsTrack);
      });
    }
    if (els.optActionDownload) {
      els.optActionDownload.addEventListener('click', async () => {
        if (state.activeOptionsTrack) {
          await toggleOfflineSave(state.activeOptionsTrack);
          closeModal(els.modalTrackOptions);
        }
      });
    }

    // 8D Audio & Reverb Controls
    if (els.fullBtn8d) {
      els.fullBtn8d.addEventListener('click', () => {
        toggle8DAudio();
        triggerHaptic(20);
      });
    }
    if (els.btnToggle8d) {
      els.btnToggle8d.addEventListener('click', () => {
        toggle8DAudio();
        triggerHaptic(15);
      });
    }
    els.spatialSpeedBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        state.spatialSpeed = parseInt(btn.dataset.speed, 10);
        els.spatialSpeedBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        triggerHaptic(15);
        showToast(`8D Orbit Speed: ${state.spatialSpeed}s`);
      });
    });
    els.reverbBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        els.reverbBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyReverbPreset(btn.dataset.reverb);
        triggerHaptic(15);
      });
    });

    // Infinite Radio Toggle in Queue
    if (els.btnToggleInfinite) {
      els.btnToggleInfinite.addEventListener('click', () => {
        toggleInfiniteRadio();
        triggerHaptic(15);
      });
    }

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        playNextTrack();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        playPrevTrack();
      } else if (e.code === 'KeyG') {
        activateGymMode();
      } else if (e.code === 'KeyL' && state.currentTrack) {
        toggleLikeTrack(state.currentTrack);
      } else if (e.code === 'KeyE') {
        openModal(els.modalEqualizer);
      }
    });

    window.addEventListener('online', checkNetworkStatus);
    window.addEventListener('offline', checkNetworkStatus);
  }

  // ——— UI Helpers & Modals ———
  function switchTab(tabName) {
    state.activeTab = tabName;
    els.tabs.forEach(tab => tab.classList.remove('active'));
    els.navItems.forEach(item => item.classList.remove('active'));

    const activeView = $('#view-' + tabName);
    const activeNav = $(`[data-tab="${tabName}"]`);
    if (activeView) activeView.classList.add('active');
    if (activeNav) activeNav.classList.add('active');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function openFullPlayer() {
    initWebAudio();
    els.fullPlayerModal.classList.add('open');
    els.fullPlayerModal.setAttribute('aria-hidden', 'false');
  }

  function closeFullPlayer() {
    els.fullPlayerModal.classList.remove('open');
    els.fullPlayerModal.setAttribute('aria-hidden', 'true');
  }

  function openModal(modalEl) {
    if (modalEl) {
      modalEl.classList.add('open');
      modalEl.setAttribute('aria-hidden', 'false');
    }
  }

  function closeModal(modalEl) {
    if (modalEl) {
      modalEl.classList.remove('open');
      modalEl.setAttribute('aria-hidden', 'true');
    }
  }

  function setupSeekbar(barEl, onSeek) {
    let isDragging = false;

    function handleSeek(e) {
      const rect = barEl.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      onSeek(pct);
    }

    barEl.addEventListener('mousedown', (e) => {
      isDragging = true;
      state.isSeeking = true;
      handleSeek(e);
    });

    barEl.addEventListener('touchstart', (e) => {
      isDragging = true;
      state.isSeeking = true;
      handleSeek(e);
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      if (isDragging) handleSeek(e);
    });

    window.addEventListener('touchmove', (e) => {
      if (isDragging) handleSeek(e);
    }, { passive: true });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        state.isSeeking = false;
      }
    });

    window.addEventListener('touchend', () => {
      if (isDragging) {
        isDragging = false;
        state.isSeeking = false;
      }
    });
  }

  function checkNetworkStatus() {
    const isOnline = navigator.onLine;
    const label = els.netStatus.querySelector('.status-label');
    if (isOnline) {
      els.netStatus.classList.remove('offline');
      label.textContent = 'Online';
    } else {
      els.netStatus.classList.add('offline');
      label.textContent = 'Offline Ready';
      showToast('⚡ Running in Offline Mode (Cached & Downloaded tracks work)');
    }
  }

  function showToast(message, duration = 2800) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    els.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.25s ease';
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  // Export / Import Playlists JSON
  function exportPlaylistsJson() {
    const data = {
      playlists: state.customPlaylists,
      likes: [...state.likedTrackIds],
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vibe_playlists_backup.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Playlists exported to JSON backup! 📥');
  }

  function importPlaylistsJson(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (Array.isArray(data.playlists)) {
          state.customPlaylists = data.playlists;
          savePlaylists();
          renderCustomPlaylists();
        }
        if (Array.isArray(data.likes)) {
          state.likedTrackIds = new Set(data.likes);
          localStorage.setItem('vibe_likes', JSON.stringify(data.likes));
        }
        updateSmartCardCounts();
        showToast('Playlists backup imported successfully! 📤');
      } catch (err) {
        showToast('Invalid backup JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  // Service Worker Registration
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
          .then((reg) => console.log('[SW] Registered v3.0:', reg.scope))
          .catch((err) => console.warn('[SW] Registration failed:', err));
      });
    }
  }

})();
