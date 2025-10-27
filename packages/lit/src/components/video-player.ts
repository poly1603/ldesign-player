import { LitElement, html, css } from 'lit'
import { customElement, property, state, query } from 'lit/decorators.js'
import { styleMap } from 'lit/directives/style-map.js'
import { VideoPlayer as CoreVideoPlayer, SubtitleParser } from '@ldesign/player-core'

@customElement('ld-video-player')
export class LdVideoPlayer extends LitElement {
  static styles = css`
    :host {
      display: block;
      position: relative;
      background: black;
      border-radius: 8px;
      overflow: hidden;
    }
    
    video {
      width: 100%;
      height: 100%;
      display: block;
    }
    
    .controls {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
      padding: 15px;
      display: flex;
      align-items: center;
      gap: 15px;
      transition: opacity 0.3s;
      opacity: 0;
    }
    
    :host(:hover) .controls,
    .controls.visible {
      opacity: 1;
    }
    
    .btn {
      background: transparent;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 18px;
      padding: 5px;
      transition: transform 0.2s;
    }
    
    .btn:hover {
      transform: scale(1.1);
    }
    
    .time {
      color: white;
      font-size: 14px;
      white-space: nowrap;
    }
    
    .progress {
      flex: 1;
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      cursor: pointer;
      position: relative;
    }
    
    .progress-bar {
      height: 100%;
      background: #ff0000;
      border-radius: 2px;
      position: relative;
    }
    
    .progress-bar::after {
      content: '';
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 12px;
      height: 12px;
      background: white;
      border-radius: 50%;
    }
    
    .volume-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .volume-slider {
      width: 80px;
      height: 4px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 2px;
      cursor: pointer;
    }
    
    .volume-bar {
      height: 100%;
      background: white;
      border-radius: 2px;
    }
    
    .subtitles {
      position: absolute;
      bottom: 80px;
      left: 50%;
      transform: translateX(-50%);
      color: white;
      font-size: 18px;
      text-align: center;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
      padding: 10px 20px;
      max-width: 80%;
    }
    
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    
    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `

  @property({ type: String }) src = ''
  @property({ type: String }) poster = ''
  @property({ type: String }) width = ''
  @property({ type: String }) height = ''
  @property({ type: Boolean }) autoplay = false
  @property({ type: Boolean }) loop = false
  @property({ type: Boolean }) muted = false
  @property({ type: Boolean }) controls = true
  @property({ type: Number }) volume = 1
  @property({ type: String }) subtitles = ''

  @state() private isPlaying = false
  @state() private currentTime = 0
  @state() private duration = 0
  @state() private currentVolume = 1
  @state() private isMuted = false
  @state() private isLoading = false
  @state() private currentSubtitle = ''
  @state() private controlsVisible = false
  @state() private isFullscreen = false
  @state() private supportsPiP = false

  @query('video') private videoElement!: HTMLVideoElement

  private player?: CoreVideoPlayer
  private subtitleParser?: SubtitleParser
  private controlsTimeout?: number

  connectedCallback() {
    super.connectedCallback()
    this.checkPiPSupport()
  }

  firstUpdated() {
    this.initPlayer()
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this.destroyPlayer()
  }

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    if (changedProperties.has('src') && this.videoElement) {
      this.loadVideo()
    }
    if (changedProperties.has('volume') && this.player) {
      this.setVolume(this.volume)
    }
    if (changedProperties.has('subtitles')) {
      this.loadSubtitles()
    }
  }

  private checkPiPSupport() {
    this.supportsPiP = 'pictureInPictureEnabled' in document
  }

  private initPlayer() {
    if (!this.videoElement) return

    this.player = new CoreVideoPlayer({
      video: this.videoElement,
      autoplay: this.autoplay,
      loop: this.loop,
      muted: this.muted,
      volume: this.volume
    })

    // Video event listeners
    this.videoElement.addEventListener('play', () => {
      this.isPlaying = true
      this.dispatchEvent(new CustomEvent('play'))
    })

    this.videoElement.addEventListener('pause', () => {
      this.isPlaying = false
      this.dispatchEvent(new CustomEvent('pause'))
    })

    this.videoElement.addEventListener('ended', () => {
      this.isPlaying = false
      this.dispatchEvent(new CustomEvent('ended'))
    })

    this.videoElement.addEventListener('timeupdate', () => {
      this.currentTime = this.videoElement.currentTime
      this.updateSubtitle(this.currentTime)
      this.dispatchEvent(new CustomEvent('timeupdate', { detail: this.currentTime }))
    })

    this.videoElement.addEventListener('loadedmetadata', () => {
      this.duration = this.videoElement.duration
    })

    this.videoElement.addEventListener('volumechange', () => {
      this.currentVolume = this.videoElement.volume
      this.isMuted = this.videoElement.muted
      this.dispatchEvent(new CustomEvent('volumechange', { detail: this.currentVolume }))
    })

    this.videoElement.addEventListener('loadstart', () => {
      this.isLoading = true
    })

    this.videoElement.addEventListener('canplay', () => {
      this.isLoading = false
    })

    if (this.src) {
      this.loadVideo()
    }
  }

  private destroyPlayer() {
    if (this.player) {
      this.player.destroy()
      this.player = undefined
    }
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout)
    }
  }

  private loadVideo() {
    if (this.videoElement && this.src) {
      this.videoElement.src = this.src
    }
  }

  private loadSubtitles() {
    if (this.subtitles) {
      this.subtitleParser = new SubtitleParser()
      fetch(this.subtitles)
        .then(res => res.text())
        .then(text => this.subtitleParser?.parse(text))
    }
  }

  private updateSubtitle(time: number) {
    if (this.subtitleParser) {
      const subtitle = this.subtitleParser.getSubtitleAt(time)
      this.currentSubtitle = subtitle || ''
    }
  }

  private play() {
    this.videoElement?.play()
  }

  private pause() {
    this.videoElement?.pause()
  }

  private togglePlay() {
    if (this.isPlaying) {
      this.pause()
    } else {
      this.play()
    }
  }

  private seek(time: number) {
    if (this.videoElement) {
      this.videoElement.currentTime = time
    }
  }

  private setVolume(volume: number) {
    if (this.videoElement) {
      this.videoElement.volume = volume
    }
  }

  private toggleMute() {
    if (this.videoElement) {
      this.videoElement.muted = !this.videoElement.muted
    }
  }

  private async toggleFullscreen() {
    if (!document.fullscreenElement) {
      await this.requestFullscreen()
      this.isFullscreen = true
      this.dispatchEvent(new CustomEvent('fullscreenchange', { detail: true }))
    } else {
      await document.exitFullscreen()
      this.isFullscreen = false
      this.dispatchEvent(new CustomEvent('fullscreenchange', { detail: false }))
    }
  }

  private async togglePiP() {
    if (!this.videoElement) return

    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture()
    } else {
      await this.videoElement.requestPictureInPicture()
    }
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
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  private get progressPercent(): number {
    return this.duration > 0 ? (this.currentTime / this.duration) * 100 : 0
  }

  private showControls() {
    this.controlsVisible = true
    if (this.controlsTimeout) {
      clearTimeout(this.controlsTimeout)
    }
    this.controlsTimeout = window.setTimeout(() => {
      if (this.isPlaying) {
        this.controlsVisible = false
      }
    }, 3000)
  }

  render() {
    const containerStyle = {
      width: this.width || '100%',
      height: this.height || 'auto'
    }

    return html`
      <div 
        style=${styleMap(containerStyle)}
        @mouseenter=${this.showControls}
        @mousemove=${this.showControls}
      >
        <video
          .src=${this.src}
          .poster=${this.poster}
          .autoplay=${this.autoplay}
          .loop=${this.loop}
          .muted=${this.muted}
          .volume=${this.volume}
        ></video>
        
        ${this.controls ? html`
          <div class="controls ${this.controlsVisible ? 'visible' : ''}">
            <button class="btn" @click=${this.togglePlay}>
              ${this.isPlaying ? '⏸️' : '▶️'}
            </button>
            
            <span class="time">
              ${this.formatTime(this.currentTime)} / ${this.formatTime(this.duration)}
            </span>
            
            <div class="progress" @click=${this.handleProgressClick}>
              <div 
                class="progress-bar"
                style=${styleMap({ width: `${this.progressPercent}%` })}
              ></div>
            </div>
            
            <div class="volume-container">
              <button class="btn" @click=${this.toggleMute}>
                ${this.isMuted ? '🔇' : '🔊'}
              </button>
              <div class="volume-slider" @click=${this.handleVolumeClick}>
                <div 
                  class="volume-bar"
                  style=${styleMap({ width: `${this.currentVolume * 100}%` })}
                ></div>
              </div>
            </div>
            
            <button class="btn" @click=${this.toggleFullscreen}>
              ⛶
            </button>
            
            ${this.supportsPiP ? html`
              <button class="btn" @click=${this.togglePiP}>
                📱
              </button>
            ` : ''}
          </div>
        ` : ''}
        
        ${this.currentSubtitle ? html`
          <div class="subtitles">
            ${this.currentSubtitle}
          </div>
        ` : ''}
        
        ${this.isLoading ? html`
          <div class="loading">
            <div class="spinner"></div>
          </div>
        ` : ''}
      </div>
    `
  }
}


