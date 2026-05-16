/* ================================================
   VIBE — Music Player Engine
   Pure JS audio player with touch support
   ================================================ */

(function () {
  'use strict';

  // ——— Configuration ———
  const MUSIC_DIR = 'music/';
  const TRACKS_MANIFEST = MUSIC_DIR + 'tracks.json';
  const DEFAULT_COVER = 'assets/default-cover.png';

  // ——— State ———
  const state = {
    tracks: [],
    currentIndex: 0,
    isPlaying: false,
    isShuffle: false,
    repeatMode: 0, // 0=off, 1=all, 2=one
    volume: 0.8,
    shuffleOrder: [],
    shuffleIndex: 0,
    seekingProgress: false,
    seekingVolume: false,
    loaded: false,
  };

  // ——— Audio Element ———
  const audio = new Audio();
  audio.preload = 'auto';
  audio.volume = state.volume;

  // ——— DOM Cache ———
  const $ = (sel, parent = document) => parent.querySelector(sel);
  const $$ = (sel, parent = document) => [...parent.querySelectorAll(sel)];

  // Elements — populated after DOM ready
  let els = {};

  // ——— Initialization ———
  function init() {
    cacheElements();
    bindEvents();
    loadTracks();
  }

  function cacheElements() {
    els = {
      // Views
      playlistView: $('#playlist-view'),
      playerView: $('#player-view'),
      loadingView: $('#loading-view'),
      emptyView: $('#empty-view'),

      // Header
      viewToggleBtn: $('#btn-view-toggle'),
      shuffleHeaderBtn: $('#btn-shuffle-header'),

      // Playlist
      trackList: $('#track-list'),
      trackCount: $('#track-count'),

      // Now Playing
      coverArt: $('#cover-art'),
      coverContainer: $('.cover-container'),
      trackTitle: $('#track-title'),
      trackArtist: $('#track-artist'),

      // Progress
      progressBar: $('#progress-bar'),
      progressFill: $('#progress-fill'),
      progressBuffered: $('#progress-buffered'),
      progressThumb: $('#progress-thumb'),
      timeCurrent: $('#time-current'),
      timeDuration: $('#time-duration'),

      // Controls
      btnShuffle: $('#btn-shuffle'),
      btnPrev: $('#btn-prev'),
      btnPlay: $('#btn-play'),
      btnNext: $('#btn-next'),
      btnRepeat: $('#btn-repeat'),

      // Volume
      volumeSlider: $('#volume-slider'),
      volumeFill: $('#volume-fill'),
      volumeIcon: $('#volume-icon'),

      // Mini Player
      miniPlayer: $('#mini-player'),
      miniCover: $('#mini-cover'),
      miniTitle: $('#mini-title'),
      miniArtist: $('#mini-artist'),
      miniBtnPlay: $('#mini-btn-play'),
      miniProgressFill: $('#mini-progress-fill'),

      // Toast
      toastContainer: $('#toast-container'),
    };
  }

  // ——— Load Tracks ———
  async function loadTracks() {
    showView('loading');

    try {
      const res = await fetch(TRACKS_MANIFEST);
      if (!res.ok) throw new Error('Could not load tracks.json');
      const data = await res.json();

      if (!Array.isArray(data) || data.length === 0) {
        showView('empty');
        return;
      }

      state.tracks = data.map((t, i) => ({
        id: i,
        title: t.title || t.file.replace(/\.[^/.]+$/, ''),
        artist: t.artist || 'Unknown Artist',
        file: MUSIC_DIR + t.file,
        cover: t.cover ? MUSIC_DIR + t.cover : DEFAULT_COVER,
        duration: t.duration || null,
      }));

      state.loaded = true;
      generateShuffleOrder();
      renderPlaylist();
      loadTrack(0, false);
      showView('playlist');

    } catch (err) {
      console.error('Failed to load tracks:', err);
      showView('empty');
    }
  }

  // ——— Render Playlist ———
  function renderPlaylist() {
    els.trackCount.textContent = `${state.tracks.length} track${state.tracks.length !== 1 ? 's' : ''}`;

    els.trackList.innerHTML = state.tracks.map((track, i) => `
      <li class="track-item${i === state.currentIndex && state.isPlaying ? ' playing' : ''}" data-index="${i}" id="track-${i}">
        <div class="track-item__index">
          <span class="track-item__index-num">${i + 1}</span>
          <div class="track-item__eq">
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
            <span class="eq-bar"></span>
          </div>
        </div>
        <div class="track-item__info">
          <div class="track-item__title">${escapeHtml(track.title)}</div>
          <div class="track-item__artist">${escapeHtml(track.artist)}</div>
        </div>
        <div class="track-item__duration" id="dur-${i}">${track.duration ? formatTime(track.duration) : '--:--'}</div>
      </li>
    `).join('');
  }

  // ——— Track Loading ———
  function loadTrack(index, autoplay = true) {
    if (index < 0 || index >= state.tracks.length) return;

    state.currentIndex = index;
    const track = state.tracks[index];

    audio.src = track.file;
    audio.load();

    // Update now-playing UI
    els.coverArt.src = track.cover;
    els.coverContainer.classList.toggle('glow', state.isPlaying);
    els.trackTitle.textContent = track.title;
    els.trackArtist.textContent = track.artist;

    // Update mini player
    els.miniCover.src = track.cover;
    els.miniTitle.textContent = track.title;
    els.miniArtist.textContent = track.artist;

    // Reset progress
    updateProgress(0, 0);
    els.timeCurrent.textContent = '0:00';
    els.timeDuration.textContent = track.duration ? formatTime(track.duration) : '--:--';

    // Highlight in playlist
    updatePlaylistHighlight();

    if (autoplay) {
      playAudio();
    }

    // Update media session
    updateMediaSession(track);
  }

  // ——— Playback Controls ———
  function playAudio() {
    const promise = audio.play();
    if (promise) {
      promise.catch(err => {
        console.warn('Play interrupted:', err);
      });
    }
    state.isPlaying = true;
    updatePlayPauseUI();
    els.coverContainer.classList.add('glow');
    updatePlaylistHighlight();
  }

  function pauseAudio() {
    audio.pause();
    state.isPlaying = false;
    updatePlayPauseUI();
    els.coverContainer.classList.remove('glow');
    updatePlaylistHighlight();
  }

  function togglePlay() {
    if (!state.loaded || state.tracks.length === 0) return;
    state.isPlaying ? pauseAudio() : playAudio();
  }

  function playNext() {
    if (state.tracks.length === 0) return;

    if (state.repeatMode === 2) {
      // Repeat one — restart current
      audio.currentTime = 0;
      playAudio();
      return;
    }

    let nextIndex;
    if (state.isShuffle) {
      state.shuffleIndex = (state.shuffleIndex + 1) % state.shuffleOrder.length;
      nextIndex = state.shuffleOrder[state.shuffleIndex];
    } else {
      nextIndex = (state.currentIndex + 1) % state.tracks.length;
    }

    // If repeat is off and we've looped back to the start, stop
    if (state.repeatMode === 0 && nextIndex === 0 && !state.isShuffle) {
      loadTrack(0, false);
      return;
    }

    loadTrack(nextIndex, true);
  }

  function playPrev() {
    if (state.tracks.length === 0) return;

    // If more than 3s in, restart current track
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }

    let prevIndex;
    if (state.isShuffle) {
      state.shuffleIndex = (state.shuffleIndex - 1 + state.shuffleOrder.length) % state.shuffleOrder.length;
      prevIndex = state.shuffleOrder[state.shuffleIndex];
    } else {
      prevIndex = (state.currentIndex - 1 + state.tracks.length) % state.tracks.length;
    }

    loadTrack(prevIndex, true);
  }

  // ——— Shuffle ———
  function toggleShuffle() {
    state.isShuffle = !state.isShuffle;
    els.btnShuffle.classList.toggle('active', state.isShuffle);
    els.shuffleHeaderBtn.classList.toggle('active', state.isShuffle);

    if (state.isShuffle) {
      generateShuffleOrder();
      showToast('Shuffle on');
    } else {
      showToast('Shuffle off');
    }
  }

  function generateShuffleOrder() {
    const order = state.tracks.map((_, i) => i);
    // Fisher-Yates shuffle
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    // Move current index to front
    const idx = order.indexOf(state.currentIndex);
    if (idx > 0) {
      [order[0], order[idx]] = [order[idx], order[0]];
    }
    state.shuffleOrder = order;
    state.shuffleIndex = 0;
  }

  // ——— Repeat ———
  function toggleRepeat() {
    state.repeatMode = (state.repeatMode + 1) % 3;
    updateRepeatUI();

    const labels = ['Repeat off', 'Repeat all', 'Repeat one'];
    showToast(labels[state.repeatMode]);
  }

  function updateRepeatUI() {
    const btn = els.btnRepeat;
    btn.classList.toggle('active', state.repeatMode > 0);

    // Remove old badge
    const oldBadge = btn.querySelector('.repeat-badge');
    if (oldBadge) oldBadge.remove();

    if (state.repeatMode === 2) {
      const badge = document.createElement('span');
      badge.className = 'repeat-badge';
      badge.textContent = '1';
      btn.appendChild(badge);
    }

    // Update icon
    btn.querySelector('.ctrl-icon').innerHTML = state.repeatMode === 2
      ? '🔂'
      : '🔁';
  }

  // ——— UI Updates ———
  function updatePlayPauseUI() {
    const icon = state.isPlaying ? '⏸' : '▶';
    els.btnPlay.querySelector('.ctrl-icon').textContent = icon;
    els.miniBtnPlay.textContent = state.isPlaying ? '⏸' : '▶';
  }

  function updatePlaylistHighlight() {
    $$('.track-item').forEach(item => {
      const idx = parseInt(item.dataset.index);
      item.classList.toggle('playing', idx === state.currentIndex && state.isPlaying);
    });
  }

  function updateProgress(current, duration) {
    if (state.seekingProgress) return;

    const pct = duration > 0 ? (current / duration) * 100 : 0;
    els.progressFill.style.width = pct + '%';
    els.progressThumb.style.left = pct + '%';
    els.miniProgressFill.style.width = pct + '%';
  }

  // ——— View Management ———
  let currentView = 'loading';

  function showView(view) {
    currentView = view;
    [els.playlistView, els.playerView, els.loadingView, els.emptyView].forEach(v => {
      v.classList.remove('active');
    });

    switch (view) {
      case 'playlist':
        els.playlistView.classList.add('active');
        els.viewToggleBtn.innerHTML = '🎵';
        els.miniPlayer.classList.toggle('visible', state.isPlaying || audio.src);
        break;
      case 'player':
        els.playerView.classList.add('active');
        els.viewToggleBtn.innerHTML = '☰';
        els.miniPlayer.classList.remove('visible');
        break;
      case 'loading':
        els.loadingView.classList.add('active');
        break;
      case 'empty':
        els.emptyView.classList.add('active');
        break;
    }
  }

  function toggleView() {
    if (!state.loaded) return;
    showView(currentView === 'playlist' ? 'player' : 'playlist');
  }

  // ——— Event Binding ———
  function bindEvents() {
    // Header
    els.viewToggleBtn.addEventListener('click', toggleView);
    els.shuffleHeaderBtn.addEventListener('click', toggleShuffle);

    // Controls
    els.btnPlay.addEventListener('click', togglePlay);
    els.btnNext.addEventListener('click', playNext);
    els.btnPrev.addEventListener('click', playPrev);
    els.btnShuffle.addEventListener('click', toggleShuffle);
    els.btnRepeat.addEventListener('click', toggleRepeat);

    // Mini player
    els.miniBtnPlay.addEventListener('click', (e) => {
      e.stopPropagation();
      togglePlay();
    });
    els.miniPlayer.querySelector('#mini-btn-next').addEventListener('click', (e) => {
      e.stopPropagation();
      playNext();
    });
    els.miniPlayer.querySelector('.mini-player__info').addEventListener('click', () => {
      showView('player');
    });

    // Track list click
    els.trackList.addEventListener('click', (e) => {
      const item = e.target.closest('.track-item');
      if (!item) return;
      const index = parseInt(item.dataset.index);
      if (index === state.currentIndex && state.isPlaying) {
        showView('player');
      } else {
        loadTrack(index, true);
        showView('player');
      }
    });

    // Progress bar — mouse events
    bindSeekEvents(els.progressBar, handleProgressSeek);

    // Volume slider
    bindSeekEvents(els.volumeSlider, handleVolumeSeek);

    // Audio events
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onTrackEnded);
    audio.addEventListener('progress', onBufferProgress);
    audio.addEventListener('waiting', () => {
      // Audio is buffering
      els.btnPlay.querySelector('.ctrl-icon').textContent = '⏳';
    });
    audio.addEventListener('canplay', () => {
      updatePlayPauseUI();
    });
    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e);
      showToast('Error loading track');
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      if (e.code === 'ArrowRight') { playNext(); }
      if (e.code === 'ArrowLeft') { playPrev(); }
    });

    // Cover art click — toggle play on player view
    els.coverContainer.addEventListener('click', togglePlay);
  }

  // ——— Seek Event Helpers ———
  function bindSeekEvents(element, handler) {
    let active = false;

    const start = (e) => {
      active = true;
      e.preventDefault();
      element.classList.add('seeking');
      handler(e);
    };

    const move = (e) => {
      if (!active) return;
      e.preventDefault();
      handler(e);
    };

    const end = () => {
      if (!active) return;
      active = false;
      element.classList.remove('seeking');

      if (element === els.progressBar) {
        state.seekingProgress = false;
      }
    };

    // Mouse
    element.addEventListener('mousedown', start);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', end);

    // Touch
    element.addEventListener('touchstart', start, { passive: false });
    document.addEventListener('touchmove', move, { passive: false });
    document.addEventListener('touchend', end);
  }

  function handleProgressSeek(e) {
    state.seekingProgress = true;
    const rect = els.progressBar.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let pct = (clientX - rect.left) / rect.width;
    pct = Math.max(0, Math.min(1, pct));

    els.progressFill.style.width = (pct * 100) + '%';
    els.progressThumb.style.left = (pct * 100) + '%';

    if (audio.duration && isFinite(audio.duration)) {
      audio.currentTime = pct * audio.duration;
      els.timeCurrent.textContent = formatTime(audio.currentTime);
    }
  }

  function handleVolumeSeek(e) {
    const rect = els.volumeSlider.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    let pct = (clientX - rect.left) / rect.width;
    pct = Math.max(0, Math.min(1, pct));

    state.volume = pct;
    audio.volume = pct;
    els.volumeFill.style.width = (pct * 100) + '%';
    updateVolumeIcon();
  }

  function updateVolumeIcon() {
    if (state.volume === 0) {
      els.volumeIcon.textContent = '🔇';
    } else if (state.volume < 0.5) {
      els.volumeIcon.textContent = '🔉';
    } else {
      els.volumeIcon.textContent = '🔊';
    }
  }

  // ——— Audio Event Handlers ———
  function onTimeUpdate() {
    if (!state.seekingProgress) {
      updateProgress(audio.currentTime, audio.duration);
      els.timeCurrent.textContent = formatTime(audio.currentTime);
    }
  }

  function onLoadedMetadata() {
    const dur = audio.duration;
    if (isFinite(dur)) {
      els.timeDuration.textContent = formatTime(dur);

      // Also update the playlist duration
      const durEl = $(`#dur-${state.currentIndex}`);
      if (durEl) durEl.textContent = formatTime(dur);

      // Store duration on track object
      state.tracks[state.currentIndex].duration = dur;
    }
  }

  function onTrackEnded() {
    if (state.repeatMode === 2) {
      audio.currentTime = 0;
      playAudio();
    } else if (state.repeatMode === 1 || state.isShuffle) {
      playNext();
    } else {
      // No repeat — go to next, stop at end
      const nextIndex = state.currentIndex + 1;
      if (nextIndex < state.tracks.length) {
        loadTrack(nextIndex, true);
      } else {
        // End of playlist
        pauseAudio();
        loadTrack(0, false);
      }
    }
  }

  function onBufferProgress() {
    if (audio.buffered.length > 0) {
      const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
      const dur = audio.duration;
      if (dur > 0) {
        els.progressBuffered.style.width = (bufferedEnd / dur * 100) + '%';
      }
    }
  }

  // ——— Media Session API ———
  function updateMediaSession(track) {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      artwork: [
        { src: track.cover, sizes: '512x512', type: 'image/png' }
      ]
    });

    navigator.mediaSession.setActionHandler('play', playAudio);
    navigator.mediaSession.setActionHandler('pause', pauseAudio);
    navigator.mediaSession.setActionHandler('previoustrack', playPrev);
    navigator.mediaSession.setActionHandler('nexttrack', playNext);
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined) {
        audio.currentTime = details.seekTime;
      }
    });
  }

  // ——— Utilities ———
  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    els.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // ——— Boot ———
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

// ——— Service Worker Registration ———
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.warn('SW registration failed:', err));
  });
}
