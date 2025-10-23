/**
 * 音频效果处理器 - 播放速度、音调、AB循环等
 */

import type { ABLoopConfig, AudioEffectsConfig } from '../types/audio';
import { clamp } from '../utils/helpers';
import { EventEmitter } from '../core/EventEmitter';

export class AudioEffects extends EventEmitter {
  private audioContext: AudioContext;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode;
  private compressorNode: DynamicsCompressorNode | null = null;
  private abLoop: ABLoopConfig = { start: 0, end: 0, enabled: false };
  private checkLoopInterval: number | null = null;

  constructor(audioContext: AudioContext, config: AudioEffectsConfig = {}) {
    super();

    this.audioContext = audioContext;

    // 创建增益节点
    this.gainNode = audioContext.createGain();

    // 创建压缩器（可选）
    if (config.compressor) {
      this.compressorNode = audioContext.createDynamicsCompressor();
      this.applyCompressorConfig(config.compressor);
    }
  }

  /**
   * 连接音频源
   */
  connectSource(source: MediaElementAudioSourceNode): void {
    this.sourceNode = source;

    let currentNode: AudioNode = source;

    // 连接压缩器
    if (this.compressorNode) {
      currentNode.connect(this.compressorNode);
      currentNode = this.compressorNode;
    }

    // 连接增益节点
    currentNode.connect(this.gainNode);
  }

  /**
   * 获取输出节点
   */
  getOutputNode(): GainNode {
    return this.gainNode;
  }

  /**
   * 设置增益
   */
  setGain(gain: number): void {
    this.gainNode.gain.value = clamp(gain, 0, 2);
  }

  /**
   * 获取增益
   */
  getGain(): number {
    return this.gainNode.gain.value;
  }

  /**
   * 淡入
   */
  fadeIn(duration: number): void {
    const currentTime = this.audioContext.currentTime;
    this.gainNode.gain.cancelScheduledValues(currentTime);
    this.gainNode.gain.setValueAtTime(0, currentTime);
    this.gainNode.gain.linearRampToValueAtTime(1, currentTime + duration / 1000);
  }

  /**
   * 淡出
   */
  fadeOut(duration: number): Promise<void> {
    return new Promise(resolve => {
      const currentTime = this.audioContext.currentTime;
      const currentGain = this.gainNode.gain.value;

      this.gainNode.gain.cancelScheduledValues(currentTime);
      this.gainNode.gain.setValueAtTime(currentGain, currentTime);
      this.gainNode.gain.linearRampToValueAtTime(0, currentTime + duration / 1000);

      setTimeout(resolve, duration);
    });
  }

  /**
   * 交叉淡入淡出
   */
  crossFade(from: number, to: number, duration: number): void {
    const currentTime = this.audioContext.currentTime;
    this.gainNode.gain.cancelScheduledValues(currentTime);
    this.gainNode.gain.setValueAtTime(from, currentTime);
    this.gainNode.gain.linearRampToValueAtTime(to, currentTime + duration / 1000);
  }

  /**
   * 应用压缩器配置
   */
  private applyCompressorConfig(config: AudioEffectsConfig['compressor']): void {
    if (!this.compressorNode || !config) return;

    if (config.threshold !== undefined) {
      this.compressorNode.threshold.value = clamp(config.threshold, -100, 0);
    }
    if (config.knee !== undefined) {
      this.compressorNode.knee.value = clamp(config.knee, 0, 40);
    }
    if (config.ratio !== undefined) {
      this.compressorNode.ratio.value = clamp(config.ratio, 1, 20);
    }
    if (config.attack !== undefined) {
      this.compressorNode.attack.value = clamp(config.attack, 0, 1);
    }
    if (config.release !== undefined) {
      this.compressorNode.release.value = clamp(config.release, 0, 1);
    }
  }

  /**
   * 设置压缩器
   */
  setCompressor(config: AudioEffectsConfig['compressor']): void {
    if (!this.compressorNode && config) {
      this.compressorNode = this.audioContext.createDynamicsCompressor();

      // 重新连接音频链路
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode.connect(this.compressorNode);
        this.compressorNode.connect(this.gainNode);
      }
    }

    if (config) {
      this.applyCompressorConfig(config);
    }
  }

  /**
   * 获取压缩器节点
   */
  getCompressor(): DynamicsCompressorNode | null {
    return this.compressorNode;
  }

  /**
   * 设置 AB 循环
   */
  setABLoop(start: number, end: number): void {
    if (start >= end) {
      throw new Error('Start time must be less than end time');
    }

    this.abLoop = {
      start,
      end,
      enabled: true,
    };

    this.emit('abloop', { start, end, enabled: true });
  }

  /**
   * 启用 AB 循环
   */
  enableABLoop(): void {
    if (this.abLoop.start < this.abLoop.end) {
      this.abLoop.enabled = true;
      this.emit('abloop', { ...this.abLoop });
    }
  }

  /**
   * 禁用 AB 循环
   */
  disableABLoop(): void {
    this.abLoop.enabled = false;
    this.stopLoopCheck();
    this.emit('abloop', { ...this.abLoop });
  }

  /**
   * 清除 AB 循环
   */
  clearABLoop(): void {
    this.abLoop = { start: 0, end: 0, enabled: false };
    this.stopLoopCheck();
    this.emit('abloop', { ...this.abLoop });
  }

  /**
   * 获取 AB 循环配置
   */
  getABLoop(): ABLoopConfig {
    return { ...this.abLoop };
  }

  /**
   * 检查 AB 循环（需要由播放器定期调用）
   */
  checkABLoop(currentTime: number, seekCallback: (time: number) => void): void {
    if (this.abLoop.enabled && currentTime >= this.abLoop.end) {
      seekCallback(this.abLoop.start);
    }
  }

  /**
   * 启动循环检查定时器
   */
  startLoopCheck(getCurrentTime: () => number, seekCallback: (time: number) => void): void {
    this.stopLoopCheck();

    this.checkLoopInterval = window.setInterval(() => {
      if (this.abLoop.enabled) {
        const currentTime = getCurrentTime();
        this.checkABLoop(currentTime, seekCallback);
      }
    }, 100);
  }

  /**
   * 停止循环检查定时器
   */
  stopLoopCheck(): void {
    if (this.checkLoopInterval !== null) {
      clearInterval(this.checkLoopInterval);
      this.checkLoopInterval = null;
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.gainNode.disconnect();
    if (this.compressorNode) {
      this.compressorNode.disconnect();
    }
    this.stopLoopCheck();
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.disconnect();
    this.sourceNode = null;
    this.compressorNode = null;
    this.clear();
  }
}

