import { LitElement, html, css } from 'lit'
import { customElement, property, state } from 'lit/decorators.js'
import { classMap } from 'lit/directives/class-map.js'
import { styleMap } from 'lit/directives/style-map.js'
import { AudioPlayer as CoreAudioPlayer, WaveformRenderer, LyricsParser } from '@ldesign/player-core'

@customElement('ld-audio-player')
export class LdAudioPlayer extends LitElement {
  static styles = css`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    
    .player {
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .waveform {
      height: 120px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .btn {
      padding: 10px;
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 20px;
      transition: transform 0.2s;
    }
    
    .btn:hover {
      transform: scale(1.1);
    }
    
    .btn--main {
      padding: 15px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      color: white;
    }
    
    .progress {
      height: 6px;
      background: #e0e0e0;
      border-radius: 3px;
      cursor: pointer;
      margin-bottom: 10px;
      position: relative;
    }
    
    .progress-bar {
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 3px;
      transition: width 0.1s;
    }
    
    .time {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      color: #666;
      margin-bottom: 15px;
    }
    
    .volume {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .volume-slider {
      flex: 1;
      height: 6px;
      background: #e0e0e0;
      border-radius: 3px;
      cursor: pointer;
      position: relative;
    }
    
    .volume-bar {
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 3px;
    }
    
    .lyrics {
      text-align: center;
      font-size: 16px;
      color: #333;
      margin-top: 20px;
      padding: 15px;
      background: #f8f8f8;
      border-radius: 8px;
    }
  `

  @property({ type: String }) src = ''
  @property({ type: Boolean }) autoplay = false
  @property({ type: Boolean }) loop = false
  @property({ type: Number }) volume = 0.8
  @property({ type: Boolean, attribute: 'show-waveform' }) showWaveform = true
  @property({ type: Boolean, attribute: 'show-volume' }) showVolume = true
  @property({ type: Boolean, attribute: 'show-lyrics' }) showLyrics = false
  @property({ type: String }) lyrics = ''

  @state() private isPlaying = false
  @state() private currentTime = 0
  @state() private duration = 0
  @state() private currentVolume = 0.8
  @state() private currentLyric = ''

  private player?: CoreAudioPlayer
  private waveform?: WaveformRenderer
  private lyricsParser?: LyricsParser

  connectedCallback() {
    super.connectedCallback()
    this.initPlayer()
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this.destroyPlayer()
  }

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    if (changedProperties.has('src')) {
      this.loadAudio()
    }
    if (changedProperties.has('volume')) {
      this.setVolume(this.volume)
    }
    if (changedProperties.has('lyrics')) {
      this.loadLyrics()
    }
  }

  private initPlayer() {
    this.player = new CoreAudioPlayer({
      src: this.src,
      autoplay: this.autoplay,
      loop: this.loop,
      volume: this.volume
    })

    this.player.on('play', () => {
      this.isPlaying = true
      this.dispatchEvent(new CustomEvent('play'))
    })

    this.player.on('pause', () => {
      this.isPlaying = false
      this.dispatchEvent(new CustomEvent('pause'))
    })

    this.player.on('ended', () => {
      this.isPlaying = false
      this.dispatchEvent(new CustomEvent('ended'))
    })

    this.player.on('timeupdate', (time) => {
      this.currentTime = time
      this.updateLyric(time)
      this.dispatchEvent(new CustomEvent('timeupdate', { detail: time }))
    })

    this.player.on('durationchange', (duration) => {
      this.duration = duration
    })

    this.player.on('volumechange', (volume) => {
      this.currentVolume = volume
      this.dispatchEvent(new CustomEvent('volumechange', { detail: volume }))
    })

    if (this.src) {
      this.loadAudio()
    }
  }

  private destroyPlayer() {
    if (this.player) {
      this.player.destroy()
      this.player = undefined
    }
    if (this.waveform) {
      this.waveform.destroy()
      this.waveform = undefined
    }
  }

  private loadAudio() {
    if (this.player && this.src) {
      this.player.load(this.src)
    }
  }

  private loadLyrics() {
    if (this.lyrics) {
      this.lyricsParser = new LyricsParser()
      this.lyricsParser.parse(this.lyrics)
    }
  }

  private updateLyric(time: number) {
    if (this.lyricsParser) {
      const line = this.lyricsParser.getCurrentLine(time)
      if (line) {
        this.currentLyric = line.text
      }
    }
  }

  private play() {
    this.player?.play()
  }

  private pause() {
    this.player?.pause()
  }

  private togglePlay() {
    if (this.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  private seek(time: number) {
    this.player?.seek(time)
  }

  private setVolume(volume: number) {
    this.player?.setVolume(volume)
  }

  private handleProgressClick(e: MouseEvent) {
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    this.seek(this.duration * percent)
  }

  private handleVolumeClick(e: MouseEvent) {
    const target = e.currentTarget as HTMLElement
    const rect = target.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    this.setVolume(percent)
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  private get progressPercent(): number {
    return this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0
  }

  private handlePrev() {
    this.dispatchEvent(new CustomEvent('prev'))
  }

  private handleNext() {
    this.dispatchEvent(new CustomEvent('next'))
  }

  render() {
    return html`
      <div class="player">
        ${this.showWaveform ? html`
          <div class="waveform" id="waveform"></div>
        ` : ''}
        
        <div class="controls">
          <button class="btn" @click=${this.handlePrev}>
            ⏮️
          </button>
          <button class="btn btn--main" @click=${this.togglePlay}>
            ${this.isPlaying ? '⏸️' : '▶️'}
          </button>
          <button class="btn" @click=${this.handleNext}>
            ⏭️
          </button>
        </div>
        
        <div class="progress" @click=${this.handleProgressClick}>
          <div 
            class="progress-bar"
            style=${styleMap({ width: `${this.progressPercent}%` })}
          ></div>
        </div>
        
        <div class="time">
          <span>${this.formatTime(this.currentTime)}</span>
          <span>${this.formatTime(this.duration)}</span>
        </div>
        
        ${this.showVolume ? html`
          <div class="volume">
            <span>🔊</span>
            <div class="volume-slider" @click=${this.handleVolumeClick}>
              <div 
                class="volume-bar"
                style=${styleMap({ width: `${this.currentVolume * 100}%` })}
              ></div>
            </div>
            <span>${Math.round(this.currentVolume * 100)}%</span>
          </div>
        ` : ''}
        
        ${this.showLyrics && this.currentLyric ? html`
          <div class="lyrics">
            ${this.currentLyric}
          </div>
        ` : ''}
      </div>
    `
  }
}


