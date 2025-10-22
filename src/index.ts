/**
 * @ldesign/player - 音频播放器
 */
export class AudioPlayer {
  play(url: string) { console.info('Playing:', url) }
  pause() { console.info('Paused') }
}
export function createPlayer() { return new AudioPlayer() }

