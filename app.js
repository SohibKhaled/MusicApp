/* VIBE Studio — Core Audio Engine, Multi-Source Failover, Smart Search,
   Lock-Screen Background Safety, and Synchronized Gym & Exercise Studio */

(() => {
  'use strict';

  const DEFAULT_COVER = 'assets/default-cover.png';
  const MUSIC_DIR = 'music/';
  const DB_NAME = 'vibe_audio_db_v2';
  const DB_STORE = 'offline_tracks';
  const IS_STATIC_HOST =
    /(?:github\.io|pages\.dev|netlify\.app|vercel\.app)$/i.test(window.location.hostname) ||
    window.location.protocol === 'file:';

  // Built-in Bilingual Exercise Catalog for pairing with any track
  const EXERCISE_CATALOG = [
    { id: 'flat_bench', zone: 'push', nameAr: 'بنش برس مستوي بالبار', nameEn: 'Flat Barbell Bench Press', muscleAr: 'الصدر والكتف الأمامي', muscleEn: 'Chest & Front Delts', sets: 4, reps: '6-8', restSec: 120, tempoNoteAr: 'نزول متحكم ٣ ثوانٍ ودفع قوي', tempoNoteEn: '3s controlled lower, explosive press' },
    { id: 'incline_db', zone: 'push', nameAr: 'تجميع صدر عالي بالدامبل', nameEn: 'Incline Dumbbell Press', muscleAr: 'الصدر العالي والتراي', muscleEn: 'Upper Chest & Triceps', sets: 4, reps: '8-10', restSec: 90, tempoNoteAr: 'حافظ على ثبات الكتفين لأسفل', tempoNoteEn: 'Keep shoulders retracted on bench' },
    { id: 'ohp_barbell', zone: 'push', nameAr: 'ضغط كتف عسكري بالبار', nameEn: 'Standing Overhead Press', muscleAr: 'الأكتاف والترايسبس', muscleEn: 'Shoulders & Triceps', sets: 4, reps: '6-8', restSec: 90, tempoNoteAr: 'شد البطن والأرداف لحماية الظهر', tempoNoteEn: 'Brace core tight through lockout' },
    { id: 'lateral_raise', zone: 'push', nameAr: 'رفرفة جانبي للكتف', nameEn: 'Dumbbell Lateral Raise', muscleAr: 'الكتف الجانبي', muscleEn: 'Lateral Deltoids', sets: 4, reps: '12-15', restSec: 60, tempoNoteAr: 'ارفع بالمرفقين بنزول بطيء', tempoNoteEn: 'Lead with elbows, zero momentum' },
    { id: 'deadlift_pr', zone: 'pull', nameAr: 'رفعة مميتة ثقيلة (Deadlift)', nameEn: 'Heavy Barbell Deadlift', muscleAr: 'الظهر السفلي والأوتار', muscleEn: 'Posterior Chain', sets: 5, reps: '3-5', restSec: 120, tempoNoteAr: 'ثبّت الظهر واسحب بقوة مع الإيقاع', tempoNoteEn: 'Engage lats and drive floor away' },
    { id: 'lat_pulldown', zone: 'pull', nameAr: 'سحب عالي واسع للظهر', nameEn: 'Wide-Grip Lat Pulldown', muscleAr: 'الظهر العريض', muscleEn: 'Lats & Upper Back', sets: 4, reps: '10-12', restSec: 75, tempoNoteAr: 'اسحب نحو أعلى الصدر بعصر العضلة', tempoNoteEn: '1s squeeze at chest height' },
    { id: 'cable_row', zone: 'pull', nameAr: 'تجديف أرضي ضيق بالكابل', nameEn: 'Seated Cable Row', muscleAr: 'سماكة الظهر', muscleEn: 'Mid Back & Rhomboids', sets: 4, reps: '10-12', restSec: 75, tempoNoteAr: 'صدر مرفوع بدون انحناء الظهر', tempoNoteEn: 'Pull elbows cleanly behind torso' },
    { id: 'face_pull', zone: 'pull', nameAr: 'سحب حبل للكتف الخلفي', nameEn: 'Rope Face Pulls', muscleAr: 'الكتف الخلفي', muscleEn: 'Rear Delts & Rotator Cuff', sets: 3, reps: '15', restSec: 45, tempoNoteAr: 'دوران خارجي في نهاية السحبة', tempoNoteEn: 'Finish with external shoulder rotation' },
    { id: 'barbell_squat', zone: 'legs', nameAr: 'سكوات حر بالبار', nameEn: 'Barbell Back Squat', muscleAr: 'الأفخاذ والأرداف', muscleEn: 'Quads & Glutes', sets: 4, reps: '6-8', restSec: 120, tempoNoteAr: 'عمق كامل مع دفع متوازن', tempoNoteEn: 'Controlled descent, drive out of hole' },
    { id: 'romanian_dl', zone: 'legs', nameAr: 'ديدليفت روماني للأوتار', nameEn: 'Romanian Deadlift (RDL)', muscleAr: 'الأوتار والأرداف', muscleEn: 'Hamstrings & Glutes', sets: 4, reps: '8-10', restSec: 90, tempoNoteAr: 'ادفع الحوض للخلف حتى أقصى تمدد', tempoNoteEn: 'Push hips back with slight knee bend' },
    { id: 'leg_press', zone: 'legs', nameAr: 'دفع أرجل ٤٥ درجة', nameEn: '45° Leg Press', muscleAr: 'الأفخاذ الأمامية', muscleEn: 'Quadriceps', sets: 4, reps: '10-12', restSec: 90, tempoNoteAr: 'لا تفرد الركبتين بالكامل بالأعلى', tempoNoteEn: 'Smooth tempo, never snap knees' },
    { id: 'bulgarian_split', zone: 'legs', nameAr: 'بلجارين سبليت سكوات', nameEn: 'Bulgarian Split Squat', muscleAr: 'أفخاذ أحادي وأرداف', muscleEn: 'Unilateral Quads & Glutes', sets: 3, reps: '10/leg', restSec: 75, tempoNoteAr: 'ثبات الحوض والهبوط لمنتصف الخطوة', tempoNoteEn: 'Keep torso steady, press through heel' },
    { id: 'incline_curl', zone: 'arms', nameAr: 'بايسبس على البنش المائل', nameEn: 'Incline Dumbbell Curl', muscleAr: 'البايسبس', muscleEn: 'Biceps Long Head', sets: 3, reps: '10-12', restSec: 60, tempoNoteAr: 'تمدد كامل بدون تحريك المرفق', tempoNoteEn: 'Full stretch bottom, peak contraction top' },
    { id: 'hammer_curl', zone: 'arms', nameAr: 'هامر كيرل بالدامبل', nameEn: 'Dumbbell Hammer Curl', muscleAr: 'البايسبس والساعد', muscleEn: 'Brachialis & Forearms', sets: 4, reps: '10-12', restSec: 60, tempoNoteAr: 'ثبات الجذع بدون تأرجح', tempoNoteEn: 'Neutral grip, controlled negative' },
    { id: 'rope_pushdown', zone: 'arms', nameAr: 'دفع حبل ترايسبس بالكابل', nameEn: 'Cable Rope Pushdown', muscleAr: 'الترايسبس', muscleEn: 'Triceps', sets: 4, reps: '12-15', restSec: 60, tempoNoteAr: 'افتح طرفي الحبل بالأسفل', tempoNoteEn: 'Spread rope at full arm lockout' },
    { id: 'cable_crunch', zone: 'core', nameAr: 'طحن بطن بالكابل الثقيل', nameEn: 'Kneeling Cable Crunch', muscleAr: 'عضلات البطن', muscleEn: 'Core & Abs', sets: 4, reps: '15-20', restSec: 45, tempoNoteAr: 'زفير قوي أثناء الانقباض', tempoNoteEn: 'Flex spine inward on every rep' },
    { id: 'plank_hold', zone: 'core', nameAr: 'بلانك ثابت للكور', nameEn: 'Weighted Isometric Plank', muscleAr: 'ثبات البطن والظهر', muscleEn: 'Core Stability', sets: 3, reps: '60 sec', restSec: 45, tempoNoteAr: 'شد البطن والأرداف باستمرار', tempoNoteEn: 'Maintain neutral spine line' },
    { id: 'hiit_sprint', zone: 'cardio', nameAr: 'سبرينت / دراجة عالية الشدة', nameEn: 'HIIT Bike / Treadmill Sprint', muscleAr: 'القلب وحرق الدهون', muscleEn: 'VO2 Max & Conditioning', sets: 6, reps: '45s/15s', restSec: 30, tempoNoteAr: 'أقصى وتيرة في فترات العمل', tempoNoteEn: 'Match stride cadence with track beat' },
    { id: 'battle_ropes', zone: 'cardio', nameAr: 'حبال المقاومة المتفجرة', nameEn: 'Explosive Battle Ropes', muscleAr: 'الأكتاف واللياقة', muscleEn: 'Delts & Conditioning', sets: 5, reps: '30 sec', restSec: 30, tempoNoteAr: 'موجات متتابعة سريعة بدون توقف', tempoNoteEn: 'Sustained high-velocity alternating waves' },
    { id: 'mobility_stretch', zone: 'recovery', nameAr: 'إطالة عضلية وفوم رولر', nameEn: 'Mobility Stretch & Cool Down', muscleAr: 'استشفاء العضلات', muscleEn: 'Flexibility & Recovery', sets: 3, reps: '45 sec', restSec: 30, tempoNoteAr: 'تنفس عميق لإرخاء الألياف العضلية', tempoNoteEn: 'Relaxed nasal breathing per stretch hold' }
  ];

  const TRANSLATIONS = {
    en: {
      brandSub: 'Audio & Training',
      navHome: 'Home',
      navSearch: 'Search',
      navGym: 'Gym Studio',
      navPlaylists: 'Library',
      pairedExerciseLabel: 'Paired Exercise',
      openGymStudio: 'Open Gym Studio',
      lockscreenReady: 'Lock-Screen Audio',
      quickSearchHint: 'Search songs, artists, BPM or Arabic hits...',
      heroBadge: 'MULTI-SOURCE FAILOVER & LOCK-SCREEN SAFE',
      heroTitle: 'Music Built for Deep Focus & Heavy Lifts',
      heroSubtitle: 'Zero-drop streaming, instant source switching, tempo-calibrated gym mixes, and paired workout sets per song.',
      playFeatured: 'Play Featured',
      enterGym: 'Gym Studio',
      gymTempoTitle: 'Tempo Training Mixes',
      tempoWarmup: 'Warm-Up Groove',
      tempoStrength: 'Strength & Hypertrophy',
      tempoPeak: 'Heavy PR & Phonk',
      tempoCardio: 'HIIT & Sprint',
      moodTitle: 'Curated Sound Stations',
      moodGymLabel: 'Gym Power',
      moodGymSub: '140+ BPM Phonk',
      moodArabicLabel: 'Arabic Hits',
      moodArabicSub: 'Diab, Wegz & More',
      moodEnergyLabel: 'Pure Adrenaline',
      moodEnergySub: 'Anthem & Drive',
      moodElectroLabel: 'Electronic',
      moodElectroSub: 'Drop & Synth',
      moodChillLabel: 'Recovery',
      moodChillSub: 'Cooldown Flow',
      moodBassLabel: 'Deep Sub-Bass',
      moodBassSub: 'Focused Rhythm',
      filterAll: 'All',
      filterArabic: 'Arabic',
      filterGym: 'Gym Phonk',
      filterEnergy: 'Energy',
      filterElectro: 'Electronic',
      filterChill: 'Cooldown',
      filterOnline: 'Cloud Hits',
      allTracksHeading: 'Library & Workouts',
      sortDefault: 'Default',
      sortBpm: 'BPM High-Low',
      sortTitle: 'Title A-Z',
      searchHeading: 'Smart Multi-Source Search',
      searchSub: 'Searches Studio AAC, Audius & SoundCloud in parallel with automatic stream failover.',
      searchPlaceholder: 'Search Arabic, English or Workout tracks...',
      modeOriginal: 'Original Studio',
      modeAll: 'All Versions',
      modeGym: 'Gym & Phonk',
      gymStudioEyebrow: 'TRAINING + AUDIO SYNC',
      gymStudioHeading: 'Gym Workout Studio',
      createGymPlaylist: 'Custom Gym Mix',
      keepAwake: 'Keep Screen On',
      tempoPlaylistsHeading: 'Tempo-Matched Gym Playlists',
      tempoWarmupTitle: 'Warm-Up & Mobility',
      tempoWarmupDesc: 'Steady cadence to raise core temp',
      tempoStrengthTitle: 'Hypertrophy & Strength',
      tempoStrengthDesc: 'Locked rhythm for controlled compounds',
      tempoPeakTitle: 'Heavy Lift & PR Beast',
      tempoPeakDesc: 'Aggressive drop sets & phonk',
      tempoCardioTitle: 'HIIT & Sprint Conditioning',
      tempoCardioDesc: 'High-cadence sprint intervals',
      tempoCooldownTitle: 'Cooldown & Stretch',
      tempoCooldownDesc: 'Down-regulate & recover post-session',
      cadenceLabel: 'Cadence Pace:',
      pairedExerciseActive: 'PAIRED EXERCISE WITH THIS TRACK',
      swapExerciseBtn: 'Swap',
      setsLabel: 'Sets Done',
      repsLabel: 'Target Reps',
      restLabel: 'Rest Interval',
      completeSetStartRest: 'Complete Set & Start Rest Timer',
      sessionTime: 'Session Time',
      caloriesBurned: 'Est. kcal',
      totalSets: 'Total Sets',
      restTimerTitle: 'Rest & Interval Timer',
      timerStart: 'Start',
      timerPause: 'Pause',
      timerReset: 'Reset',
      workoutQueueHeading: 'Active Training Tracks & Exercises',
      playAllBtn: 'Play Mix',
      recentHeading: 'Recently Played',
      smartLibTitle: 'Smart Collections',
      smartGymTitle: 'Gym & PR Mix',
      smartFavTitle: 'Liked Songs',
      smartLocalTitle: 'Device Audio',
      smartOfflineTitle: 'Saved Offline',
      saveFavsOffline: 'Save Favorites Offline',
      clearCacheBtn: 'Clear Cache',
      customPlaylistsHeading: 'My Playlists & Gym Routines',
      uploadBtn: 'Import Audio',
      newPlaylistBtn: 'New Playlist',
      nowPlaying: 'NOW PLAYING',
      trainLabel: 'Train',
      saveOffline: 'Save Offline',
      offlineReady: 'Offline Ready',
      addToList: 'Playlist',
      lyricsBtn: 'Lyrics',
      queueBtn: 'Queue',
      shareBtn: 'Share',
      shuffleBtn: 'Shuffle',
      createPlModalTitle: 'New Playlist or Gym Mix',
      plNameLabel: 'Playlist Name',
      plTypeLabel: 'Target Tempo / Mode (Optional)',
      plIconLabel: 'Choose Icon',
      createPlConfirm: 'Create Playlist',
      exercisePickerTitle: 'Pair Workout Exercise with Track',
      zoneAll: 'All',
      zonePush: 'Chest & Push',
      zonePull: 'Back & Pull',
      zoneLegs: 'Legs',
      zoneArms: 'Arms',
      zoneCore: 'Core',
      zoneCardio: 'HIIT & Cardio',
      customExerciseHeading: 'Or Create Custom Exercise',
      savePairedExercise: 'Pair Exercise to Track',
      addToListModalTitle: 'Add to Playlist',
      sleepTitle: 'Sleep Timer',
      sleepOff: 'Turn Off',
      eqTitle: 'Audio Engine & 5-Band EQ',
      eqNote: 'Default native playback stays lock-screen ultra-safe. Enabling EQ or 8D engages Web Audio DSP.',
      queueTitle: 'Up Next Queue',
      lyricsTitle: 'Lyrics',
      themesTitle: 'Studio Appearance',
      uploadModalTitle: 'Import Device Audio',
      uploadDropText: 'Drop MP3, M4A, FLAC or WAV files here',
      browseFilesBtn: 'Select Files',
      trackOptionsTitle: 'Track Options & Share',
      optPairEx: 'Pair / Edit Workout Exercise',
      optSwitchSource: 'Switch Stream Source'
    },
    ar: {
      brandSub: 'صوتيات وتدريب الجيم',
      navHome: 'الرئيسية',
      navSearch: 'البحث',
      navGym: 'استوديو الجيم',
      navPlaylists: 'المكتبة',
      pairedExerciseLabel: 'التمرين المقترن',
      openGymStudio: 'فتح استوديو الجيم',
      lockscreenReady: 'تشغيل مع قفل الشاشة',
      quickSearchHint: 'ابحث عن أغنية، فنان، إيقاع أو تمارين...',
      heroBadge: 'تبديل تلقائي للمصادر + ثبات تام عند قفل الشاشة',
      heroTitle: 'موسيقى مصممة للتركيز وأعلى أوزان الجيم',
      heroSubtitle: 'بث فوري فائق السرعة، تبديل ذكي للمصدر عند أي عطل، قوائم وتيرة جيم مخصصة، وتمرين مقترن مع كل أغنية.',
      playFeatured: 'تشغيل المختارات',
      enterGym: 'استوديو الجيم',
      gymTempoTitle: 'قوائم الوتيرة للتمرين',
      tempoWarmup: 'إحماء وتركيز',
      tempoStrength: 'تضخيم وقوة عضلية',
      tempoPeak: 'أوزان قصوى و PR',
      tempoCardio: 'كارديو و HIIT',
      moodTitle: 'محطات الصوت المنسقة',
      moodGymLabel: 'قوة الجيم',
      moodGymSub: '140+ BPM فونك',
      moodArabicLabel: 'أغاني عربية',
      moodArabicSub: 'عمرو دياب، ويجز والمزيد',
      moodEnergyLabel: 'حماس وطاقة',
      moodEnergySub: 'إيقاع متواصل',
      moodElectroLabel: 'إلكترونيك',
      moodElectroSub: 'توزيع وإيقاع حديث',
      moodChillLabel: 'استشفاء وتهدئة',
      moodChillSub: 'ما بعد التمرين',
      moodBassLabel: 'بيس عميق',
      moodBassSub: 'ثبات وإيقاع متزن',
      filterAll: 'الكل',
      filterArabic: 'عربي',
      filterGym: 'فونك جيم',
      filterEnergy: 'حماس',
      filterElectro: 'إلكترونيك',
      filterChill: 'استشفاء',
      filterOnline: 'أونلاين',
      allTracksHeading: 'المكتبة والتمارين',
      sortDefault: 'الافتراضي',
      sortBpm: 'الأسرع BPM',
      sortTitle: 'بالاسم',
      searchHeading: 'محرك البحث الذكي متعدد المصادر',
      searchSub: 'يبحث في Studio AAC و Audius و SoundCloud بالتوازي مع تبديل تلقائي لأي رابط لا يعمل.',
      searchPlaceholder: 'ابحث عن أي أغنية عربية، أجنبية أو تمرين...',
      modeOriginal: 'النسخ الأصلية',
      modeAll: 'كل النسخ',
      modeGym: 'جيم وفونك',
      gymStudioEyebrow: 'تزامن التمرين والموسيقى',
      gymStudioHeading: 'استوديو الجيم والتدريب',
      createGymPlaylist: 'إنشاء قائمة جيم',
      keepAwake: 'إبقاء الشاشة مضيئة',
      tempoPlaylistsHeading: 'بلاي ليستات الجيم حسب الوتيرة (BPM)',
      tempoWarmupTitle: 'الإحماء والمرونة',
      tempoWarmupDesc: 'وتيرة متزنة لرفع جاهزية الجسم',
      tempoStrengthTitle: 'القوة والتضخيم العضلي',
      tempoStrengthDesc: 'إيقاع ثابت لمجموعات التمرين الأساسية',
      tempoPeakTitle: 'الأوزان القصوى والـ PR',
      tempoPeakDesc: 'إيقاع عالي الاندفاع وأقوى الرفعات',
      tempoCardioTitle: 'الحرق والـ HIIT السريع',
      tempoCardioDesc: 'وتيرة متسارعة للجري والتكرارات السريعة',
      tempoCooldownTitle: 'التهدئة والإطالات',
      tempoCooldownDesc: 'استرخاء التنفس والاستشفاء العضلي',
      cadenceLabel: 'سرعة الإيقاع:',
      pairedExerciseActive: 'التمرين الرياضي المقترن بالأغنية',
      swapExerciseBtn: 'تغيير التمرين',
      setsLabel: 'المجموعات',
      repsLabel: 'التكرارات',
      restLabel: 'مدة الراحة',
      completeSetStartRest: 'إتمام مجموعة وبدء مؤقت الراحة',
      sessionTime: 'زمن التمرين',
      caloriesBurned: 'سعرات تقريبية',
      totalSets: 'إجمالي المجموعات',
      restTimerTitle: 'مؤقت الراحة والتاباتا',
      timerStart: 'ابدأ',
      timerPause: 'إيقاف مؤقت',
      timerReset: 'إعادة ضبط',
      workoutQueueHeading: 'أغاني التمرين والتمارين المقترنة',
      playAllBtn: 'تشغيل الكل',
      recentHeading: 'شغّلت مؤخراً',
      smartLibTitle: 'القوائم الذكية',
      smartGymTitle: 'خلطة الجيم و PR',
      smartFavTitle: 'المفضلة',
      smartLocalTitle: 'ملفات الجهاز',
      smartOfflineTitle: 'محفوظ أوفلاين',
      saveFavsOffline: 'حفظ المفضلة أوفلاين',
      clearCacheBtn: 'تفريغ الكاش',
      customPlaylistsHeading: 'قوائمي وبرامج الجيم',
      uploadBtn: 'إضافة ملفات',
      newPlaylistBtn: 'قائمة جديدة',
      nowPlaying: 'يعمل الآن',
      trainLabel: 'تدرّب',
      saveOffline: 'حفظ أوفلاين',
      offlineReady: 'جاهز أوفلاين',
      addToList: 'إضافة لقائمة',
      lyricsBtn: 'الكلمات',
      queueBtn: 'التالي',
      shareBtn: 'مشاركة',
      shuffleBtn: 'عشوائي',
      createPlModalTitle: 'إنشاء قائمة أو برنامج جيم',
      plNameLabel: 'اسم القائمة',
      plTypeLabel: 'الوتيرة المستهدفة للتمرين (اختياري)',
      plIconLabel: 'اختر أيقونة',
      createPlConfirm: 'إنشاء القائمة',
      exercisePickerTitle: 'تخصيص تمرين مع الأغنية',
      zoneAll: 'الكل',
      zonePush: 'صدر ودفع',
      zonePull: 'ظهر وسحب',
      zoneLegs: 'أرجل',
      zoneArms: 'ذراعين',
      zoneCore: 'بطن وكور',
      zoneCardio: 'كارديو',
      customExerciseHeading: 'أو أضف تمريناً مخصصاً',
      savePairedExercise: 'ربط التمرين بالأغنية',
      addToListModalTitle: 'إضافة لقائمة تشغيل',
      sleepTitle: 'مؤقت النوم التلقائي',
      sleepOff: 'إلغاء المؤقت',
      eqTitle: 'محرك الصوت ومعادل الترددات',
      eqNote: 'الوضع الافتراضي يبقي الصوت محمياً لقفل شاشة الهاتف. تفعيل المعادل أو 8D يشغل معالجة الصوت الحية.',
      queueTitle: 'قائمة الانتظار',
      lyricsTitle: 'كلمات الأغنية',
      themesTitle: 'مظهر المنصة',
      uploadModalTitle: 'استيراد ملفات من الجهاز',
      uploadDropText: 'اسحب ملفات MP3 أو M4A أو FLAC هنا',
      browseFilesBtn: 'اختر ملفات',
      trackOptionsTitle: 'خيارات الأغنية والمشاركة',
      optPairEx: 'تعيين أو تعديل التمرين المقترن',
      optSwitchSource: 'تبديل مصدر البث'
    }
  };

  function safeJsonParse(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  const state = {
    lang: localStorage.getItem('vibe_lang') || 'ar',
    activeTab: 'home',
    allTracks: [],
    filteredTracks: [],
    activeQueue: [],
    queueIndex: -1,
    currentTrack: null,
    isPlaying: false,
    userPaused: false,
    playbackRate: Number(localStorage.getItem('vibe_speed') || 1),
    isShuffle: localStorage.getItem('vibe_shuffle') === 'true',
    repeatMode: localStorage.getItem('vibe_repeat') || 'all',
    searchMode: 'original',
    homeFilter: 'all',
    sortMode: 'default',
    activeTempoZone: 'peak',
    activeTheme: localStorage.getItem('vibe_theme') || 'midnight',
    likedTrackIds: new Set(safeJsonParse('vibe_likes', [])),
    customPlaylists: safeJsonParse('vibe_playlists', []),
    recentPlayed: safeJsonParse('vibe_recent', []),
    customLyrics: safeJsonParse('vibe_custom_lyrics', {}),
    customTrackExercises: safeJsonParse('vibe_track_exercises', {}),
    exerciseSetsDone: {},
    offlineTrackIds: new Set(),
    cacheTotalMB: '0.0',
    eqGains: safeJsonParse('vibe_eq_gains', [0, 0, 0, 0, 0]),
    gainBoost: Number(localStorage.getItem('vibe_gain_boost') || 1),
    crossfadeSec: Number(localStorage.getItem('vibe_crossfade') || 0),
    reverbType: localStorage.getItem('vibe_reverb') || 'dry',
    is8dActive: false,
    spatialRate: 0.2,
    infiniteRadio: true,
    webAudioActivated: false,
    volume: Number(localStorage.getItem('vibe_vol') || 1),
    muted: false,
    db: null,
    activeModalPlaylist: null,
    targetTrackForPlaylist: null,
    targetTrackForOptions: null,
    targetTrackForExercise: null,
    selectedPlaylistIcon: 'icon-gym',
    lastPlayedPosSync: 0,
    gymSessionSeconds: 0,
    gymCalories: 0,
    gymCurrentSet: 0,
    gymVoiceCoach: false,
    wakeLockSentinel: null,
    sleepTimerId: null,
    sleepEndTime: 0,
    activeLoadToken: 0,
    failoverAttempts: 0,
    loadWatchdogId: null,
    searchAbortCtrl: null,
    searchTimer: null,
    onlineSearchResults: [],
    gymTimer: {
      mode: 'rest',
      totalSeconds: 60,
      secondsLeft: 60,
      tabataWork: 45,
      tabataRest: 15,
      tabataRound: 1,
      totalRounds: 8,
      tabataState: 'work',
      isRunning: false,
      soundEnabled: true,
      id: null
    }
  };

  // Native Dual Audio Elements
  const audioA = document.getElementById('audio-engine-a');
  const audioB = document.getElementById('audio-engine-b');
  let primaryAudio = audioA;
  let preloadAudio = audioB;
  let hlsPrimary = null;
  let activeCandidateList = [];
  let activeCandidateIdx = 0;

  // Opt-in Web Audio Nodes (ONLY attached when EQ/8D/Reverb/Boost explicitly engaged)
  let audioCtx = null;
  let mediaSourceMap = new WeakMap();
  let biquadFilters = [];
  let gainNode = null;
  let analyserNode = null;
  let pannerNode = null;
  let convolverNode = null;
  let dryGain = null;
  let wetGain = null;
  let spatialTimerId = null;
  let spatialPhase = 0;
  let visualizerAnimFrame = null;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const els = {
    views: $$('.view'),
    sidebarItems: $$('.sidebar-nav-item'),
    navItems: $$('.nav-item'),
    netStatus: $('#net-status'),
    ambientGlow: $('#ambient-glow'),
    btnHeaderLang: $('#btn-header-lang'),
    btnHeaderShuffle: $('#btn-header-shuffle'),
    btnHeaderSleep: $('#btn-header-sleep'),
    btnHeaderEq: $('#btn-header-eq'),
    btnHeaderTheme: $('#btn-header-theme'),
    btnHeaderQuickSearch: $('#btn-header-quick-search'),
    sleepIndicator: $('#sleep-indicator'),
    sleepIndicatorText: $('#sleep-indicator-text'),
    sidebarBpmChip: $('#sidebar-bpm-chip'),
    sidebarExerciseName: $('#sidebar-exercise-name'),
    sidebarExerciseMeta: $('#sidebar-exercise-meta'),
    btnSidebarOpenGym: $('#btn-sidebar-open-gym'),

    heroPlayBtn: $('#btn-hero-play'),
    heroGymViewBtn: $('#btn-hero-gym-view'),
    tempoQuickItems: $$('.tempo-quick-item'),
    moodCards: $$('.mood-card'),
    filterChips: $$('#home-filters .filter-chip'),
    homeTrackList: $('#home-track-list'),
    homeTrackCount: $('#home-track-count'),
    btnSortToggle: $('#btn-sort-toggle'),
    sortToggleLabel: $('#sort-toggle-label'),

    searchInput: $('#search-input'),
    btnVoiceSearch: $('#btn-voice-search'),
    searchClearBtn: $('#search-clear-btn'),
    searchSpinner: $('#search-spinner'),
    searchResultsList: $('#search-results-list'),
    searchResultsHeader: $('#search-results-header'),
    searchResultsCount: $('#search-results-count'),
    searchSourceLabel: $('#search-source-label'),
    tagPills: $$('.tag-pill'),
    searchModeChips: $$('.search-mode-chip'),

    recentPlayedSection: $('#recent-played-section'),
    recentPlayedScroll: $('#recent-played-scroll'),
    recentPlayedCount: $('#recent-played-count'),
    smartCards: $$('.smart-card'),
    btnDownloadAllFavs: $('#btn-download-all-favs'),
    btnClearCache: $('#btn-clear-cache'),
    cacheStatsBadge: $('#cache-stats-badge'),
    customPlaylistsContainer: $('#custom-playlists-container'),
    btnCreatePlaylistModal: $('#btn-create-playlist-modal'),
    btnCreateGymPlaylist: $('#btn-create-gym-playlist'),
    btnUploadMusicModal: $('#btn-upload-music-modal'),
    btnExportPlaylists: $('#btn-export-playlists'),
    btnImportPlaylists: $('#btn-import-playlists'),
    fileImportPlaylists: $('#file-import-playlists'),
    countSmartGym: $('#count-smart-gym'),
    countSmartFavorites: $('#count-smart-favorites'),
    countSmartLocal: $('#count-smart-local'),
    countSmartDownloaded: $('#count-smart-downloaded'),

    gymTempoCards: $$('.gym-tempo-card'),
    gymCoverArt: $('#gym-cover-art'),
    gymTrackTitle: $('#gym-track-title'),
    gymTrackArtist: $('#gym-track-artist'),
    gymBpmBadge: $('#gym-bpm-badge'),
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
    gymWorkoutTrackList: $('#gym-workout-track-list'),
    gymActiveMixLabel: $('#gym-active-mix-label'),
    btnPlayActiveGymMix: $('#btn-play-active-gym-mix'),
    peName: $('#pe-name'),
    peMuscle: $('#pe-muscle'),
    peSetsProgress: $('#pe-sets-progress'),
    peRepsTarget: $('#pe-reps-target'),
    peRestTarget: $('#pe-rest-target'),
    peCue: $('#pe-cue'),
    btnChangeExercise: $('#btn-change-exercise'),
    btnCompletePairedSet: $('#btn-complete-paired-set'),

    gymTimerCircle: $('#gym-timer-circle'),
    gymTimerTime: $('#gym-timer-time'),
    gymTimerSub: $('#gym-timer-sub'),
    gymTimerModeLabel: $('#gym-timer-mode-label'),
    timerPills: $$('.timer-pill[data-seconds]'),
    btnTabataMode: $('#btn-tabata-mode'),
    btnTimerStart: $('#btn-timer-start'),
    timerStartLabel: $('#timer-start-label'),
    btnTimerReset: $('#btn-timer-reset'),
    btnTimerSoundToggle: $('#btn-timer-sound-toggle'),

    miniPlayer: $('#mini-player'),
    miniCover: $('#mini-cover'),
    miniTitle: $('#mini-title'),
    miniArtist: $('#mini-artist'),
    miniExerciseBadge: $('#mini-exercise-badge'),
    miniGaplessPill: $('#mini-gapless-pill'),
    miniSourcePillText: $('#mini-source-pill-text'),
    miniBtnLike: $('#mini-btn-like'),
    miniBtnPlay: $('#mini-btn-play'),
    miniPlayIcon: $('#mini-play-icon'),
    miniBtnPrev: $('#mini-btn-prev'),
    miniBtnNext: $('#mini-btn-next'),
    miniBtnQueue: $('#mini-btn-queue'),
    miniProgressFill: $('#mini-progress-fill'),
    miniBufferedFill: $('#mini-buffered-fill'),
    miniInfoTap: $('#mini-info-tap'),

    fullPlayerModal: $('#full-player-modal'),
    btnMinimizePlayer: $('#btn-minimize-player'),
    sheetHandle: $('#sheet-handle'),
    btnFullOptions: $('#btn-full-options'),
    fullArtWrapper: $('#full-art-wrapper'),
    heartPulseOverlay: $('#heart-pulse-overlay'),
    pill8dSpatial: $('#pill-8d-spatial'),
    fullCoverArt: $('#full-cover-art'),
    fullTrackCategory: $('#full-track-category'),
    fullTrackTitle: $('#full-track-title'),
    fullTrackArtist: $('#full-track-artist'),
    fullBtnSwitchSource: $('#full-btn-switch-source'),
    fullBtnLike: $('#full-btn-like'),
    btnFullOpenExercise: $('#btn-full-open-exercise'),
    fullExerciseName: $('#full-exercise-name'),
    fullExerciseSub: $('#full-exercise-sub'),
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
    fullRepeatIcon: $('#full-repeat-icon'),
    fullBtnDownload: $('#full-btn-download'),
    downloadIcon: $('#download-icon'),
    downloadLabel: $('#download-label'),
    fullBtnAddPlaylist: $('#full-btn-add-playlist'),
    fullBtnLyrics: $('#full-btn-lyrics'),
    fullBtnQueue: $('#full-btn-queue'),
    fullBtnEq: $('#full-btn-eq'),
    fullBtn8d: $('#full-btn-8d'),
    label8dBtn: $('#label-8d-btn'),
    fullBtnSpeed: $('#full-btn-speed'),
    fullSpeedLabel: $('#full-speed-label'),
    fullBtnShare: $('#full-btn-share'),
    btnMuteToggle: $('#btn-mute-toggle'),
    volMuteIcon: $('#vol-mute-icon'),
    volSlider: $('#vol-slider'),
    volFill: $('#vol-fill'),
    visualizerContainer: $('#visualizer-container'),
    visualizerBars: $$('.v-bar'),

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
    inputPlaylistTempo: $('#input-playlist-tempo'),
    iconOptions: $$('#playlist-icon-picker .icon-opt'),
    btnConfirmCreatePlaylist: $('#btn-confirm-create-playlist'),

    modalExercisePicker: $('#modal-exercise-picker'),
    exercisePickerTrackLabel: $('#exercise-picker-track-label'),
    exerciseZoneFilters: $$('#exercise-zone-filters .filter-chip'),
    exerciseCatalogList: $('#exercise-catalog-list'),
    inputCustomExName: $('#input-custom-ex-name'),
    inputCustomExSets: $('#input-custom-ex-sets'),
    inputCustomExReps: $('#input-custom-ex-reps'),
    inputCustomExRest: $('#input-custom-ex-rest'),
    btnSaveCustomExercise: $('#btn-save-custom-exercise'),

    modalAddToPlaylist: $('#modal-add-to-playlist'),
    targetTrackLabel: $('#target-track-label'),
    playlistsChecklist: $('#playlists-checklist'),

    modalSleepTimer: $('#modal-sleep-timer'),
    sleepStatusText: $('#sleep-status-text'),
    sleepOptionBtns: $$('.sleep-option-btn'),

    modalEqualizer: $('#modal-equalizer'),
    eqPresetChips: $$('.eq-preset-chip'),
    sliderVolBoost: $('#slider-vol-boost'),
    volBoostVal: $('#vol-boost-val'),
    crossfadeBtns: $$('.crossfade-btn'),
    crossfadeVal: $('#crossfade-val'),
    btnToggle8d: $('#btn-toggle-8d'),
    spatialSpeeds: $('#spatial-speeds'),
    spatialSpeedBtns: $$('.spatial-speed-btn'),
    reverbBtns: $$('.reverb-btn'),
    reverbVal: $('#reverb-val'),

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
    lyricsLoading: $('#lyrics-loading'),
    lyricsContainer: $('#lyrics-container'),
    lyricsText: $('#lyrics-text'),
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

    modalTrackOptions: $('#modal-track-options'),
    optionsTrackArt: $('#options-track-art'),
    optionsTrackTitle: $('#options-track-title'),
    optionsTrackArtist: $('#options-track-artist'),
    trackQrCanvas: $('#track-qr-canvas'),
    btnShareNative: $('#btn-share-native'),
    btnCopyTrackLink: $('#btn-copy-track-link'),
    optActionPairExercise: $('#opt-action-pair-exercise'),
    optActionSwitchSource: $('#opt-action-switch-source'),
    optAction8d: $('#opt-action-8d'),
    opt8dStatus: $('#opt-8d-status'),
    optActionQueue: $('#opt-action-queue'),
    optActionPlaylist: $('#opt-action-playlist'),
    optActionDownload: $('#opt-action-download'),
    optDownloadStatus: $('#opt-download-status')
  };

  // -------------------------------------------------------------------------
  // Utilities & Text Normalization (Unicode + Arabic)
  // -------------------------------------------------------------------------
  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function normalizeText(str) {
    if (!str) return '';
    return String(str)
      .toLowerCase()
      .replace(/[\u064B-\u065F\u0670]/g, '')
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/ؤ/g, 'و')
      .replace(/ئ/g, 'ي')
      .trim();
  }

  function dedupeKey(title, artist) {
    const cleanT = normalizeText(title).replace(/[\(\[\{].*?[\)\]\}]/g, '').replace(/[^\p{L}\p{N}]/gu, '');
    const cleanA = normalizeText(artist).replace(/[\(\[\{].*?[\)\]\}]/g, '').replace(/[^\p{L}\p{N}]/gu, '');
    return `${cleanT.slice(0, 28)}|${cleanA.slice(0, 16)}`;
  }

  function svgIcon(id, cls = '') {
    return `<svg class="v-icon ${cls}" aria-hidden="true"><use href="#${id}"></use></svg>`;
  }

  function setSvgUse(el, symbolId) {
    if (!el) return;
    const use = el.tagName.toLowerCase() === 'use' ? el : el.querySelector('use');
    if (use) use.setAttribute('href', `#${symbolId}`);
  }

  function formatTime(sec) {
    if (!Number.isFinite(sec) || sec < 0) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  let toastTimer = null;
  function showToast(msg) {
    const container = $('#toast-container');
    if (!container) return;
    container.innerHTML = '';
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    container.appendChild(el);
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      if (el.parentNode) el.remove();
    }, 3000);
  }

  function applyTranslations() {
    const dict = TRANSLATIONS[state.lang] || TRANSLATIONS.en;
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    $$('[data-i18n]').forEach((node) => {
      const key = node.dataset.i18n;
      if (dict[key]) node.textContent = dict[key];
    });
    if (els.searchInput) els.searchInput.placeholder = dict.searchPlaceholder;
    if (els.sortToggleLabel) {
      els.sortToggleLabel.textContent =
        state.sortMode === 'bpm' ? dict.sortBpm : state.sortMode === 'title' ? dict.sortTitle : dict.sortDefault;
    }
    updatePairedExerciseUI();
    updateGymTimerUI();
    updateCacheStatsUI();
    updateSmartCardCounts();
    renderTempoPlaylistCounts();
  }

  // -------------------------------------------------------------------------
  // Exercise Pairing & Gym Tempo Intelligence
  // -------------------------------------------------------------------------
  function estimateBpm(track) {
    if (track && Number(track.bpm) > 0) return Number(track.bpm);
    const hay = `${track?.title || ''} ${track?.tag || ''} ${track?.category || ''}`.toLowerCase();
    if (hay.includes('phonk') || hay.includes('gym') || hay.includes('hard')) return 146;
    if (hay.includes('sprint') || hay.includes('hiit') || hay.includes('cardio')) return 154;
    if (hay.includes('electronic') || hay.includes('edm') || hay.includes('energy')) return 132;
    if (hay.includes('chill') || hay.includes('lofi') || hay.includes('slow')) return 94;
    return 126;
  }

  function getIntensityForTrack(track) {
    if (track?.intensity) return track.intensity;
    const bpm = estimateBpm(track);
    if (bpm >= 150) return 'cardio';
    if (bpm >= 139) return 'peak';
    if (bpm >= 123) return 'strength';
    if (bpm >= 108) return 'warmup';
    return 'cooldown';
  }

  function getExerciseForTrack(track) {
    if (!track) return EXERCISE_CATALOG[0];
    if (state.customTrackExercises[track.id]) {
      return state.customTrackExercises[track.id];
    }
    if (track.exercise && (track.exercise.nameAr || track.exercise.nameEn)) {
      return track.exercise;
    }
    const bpm = estimateBpm(track);
    if (bpm >= 150) return EXERCISE_CATALOG.find(e => e.id === 'hiit_sprint');
    if (bpm >= 140) return EXERCISE_CATALOG.find(e => e.id === 'deadlift_pr');
    if (bpm >= 130) return EXERCISE_CATALOG.find(e => e.id === 'flat_bench');
    if (bpm >= 115) return EXERCISE_CATALOG.find(e => e.id === 'lat_pulldown');
    return EXERCISE_CATALOG.find(e => e.id === 'mobility_stretch');
  }

  function getExerciseDisplayName(ex) {
    if (!ex) return 'Bench Press';
    return state.lang === 'ar' ? (ex.nameAr || ex.nameEn) : (ex.nameEn || ex.nameAr);
  }

  function getExerciseMuscle(ex) {
    if (!ex) return '';
    return state.lang === 'ar' ? (ex.muscleAr || ex.muscleEn || '') : (ex.muscleEn || ex.muscleAr || '');
  }

  function getExerciseCue(ex) {
    if (!ex) return '';
    return state.lang === 'ar'
      ? (ex.tempoNoteAr || ex.tempoNoteEn || '')
      : (ex.tempoNoteEn || ex.tempoNoteAr || '');
  }

  function updatePairedExerciseUI() {
    const track = state.currentTrack || state.allTracks[0];
    if (!track) return;
    const ex = getExerciseForTrack(track);
    const bpm = estimateBpm(track);
    const done = state.exerciseSetsDone[track.id] || 0;
    const exName = getExerciseDisplayName(ex);
    const exMuscle = getExerciseMuscle(ex);

    if (els.gymBpmBadge) els.gymBpmBadge.textContent = `${bpm} BPM`;
    if (els.sidebarBpmChip) els.sidebarBpmChip.textContent = `${bpm} BPM`;
    if (els.sidebarExerciseName) els.sidebarExerciseName.textContent = exName;
    if (els.sidebarExerciseMeta) els.sidebarExerciseMeta.textContent = `${ex.sets} x ${ex.reps}${exMuscle ? ' · ' + exMuscle : ''}`;

    if (els.peName) els.peName.textContent = exName;
    if (els.peMuscle) els.peMuscle.textContent = exMuscle || ex.zone || 'Training';
    if (els.peSetsProgress) els.peSetsProgress.textContent = `${done} / ${ex.sets}`;
    if (els.peRepsTarget) els.peRepsTarget.textContent = ex.reps;
    if (els.peRestTarget) els.peRestTarget.textContent = `${ex.restSec || 60}s`;
    if (els.peCue) els.peCue.textContent = getExerciseCue(ex);

    if (els.fullExerciseName) els.fullExerciseName.textContent = exName;
    if (els.fullExerciseSub) els.fullExerciseSub.textContent = `${ex.sets} x ${ex.reps} · ${bpm} BPM`;

    if (els.miniExerciseBadge) {
      els.miniExerciseBadge.textContent = `${exName} (${bpm} BPM)`;
      els.miniExerciseBadge.classList.remove('hidden');
    }
  }

  function completeCurrentPairedSet() {
    const track = state.currentTrack || state.allTracks[0];
    if (!track) return;
    const ex = getExerciseForTrack(track);
    state.exerciseSetsDone[track.id] = (state.exerciseSetsDone[track.id] || 0) + 1;
    state.gymCurrentSet++;
    updateGymSessionDashboard();
    updatePairedExerciseUI();

    const restSec = Number(ex.restSec) || 60;
    setGymTimerPreset(restSec);
    if (!state.gymTimer.isRunning) startGymTimer();
    showToast(
      state.lang === 'ar'
        ? `تم تسجيل مجموعة ${getExerciseDisplayName(ex)} — مؤقت الراحة ${restSec} ثانية`
        : `Logged set for ${getExerciseDisplayName(ex)} — ${restSec}s rest timer started`
    );
  }

  function openExercisePickerModal(track) {
    const target = track || state.currentTrack || state.allTracks[0];
    if (!target) return;
    state.targetTrackForExercise = target;
    if (els.exercisePickerTrackLabel) {
      els.exercisePickerTrackLabel.textContent = `${target.title} — ${target.artist}`;
    }
    renderExerciseCatalog('all');
    openModal(els.modalExercisePicker);
  }

  function renderExerciseCatalog(zone) {
    if (!els.exerciseCatalogList) return;
    els.exerciseZoneFilters.forEach(c => c.classList.toggle('active', c.dataset.zone === zone));
    const list = zone === 'all' ? EXERCISE_CATALOG : EXERCISE_CATALOG.filter(e => e.zone === zone);
    els.exerciseCatalogList.innerHTML = '';
    list.forEach(ex => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'exercise-pick-row';
      btn.innerHTML = `
        <div>
          <div style="font-weight:700;" dir="auto">${escapeHtml(getExerciseDisplayName(ex))}</div>
          <div style="font-size:0.76rem;color:var(--text-muted);" dir="auto">${escapeHtml(getExerciseMuscle(ex))} · ${ex.sets} x ${ex.reps} · ${ex.restSec}s</div>
        </div>
        <span class="status-tag">${ex.zone.toUpperCase()}</span>
      `;
      btn.addEventListener('click', () => {
        if (!state.targetTrackForExercise) return;
        state.customTrackExercises[state.targetTrackForExercise.id] = ex;
        localStorage.setItem('vibe_track_exercises', JSON.stringify(state.customTrackExercises));
        updatePairedExerciseUI();
        renderHomeTrackList(state.filteredTracks);
        renderGymTempoMix(state.activeTempoZone, false);
        closeModal(els.modalExercisePicker);
        showToast(
          state.lang === 'ar'
            ? `تم ربط "${getExerciseDisplayName(ex)}" بالأغنية`
            : `Paired "${getExerciseDisplayName(ex)}" to track`
        );
      });
      els.exerciseCatalogList.appendChild(btn);
    });
  }

  function getTempoMixTracks(zone) {
    const all = state.allTracks;
    if (!all.length) return [];
    const matched = all.filter(t => getIntensityForTrack(t) === zone);
    if (matched.length >= 3) return matched;
    if (zone === 'peak') return all.filter(t => estimateBpm(t) >= 136);
    if (zone === 'cardio') return all.filter(t => estimateBpm(t) >= 132);
    if (zone === 'strength') return all.filter(t => estimateBpm(t) >= 120 && estimateBpm(t) <= 142);
    if (zone === 'warmup') return all.filter(t => estimateBpm(t) >= 105 && estimateBpm(t) <= 128);
    return all.filter(t => estimateBpm(t) < 112);
  }

  function renderTempoPlaylistCounts() {
    ['warmup', 'strength', 'peak', 'cardio', 'cooldown'].forEach(z => {
      const el = $(`#count-tempo-${z}`);
      if (el) {
        const cnt = getTempoMixTracks(z).length;
        el.textContent = state.lang === 'ar' ? `${cnt} أغنية` : `${cnt} tracks`;
      }
    });
  }

  function renderGymTempoMix(zone, autoplay = false) {
    state.activeTempoZone = zone || 'peak';
    els.gymTempoCards.forEach(c => c.classList.toggle('active', c.dataset.tempo === state.activeTempoZone));
    const tracks = getTempoMixTracks(state.activeTempoZone);
    if (els.gymWorkoutTrackList) {
      els.gymWorkoutTrackList.innerHTML = '';
      tracks.forEach((tr, idx) => {
        const ex = getExerciseForTrack(tr);
        const bpm = estimateBpm(tr);
        const row = document.createElement('div');
        row.className = 'track-item';
        if (state.currentTrack && state.currentTrack.id === tr.id) row.classList.add('playing');
        row.innerHTML = `
          <div class="track-art-wrap"><img class="track-item-art" src="${escapeHtml(tr.cover || DEFAULT_COVER)}" alt="" loading="lazy"></div>
          <div class="track-item-info">
            <div class="track-item-title" dir="auto">${escapeHtml(tr.title)}</div>
            <div class="track-item-meta">
              <span class="track-pill bpm">${bpm} BPM</span>
              <span class="track-pill exercise" dir="auto">${escapeHtml(getExerciseDisplayName(ex))} (${ex.sets}x${ex.reps})</span>
            </div>
          </div>
          <button class="track-action-btn" data-action="edit-ex" title="Change Exercise">${svgIcon('icon-edit', 'v-icon-xs')}</button>
        `;
        row.addEventListener('click', (e) => {
          if (e.target.closest('[data-action="edit-ex"]')) {
            e.stopPropagation();
            openExercisePickerModal(tr);
            return;
          }
          playTrack(tr, tracks, idx);
        });
        els.gymWorkoutTrackList.appendChild(row);
      });
    }
    if (autoplay && tracks.length > 0) {
      playTrack(tracks[0], tracks, 0);
      switchTab('gym');
    }
  }

  // -------------------------------------------------------------------------
  // Native Safe Audio Pipeline & Automatic Multi-Source Failover
  // -------------------------------------------------------------------------
  function getTrackPrimaryUrl(track) {
    if (!track) return '';
    if (track.isLocal && track.file) return MUSIC_DIR + encodeURIComponent(track.file);
    return track.streamUrl || '';
  }

  function destroyHls() {
    if (hlsPrimary) {
      try { hlsPrimary.destroy(); } catch {}
      hlsPrimary = null;
    }
  }

  function clearWatchdog() {
    if (state.loadWatchdogId) {
      clearTimeout(state.loadWatchdogId);
      state.loadWatchdogId = null;
    }
  }

  function attachAudioListenersOnce(audioEl) {
    if (audioEl.dataset.vibeBound === '1') return;
    audioEl.dataset.vibeBound = '1';

    audioEl.addEventListener('timeupdate', () => {
      if (audioEl !== primaryAudio) return;
      onTimeUpdate();
    });

    audioEl.addEventListener('progress', () => {
      if (audioEl !== primaryAudio) return;
      onBufferProgress();
    });

    audioEl.addEventListener('loadedmetadata', () => {
      if (audioEl !== primaryAudio) return;
      clearWatchdog();
      if (els.fullTimeDuration && Number.isFinite(audioEl.duration)) {
        els.fullTimeDuration.textContent = formatTime(audioEl.duration);
      }
      syncMediaSessionPosition();
    });

    audioEl.addEventListener('canplay', () => {
      if (audioEl !== primaryAudio) return;
      clearWatchdog();
      setBufferBadge(state.currentTrack?.sourceLabel || (state.lang === 'ar' ? 'جاهز' : 'Ready'));
    });

    audioEl.addEventListener('play', () => {
      if (audioEl !== primaryAudio) return;
      state.isPlaying = true;
      state.userPaused = false;
      updatePlayButtons();
      syncMediaSessionPlayback();
    });

    audioEl.addEventListener('playing', () => {
      if (audioEl !== primaryAudio) return;
      clearWatchdog();
      state.isPlaying = true;
      updatePlayButtons();
      syncMediaSessionPlayback();
      scheduleBackgroundAutoCache(state.currentTrack);
    });

    audioEl.addEventListener('pause', () => {
      if (audioEl !== primaryAudio) return;
      state.isPlaying = false;
      updatePlayButtons();
      syncMediaSessionPlayback();
    });

    audioEl.addEventListener('ended', () => {
      if (audioEl !== primaryAudio) return;
      onTrackEnded();
    });

    audioEl.addEventListener('error', () => {
      if (audioEl !== primaryAudio || audioEl._intentionalClear) return;
      if (!audioEl.getAttribute('src')) return;
      handleAudioFailure('Audio element decode/network error');
    });
  }

  function setBufferBadge(text) {
    if (els.fullGaplessChip) els.fullGaplessChip.textContent = text;
    if (els.gymGaplessStatus) els.gymGaplessStatus.textContent = text;
    if (els.miniSourcePillText) els.miniSourcePillText.textContent = text;
  }

  function safelyUnloadElement(audioEl) {
    if (!audioEl) return;
    audioEl._intentionalClear = true;
    try { audioEl.pause(); } catch {}
    audioEl.removeAttribute('src');
    try { audioEl.load(); } catch {}
    setTimeout(() => { audioEl._intentionalClear = false; }, 60);
  }

  function startAudioCandidate(track, streamUrl, token, resumeAt = 0) {
    if (token !== state.activeLoadToken) return;
    clearWatchdog();
    destroyHls();

    primaryAudio._intentionalClear = false;
    primaryAudio.volume = state.muted ? 0 : state.volume;
    primaryAudio.playbackRate = state.playbackRate;

    const isHls = streamUrl.includes('.m3u8') || streamUrl.includes('/api/stream?id=');
    const canNativeHls = Boolean(primaryAudio.canPlayType('application/vnd.apple.mpegurl'));

    setBufferBadge(state.lang === 'ar' ? 'جاري التحميل...' : 'Buffering...');

    // Watchdog: if remote stream stalls silently > 9.5s without playing, trigger failover!
    if (!streamUrl.startsWith('blob:')) {
      state.loadWatchdogId = setTimeout(() => {
        if (token === state.activeLoadToken && primaryAudio.readyState < 2 && !primaryAudio.paused) {
          handleAudioFailure('Stream timeout (>9.5s)');
        }
      }, 9500);
    }

    if (isHls && !canNativeHls && typeof window.Hls !== 'undefined' && window.Hls.isSupported()) {
      hlsPrimary = new window.Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 45,
        maxMaxBufferLength: 90,
        startPosition: resumeAt > 0 ? resumeAt : -1
      });
      hlsPrimary.loadSource(streamUrl);
      hlsPrimary.attachMedia(primaryAudio);
      hlsPrimary.on(window.Hls.Events.MANIFEST_PARSED, () => {
        if (token !== state.activeLoadToken) return;
        primaryAudio.playbackRate = state.playbackRate;
        primaryAudio.play().catch(err => {
          if (err && err.name !== 'AbortError') console.warn('HLS play notice:', err);
        });
      });
      hlsPrimary.on(window.Hls.Events.ERROR, (_evt, data) => {
        if (token !== state.activeLoadToken) return;
        if (data && data.fatal) {
          handleAudioFailure(`HLS fatal: ${data.details || data.type}`);
        }
      });
    } else {
      primaryAudio.src = streamUrl;
      if (resumeAt > 0) {
        const onMeta = () => {
          primaryAudio.removeEventListener('loadedmetadata', onMeta);
          try {
            if (Number.isFinite(primaryAudio.duration) && resumeAt < primaryAudio.duration - 1) {
              primaryAudio.currentTime = resumeAt;
            }
          } catch {}
        };
        primaryAudio.addEventListener('loadedmetadata', onMeta);
      }
      primaryAudio.play().catch(err => {
        if (err && err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
          console.warn('Native play warning:', err);
        }
      });
    }
  }

  async function handleAudioFailure(reason) {
    const track = state.currentTrack;
    if (!track) return;
    const token = state.activeLoadToken;
    const resumeTime = Number.isFinite(primaryAudio.currentTime) ? primaryAudio.currentTime : 0;
    console.warn(`[AudioFailover] ${track.title}: ${reason}`);

    // Step 1: Try remaining pre-bundled fallback candidates on track
    activeCandidateIdx++;
    if (activeCandidateIdx < activeCandidateList.length) {
      const nextUrl = activeCandidateList[activeCandidateIdx];
      showToast(state.lang === 'ar' ? 'جاري التبديل تلقائياً لمصدر بديل...' : 'Switching automatically to backup stream...');
      startAudioCandidate(track, nextUrl, token, resumeTime);
      return;
    }

    // Step 2: Query backend /api/resolve_fallback (or direct static cloud resolver on GitHub Pages)
    if (state.failoverAttempts < 2 && navigator.onLine) {
      state.failoverAttempts++;
      setBufferBadge(state.lang === 'ar' ? 'بحث عن مصدر بديل...' : 'Resolving source...');
      try {
        let newUrls = [];
        const excludeUrl = getTrackPrimaryUrl(track) || '';
        if (!IS_STATIC_HOST) {
          const exclude = encodeURIComponent(excludeUrl);
          const res = await fetch(
            `/api/resolve_fallback?title=${encodeURIComponent(track.title)}&artist=${encodeURIComponent(track.artist)}&exclude=${exclude}`
          );
          if (token !== state.activeLoadToken) return;
          if (res.ok) {
            const data = await res.json();
            newUrls = (data.candidates || [])
              .map(c => c.streamUrl)
              .filter(u => u && !activeCandidateList.includes(u));
          }
        }
        if (newUrls.length === 0) {
          const staticRes = await searchStaticCloud(`${track.title} ${track.artist}`, 'original');
          if (token !== state.activeLoadToken) return;
          const pool = [];
          (staticRes.results || []).forEach(c => {
            if (c.streamUrl) pool.push(c.streamUrl);
            if (Array.isArray(c.fallbackStreams)) pool.push(...c.fallbackStreams);
          });
          newUrls = pool.filter(u => u && u !== excludeUrl && !activeCandidateList.includes(u));
        }
        if (newUrls.length > 0) {
          activeCandidateList.push(...newUrls);
          track.streamUrl = newUrls[0];
          track.fallbackStreams = newUrls.slice(1);
          activeCandidateIdx = activeCandidateList.length - newUrls.length;
          showToast(state.lang === 'ar' ? 'تم العثور على مصدر بث سريع بديل' : 'Switched to healthy backup stream');
          startAudioCandidate(track, newUrls[0], token, resumeTime);
          return;
        }
      } catch (e) {
        console.warn('Resolve fallback fetch error:', e);
      }
    }

    // Step 3: Local file fallback unencoded retry if needed
    if (track.isLocal && track.file && state.failoverAttempts < 2) {
      state.failoverAttempts++;
      const altLocal = MUSIC_DIR + track.file;
      if (!activeCandidateList.includes(altLocal)) {
        activeCandidateList.push(altLocal);
        startAudioCandidate(track, altLocal, token, resumeTime);
        return;
      }
    }

    setBufferBadge(state.lang === 'ar' ? 'تعذر التشغيل' : 'Unavailable');
    showToast(state.lang === 'ar' ? 'تعذر تشغيل هذا المسار، تم الانتقال للتالي' : 'Track unavailable, skipping to next');
    if (state.activeQueue.length > 1) {
      setTimeout(() => {
        if (token === state.activeLoadToken) playNextTrack(true);
      }, 650);
    }
  }

  async function manualSwitchTrackSource() {
    const track = state.currentTrack;
    if (!track) return;
    if (activeCandidateList.length > 1) {
      activeCandidateIdx = (activeCandidateIdx + 1) % activeCandidateList.length;
      const resumeAt = primaryAudio.currentTime || 0;
      startAudioCandidate(track, activeCandidateList[activeCandidateIdx], ++state.activeLoadToken, resumeAt);
      showToast(state.lang === 'ar' ? 'تم تبديل مصدر البث' : 'Switched stream source');
      return;
    }
    state.failoverAttempts = 0;
    activeCandidateIdx = activeCandidateList.length;
    await handleAudioFailure('Manual source switch');
  }

  async function playTrack(track, queue = null, index = -1) {
    if (!track) return;
    const token = ++state.activeLoadToken;
    clearWatchdog();

    if (Array.isArray(queue) && queue.length > 0) {
      state.activeQueue = [...queue];
      state.queueIndex = index >= 0 ? index : state.activeQueue.findIndex(t => t.id === track.id);
    } else if (!state.activeQueue.some(t => t.id === track.id)) {
      state.activeQueue = state.filteredTracks.length ? [...state.filteredTracks] : [track];
      state.queueIndex = state.activeQueue.findIndex(t => t.id === track.id);
    } else if (index >= 0) {
      state.queueIndex = index;
    } else {
      state.queueIndex = state.activeQueue.findIndex(t => t.id === track.id);
    }

    state.currentTrack = track;
    state.failoverAttempts = 0;
    updateTrackUI(track);
    recordRecentTrack(track);
    updatePairedExerciseUI();
    highlightPlayingTrackInLists();
    updateMediaSessionMetadata(track);

    // Build ordered failover list
    const candidates = [];
    const offlineBlob = await getOfflineAudioBlob(track.id);
    if (token !== state.activeLoadToken) return;
    if (offlineBlob) {
      candidates.push(URL.createObjectURL(offlineBlob));
    }
    const primaryUrl = getTrackPrimaryUrl(track);
    if (primaryUrl) candidates.push(primaryUrl);
    if (Array.isArray(track.fallbackStreams)) {
      track.fallbackStreams.forEach(u => {
        if (u && !candidates.includes(u)) candidates.push(u);
      });
    }

    activeCandidateList = candidates;
    activeCandidateIdx = 0;

    if (candidates.length === 0) {
      handleAudioFailure('No initial URL');
      return;
    }

    if (els.miniPlayer) els.miniPlayer.classList.remove('hidden');
    startAudioCandidate(track, candidates[0], token, 0);
  }

  function togglePlayPause() {
    if (!state.currentTrack) {
      const list = state.filteredTracks.length ? state.filteredTracks : state.allTracks;
      if (list.length > 0) playTrack(list[0], list, 0);
      return;
    }
    if (primaryAudio.paused) {
      state.userPaused = false;
      primaryAudio.play().catch(err => console.warn('Resume warning:', err));
    } else {
      state.userPaused = true;
      primaryAudio.pause();
    }
  }

  function playNextTrack(autoAdvance = false) {
    if (!state.activeQueue.length) return;
    if (state.repeatMode === 'one' && autoAdvance && state.currentTrack) {
      primaryAudio.currentTime = 0;
      primaryAudio.play().catch(() => {});
      return;
    }
    let nextIdx = state.queueIndex + 1;
    if (state.isShuffle && state.activeQueue.length > 1) {
      do {
        nextIdx = Math.floor(Math.random() * state.activeQueue.length);
      } while (nextIdx === state.queueIndex);
    } else if (nextIdx >= state.activeQueue.length) {
      if (state.repeatMode === 'all' || state.infiniteRadio) {
        nextIdx = 0;
      } else {
        state.isPlaying = false;
        updatePlayButtons();
        return;
      }
    }
    playTrack(state.activeQueue[nextIdx], state.activeQueue, nextIdx);
  }

  function playPrevTrack() {
    if (primaryAudio.currentTime > 4) {
      primaryAudio.currentTime = 0;
      return;
    }
    if (!state.activeQueue.length) return;
    let prevIdx = state.queueIndex - 1;
    if (prevIdx < 0) prevIdx = state.activeQueue.length - 1;
    playTrack(state.activeQueue[prevIdx], state.activeQueue, prevIdx);
  }

  function onTrackEnded() {
    playNextTrack(true);
  }

  // -------------------------------------------------------------------------
  // Mobile Screen-Lock & Background Survival (MediaSession API + Visibility)
  // -------------------------------------------------------------------------
  function updateMediaSessionMetadata(track) {
    if (!('mediaSession' in navigator) || !track) return;
    let absCover = DEFAULT_COVER;
    try {
      absCover = new URL(track.cover || DEFAULT_COVER, window.location.href).href;
    } catch {}
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title || 'VIBE Track',
        artist: track.artist || 'VIBE Studio',
        album: track.category || 'VIBE Studio',
        artwork: [
          { src: absCover, sizes: '256x256', type: 'image/jpeg' },
          { src: absCover, sizes: '512x512', type: 'image/jpeg' }
        ]
      });
    } catch (e) {
      console.warn('MediaMetadata notice:', e);
    }
  }

  function syncMediaSessionPlayback() {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = state.isPlaying ? 'playing' : 'paused';
      syncMediaSessionPosition();
    } catch {}
  }

  function syncMediaSessionPosition() {
    if (!('mediaSession' in navigator) || typeof navigator.mediaSession.setPositionState !== 'function') return;
    const dur = primaryAudio.duration;
    const pos = primaryAudio.currentTime;
    if (Number.isFinite(dur) && dur > 0 && Number.isFinite(pos) && pos >= 0 && pos <= dur) {
      try {
        navigator.mediaSession.setPositionState({
          duration: dur,
          playbackRate: primaryAudio.playbackRate || 1,
          position: pos
        });
      } catch {}
    }
  }

  function setupMediaSessionHandlers() {
    if (!('mediaSession' in navigator)) return;
    const safeBind = (action, fn) => {
      try { navigator.mediaSession.setActionHandler(action, fn); } catch {}
    };
    safeBind('play', () => {
      state.userPaused = false;
      primaryAudio.play().catch(() => {});
    });
    safeBind('pause', () => {
      state.userPaused = true;
      primaryAudio.pause();
    });
    safeBind('previoustrack', () => playPrevTrack());
    safeBind('nexttrack', () => playNextTrack(false));
    safeBind('seekbackward', (details) => {
      const skip = (details && details.seekOffset) || 15;
      primaryAudio.currentTime = Math.max(0, primaryAudio.currentTime - skip);
      syncMediaSessionPosition();
    });
    safeBind('seekforward', (details) => {
      const skip = (details && details.seekOffset) || 15;
      if (Number.isFinite(primaryAudio.duration)) {
        primaryAudio.currentTime = Math.min(primaryAudio.duration, primaryAudio.currentTime + skip);
        syncMediaSessionPosition();
      }
    });
    safeBind('seekto', (details) => {
      if (details && Number.isFinite(details.seekTime)) {
        primaryAudio.currentTime = details.seekTime;
        syncMediaSessionPosition();
      }
    });
    safeBind('stop', () => {
      state.userPaused = true;
      primaryAudio.pause();
      primaryAudio.currentTime = 0;
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      state.isPlaying = !primaryAudio.paused;
      updatePlayButtons();
      syncMediaSessionPlayback();
      if (audioCtx && state.webAudioActivated && audioCtx.state === 'suspended' && !state.userPaused) {
        audioCtx.resume().catch(() => {});
      }
    }
  });

  // -------------------------------------------------------------------------
  // Opt-in Web Audio Engine (EQ, Boost, 8D, Reverb — Never Touches Default Native Playback!)
  // -------------------------------------------------------------------------
  function ensureWebAudioPipeline() {
    if (state.webAudioActivated && audioCtx) {
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

      const connectEl = (el) => {
        if (mediaSourceMap.has(el)) return mediaSourceMap.get(el);
        const src = audioCtx.createMediaElementSource(el);
        mediaSourceMap.set(el, src);
        return src;
      };

      const freqs = [60, 230, 910, 3600, 14000];
      biquadFilters = freqs.map((f, i) => {
        const flt = audioCtx.createBiquadFilter();
        flt.type = i === 0 ? 'lowshelf' : i === 4 ? 'highshelf' : 'peaking';
        flt.frequency.value = f;
        flt.Q.value = 1.0;
        flt.gain.value = state.eqGains[i] || 0;
        return flt;
      });

      gainNode = audioCtx.createGain();
      gainNode.gain.value = state.gainBoost || 1;
      analyserNode = audioCtx.createAnalyser();
      analyserNode.fftSize = 64;
      pannerNode = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;

      dryGain = audioCtx.createGain();
      wetGain = audioCtx.createGain();
      convolverNode = audioCtx.createConvolver();
      convolverNode.buffer = buildImpulseResponse(audioCtx, 1.4, 2.2);
      setReverbWetDry(state.reverbType);

      const srcA = connectEl(audioA);
      const srcB = connectEl(audioB);

      const head = biquadFilters[0];
      srcA.connect(head);
      srcB.connect(head);
      for (let i = 0; i < biquadFilters.length - 1; i++) {
        biquadFilters[i].connect(biquadFilters[i + 1]);
      }

      let tail = biquadFilters[biquadFilters.length - 1];
      if (pannerNode) {
        tail.connect(pannerNode);
        tail = pannerNode;
      }
      tail.connect(gainNode);
      gainNode.connect(dryGain);
      gainNode.connect(convolverNode);
      convolverNode.connect(wetGain);
      dryGain.connect(analyserNode);
      wetGain.connect(analyserNode);
      analyserNode.connect(audioCtx.destination);

      state.webAudioActivated = true;
      startVisualizerLoop();
    } catch (e) {
      console.warn('Web Audio opt-in notice:', e);
    }
  }

  function buildImpulseResponse(ctx, dur, decay) {
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  function setReverbWetDry(mode) {
    state.reverbType = mode;
    localStorage.setItem('vibe_reverb', mode);
    if (dryGain && wetGain && audioCtx) {
      const wet = mode === 'dry' ? 0 : mode === 'gym' ? 0.28 : 0.48;
      wetGain.gain.setValueAtTime(wet, audioCtx.currentTime);
      dryGain.gain.setValueAtTime(1 - wet * 0.25, audioCtx.currentTime);
    }
    const lbl = mode === 'dry' ? 'Studio Dry' : mode === 'gym' ? 'Arena' : 'Concert';
    if (els.reverbVal) els.reverbVal.textContent = lbl;
    els.reverbBtns.forEach(b => b.classList.toggle('active', b.dataset.reverb === mode));
  }

  function setEqBandGain(index, gainDb) {
    ensureWebAudioPipeline();
    state.eqGains[index] = gainDb;
    localStorage.setItem('vibe_eq_gains', JSON.stringify(state.eqGains));
    if (biquadFilters[index]) biquadFilters[index].gain.value = gainDb;
    const valEl = $(`#eq-val-${index}`);
    if (valEl) valEl.textContent = `${gainDb > 0 ? '+' : ''}${gainDb}dB`;
  }

  function applyEqPreset(presetName) {
    const map = {
      flat: [0, 0, 0, 0, 0],
      bass: [8, 5, 0, 2, 4],
      vocal: [-2, 1, 5, 3, 1],
      electronic: [6, 3, -1, 4, 5]
    };
    const gains = map[presetName] || map.flat;
    gains.forEach((g, i) => {
      setEqBandGain(i, g);
      const sl = $(`#eq-band-${i}`);
      if (sl) sl.value = g;
    });
    els.eqPresetChips.forEach(c => c.classList.toggle('active', c.dataset.preset === presetName));
    showToast(state.lang === 'ar' ? `تم تطبيق وضع ${presetName}` : `Equalizer: ${presetName}`);
  }

  function toggle8dAudio(forceState = null) {
    const target = forceState === null ? !state.is8dActive : forceState;
    if (target) ensureWebAudioPipeline();
    state.is8dActive = target;
    if (spatialTimerId) {
      clearInterval(spatialTimerId);
      spatialTimerId = null;
    }
    if (state.is8dActive && pannerNode && audioCtx) {
      spatialTimerId = setInterval(() => {
        if (!state.isPlaying) return;
        spatialPhase += state.spatialRate;
        pannerNode.pan.setValueAtTime(Math.sin(spatialPhase) * 0.85, audioCtx.currentTime);
      }, 65);
    } else if (pannerNode && audioCtx) {
      pannerNode.pan.setValueAtTime(0, audioCtx.currentTime);
    }
    if (els.pill8dSpatial) els.pill8dSpatial.classList.toggle('hidden', !state.is8dActive);
    if (els.spatialSpeeds) els.spatialSpeeds.classList.toggle('hidden', !state.is8dActive);
    if (els.fullBtn8d) els.fullBtn8d.classList.toggle('active', state.is8dActive);
    if (els.btnToggle8d) els.btnToggle8d.textContent = state.is8dActive ? 'Turn Off' : 'Turn On';
    if (els.opt8dStatus) els.opt8dStatus.textContent = state.is8dActive ? 'ON' : 'OFF';
    showToast(state.is8dActive ? '8D Spatial Orbit ON' : '8D Spatial Orbit OFF');
  }

  function startVisualizerLoop() {
    if (!analyserNode || !els.visualizerBars.length) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const data = new Uint8Array(analyserNode.frequencyBinCount);
    const draw = () => {
      visualizerAnimFrame = requestAnimationFrame(draw);
      if (!state.isPlaying || document.hidden || els.fullPlayerModal.classList.contains('hidden')) return;
      analyserNode.getByteFrequencyData(data);
      const n = els.visualizerBars.length;
      for (let i = 0; i < n; i++) {
        const val = data[i % data.length] || 0;
        const h = Math.max(4, Math.floor((val / 255) * 24));
        els.visualizerBars[i].style.height = `${h}px`;
      }
    };
    if (!visualizerAnimFrame) draw();
  }

  // -------------------------------------------------------------------------
  // UI Rendering, Track Updates, Progress Scrubbing
  // -------------------------------------------------------------------------
  function updateTrackUI(track) {
    const cover = track.cover || DEFAULT_COVER;
    if (els.miniCover) els.miniCover.src = cover;
    if (els.fullCoverArt) els.fullCoverArt.src = cover;
    if (els.gymCoverArt) els.gymCoverArt.src = cover;
    if (els.miniTitle) els.miniTitle.textContent = track.title;
    if (els.miniArtist) els.miniArtist.textContent = track.artist;
    if (els.fullTrackTitle) els.fullTrackTitle.textContent = track.title;
    if (els.fullTrackArtist) els.fullTrackArtist.textContent = track.artist;
    if (els.fullTrackCategory) els.fullTrackCategory.textContent = track.sourceLabel || track.category || 'Audio';
    if (els.gymTrackTitle) els.gymTrackTitle.textContent = track.title;
    if (els.gymTrackArtist) els.gymTrackArtist.textContent = track.artist;

    const liked = state.likedTrackIds.has(track.id);
    if (els.miniBtnLike) {
      els.miniBtnLike.classList.toggle('liked', liked);
      setSvgUse(els.miniBtnLike, liked ? 'icon-heart-filled' : 'icon-heart');
    }
    if (els.fullBtnLike) {
      els.fullBtnLike.classList.toggle('liked', liked);
      setSvgUse(els.fullBtnLike, liked ? 'icon-heart-filled' : 'icon-heart');
    }
    if (els.fullBtnSwitchSource) {
      const showSwitch = !track.isLocal;
      els.fullBtnSwitchSource.classList.toggle('hidden', !showSwitch);
    }
    updateDownloadButtonState();
    updatePlayButtons();
  }

  function updatePlayButtons() {
    const sym = state.isPlaying ? 'icon-pause' : 'icon-play';
    setSvgUse(els.miniPlayIcon, sym);
    setSvgUse(els.fullPlayIcon, sym);
    setSvgUse(els.gymPlayIcon, sym);
  }

  function onTimeUpdate() {
    const cur = primaryAudio.currentTime || 0;
    const dur = primaryAudio.duration || 0;
    const pct = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0;
    if (els.miniProgressFill) els.miniProgressFill.style.width = `${pct}%`;
    if (els.fullProgressFill) els.fullProgressFill.style.width = `${pct}%`;
    if (els.fullProgressThumb) els.fullProgressThumb.style.left = `${pct}%`;
    if (els.fullTimeCurrent) els.fullTimeCurrent.textContent = formatTime(cur);
    if (els.fullTimeDuration && dur > 0) els.fullTimeDuration.textContent = formatTime(dur);

    const now = Date.now();
    if (now - state.lastPlayedPosSync > 2000) {
      state.lastPlayedPosSync = now;
      syncMediaSessionPosition();
    }
  }

  function onBufferProgress() {
    const dur = primaryAudio.duration || 0;
    if (dur <= 0 || !primaryAudio.buffered || primaryAudio.buffered.length === 0) return;
    try {
      const end = primaryAudio.buffered.end(primaryAudio.buffered.length - 1);
      const pct = Math.min(100, (end / dur) * 100);
      if (els.miniBufferedFill) els.miniBufferedFill.style.width = `${pct}%`;
      if (els.fullProgressBuffered) els.fullProgressBuffered.style.width = `${pct}%`;
    } catch {}
  }

  function createTrackItemElement(track, onClickPlay) {
    const item = document.createElement('div');
    item.className = 'track-item';
    item.dataset.trackId = track.id;
    if (state.currentTrack && state.currentTrack.id === track.id) item.classList.add('playing');

    const liked = state.likedTrackIds.has(track.id);
    const offline = state.offlineTrackIds.has(track.id);
    const bpm = estimateBpm(track);
    const ex = getExerciseForTrack(track);
    const exShort = getExerciseDisplayName(ex);
    const sourcePill = offline
      ? `<span class="track-pill offline">${state.lang === 'ar' ? 'أوفلاين' : 'Offline'}</span>`
      : track.sourceLabel
        ? `<span class="track-pill">${escapeHtml(track.sourceLabel)}</span>`
        : '';

    item.innerHTML = `
      <div class="track-art-wrap">
        <img class="track-item-art" src="${escapeHtml(track.cover || DEFAULT_COVER)}" alt="" loading="lazy" />
      </div>
      <div class="track-item-info">
        <div class="track-item-title" dir="auto">${escapeHtml(track.title)}</div>
        <div class="track-item-meta">
          <span class="track-item-artist" dir="auto">${escapeHtml(track.artist)}</span>
          <span class="track-pill bpm">${bpm} BPM</span>
          <span class="track-pill exercise" dir="auto">${escapeHtml(exShort)}</span>
          ${sourcePill}
        </div>
      </div>
      <div class="track-item-actions">
        <button class="track-action-btn ${liked ? 'liked' : ''}" data-action="like" aria-label="Favorite">${svgIcon(liked ? 'icon-heart-filled' : 'icon-heart', 'v-icon-sm')}</button>
        <button class="track-action-btn" data-action="add-pl" aria-label="Add to Playlist">${svgIcon('icon-plus', 'v-icon-sm')}</button>
        <button class="track-action-btn" data-action="more" aria-label="Options">${svgIcon('icon-more', 'v-icon-sm')}</button>
      </div>
    `;

    const img = item.querySelector('img');
    if (img) img.onerror = () => { img.src = DEFAULT_COVER; };

    item.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (btn) {
        e.stopPropagation();
        const act = btn.dataset.action;
        if (act === 'like') toggleLikeTrack(track);
        else if (act === 'add-pl') openAddToPlaylistModal(track);
        else if (act === 'more') openTrackOptionsModal(track);
        return;
      }
      onClickPlay();
    });

    return item;
  }

  function renderHomeTrackList(tracks) {
    state.filteredTracks = tracks;
    if (els.homeTrackCount) els.homeTrackCount.textContent = String(tracks.length);
    if (!els.homeTrackList) return;
    els.homeTrackList.innerHTML = '';
    const frag = document.createDocumentFragment();
    tracks.forEach((tr, idx) => {
      frag.appendChild(createTrackItemElement(tr, () => playTrack(tr, tracks, idx)));
    });
    els.homeTrackList.appendChild(frag);
  }

  function applyHomeFilterAndSort() {
    let list = [...state.allTracks];
    if (state.homeFilter === 'online') {
      list = list.filter(t => t.isOnline);
    } else if (state.homeFilter !== 'all') {
      list = list.filter(t => t.tag === state.homeFilter);
    }

    if (state.sortMode === 'bpm') {
      list.sort((a, b) => estimateBpm(b) - estimateBpm(a));
    } else if (state.sortMode === 'title') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
    renderHomeTrackList(list);
  }

  function highlightPlayingTrackInLists() {
    $$('.track-item').forEach(el => {
      const match = state.currentTrack && el.dataset.trackId === state.currentTrack.id;
      el.classList.toggle('playing', Boolean(match));
    });
  }

  // -------------------------------------------------------------------------
  // Smart Multi-Source Search (Fixed Unicode Arabic Normalization + No Premature Abort)
  // -------------------------------------------------------------------------
  // Direct browser-side cloud search (powers GitHub Pages / static hosts & backend-less fallback)
  async function fetchAudiusClientSearch(q, signal, limit = 16) {
    if (!q) return [];
    const url = `https://api.audius.co/v1/tracks/search?query=${encodeURIComponent(q)}&limit=${limit}&app_name=VIBE_STUDIO`;
    const res = await fetch(url, { signal });
    if (!res.ok) return [];
    const payload = await res.json();
    const list = Array.isArray(payload?.data) ? payload.data : [];
    return list
      .filter(item => item && item.id && item.title)
      .map(item => {
        const art = item.artwork || {};
        const cover = art['480x480'] || art['150x150'] || DEFAULT_COVER;
        const primary = `https://api.audius.co/v1/tracks/${encodeURIComponent(item.id)}/stream?app_name=VIBE_STUDIO`;
        const mirror = `https://discoveryprovider.audius.co/v1/tracks/${encodeURIComponent(item.id)}/stream?app_name=VIBE_STUDIO`;
        const genre = item.genre || 'Global Hits';
        return {
          id: `aud_${item.id}`,
          title: String(item.title).trim(),
          artist: String(item.user?.name || item.user?.handle || 'Artist').trim(),
          cover,
          category: genre,
          streamUrl: primary,
          fallbackStreams: [mirror],
          isLocal: false,
          isOnline: true,
          isOriginal: true,
          source: 'audius',
          sourceLabel: 'Audius',
          bpm: Number(item.bpm) || estimateBpm({ title: item.title, category: genre }),
          duration: Number(item.duration) || 0
        };
      });
  }

  async function fetchItunesClientSearch(q, signal, limit = 14) {
    if (!q) return { tracks: [], latinHints: [] };
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=${limit}`;
    const res = await fetch(url, { signal });
    if (!res.ok) return { tracks: [], latinHints: [] };
    const payload = await res.json();
    const list = Array.isArray(payload?.results) ? payload.results : [];
    const latinHints = [];
    const tracks = [];
    list.forEach(item => {
      if (!item || !item.trackName) return;
      const artist = String(item.artistName || 'Artist').trim();
      const title = String(item.trackName).trim();
      if (/^[a-zA-Z0-9\s\-&'.]+$/.test(artist) && !latinHints.includes(artist)) {
        latinHints.push(artist);
      }
      if (item.previewUrl) {
        const art = (item.artworkUrl100 || '').replace('100x100bb', '600x600bb') || DEFAULT_COVER;
        tracks.push({
          id: `itu_${item.trackId}`,
          title,
          artist,
          cover: art,
          category: item.primaryGenreName || 'Global Hits',
          streamUrl: item.previewUrl,
          fallbackStreams: [],
          isLocal: false,
          isOnline: true,
          isOriginal: true,
          source: 'itunes',
          sourceLabel: 'Apple Preview',
          bpm: estimateBpm({ title, category: item.primaryGenreName || '' }),
          duration: Math.round((item.trackTimeMillis || 30000) / 1000)
        });
      }
    });
    return { tracks, latinHints };
  }

  async function searchStaticCloud(query, mode, signal) {
    const started = performance.now();
    const qMod = mode === 'remix' ? `${query} remix` : mode === 'slowed' ? `${query} slowed` : query;
    const [audRes, ituRes] = await Promise.allSettled([
      fetchAudiusClientSearch(qMod, signal, 18),
      fetchItunesClientSearch(qMod, signal, 14)
    ]);
    let audTracks = audRes.status === 'fulfilled' ? audRes.value : [];
    const ituData = ituRes.status === 'fulfilled' ? ituRes.value : { tracks: [], latinHints: [] };

    // If query has Arabic letters or Audius gave few results, rescue with canonical Latin artist from iTunes
    if ((/[\u0600-\u06FF]/.test(query) || audTracks.length < 5) && ituData.latinHints.length > 0) {
      try {
        const hintQuery = mode === 'remix' ? `${ituData.latinHints[0]} remix` : ituData.latinHints[0];
        const extra = await fetchAudiusClientSearch(hintQuery, signal, 14);
        audTracks = [...audTracks, ...extra];
      } catch {}
    }

    // Attach matching iTunes preview as fallback onto full-length Audius hits
    const ituByKey = new Map();
    ituData.tracks.forEach(it => {
      const k = dedupeKey(it.title, it.artist);
      if (k && it.streamUrl) ituByKey.set(k, it.streamUrl);
    });
    audTracks.forEach(at => {
      const k = dedupeKey(at.title, at.artist);
      const pv = ituByKey.get(k);
      if (pv && !at.fallbackStreams.includes(pv)) at.fallbackStreams.push(pv);
    });

    const merged = [...audTracks, ...ituData.tracks];
    const sourcesUsed = [];
    if (audTracks.length) sourcesUsed.push('Audius');
    if (ituData.tracks.length) sourcesUsed.push('Apple Music');
    return {
      results: merged,
      sourcesUsed,
      queryMs: Math.round(performance.now() - started)
    };
  }

  async function handleSearchInput(rawQuery) {
    const query = rawQuery.trim();
    if (els.searchClearBtn) els.searchClearBtn.classList.toggle('hidden', !query);

    if (!query) {
      if (els.searchResultsHeader) els.searchResultsHeader.classList.add('hidden');
      if (els.searchSpinner) els.searchSpinner.classList.add('hidden');
      if (els.searchResultsList) els.searchResultsList.innerHTML = '';
      return;
    }

    // Immediate local fuzzy match (Unicode + Arabic normalized)
    const nq = normalizeText(query);
    const localHits = state.allTracks.filter(t => {
      const hay = normalizeText(`${t.title} ${t.artist} ${t.category || ''}`);
      return hay.includes(nq);
    });
    renderSearchResults(localHits, state.lang === 'ar' ? 'المكتبة + جاري البحث سحابياً...' : 'Local + Searching cloud...');

    if (state.searchAbortCtrl) state.searchAbortCtrl.abort();
    state.searchAbortCtrl = new AbortController();
    const signal = state.searchAbortCtrl.signal;

    if (els.searchSpinner) els.searchSpinner.classList.remove('hidden');

    try {
      const timeoutId = setTimeout(() => {
        if (state.searchAbortCtrl) state.searchAbortCtrl.abort();
      }, 10000);

      let data = null;
      if (!IS_STATIC_HOST) {
        try {
          const url = `/api/search?q=${encodeURIComponent(query)}&mode=${encodeURIComponent(state.searchMode)}`;
          const res = await fetch(url, { signal });
          if (res.ok) data = await res.json();
        } catch (err) {
          if (err && err.name === 'AbortError') throw err;
        }
      }
      if (!data) {
        data = await searchStaticCloud(query, state.searchMode, signal);
      }
      clearTimeout(timeoutId);

      const onlineHits = data.results || [];
      state.onlineSearchResults = onlineHits;

      // Merge & deduplicate cleanly WITHOUT stripping Arabic letters
      const merged = [];
      const seen = new Set();
      [...localHits, ...onlineHits].forEach(tr => {
        const key = dedupeKey(tr.title, tr.artist) || tr.id;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(tr);
        }
      });

      const ms = data.queryMs || 0;
      const srcStr = (data.sourcesUsed || []).join(' + ') || 'Local';
      const label = state.lang === 'ar'
        ? `${merged.length} نتيجة (${srcStr}) · ${(ms / 1000).toFixed(1)}ث`
        : `${merged.length} results (${srcStr}) · ${(ms / 1000).toFixed(1)}s`;
      renderSearchResults(merged, label);
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      console.warn('Cloud search notice:', err);
      renderSearchResults(localHits, state.lang === 'ar' ? 'نتائج المكتبة المحلية' : 'Local Matches Only');
    } finally {
      if (els.searchSpinner) els.searchSpinner.classList.add('hidden');
    }
  }

  function renderSearchResults(tracks, sourceLabelText) {
    if (els.searchResultsHeader) els.searchResultsHeader.classList.remove('hidden');
    if (els.searchResultsCount) {
      els.searchResultsCount.textContent = state.lang === 'ar' ? `${tracks.length} أغنية` : `${tracks.length} tracks`;
    }
    if (els.searchSourceLabel) els.searchSourceLabel.textContent = sourceLabelText;
    if (!els.searchResultsList) return;

    els.searchResultsList.innerHTML = '';
    if (tracks.length === 0) {
      els.searchResultsList.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:34px 16px;color:var(--text-muted);">
          ${escapeHtml(state.lang === 'ar' ? 'جرب كلمة بحث أخرى أو غيّر الفلتر أعلى النتائج' : 'No matches found yet — try another keyword or search mode')}
        </div>`;
      return;
    }

    const frag = document.createDocumentFragment();
    tracks.forEach((tr, idx) => {
      frag.appendChild(createTrackItemElement(tr, () => {
        if (!state.allTracks.some(x => x.id === tr.id)) {
          // Remember played search hit inside session memory so queue/favorites/exercises stay intact
          state.allTracks.push(tr);
        }
        playTrack(tr, tracks, idx);
      }));
    });
    els.searchResultsList.appendChild(frag);
  }

  // -------------------------------------------------------------------------
  // Favorites, Playlists, Recently Played, Offline IndexedDB & Sharing
  // -------------------------------------------------------------------------
  function toggleLikeTrack(track) {
    if (!track) return;
    if (state.likedTrackIds.has(track.id)) {
      state.likedTrackIds.delete(track.id);
    } else {
      state.likedTrackIds.add(track.id);
      if (els.heartPulseOverlay && !els.fullPlayerModal.classList.contains('hidden')) {
        els.heartPulseOverlay.classList.add('active');
        setTimeout(() => els.heartPulseOverlay.classList.remove('active'), 420);
      }
    }
    localStorage.setItem('vibe_likes', JSON.stringify(Array.from(state.likedTrackIds)));
    if (state.currentTrack && state.currentTrack.id === track.id) updateTrackUI(track);
    updateSmartCardCounts();
    applyHomeFilterAndSort();
    highlightPlayingTrackInLists();
  }

  function recordRecentTrack(track) {
    if (!track) return;
    state.recentPlayed = state.recentPlayed.filter(t => t.id !== track.id);
    state.recentPlayed.unshift({
      id: track.id,
      title: track.title,
      artist: track.artist,
      cover: track.cover || DEFAULT_COVER,
      file: track.file,
      streamUrl: track.streamUrl,
      fallbackStreams: track.fallbackStreams,
      isLocal: track.isLocal,
      isOnline: track.isOnline,
      sourceLabel: track.sourceLabel,
      bpm: track.bpm,
      intensity: track.intensity
    });
    state.recentPlayed = state.recentPlayed.slice(0, 12);
    localStorage.setItem('vibe_recent', JSON.stringify(state.recentPlayed));
    renderRecentPlayed();
  }

  function renderRecentPlayed() {
    if (!els.recentPlayedSection || !els.recentPlayedScroll) return;
    if (state.recentPlayed.length === 0) {
      els.recentPlayedSection.classList.add('hidden');
      return;
    }
    els.recentPlayedSection.classList.remove('hidden');
    if (els.recentPlayedCount) els.recentPlayedCount.textContent = String(state.recentPlayed.length);
    els.recentPlayedScroll.innerHTML = '';
    state.recentPlayed.forEach((tr, idx) => {
      const card = document.createElement('div');
      card.className = 'recent-card';
      card.innerHTML = `
        <img src="${escapeHtml(tr.cover || DEFAULT_COVER)}" alt="" loading="lazy" />
        <div class="recent-card-title" dir="auto">${escapeHtml(tr.title)}</div>
        <div class="recent-card-artist" dir="auto">${escapeHtml(tr.artist)}</div>
      `;
      card.querySelector('img').onerror = (e) => { e.target.src = DEFAULT_COVER; };
      card.addEventListener('click', () => {
        const full = state.allTracks.find(x => x.id === tr.id) || tr;
        playTrack(full, state.recentPlayed, idx);
      });
      els.recentPlayedScroll.appendChild(card);
    });
  }

  function getSmartPlaylistTracks(smartType) {
    if (smartType === 'smart_gym') {
      return state.allTracks.filter(t => t.tag === 'gym' || t.tag === 'energy' || estimateBpm(t) >= 134);
    }
    if (smartType === 'smart_favorites') {
      return state.allTracks.filter(t => state.likedTrackIds.has(t.id));
    }
    if (smartType === 'smart_local') {
      return state.allTracks.filter(t => t.isLocal);
    }
    if (smartType === 'smart_downloaded') {
      return state.allTracks.filter(t => state.offlineTrackIds.has(t.id));
    }
    return [];
  }

  function updateSmartCardCounts() {
    const unit = state.lang === 'ar' ? 'أغنية' : 'tracks';
    if (els.countSmartGym) els.countSmartGym.textContent = `${getSmartPlaylistTracks('smart_gym').length} ${unit}`;
    if (els.countSmartFavorites) els.countSmartFavorites.textContent = `${state.likedTrackIds.size} ${unit}`;
    if (els.countSmartLocal) els.countSmartLocal.textContent = `${getSmartPlaylistTracks('smart_local').length} ${unit}`;
    if (els.countSmartDownloaded) els.countSmartDownloaded.textContent = `${state.offlineTrackIds.size} ${state.lang === 'ar' ? 'محفوظ' : 'saved'}`;

    const sideCount = $('#sidebar-cached-count');
    if (sideCount) {
      sideCount.textContent = state.lang === 'ar'
        ? `${state.offlineTrackIds.size} مسار جاهز أوفلاين`
        : `${state.offlineTrackIds.size} tracks ready offline`;
    }
  }

  function savePlaylists() {
    localStorage.setItem('vibe_playlists', JSON.stringify(state.customPlaylists));
  }

  function createCustomPlaylist(name, iconId, tempoZone) {
    if (!name.trim()) return;
    const pl = {
      id: 'pl_' + Date.now(),
      name: name.trim(),
      icon: iconId || 'icon-music',
      tempoZone: tempoZone || '',
      trackIds: tempoZone ? getTempoMixTracks(tempoZone).slice(0, 8).map(t => t.id) : []
    };
    state.customPlaylists.push(pl);
    savePlaylists();
    renderCustomPlaylists();
    showToast(state.lang === 'ar' ? `تم إنشاء القائمة "${pl.name}"` : `Playlist "${pl.name}" created`);
  }

  function renderCustomPlaylists() {
    if (!els.customPlaylistsContainer) return;
    els.customPlaylistsContainer.innerHTML = '';
    if (state.customPlaylists.length === 0) {
      els.customPlaylistsContainer.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:24px;color:var(--text-muted);font-size:0.86rem;">
          ${escapeHtml(state.lang === 'ar' ? 'لا توجد قوائم مخصصة بعد. اضغط قائمة جديدة لإنشاء قائمة جيم أو موسيقى.' : 'No custom playlists yet. Create a Music or Gym Workout playlist above.')}
        </div>`;
      return;
    }
    state.customPlaylists.forEach(pl => {
      const iconSym = pl.icon && pl.icon.startsWith('icon-') ? pl.icon : 'icon-music';
      const tempoStr = pl.tempoZone ? ` · ${pl.tempoZone.toUpperCase()}` : '';
      const item = document.createElement('div');
      item.className = 'custom-playlist-item';
      item.innerHTML = `
        <div class="custom-pl-left">
          <div class="custom-pl-icon">${svgIcon(iconSym)}</div>
          <div style="min-width:0;">
            <div class="custom-pl-name" dir="auto">${escapeHtml(pl.name)}</div>
            <div class="custom-pl-count">${pl.trackIds.length} ${state.lang === 'ar' ? 'أغنية' : 'tracks'}${escapeHtml(tempoStr)}</div>
          </div>
        </div>
        <button class="icon-btn" data-action="play-pl" aria-label="Play Playlist">${svgIcon('icon-play', 'v-icon-sm')}</button>
      `;
      item.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="play-pl"]')) {
          e.stopPropagation();
          const tracks = pl.trackIds.map(id => state.allTracks.find(t => t.id === id)).filter(Boolean);
          if (!tracks.length) {
            showToast(state.lang === 'ar' ? 'القائمة فارغة' : 'Playlist is empty');
            return;
          }
          playTrack(tracks[0], tracks, 0);
          return;
        }
        openPlaylistDetailView(pl);
      });
      els.customPlaylistsContainer.appendChild(item);
    });
  }

  function openPlaylistDetailView(plOrSmart) {
    let title = '';
    let iconSym = 'icon-music';
    let tracks = [];
    if (typeof plOrSmart === 'string') {
      const map = {
        smart_gym: [state.lang === 'ar' ? 'خلطة الجيم و PR' : 'Gym & PR Mix', 'icon-gym'],
        smart_favorites: [state.lang === 'ar' ? 'الأغاني المفضلة' : 'Liked Songs', 'icon-heart-filled'],
        smart_local: [state.lang === 'ar' ? 'ملفات الجهاز' : 'Device Audio', 'icon-disc'],
        smart_downloaded: [state.lang === 'ar' ? 'المحفوظة أوفلاين' : 'Saved Offline', 'icon-check-circle']
      };
      [title, iconSym] = map[plOrSmart] || ['Playlist', 'icon-music'];
      tracks = getSmartPlaylistTracks(plOrSmart);
      state.activeModalPlaylist = { isSmart: true, tracks };
      if (els.btnDeleteActivePlaylist) els.btnDeleteActivePlaylist.style.display = 'none';
    } else {
      title = plOrSmart.name;
      iconSym = plOrSmart.icon && plOrSmart.icon.startsWith('icon-') ? plOrSmart.icon : 'icon-music';
      tracks = plOrSmart.trackIds.map(id => state.allTracks.find(t => t.id === id)).filter(Boolean);
      state.activeModalPlaylist = plOrSmart;
      if (els.btnDeleteActivePlaylist) els.btnDeleteActivePlaylist.style.display = 'inline-flex';
    }

    if (els.modalPlaylistTitle) els.modalPlaylistTitle.textContent = title;
    if (els.modalPlaylistHeading) els.modalPlaylistHeading.textContent = title;
    if (els.modalPlaylistIcon) els.modalPlaylistIcon.innerHTML = svgIcon(iconSym, 'v-icon-lg');
    if (els.modalPlaylistMeta) els.modalPlaylistMeta.textContent = `${tracks.length} ${state.lang === 'ar' ? 'أغنية' : 'tracks'}`;
    if (els.modalPlaylistTracks) {
      els.modalPlaylistTracks.innerHTML = '';
      if (!tracks.length) {
        els.modalPlaylistTracks.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted);">${state.lang === 'ar' ? 'لا توجد أغانٍ هنا بعد' : 'No tracks in this playlist yet'}</div>`;
      } else {
        tracks.forEach((tr, idx) => {
          els.modalPlaylistTracks.appendChild(createTrackItemElement(tr, () => playTrack(tr, tracks, idx)));
        });
      }
    }
    openModal(els.modalPlaylistView);
  }

  function openAddToPlaylistModal(track) {
    state.targetTrackForPlaylist = track;
    if (els.targetTrackLabel) els.targetTrackLabel.textContent = `${track.title} — ${track.artist}`;
    if (!els.playlistsChecklist) return;
    els.playlistsChecklist.innerHTML = '';
    if (state.customPlaylists.length === 0) {
      els.playlistsChecklist.innerHTML = `<p class="subtitle-text">${state.lang === 'ar' ? 'أنشئ قائمة جديدة أولاً من المكتبة.' : 'Create a playlist first from the Library tab.'}</p>`;
      openModal(els.modalAddToPlaylist);
      return;
    }
    state.customPlaylists.forEach(pl => {
      const has = pl.trackIds.includes(track.id);
      const row = document.createElement('label');
      row.className = 'playlist-check-item';
      row.innerHTML = `
        <span class="orb-left">${svgIcon(pl.icon && pl.icon.startsWith('icon-') ? pl.icon : 'icon-music', 'v-icon-xs')} <span>${escapeHtml(pl.name)}</span></span>
        <input type="checkbox" ${has ? 'checked' : ''} />
      `;
      row.querySelector('input').addEventListener('change', (e) => {
        if (e.target.checked) {
          if (!pl.trackIds.includes(track.id)) pl.trackIds.push(track.id);
          showToast(state.lang === 'ar' ? `أضيفت إلى "${pl.name}"` : `Added to "${pl.name}"`);
        } else {
          pl.trackIds = pl.trackIds.filter(id => id !== track.id);
          showToast(state.lang === 'ar' ? `أزيلت من "${pl.name}"` : `Removed from "${pl.name}"`);
        }
        savePlaylists();
        renderCustomPlaylists();
      });
      els.playlistsChecklist.appendChild(row);
    });
    openModal(els.modalAddToPlaylist);
  }

  // IndexedDB Offline Cache
  function initIndexedDB() {
    if (!('indexedDB' in window)) return;
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE, { keyPath: 'id' });
    };
    req.onsuccess = (e) => {
      state.db = e.target.result;
      refreshOfflineTrackKeys();
      loadUserUploadedTracks();
    };
  }

  function refreshOfflineTrackKeys() {
    if (!state.db) return;
    try {
      const tx = state.db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).getAll();
      req.onsuccess = () => {
        const recs = req.result || [];
        state.offlineTrackIds = new Set(recs.map(r => r.id));
        const bytes = recs.reduce((acc, r) => acc + (r.blob ? r.blob.size : 0), 0);
        state.cacheTotalMB = (bytes / (1024 * 1024)).toFixed(1);
        updateSmartCardCounts();
        updateDownloadButtonState();
        updateCacheStatsUI();
      };
    } catch {}
  }

  function updateCacheStatsUI() {
    if (!els.cacheStatsBadge) return;
    const n = state.offlineTrackIds.size;
    const mb = state.cacheTotalMB || '0.0';
    els.cacheStatsBadge.textContent = state.lang === 'ar' ? `${n} مسار محفوظ (${mb} MB)` : `${n} cached (${mb} MB)`;
  }

  async function getOfflineAudioBlob(trackId) {
    if (!state.db) return null;
    return new Promise((resolve) => {
      try {
        const req = state.db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(trackId);
        req.onsuccess = () => resolve(req.result && req.result.blob ? req.result.blob : null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  let autoCacheTimer = null;
  function scheduleBackgroundAutoCache(track) {
    if (!track || !state.db || track.isLocal || state.offlineTrackIds.has(track.id)) return;
    const url = getTrackPrimaryUrl(track);
    if (!url || url.includes('.m3u8')) return;
    if (autoCacheTimer) clearTimeout(autoCacheTimer);
    autoCacheTimer = setTimeout(async () => {
      if (!state.isPlaying || !state.currentTrack || state.currentTrack.id !== track.id) return;
      try {
        const res = await fetch(url);
        if (!res.ok) return;
        const blob = await res.blob();
        if (!blob || blob.size < 4096) return;
        const tx = state.db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).put({ id: track.id, track, blob, savedAt: Date.now(), isAutoCached: true });
        tx.oncomplete = () => {
          state.offlineTrackIds.add(track.id);
          refreshOfflineTrackKeys();
        };
      } catch {}
    }, 3200);
  }

  async function toggleOfflineSave(track) {
    if (!state.db || !track) return;
    if (state.offlineTrackIds.has(track.id)) {
      const tx = state.db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).delete(track.id);
      tx.oncomplete = () => {
        state.offlineTrackIds.delete(track.id);
        refreshOfflineTrackKeys();
        showToast(state.lang === 'ar' ? 'تمت الإزالة من الحفظ الأوفلاين' : 'Removed from offline storage');
      };
      return;
    }
    const url = getTrackPrimaryUrl(track);
    if (!url) return;
    if (els.downloadLabel) els.downloadLabel.textContent = state.lang === 'ar' ? 'جاري الحفظ...' : 'Saving...';
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const blob = await res.blob();
      const tx = state.db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put({ id: track.id, track, blob, savedAt: Date.now() });
      tx.oncomplete = () => {
        state.offlineTrackIds.add(track.id);
        refreshOfflineTrackKeys();
        showToast(state.lang === 'ar' ? `تم حفظ "${track.title}" أوفلاين` : `Saved "${track.title}" offline`);
      };
    } catch {
      updateDownloadButtonState();
      showToast(state.lang === 'ar' ? 'تعذر الحفظ الأوفلاين' : 'Could not cache track');
    }
  }

  function updateDownloadButtonState() {
    if (!state.currentTrack || !els.fullBtnDownload) return;
    const saved = state.offlineTrackIds.has(state.currentTrack.id);
    els.fullBtnDownload.classList.toggle('downloaded', saved);
    setSvgUse(els.downloadIcon, saved ? 'icon-check-circle' : 'icon-download');
    if (els.downloadLabel) {
      els.downloadLabel.textContent = saved
        ? (state.lang === 'ar' ? 'جاهز أوفلاين' : 'Offline Ready')
        : (state.lang === 'ar' ? 'حفظ أوفلاين' : 'Save Offline');
    }
  }

  function loadUserUploadedTracks() {
    if (!state.db) return;
    try {
      const req = state.db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).getAll();
      req.onsuccess = () => {
        const uploads = (req.result || []).filter(i => i.isUpload && i.track);
        uploads.forEach(u => {
          if (!state.allTracks.some(t => t.id === u.track.id)) state.allTracks.unshift(u.track);
        });
        if (uploads.length > 0) applyHomeFilterAndSort();
      };
    } catch {}
  }

  async function handleAudioFilesUpload(files) {
    if (!files || !files.length || !state.db) return;
    let count = 0;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (!f.type.startsWith('audio/') && !/\.(mp3|m4a|wav|flac|aac|ogg)$/i.test(f.name)) continue;
      const base = f.name.replace(/\.[^/.]+$/, '');
      const parts = base.includes(' - ') ? base.split(' - ') : null;
      const newTrack = {
        id: `upload_${Date.now()}_${i}`,
        title: parts ? parts.slice(1).join(' - ').trim() : base,
        artist: parts ? parts[0].trim() : 'Device Audio',
        category: 'My Uploads',
        tag: 'local',
        cover: DEFAULT_COVER,
        isLocal: true,
        isUpload: true,
        bpm: 128
      };
      const tx = state.db.transaction(DB_STORE, 'readwrite');
      tx.objectStore(DB_STORE).put({ id: newTrack.id, track: newTrack, blob: f, isUpload: true, savedAt: Date.now() });
      await new Promise(r => { tx.oncomplete = r; });
      state.offlineTrackIds.add(newTrack.id);
      state.allTracks.unshift(newTrack);
      count++;
    }
    if (count > 0) {
      applyHomeFilterAndSort();
      refreshOfflineTrackKeys();
      closeModal(els.modalUpload);
      showToast(state.lang === 'ar' ? `تم استيراد ${count} ملف` : `Imported ${count} audio file(s)`);
    }
  }

  // -------------------------------------------------------------------------
  // Gym Session Dashboard, Rest & Tabata Timer
  // -------------------------------------------------------------------------
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
    if (els.gymSessionTime) els.gymSessionTime.textContent = formatTime(state.gymSessionSeconds).padStart(5, '0');
    state.gymCalories = Math.floor(state.gymSessionSeconds * 0.12);
    if (els.gymCaloriesVal) els.gymCaloriesVal.textContent = String(state.gymCalories);
    if (els.gymSetsVal) els.gymSetsVal.textContent = String(state.gymCurrentSet);
  }

  function playGymChime(high = true) {
    if (!state.gymTimer.soundEnabled) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!audioCtx) audioCtx = new AC();
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(high ? 880 : 520, audioCtx.currentTime);
      g.gain.setValueAtTime(0.35, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch {}
  }

  function speakVoiceCoach(text) {
    if (!state.gymVoiceCoach || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = state.lang === 'ar' ? 'ar-SA' : 'en-US';
      window.speechSynthesis.speak(u);
    } catch {}
  }

  function updateGymTimerUI() {
    const m = Math.floor(state.gymTimer.secondsLeft / 60);
    const s = state.gymTimer.secondsLeft % 60;
    if (els.gymTimerTime) els.gymTimerTime.textContent = `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    if (state.gymTimer.mode === 'tabata') {
      if (els.gymTimerModeLabel) els.gymTimerModeLabel.textContent = `Tabata R${state.gymTimer.tabataRound}/${state.gymTimer.totalRounds}`;
      if (els.gymTimerSub) els.gymTimerSub.textContent = state.gymTimer.tabataState === 'work' ? 'WORK' : 'REST';
      if (els.gymTimerCircle) els.gymTimerCircle.style.borderColor = state.gymTimer.tabataState === 'work' ? 'var(--accent-crimson)' : 'var(--accent-teal)';
    } else {
      if (els.gymTimerModeLabel) els.gymTimerModeLabel.textContent = state.lang === 'ar' ? 'عد تنازلي للراحة' : 'Rest Countdown';
      if (els.gymTimerSub) els.gymTimerSub.textContent = state.lang === 'ar' ? 'راحة' : 'REST';
      if (els.gymTimerCircle) els.gymTimerCircle.style.borderColor = 'var(--accent-teal)';
    }
    if (els.timerStartLabel) {
      els.timerStartLabel.textContent = state.gymTimer.isRunning
        ? (state.lang === 'ar' ? 'إيقاف' : 'Pause')
        : (state.lang === 'ar' ? 'ابدأ' : 'Start');
    }
  }

  function pauseGymTimer() {
    clearInterval(state.gymTimer.id);
    state.gymTimer.id = null;
    state.gymTimer.isRunning = false;
    updateGymTimerUI();
  }

  function resetGymTimer() {
    clearInterval(state.gymTimer.id);
    state.gymTimer.id = null;
    state.gymTimer.isRunning = false;
    state.gymTimer.secondsLeft = state.gymTimer.totalSeconds;
    state.gymTimer.tabataRound = 1;
    state.gymTimer.tabataState = 'work';
    updateGymTimerUI();
  }

  function startGymTimer() {
    if (state.gymTimer.isRunning) {
      pauseGymTimer();
      return;
    }
    state.gymTimer.isRunning = true;
    updateGymTimerUI();
    state.gymTimer.id = setInterval(() => {
      state.gymTimer.secondsLeft--;
      updateGymTimerUI();
      if (state.gymTimer.secondsLeft <= 0) {
        if (state.gymTimer.mode === 'tabata') {
          if (state.gymTimer.tabataState === 'work') {
            state.gymTimer.tabataState = 'rest';
            state.gymTimer.secondsLeft = state.gymTimer.tabataRest;
            playGymChime(false);
          } else {
            state.gymTimer.tabataRound++;
            if (state.gymTimer.tabataRound > state.gymTimer.totalRounds) {
              resetGymTimer();
              playGymChime(true);
              showToast(state.lang === 'ar' ? 'اكتملت جولات التاباتا!' : 'Tabata complete!');
              return;
            }
            state.gymTimer.tabataState = 'work';
            state.gymTimer.secondsLeft = state.gymTimer.tabataWork;
            playGymChime(true);
          }
        } else {
          playGymChime(true);
          speakVoiceCoach(state.lang === 'ar' ? 'انتهت الراحة ابدأ المجموعة' : 'Rest over, start your next set');
          resetGymTimer();
          showToast(state.lang === 'ar' ? 'انتهت الراحة — ابدأ مجموعتك' : 'Rest complete — next set ready');
        }
      } else if (state.gymTimer.secondsLeft <= 3 && state.gymTimer.secondsLeft > 0) {
        playGymChime(false);
      }
    }, 1000);
  }

  function setGymTimerPreset(seconds) {
    state.gymTimer.mode = 'rest';
    state.gymTimer.totalSeconds = seconds;
    state.gymTimer.secondsLeft = seconds;
    els.timerPills.forEach(p => p.classList.toggle('active', Number(p.dataset.seconds) === seconds));
    if (els.btnTabataMode) els.btnTabataMode.classList.remove('active');
    resetGymTimer();
  }

  async function requestScreenWakeLock() {
    if (!('wakeLock' in navigator)) return;
    try {
      if (state.wakeLockSentinel) {
        await state.wakeLockSentinel.release();
        state.wakeLockSentinel = null;
        if (els.btnWakeLock) els.btnWakeLock.classList.remove('active');
        return;
      }
      state.wakeLockSentinel = await navigator.wakeLock.request('screen');
      if (els.btnWakeLock) els.btnWakeLock.classList.add('active');
      showToast(state.lang === 'ar' ? 'الشاشة ستبقى مضيئة أثناء التمرين' : 'Screen keep-awake active');
    } catch {}
  }

  // -------------------------------------------------------------------------
  // Navigation, Modals, Queue, Lyrics, Options, Themes
  // -------------------------------------------------------------------------
  function switchTab(tab) {
    state.activeTab = tab;
    els.views.forEach(v => v.classList.toggle('active', v.id === `view-${tab}`));
    els.navItems.forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    els.sidebarItems.forEach(b => {
      const act = b.dataset.tab === tab;
      b.classList.toggle('active', act);
      b.setAttribute('aria-selected', String(act));
    });
    if (tab === 'gym') renderGymTempoMix(state.activeTempoZone, false);
    if (tab === 'library') {
      renderRecentPlayed();
      renderCustomPlaylists();
    }
  }

  function openModal(modal) {
    if (modal) modal.classList.remove('hidden');
  }

  function closeModal(modal) {
    if (modal) modal.classList.add('hidden');
  }

  function openQueueModal() {
    if (!state.currentTrack) return;
    if (els.queueNowArt) els.queueNowArt.src = state.currentTrack.cover || DEFAULT_COVER;
    if (els.queueNowTitle) els.queueNowTitle.textContent = state.currentTrack.title;
    if (els.queueNowArtist) els.queueNowArtist.textContent = state.currentTrack.artist;

    const upcoming = state.activeQueue.slice(state.queueIndex + 1);
    if (els.queueCount) els.queueCount.textContent = `${upcoming.length} ${state.lang === 'ar' ? 'مسار' : 'tracks'}`;
    if (els.queueList) {
      els.queueList.innerHTML = '';
      if (upcoming.length === 0) {
        els.queueList.innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-muted);">${state.lang === 'ar' ? 'نهاية القائمة' : 'End of queue'}</div>`;
      } else {
        upcoming.forEach((tr, idx) => {
          const item = document.createElement('div');
          item.className = 'track-item';
          item.innerHTML = `
            <div class="track-art-wrap"><img class="track-item-art" src="${escapeHtml(tr.cover || DEFAULT_COVER)}" alt="" /></div>
            <div class="track-item-info">
              <div class="track-item-title" dir="auto">${escapeHtml(tr.title)}</div>
              <div class="track-item-artist" dir="auto">${escapeHtml(tr.artist)}</div>
            </div>
            <button class="track-action-btn" data-action="rm" aria-label="Remove">${svgIcon('icon-x', 'v-icon-sm')}</button>
          `;
          item.addEventListener('click', (e) => {
            if (e.target.closest('[data-action="rm"]')) {
              e.stopPropagation();
              state.activeQueue.splice(state.queueIndex + 1 + idx, 1);
              openQueueModal();
              return;
            }
            playTrack(tr, state.activeQueue, state.queueIndex + 1 + idx);
            closeModal(els.modalQueue);
          });
          els.queueList.appendChild(item);
        });
      }
    }
    openModal(els.modalQueue);
  }

  async function openLyricsModal() {
    const tr = state.currentTrack;
    if (!tr) return;
    if (els.lyricsTrackArt) els.lyricsTrackArt.src = tr.cover || DEFAULT_COVER;
    if (els.lyricsTrackTitle) els.lyricsTrackTitle.textContent = tr.title;
    if (els.lyricsTrackArtist) els.lyricsTrackArtist.textContent = tr.artist;
    if (els.lyricsEditorBox) els.lyricsEditorBox.style.display = 'none';
    if (els.lyricsContainer) els.lyricsContainer.style.display = 'block';
    openModal(els.modalLyrics);

    if (state.customLyrics[tr.id]) {
      els.lyricsLoading.classList.add('hidden');
      els.lyricsText.textContent = state.customLyrics[tr.id];
      return;
    }
    els.lyricsText.textContent = '';
    els.lyricsLoading.classList.remove('hidden');
    try {
      const ct = encodeURIComponent(tr.title.replace(/[\(\[].*?[\)\]]/g, '').trim());
      const ca = encodeURIComponent(tr.artist.replace(/[\(\[].*?[\)\]]/g, '').trim());
      const res = await fetch(`https://lrclib.net/api/get?track_name=${ct}&artist_name=${ca}`);
      if (res.ok) {
        const d = await res.json();
        if (d.plainLyrics) {
          els.lyricsLoading.classList.add('hidden');
          els.lyricsText.textContent = d.plainLyrics;
          return;
        }
      }
    } catch {}
    els.lyricsLoading.classList.add('hidden');
    els.lyricsText.textContent = state.lang === 'ar'
      ? 'لم يتم العثور على كلمات تلقائياً. اضغط أيقونة التعديل بالأعلى لإضافتها.'
      : 'No lyrics found automatically. Tap the edit icon above to save your own.';
  }

  function openTrackOptionsModal(track) {
    const tr = track || state.currentTrack;
    if (!tr) return;
    state.targetTrackForOptions = tr;
    if (els.optionsTrackArt) els.optionsTrackArt.src = tr.cover || DEFAULT_COVER;
    if (els.optionsTrackTitle) els.optionsTrackTitle.textContent = tr.title;
    if (els.optionsTrackArtist) els.optionsTrackArtist.textContent = tr.artist;
    if (els.opt8dStatus) els.opt8dStatus.textContent = state.is8dActive ? 'ON' : 'OFF';
    if (els.optDownloadStatus) els.optDownloadStatus.textContent = state.offlineTrackIds.has(tr.id) ? 'Saved' : 'Save';

    if (els.trackQrCanvas && typeof window.QRCode !== 'undefined') {
      try {
        const shareUrl = `${window.location.origin}/?track=${encodeURIComponent(tr.id)}`;
        window.QRCode.toCanvas(els.trackQrCanvas, shareUrl, { width: 140, margin: 1 });
      } catch {}
    }
    openModal(els.modalTrackOptions);
  }

  function applyTheme(name) {
    state.activeTheme = name;
    document.body.dataset.theme = name;
    localStorage.setItem('vibe_theme', name);
    els.themeCards.forEach(c => c.classList.toggle('active', c.dataset.theme === name));
  }

  function setSleepTimer(mins) {
    if (state.sleepTimerId) {
      clearInterval(state.sleepTimerId);
      state.sleepTimerId = null;
    }
    if (mins <= 0) {
      if (els.sleepIndicator) els.sleepIndicator.classList.add('hidden');
      if (els.sleepStatusText) els.sleepStatusText.textContent = state.lang === 'ar' ? 'تم إيقاف مؤقت النوم' : 'Sleep timer off';
      closeModal(els.modalSleepTimer);
      return;
    }
    state.sleepEndTime = Date.now() + mins * 60000;
    if (els.sleepIndicator) els.sleepIndicator.classList.remove('hidden');
    if (els.sleepIndicatorText) els.sleepIndicatorText.textContent = `${mins}m`;
    state.sleepTimerId = setInterval(() => {
      const rem = Math.ceil((state.sleepEndTime - Date.now()) / 60000);
      if (rem <= 0) {
        clearInterval(state.sleepTimerId);
        state.sleepTimerId = null;
        state.userPaused = true;
        primaryAudio.pause();
        if (els.sleepIndicator) els.sleepIndicator.classList.add('hidden');
        showToast(state.lang === 'ar' ? 'انتهى مؤقت النوم وتوقف الصوت' : 'Sleep timer ended');
      } else if (els.sleepIndicatorText) {
        els.sleepIndicatorText.textContent = `${rem}m`;
      }
    }, 10000);
    showToast(state.lang === 'ar' ? `تم ضبط مؤقت النوم على ${mins} دقيقة` : `Sleep timer set: ${mins} min`);
    closeModal(els.modalSleepTimer);
  }

  // -------------------------------------------------------------------------
  // Event Binding & Boot
  // -------------------------------------------------------------------------
  function bindEvents() {
    attachAudioListenersOnce(audioA);
    attachAudioListenersOnce(audioB);
    setupMediaSessionHandlers();

    // Navigation
    els.navItems.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
    els.sidebarItems.forEach(btn => btn.addEventListener('click', () => switchTab(btn.dataset.tab)));
    if (els.btnHeaderQuickSearch) {
      els.btnHeaderQuickSearch.addEventListener('click', () => {
        switchTab('search');
        setTimeout(() => els.searchInput && els.searchInput.focus(), 50);
      });
    }
    if (els.btnSidebarOpenGym) els.btnSidebarOpenGym.addEventListener('click', () => switchTab('gym'));

    // Header Actions
    if (els.btnHeaderLang) {
      els.btnHeaderLang.addEventListener('click', () => {
        state.lang = state.lang === 'ar' ? 'en' : 'ar';
        localStorage.setItem('vibe_lang', state.lang);
        applyTranslations();
        applyHomeFilterAndSort();
        renderCustomPlaylists();
        if (state.activeTab === 'gym') renderGymTempoMix(state.activeTempoZone, false);
        showToast(state.lang === 'ar' ? 'تم التبديل للعربية' : 'Switched to English');
      });
    }
    if (els.btnHeaderShuffle) {
      els.btnHeaderShuffle.addEventListener('click', () => {
        state.isShuffle = !state.isShuffle;
        localStorage.setItem('vibe_shuffle', String(state.isShuffle));
        els.btnHeaderShuffle.classList.toggle('active', state.isShuffle);
        if (els.fullBtnShuffle) els.fullBtnShuffle.classList.toggle('active', state.isShuffle);
        showToast(state.isShuffle ? (state.lang === 'ar' ? 'التشغيل العشوائي مفعّل' : 'Shuffle ON') : (state.lang === 'ar' ? 'التشغيل العشوائي متوقف' : 'Shuffle OFF'));
      });
    }
    if (els.btnHeaderSleep) els.btnHeaderSleep.addEventListener('click', () => openModal(els.modalSleepTimer));
    if (els.btnHeaderEq) els.btnHeaderEq.addEventListener('click', () => openModal(els.modalEqualizer));
    if (els.btnHeaderTheme) els.btnHeaderTheme.addEventListener('click', () => openModal(els.modalThemes));

    // Hero & Home
    if (els.heroPlayBtn) {
      els.heroPlayBtn.addEventListener('click', () => {
        const list = state.filteredTracks.length ? state.filteredTracks : state.allTracks;
        if (list.length) playTrack(list[0], list, 0);
      });
    }
    if (els.heroGymViewBtn) els.heroGymViewBtn.addEventListener('click', () => switchTab('gym'));
    els.tempoQuickItems.forEach(b => b.addEventListener('click', () => renderGymTempoMix(b.dataset.tempo, true)));

    els.moodCards.forEach(c => c.addEventListener('click', () => {
      const m = c.dataset.mood;
      const list = state.allTracks.filter(t => t.tag === m);
      if (list.length) {
        playTrack(list[0], list, 0);
        state.homeFilter = m;
        els.filterChips.forEach(f => f.classList.toggle('active', f.dataset.filter === m));
        applyHomeFilterAndSort();
      }
    }));

    els.filterChips.forEach(c => c.addEventListener('click', () => {
      state.homeFilter = c.dataset.filter;
      els.filterChips.forEach(f => f.classList.toggle('active', f.dataset.filter === state.homeFilter));
      applyHomeFilterAndSort();
    }));

    if (els.btnSortToggle) {
      els.btnSortToggle.addEventListener('click', () => {
        const order = ['default', 'bpm', 'title'];
        state.sortMode = order[(order.indexOf(state.sortMode) + 1) % order.length];
        applyTranslations();
        applyHomeFilterAndSort();
      });
    }

    // Search
    if (els.searchInput) {
      els.searchInput.addEventListener('input', () => {
        if (state.searchTimer) clearTimeout(state.searchTimer);
        state.searchTimer = setTimeout(() => handleSearchInput(els.searchInput.value), 360);
      });
      els.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          if (state.searchTimer) clearTimeout(state.searchTimer);
          handleSearchInput(els.searchInput.value);
        }
      });
    }
    if (els.searchClearBtn) {
      els.searchClearBtn.addEventListener('click', () => {
        els.searchInput.value = '';
        handleSearchInput('');
      });
    }
    els.tagPills.forEach(p => p.addEventListener('click', () => {
      els.searchInput.value = p.dataset.query;
      handleSearchInput(p.dataset.query);
    }));
    els.searchModeChips.forEach(c => c.addEventListener('click', () => {
      state.searchMode = c.dataset.mode;
      els.searchModeChips.forEach(m => m.classList.toggle('active', m.dataset.mode === state.searchMode));
      if (els.searchInput.value.trim()) handleSearchInput(els.searchInput.value);
    }));
    if (els.btnVoiceSearch) {
      els.btnVoiceSearch.addEventListener('click', () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
          showToast(state.lang === 'ar' ? 'البحث الصوتي غير مدعوم هنا' : 'Voice search unavailable in this browser');
          return;
        }
        const rec = new SR();
        rec.lang = state.lang === 'ar' ? 'ar-EG' : 'en-US';
        rec.onresult = (ev) => {
          const text = ev.results?.[0]?.[0]?.transcript;
          if (text && els.searchInput) {
            els.searchInput.value = text;
            handleSearchInput(text);
          }
        };
        rec.start();
      });
    }

    // Mini & Full Player Controls
    if (els.miniInfoTap) els.miniInfoTap.addEventListener('click', () => openModal(els.fullPlayerModal));
    if (els.btnMinimizePlayer) els.btnMinimizePlayer.addEventListener('click', () => closeModal(els.fullPlayerModal));
    if (els.miniBtnPlay) els.miniBtnPlay.addEventListener('click', (e) => { e.stopPropagation(); togglePlayPause(); });
    if (els.miniBtnPrev) els.miniBtnPrev.addEventListener('click', (e) => { e.stopPropagation(); playPrevTrack(); });
    if (els.miniBtnNext) els.miniBtnNext.addEventListener('click', (e) => { e.stopPropagation(); playNextTrack(false); });
    if (els.miniBtnLike) els.miniBtnLike.addEventListener('click', (e) => { e.stopPropagation(); toggleLikeTrack(state.currentTrack); });
    if (els.miniBtnQueue) els.miniBtnQueue.addEventListener('click', (e) => { e.stopPropagation(); openQueueModal(); });

    if (els.fullBtnPlay) els.fullBtnPlay.addEventListener('click', togglePlayPause);
    if (els.fullBtnPrev) els.fullBtnPrev.addEventListener('click', playPrevTrack);
    if (els.fullBtnNext) els.fullBtnNext.addEventListener('click', () => playNextTrack(false));
    if (els.fullBtnLike) els.fullBtnLike.addEventListener('click', () => toggleLikeTrack(state.currentTrack));
    if (els.fullBtnSwitchSource) els.fullBtnSwitchSource.addEventListener('click', manualSwitchTrackSource);
    if (els.btnFullOpenExercise) {
      els.btnFullOpenExercise.addEventListener('click', () => {
        closeModal(els.fullPlayerModal);
        switchTab('gym');
      });
    }
    if (els.fullBtnShuffle) {
      els.fullBtnShuffle.addEventListener('click', () => {
        if (els.btnHeaderShuffle) els.btnHeaderShuffle.click();
      });
    }
    if (els.fullBtnRepeat) {
      els.fullBtnRepeat.addEventListener('click', () => {
        const modes = ['all', 'one', 'none'];
        state.repeatMode = modes[(modes.indexOf(state.repeatMode) + 1) % modes.length];
        localStorage.setItem('vibe_repeat', state.repeatMode);
        els.fullBtnRepeat.classList.toggle('active', state.repeatMode !== 'none');
        setSvgUse(els.fullRepeatIcon, state.repeatMode === 'one' ? 'icon-repeat-one' : 'icon-repeat');
        showToast(state.repeatMode === 'one' ? 'Repeat One' : state.repeatMode === 'all' ? 'Repeat All' : 'Repeat Off');
      });
    }
    if (els.fullProgressBar) {
      els.fullProgressBar.addEventListener('click', (e) => {
        const dur = primaryAudio.duration;
        if (!Number.isFinite(dur) || dur <= 0) return;
        const rect = els.fullProgressBar.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        primaryAudio.currentTime = ratio * dur;
        syncMediaSessionPosition();
      });
    }
    if (els.volSlider) {
      els.volSlider.addEventListener('input', () => {
        state.volume = Number(els.volSlider.value) / 100;
        state.muted = state.volume === 0;
        primaryAudio.volume = state.volume;
        if (els.volFill) els.volFill.style.width = `${els.volSlider.value}%`;
        setSvgUse(els.volMuteIcon, state.muted ? 'icon-volume-mute' : 'icon-volume');
        localStorage.setItem('vibe_vol', String(state.volume));
      });
    }
    if (els.btnMuteToggle) {
      els.btnMuteToggle.addEventListener('click', () => {
        state.muted = !state.muted;
        primaryAudio.volume = state.muted ? 0 : state.volume;
        setSvgUse(els.volMuteIcon, state.muted ? 'icon-volume-mute' : 'icon-volume');
      });
    }

    if (els.fullBtnDownload) els.fullBtnDownload.addEventListener('click', () => toggleOfflineSave(state.currentTrack));
    if (els.fullBtnAddPlaylist) els.fullBtnAddPlaylist.addEventListener('click', () => state.currentTrack && openAddToPlaylistModal(state.currentTrack));
    if (els.fullBtnLyrics) els.fullBtnLyrics.addEventListener('click', openLyricsModal);
    if (els.fullBtnQueue) els.fullBtnQueue.addEventListener('click', openQueueModal);
    if (els.fullBtnEq) els.fullBtnEq.addEventListener('click', () => openModal(els.modalEqualizer));
    if (els.fullBtn8d) els.fullBtn8d.addEventListener('click', () => toggle8dAudio());
    if (els.fullBtnShare) els.fullBtnShare.addEventListener('click', () => openTrackOptionsModal(state.currentTrack));
    if (els.btnFullOptions) els.btnFullOptions.addEventListener('click', () => openTrackOptionsModal(state.currentTrack));
    if (els.fullBtnSpeed) {
      els.fullBtnSpeed.addEventListener('click', () => {
        const speeds = [0.9, 1, 1.1, 1.2];
        const next = speeds[(speeds.indexOf(state.playbackRate) + 1) % speeds.length];
        setPlaybackSpeed(next);
      });
    }

    // Gym Studio Bindings
    els.gymTempoCards.forEach(c => c.addEventListener('click', () => renderGymTempoMix(c.dataset.tempo, true)));
    if (els.btnPlayActiveGymMix) els.btnPlayActiveGymMix.addEventListener('click', () => renderGymTempoMix(state.activeTempoZone, true));
    if (els.gymBtnPlay) els.gymBtnPlay.addEventListener('click', togglePlayPause);
    if (els.gymBtnPrev) els.gymBtnPrev.addEventListener('click', playPrevTrack);
    if (els.gymBtnNext) els.gymBtnNext.addEventListener('click', () => playNextTrack(false));
    if (els.gymBtnSkipBack) els.gymBtnSkipBack.addEventListener('click', () => { primaryAudio.currentTime = Math.max(0, primaryAudio.currentTime - 15); });
    if (els.gymBtnSkipForward) els.gymBtnSkipForward.addEventListener('click', () => { if (primaryAudio.duration) primaryAudio.currentTime = Math.min(primaryAudio.duration, primaryAudio.currentTime + 15); });
    els.speedBtns.forEach(b => b.addEventListener('click', () => setPlaybackSpeed(Number(b.dataset.speed))));
    if (els.btnWakeLock) els.btnWakeLock.addEventListener('click', requestScreenWakeLock);
    if (els.btnCompletePairedSet) els.btnCompletePairedSet.addEventListener('click', completeCurrentPairedSet);
    if (els.btnGymAddSet) els.btnGymAddSet.addEventListener('click', completeCurrentPairedSet);
    if (els.btnChangeExercise) els.btnChangeExercise.addEventListener('click', () => openExercisePickerModal(state.currentTrack || state.allTracks[0]));
    if (els.btnCreateGymPlaylist) {
      els.btnCreateGymPlaylist.addEventListener('click', () => {
        if (els.inputPlaylistTempo) els.inputPlaylistTempo.value = state.activeTempoZone || 'peak';
        openModal(els.modalCreatePlaylist);
      });
    }

    els.timerPills.forEach(p => p.addEventListener('click', () => setGymTimerPreset(Number(p.dataset.seconds))));
    if (els.btnTabataMode) {
      els.btnTabataMode.addEventListener('click', () => {
        state.gymTimer.mode = 'tabata';
        state.gymTimer.secondsLeft = state.gymTimer.tabataWork;
        state.gymTimer.totalSeconds = state.gymTimer.tabataWork;
        els.timerPills.forEach(p => p.classList.remove('active'));
        els.btnTabataMode.classList.add('active');
        resetGymTimer();
      });
    }
    if (els.btnTimerStart) els.btnTimerStart.addEventListener('click', startGymTimer);
    if (els.btnTimerReset) els.btnTimerReset.addEventListener('click', resetGymTimer);
    if (els.btnTimerSoundToggle) {
      els.btnTimerSoundToggle.addEventListener('click', () => {
        state.gymTimer.soundEnabled = !state.gymTimer.soundEnabled;
        els.btnTimerSoundToggle.classList.toggle('active', state.gymTimer.soundEnabled);
      });
    }
    if (els.btnGymVoiceCoach) {
      els.btnGymVoiceCoach.addEventListener('click', () => {
        state.gymVoiceCoach = !state.gymVoiceCoach;
        els.btnGymVoiceCoach.classList.toggle('active', state.gymVoiceCoach);
        if (els.voiceCoachText) els.voiceCoachText.textContent = state.gymVoiceCoach ? 'Cue ON' : 'Cue Off';
      });
    }

    // Exercise Picker Modal
    els.exerciseZoneFilters.forEach(f => f.addEventListener('click', () => renderExerciseCatalog(f.dataset.zone)));
    if (els.btnSaveCustomExercise) {
      els.btnSaveCustomExercise.addEventListener('click', () => {
        const name = els.inputCustomExName?.value?.trim();
        if (!name || !state.targetTrackForExercise) return;
        const ex = {
          id: 'custom_' + Date.now(),
          zone: 'custom',
          nameAr: name,
          nameEn: name,
          muscleAr: 'مخصص',
          muscleEn: 'Custom',
          sets: Number(els.inputCustomExSets?.value) || 4,
          reps: els.inputCustomExReps?.value?.trim() || '10-12',
          restSec: Number(els.inputCustomExRest?.value) || 75,
          tempoNoteAr: 'حافظ على الإيقاع الثابت وجودة الأداء',
          tempoNoteEn: 'Controlled form matched to track pace'
        };
        state.customTrackExercises[state.targetTrackForExercise.id] = ex;
        localStorage.setItem('vibe_track_exercises', JSON.stringify(state.customTrackExercises));
        updatePairedExerciseUI();
        renderHomeTrackList(state.filteredTracks);
        renderGymTempoMix(state.activeTempoZone, false);
        closeModal(els.modalExercisePicker);
        showToast(state.lang === 'ar' ? `تم حفظ التمرين "${name}"` : `Saved "${name}"`);
      });
    }

    // Library, Playlists & Cache
    els.smartCards.forEach(c => c.addEventListener('click', () => openPlaylistDetailView(c.dataset.smart)));
    if (els.btnCreatePlaylistModal) els.btnCreatePlaylistModal.addEventListener('click', () => openModal(els.modalCreatePlaylist));
    els.iconOptions.forEach(b => b.addEventListener('click', () => {
      state.selectedPlaylistIcon = b.dataset.icon;
      els.iconOptions.forEach(o => o.classList.toggle('selected', o === b));
    }));
    if (els.btnConfirmCreatePlaylist) {
      els.btnConfirmCreatePlaylist.addEventListener('click', () => {
        const name = els.inputPlaylistName?.value || '';
        const tempo = els.inputPlaylistTempo?.value || '';
        if (!name.trim()) return;
        createCustomPlaylist(name, state.selectedPlaylistIcon, tempo);
        els.inputPlaylistName.value = '';
        closeModal(els.modalCreatePlaylist);
      });
    }
    if (els.btnDeleteActivePlaylist) {
      els.btnDeleteActivePlaylist.addEventListener('click', () => {
        if (!state.activeModalPlaylist || state.activeModalPlaylist.isSmart) return;
        state.customPlaylists = state.customPlaylists.filter(p => p.id !== state.activeModalPlaylist.id);
        savePlaylists();
        renderCustomPlaylists();
        closeModal(els.modalPlaylistView);
      });
    }
    if (els.btnModalPlaylistPlay) {
      els.btnModalPlaylistPlay.addEventListener('click', () => {
        const t = state.activeModalPlaylist?.tracks || [];
        if (t.length) { playTrack(t[0], t, 0); closeModal(els.modalPlaylistView); }
      });
    }
    if (els.btnModalPlaylistShuffle) {
      els.btnModalPlaylistShuffle.addEventListener('click', () => {
        const t = [...(state.activeModalPlaylist?.tracks || [])];
        if (!t.length) return;
        const r = Math.floor(Math.random() * t.length);
        state.isShuffle = true;
        playTrack(t[r], t, r);
        closeModal(els.modalPlaylistView);
      });
    }
    if (els.btnClearCache) {
      els.btnClearCache.addEventListener('click', () => {
        if (!state.db) return;
        const tx = state.db.transaction(DB_STORE, 'readwrite');
        tx.objectStore(DB_STORE).clear();
        tx.oncomplete = () => {
          state.offlineTrackIds.clear();
          refreshOfflineTrackKeys();
          showToast(state.lang === 'ar' ? 'تم تفريغ الكاش' : 'Offline cache cleared');
        };
      });
    }
    if (els.btnDownloadAllFavs) {
      els.btnDownloadAllFavs.addEventListener('click', async () => {
        const favs = getSmartPlaylistTracks('smart_favorites').filter(t => !state.offlineTrackIds.has(t.id));
        if (!favs.length) {
          showToast(state.lang === 'ar' ? 'كل المفضلة محفوظة بالفعل' : 'All favorites already saved');
          return;
        }
        for (const tr of favs) await toggleOfflineSave(tr);
      });
    }
    if (els.btnUploadMusicModal) els.btnUploadMusicModal.addEventListener('click', () => openModal(els.modalUpload));
    if (els.btnBrowseAudioFiles) els.btnBrowseAudioFiles.addEventListener('click', () => els.fileAudioInput && els.fileAudioInput.click());
    if (els.fileAudioInput) els.fileAudioInput.addEventListener('change', () => handleAudioFilesUpload(els.fileAudioInput.files));
    if (els.btnExportPlaylists) {
      els.btnExportPlaylists.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(state.customPlaylists, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'vibe-playlists.json';
        a.click();
      });
    }
    if (els.btnImportPlaylists && els.fileImportPlaylists) {
      els.btnImportPlaylists.addEventListener('click', () => els.fileImportPlaylists.click());
      els.fileImportPlaylists.addEventListener('change', async () => {
        const f = els.fileImportPlaylists.files?.[0];
        if (!f) return;
        try {
          const parsed = JSON.parse(await f.text());
          if (Array.isArray(parsed)) {
            state.customPlaylists = parsed;
            savePlaylists();
            renderCustomPlaylists();
            showToast(state.lang === 'ar' ? 'تم استيراد القوائم' : 'Playlists imported');
          }
        } catch {}
      });
    }

    // EQ, Sleep, Queue, Lyrics, Options, Themes & Modal Closers
    $$('.eq-slider').forEach((sl, idx) => sl.addEventListener('input', () => setEqBandGain(idx, Number(sl.value))));
    els.eqPresetChips.forEach(c => c.addEventListener('click', () => applyEqPreset(c.dataset.preset)));
    if (els.sliderVolBoost) {
      els.sliderVolBoost.addEventListener('input', () => {
        ensureWebAudioPipeline();
        state.gainBoost = Number(els.sliderVolBoost.value) / 100;
        if (gainNode) gainNode.gain.value = state.gainBoost;
        if (els.volBoostVal) els.volBoostVal.textContent = `${els.sliderVolBoost.value}%`;
      });
    }
    els.crossfadeBtns.forEach(b => b.addEventListener('click', () => {
      state.crossfadeSec = Number(b.dataset.fade);
      localStorage.setItem('vibe_crossfade', String(state.crossfadeSec));
      els.crossfadeBtns.forEach(x => x.classList.toggle('active', x === b));
      if (els.crossfadeVal) els.crossfadeVal.textContent = state.crossfadeSec ? `${state.crossfadeSec}s` : 'Off';
    }));
    if (els.btnToggle8d) els.btnToggle8d.addEventListener('click', () => toggle8dAudio());
    els.spatialSpeedBtns.forEach(b => b.addEventListener('click', () => {
      state.spatialRate = Number(b.dataset.rate);
      els.spatialSpeedBtns.forEach(x => x.classList.toggle('active', x === b));
    }));
    els.reverbBtns.forEach(b => b.addEventListener('click', () => {
      if (b.dataset.reverb !== 'dry') ensureWebAudioPipeline();
      setReverbWetDry(b.dataset.reverb);
    }));

    els.sleepOptionBtns.forEach(b => b.addEventListener('click', () => setSleepTimer(Number(b.dataset.mins))));
    els.themeCards.forEach(c => c.addEventListener('click', () => applyTheme(c.dataset.theme)));

    if (els.btnEditLyrics) {
      els.btnEditLyrics.addEventListener('click', () => {
        els.lyricsContainer.style.display = 'none';
        els.lyricsEditorBox.style.display = 'flex';
        els.lyricsEditorBox.classList.remove('hidden');
        els.lyricsTextarea.value = state.customLyrics[state.currentTrack?.id] || '';
      });
    }
    if (els.btnSaveCustomLyrics) {
      els.btnSaveCustomLyrics.addEventListener('click', () => {
        if (!state.currentTrack) return;
        state.customLyrics[state.currentTrack.id] = els.lyricsTextarea.value.trim();
        localStorage.setItem('vibe_custom_lyrics', JSON.stringify(state.customLyrics));
        openLyricsModal();
      });
    }
    if (els.btnClearQueue) {
      els.btnClearQueue.addEventListener('click', () => {
        if (state.currentTrack) {
          state.activeQueue = [state.currentTrack];
          state.queueIndex = 0;
        }
        openQueueModal();
      });
    }
    if (els.btnToggleInfinite) {
      els.btnToggleInfinite.addEventListener('click', () => {
        state.infiniteRadio = !state.infiniteRadio;
        if (els.labelInfiniteRadio) {
          els.labelInfiniteRadio.textContent = `Infinite Radio: ${state.infiniteRadio ? 'ON' : 'OFF'}`;
        }
      });
    }

    if (els.optActionPairExercise) {
      els.optActionPairExercise.addEventListener('click', () => {
        closeModal(els.modalTrackOptions);
        openExercisePickerModal(state.targetTrackForOptions);
      });
    }
    if (els.optActionSwitchSource) {
      els.optActionSwitchSource.addEventListener('click', () => {
        closeModal(els.modalTrackOptions);
        if (state.targetTrackForOptions) {
          if (!state.currentTrack || state.currentTrack.id !== state.targetTrackForOptions.id) {
            playTrack(state.targetTrackForOptions);
          } else {
            manualSwitchTrackSource();
          }
        }
      });
    }
    if (els.optAction8d) els.optAction8d.addEventListener('click', () => toggle8dAudio());
    if (els.optActionQueue) {
      els.optActionQueue.addEventListener('click', () => {
        if (state.targetTrackForOptions) {
          state.activeQueue.push(state.targetTrackForOptions);
          showToast(state.lang === 'ar' ? 'تمت الإضافة لقائمة الانتظار' : 'Added to queue');
        }
        closeModal(els.modalTrackOptions);
      });
    }
    if (els.optActionPlaylist) {
      els.optActionPlaylist.addEventListener('click', () => {
        closeModal(els.modalTrackOptions);
        if (state.targetTrackForOptions) openAddToPlaylistModal(state.targetTrackForOptions);
      });
    }
    if (els.optActionDownload) {
      els.optActionDownload.addEventListener('click', () => {
        if (state.targetTrackForOptions) toggleOfflineSave(state.targetTrackForOptions);
        closeModal(els.modalTrackOptions);
      });
    }
    if (els.btnCopyTrackLink) {
      els.btnCopyTrackLink.addEventListener('click', async () => {
        const tr = state.targetTrackForOptions || state.currentTrack;
        if (!tr) return;
        const url = `${window.location.origin}/?track=${encodeURIComponent(tr.id)}`;
        try {
          await navigator.clipboard.writeText(url);
          showToast(state.lang === 'ar' ? 'تم نسخ الرابط' : 'Link copied');
        } catch {}
      });
    }
    if (els.btnShareNative) {
      els.btnShareNative.addEventListener('click', async () => {
        const tr = state.targetTrackForOptions || state.currentTrack;
        if (!tr || !navigator.share) return;
        try {
          await navigator.share({ title: tr.title, text: `${tr.title} — ${tr.artist}`, url: window.location.href });
        } catch {}
      });
    }

    // Modal Backdrops & Close Buttons + Escape key
    $$('.modal-close-btn').forEach(btn => {
      btn.addEventListener('click', () => closeModal(btn.closest('.app-modal')));
    });
    $$('.modal-backdrop').forEach(bd => {
      bd.addEventListener('click', () => closeModal(bd.closest('.app-modal')));
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        $$('.app-modal:not(.hidden)').forEach(closeModal);
        if (els.fullPlayerModal && !els.fullPlayerModal.classList.contains('hidden')) {
          closeModal(els.fullPlayerModal);
        }
      } else if (e.key === ' ' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
        e.preventDefault();
        togglePlayPause();
      }
    });

    // Online/Offline indicator
    const syncOnlineBadge = () => {
      if (!els.netStatus) return;
      els.netStatus.classList.toggle('offline', !navigator.onLine);
      const t = els.netStatus.querySelector('.net-text');
      if (t) t.textContent = navigator.onLine ? (state.lang === 'ar' ? 'متصل' : 'Online') : (state.lang === 'ar' ? 'أوفلاين' : 'Offline');
    };
    window.addEventListener('online', syncOnlineBadge);
    window.addEventListener('offline', syncOnlineBadge);
    syncOnlineBadge();
  }

  function setPlaybackSpeed(rate) {
    state.playbackRate = rate;
    localStorage.setItem('vibe_speed', String(rate));
    primaryAudio.playbackRate = rate;
    preloadAudio.playbackRate = rate;
    if (els.fullSpeedLabel) els.fullSpeedLabel.textContent = `${rate}x`;
    if (els.gymSpeedChip) els.gymSpeedChip.textContent = `${rate}x`;
    els.speedBtns.forEach(b => b.classList.toggle('active', Number(b.dataset.speed) === rate));
    syncMediaSessionPosition();
  }

  async function loadTracksAndBoot() {
    applyTheme(state.activeTheme);
    applyTranslations();
    initIndexedDB();
    bindEvents();
    startGymSessionTimer();

    if (els.btnHeaderShuffle) els.btnHeaderShuffle.classList.toggle('active', state.isShuffle);
    if (els.fullBtnShuffle) els.fullBtnShuffle.classList.toggle('active', state.isShuffle);
    if (els.volSlider) {
      els.volSlider.value = String(Math.round(state.volume * 100));
      if (els.volFill) els.volFill.style.width = `${Math.round(state.volume * 100)}%`;
    }
    setPlaybackSpeed(state.playbackRate);

    try {
      const res = await fetch('music/tracks.json');
      if (!res.ok) throw new Error('HTTP ' + res.status);
      state.allTracks = await res.json();
    } catch (e) {
      console.error('Failed to load tracks.json:', e);
      state.allTracks = [];
    }

    applyHomeFilterAndSort();
    updateSmartCardCounts();
    renderTempoPlaylistCounts();
    renderGymTempoMix(state.activeTempoZone, false);
    renderRecentPlayed();
    renderCustomPlaylists();
    updatePairedExerciseUI();

    if (state.allTracks.length > 0 && !state.currentTrack) {
      state.currentTrack = state.allTracks[0];
      updateTrackUI(state.currentTrack);
    }

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  loadTracksAndBoot();
})();
