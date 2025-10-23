import { createAudioPlayer, createVideoPlayer, WaveformRenderer, LyricsParser, Equalizer } from '@ldesign/player';

// 示例播放列表
const playlist = [
  {
    id: '1',
    title: '示例音频 1 - SoundHelix Song 1',
    artist: 'SoundHelix',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  },
  {
    id: '2',
    title: '示例音频 2 - SoundHelix Song 2',
    artist: 'SoundHelix',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  },
  {
    id: '3',
    title: '示例音频 3 - SoundHelix Song 3',
    artist: 'SoundHelix',
    src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  },
];

// 示例歌词
const sampleLyrics = `[ar:示例艺术家]
[ti:示例歌曲]
[al:示例专辑]
[00:00.00]这是一首示例歌曲
[00:05.00]展示歌词同步功能
[00:10.00]歌词会随着音乐播放
[00:15.00]自动高亮当前行
[00:20.00]支持点击跳转
[00:25.00]完美的时间同步
[00:30.00]享受音乐吧！`;

// ==================== 音频播放器 ====================
console.log('🎵 创建音频播放器...');
const audioPlayer = createAudioPlayer({
  playlist,
  volume: 1,
  loopMode: 'list',
  enableWebAudio: true,
});

// 获取播放列表管理器
const playlistManager = audioPlayer.getPlaylistManager();
playlistManager.setCurrentIndex(0);

// 渲染播放列表
function renderPlaylist() {
  const container = document.getElementById('playlist');
  container.innerHTML = '';

  const tracks = playlistManager.getAll();
  tracks.forEach((track, index) => {
    const item = document.createElement('div');
    item.className = 'playlist-item';
    if (index === playlistManager.getCurrentIndex()) {
      item.classList.add('active');
    }

    item.innerHTML = `
      <div class="playlist-item-index">${index + 1}</div>
      <div style="flex: 1;">
        <div style="font-weight: 500;">${track.title}</div>
        <div style="font-size: 12px; opacity: 0.7;">${track.artist}</div>
      </div>
    `;

    item.addEventListener('click', () => {
      playlistManager.setCurrentIndex(index);
      audioPlayer.play();
    });

    container.appendChild(item);
  });
}

renderPlaylist();

// 播放控制
document.getElementById('audioPlay').addEventListener('click', () => audioPlayer.play());
document.getElementById('audioPause').addEventListener('click', () => audioPlayer.pause());
document.getElementById('audioStop').addEventListener('click', () => audioPlayer.stop());
document.getElementById('audioPrev').addEventListener('click', () => audioPlayer.prev());
document.getElementById('audioNext').addEventListener('click', () => audioPlayer.next());

// 音量控制
const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
volumeSlider.addEventListener('input', (e) => {
  const vol = e.target.value / 100;
  audioPlayer.setVolume(vol);
  volumeValue.textContent = e.target.value + '%';
});

document.getElementById('muteBtn').addEventListener('click', () => {
  if (audioPlayer.isMuted()) {
    audioPlayer.unmute();
    document.getElementById('muteBtn').innerHTML = '🔇 静音';
  } else {
    audioPlayer.mute();
    document.getElementById('muteBtn').innerHTML = '🔊 取消静音';
  }
});

// 进度控制
const progressSlider = document.getElementById('progressSlider');
progressSlider.addEventListener('input', (e) => {
  const percent = e.target.value / 100;
  const duration = audioPlayer.getDuration();
  audioPlayer.seek(duration * percent);
});

// 更新进度
audioPlayer.on('timeupdate', ({ currentTime, duration }) => {
  if (!progressSlider.matches(':active')) {
    progressSlider.value = (currentTime / duration) * 100 || 0;
  }

  const formatTime = (sec) => {
    if (!isFinite(sec)) return '00:00';
    const min = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${min.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  document.getElementById('timeDisplay').textContent =
    `${formatTime(currentTime)} / ${formatTime(duration)}`;
});

// 播放速率
document.querySelectorAll('[data-rate]').forEach(btn => {
  btn.addEventListener('click', () => {
    const rate = parseFloat(btn.dataset.rate);
    audioPlayer.setPlaybackRate(rate);

    // 更新按钮样式
    document.querySelectorAll('[data-rate]').forEach(b => {
      b.className = 'secondary';
    });
    btn.className = 'success';
  });
});

// 循环模式
document.querySelectorAll('[data-loop]').forEach(btn => {
  btn.addEventListener('click', () => {
    audioPlayer.setLoopMode(btn.dataset.loop);
    document.getElementById('loopMode').textContent = {
      'none': '不循环',
      'single': '单曲循环',
      'list': '列表循环',
      'random': '随机播放',
    }[btn.dataset.loop];

    // 更新按钮样式
    document.querySelectorAll('[data-loop]').forEach(b => {
      b.className = 'secondary';
    });
    btn.className = 'success';
  });
});

// 更新播放状态
audioPlayer.on('play', () => {
  document.getElementById('playState').textContent = '播放中 ▶';
});

audioPlayer.on('pause', () => {
  document.getElementById('playState').textContent = '已暂停 ⏸';
});

audioPlayer.on('stop', () => {
  document.getElementById('playState').textContent = '已停止 ⏹';
});

audioPlayer.on('trackchange', ({ track }) => {
  document.getElementById('currentTrack').textContent = `${track.title} - ${track.artist}`;
  renderPlaylist();
});

// ==================== 波形可视化 ====================
const canvas = document.getElementById('waveformCanvas');
const audioContext = audioPlayer.getAudioContext();
let waveform = null;
let isWaveformActive = false;

if (audioContext) {
  waveform = new WaveformRenderer(canvas, audioContext, {
    waveColor: '#667eea',
    progressColor: '#764ba2',
    cursorColor: '#ff4d4f',
  });

  // 波形点击跳转
  waveform.on('seek', ({ progress }) => {
    const duration = audioPlayer.getDuration();
    audioPlayer.seek(duration * progress);
  });

  // 更新波形进度
  audioPlayer.on('timeupdate', ({ currentTime, duration }) => {
    if (waveform && duration > 0) {
      waveform.setProgress(currentTime / duration);
    }
  });
}

// 波形切换
document.getElementById('waveformToggle').addEventListener('click', () => {
  if (waveform) {
    waveform.stop();
    waveform.drawRealtimeWaveform();
    isWaveformActive = true;
    document.getElementById('waveformToggle').className = 'success';
    document.getElementById('frequencyToggle').className = 'secondary';
  }
});

document.getElementById('frequencyToggle').addEventListener('click', () => {
  if (waveform) {
    waveform.stop();
    waveform.drawFrequency();
    isWaveformActive = true;
    document.getElementById('waveformToggle').className = 'secondary';
    document.getElementById('frequencyToggle').className = 'success';
  }
});

// ==================== 歌词同步 ====================
const lyricsParser = new LyricsParser();
lyricsParser.parse(sampleLyrics);

function renderLyrics() {
  const container = document.getElementById('lyricsContainer');
  container.innerHTML = '';

  const lyrics = lyricsParser.getLyrics();
  lyrics.forEach((line, index) => {
    const div = document.createElement('div');
    div.className = 'lyric-line';
    div.textContent = line.text;
    div.dataset.index = index;
    div.dataset.time = line.time;

    div.addEventListener('click', () => {
      audioPlayer.seek(line.time);
    });

    container.appendChild(div);
  });
}

renderLyrics();

// 更新歌词高亮
audioPlayer.on('timeupdate', ({ currentTime }) => {
  const currentLine = lyricsParser.getCurrentLine(currentTime);

  document.querySelectorAll('.lyric-line').forEach(line => {
    line.classList.remove('active');
  });

  if (currentLine) {
    const index = lyricsParser.getCurrentLineIndex(currentTime);
    const lineElement = document.querySelector(`.lyric-line[data-index="${index}"]`);
    if (lineElement) {
      lineElement.classList.add('active');
      // 自动滚动
      lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
});

// ==================== 均衡器 ====================
let equalizer = null;

if (audioContext) {
  equalizer = new Equalizer(audioContext);
}

document.querySelectorAll('[data-eq]').forEach(btn => {
  btn.addEventListener('click', () => {
    const preset = btn.dataset.eq;
    if (equalizer) {
      equalizer.applyPreset(preset);
      console.log(`应用均衡器预设: ${preset}`);
    }

    // 更新按钮样式
    document.querySelectorAll('[data-eq]').forEach(b => {
      b.className = 'secondary';
    });
    btn.className = 'success';
  });
});

// ==================== 音效处理 ====================
document.getElementById('fadeInBtn').addEventListener('click', () => {
  audioPlayer.fade(0, 1, 2000);
  console.log('淡入效果');
});

document.getElementById('fadeOutBtn').addEventListener('click', () => {
  audioPlayer.fade(1, 0, 2000);
  console.log('淡出效果');
});

// ==================== 视频播放器 ====================
console.log('🎬 创建视频播放器...');
const videoPlayer = createVideoPlayer('#videoContainer', {
  src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  poster: 'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg',
  controls: true,
  autoplay: false,
});

// 播放控制
document.getElementById('videoPlay').addEventListener('click', () => videoPlayer.play());
document.getElementById('videoPause').addEventListener('click', () => videoPlayer.pause());
document.getElementById('videoStop').addEventListener('click', () => videoPlayer.stop());

// 视频控制
document.getElementById('fullscreenBtn').addEventListener('click', () => {
  videoPlayer.toggleFullscreen();
});

document.getElementById('pipBtn').addEventListener('click', () => {
  videoPlayer.togglePictureInPicture().catch(err => {
    alert('画中画不支持或被禁用');
    console.error(err);
  });
});

document.getElementById('screenshotBtn').addEventListener('click', () => {
  const dataUrl = videoPlayer.screenshot();
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `screenshot-${Date.now()}.png`;
  link.click();
  console.log('截图成功！');
});

// 音量控制
const videoVolumeSlider = document.getElementById('videoVolumeSlider');
const videoVolumeValue = document.getElementById('videoVolumeValue');
videoVolumeSlider.addEventListener('input', (e) => {
  const vol = e.target.value / 100;
  videoPlayer.setVolume(vol);
  videoVolumeValue.textContent = e.target.value + '%';
});

document.getElementById('videoMuteBtn').addEventListener('click', () => {
  if (videoPlayer.isMuted()) {
    videoPlayer.unmute();
    document.getElementById('videoMuteBtn').innerHTML = '🔇 静音';
  } else {
    videoPlayer.mute();
    document.getElementById('videoMuteBtn').innerHTML = '🔊 取消静音';
  }
});

// 播放速率
document.querySelectorAll('[data-video-rate]').forEach(btn => {
  btn.addEventListener('click', () => {
    const rate = parseFloat(btn.dataset.videoRate);
    videoPlayer.setPlaybackRate(rate);

    // 更新按钮样式
    document.querySelectorAll('[data-video-rate]').forEach(b => {
      b.className = 'secondary';
    });
    btn.className = 'success';
  });
});

// 更新视频状态
videoPlayer.on('play', () => {
  document.getElementById('videoPlayState').textContent = '播放中 ▶';
});

videoPlayer.on('pause', () => {
  document.getElementById('videoPlayState').textContent = '已暂停 ⏸';
});

videoPlayer.on('stop', () => {
  document.getElementById('videoPlayState').textContent = '已停止 ⏹';
});

videoPlayer.on('timeupdate', ({ currentTime, duration }) => {
  const formatTime = (sec) => {
    if (!isFinite(sec)) return '00:00';
    const min = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${min.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  document.getElementById('videoTime').textContent =
    `${formatTime(currentTime)} / ${formatTime(duration)}`;
});

videoPlayer.on('loadedmetadata', () => {
  const video = videoPlayer.getVideoElement();
  document.getElementById('videoResolution').textContent =
    `${video.videoWidth} x ${video.videoHeight}`;
});

// 欢迎信息
console.log(`
%c🎉 @ldesign/player 演示已启动！

%c✨ 功能特性：
• 🎵 完整的音频播放器（播放控制、音量、进度）
• 🌊 波形可视化（实时波形、频谱显示）
• 📝 歌词同步（LRC 格式、自动高亮）
• 🎛 10频段均衡器（8种预设音效）
• 🎬 视频播放器（全屏、画中画、截图）
• 🔌 框架无关（支持 Vue、React、原生 JS）

%c🚀 开始探索吧！
`,
  'color: #667eea; font-size: 20px; font-weight: bold;',
  'color: #764ba2; font-size: 14px;',
  'color: #28a745; font-size: 16px; font-weight: bold;'
);

