/**
 * 音频均衡器 - 10频段 EQ
 */

import type { EqualizerConfig, EqualizerBand, EqualizerPreset } from '../types/audio';
import { clamp } from '../utils/helpers';

/**
 * 标准 10频段频率
 */
const STANDARD_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

/**
 * 预设音效
 */
const PRESETS: Record<EqualizerPreset, number[]> = {
  flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  rock: [5, 4, 3, 1, -1, -1, 0, 2, 3, 4],
  pop: [1, 3, 4, 4, 2, 0, -1, -1, 1, 2],
  jazz: [3, 2, 1, 1, -1, -1, 0, 1, 2, 3],
  classical: [3, 2, 1, 0, 0, 0, -1, -1, -2, -2],
  electronic: [4, 3, 1, 0, -1, 1, 0, 1, 3, 4],
  'bass-boost': [6, 5, 4, 2, 1, 0, 0, 0, 0, 0],
  'treble-boost': [0, 0, 0, 0, 0, 1, 2, 3, 4, 5],
  'vocal-boost': [0, 0, 1, 2, 3, 3, 2, 1, 0, 0],
  custom: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

export class Equalizer {
  private audioContext: AudioContext;
  private filters: BiquadFilterNode[] = [];
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private enabled = true;
  private currentPreset: EqualizerPreset = 'flat';

  constructor(audioContext: AudioContext, config: EqualizerConfig = {}) {
    this.audioContext = audioContext;
    this.enabled = config.enabled !== false;
    this.currentPreset = config.preset || 'flat';

    this.initializeFilters(config.bands);
  }

  /**
   * 初始化滤波器
   */
  private initializeFilters(customBands?: EqualizerBand[]): void {
    const bands = customBands || this.getDefaultBands();

    for (const band of bands) {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = band.type || 'peaking';
      filter.frequency.value = band.frequency;
      filter.Q.value = band.Q || 1;
      filter.gain.value = band.gain;

      this.filters.push(filter);
    }
  }

  /**
   * 获取默认频段配置
   */
  private getDefaultBands(): EqualizerBand[] {
    const gains = PRESETS[this.currentPreset];
    return STANDARD_FREQUENCIES.map((frequency, index) => ({
      frequency,
      gain: gains[index],
      Q: 1,
      type: 'peaking' as BiquadFilterType,
    }));
  }

  /**
   * 连接音频源
   */
  connectSource(source: MediaElementAudioSourceNode): void {
    this.sourceNode = source;

    if (this.filters.length === 0) {
      // 没有滤波器，直接连接到输出
      source.connect(this.audioContext.destination);
      return;
    }

    // 串联滤波器
    source.connect(this.filters[0]);

    for (let i = 0; i < this.filters.length - 1; i++) {
      this.filters[i].connect(this.filters[i + 1]);
    }

    this.filters[this.filters.length - 1].connect(this.audioContext.destination);
  }

  /**
   * 获取输入节点（用于连接其他效果器）
   */
  getInputNode(): BiquadFilterNode | null {
    return this.filters[0] || null;
  }

  /**
   * 获取输出节点
   */
  getOutputNode(): BiquadFilterNode | AudioDestinationNode {
    return this.filters[this.filters.length - 1] || this.audioContext.destination;
  }

  /**
   * 设置频段增益
   */
  setBandGain(index: number, gain: number): void {
    if (index >= 0 && index < this.filters.length) {
      const clampedGain = clamp(gain, -40, 40);
      this.filters[index].gain.value = clampedGain;

      // 如果修改了增益，切换到自定义预设
      if (this.currentPreset !== 'custom') {
        this.currentPreset = 'custom';
      }
    }
  }

  /**
   * 获取频段增益
   */
  getBandGain(index: number): number {
    if (index >= 0 && index < this.filters.length) {
      return this.filters[index].gain.value;
    }
    return 0;
  }

  /**
   * 设置所有频段增益
   */
  setAllBands(gains: number[]): void {
    const minLength = Math.min(gains.length, this.filters.length);
    for (let i = 0; i < minLength; i++) {
      this.setBandGain(i, gains[i]);
    }
  }

  /**
   * 获取所有频段增益
   */
  getAllBands(): number[] {
    return this.filters.map(filter => filter.gain.value);
  }

  /**
   * 应用预设
   */
  applyPreset(preset: EqualizerPreset): void {
    const gains = PRESETS[preset];
    if (gains) {
      this.setAllBands(gains);
      this.currentPreset = preset;
    }
  }

  /**
   * 获取当前预设
   */
  getCurrentPreset(): EqualizerPreset {
    return this.currentPreset;
  }

  /**
   * 获取所有可用预设
   */
  getAvailablePresets(): EqualizerPreset[] {
    return Object.keys(PRESETS) as EqualizerPreset[];
  }

  /**
   * 启用均衡器
   */
  enable(): void {
    this.enabled = true;
    // 恢复所有滤波器的增益
    // （这里假设之前保存了状态，简化实现直接重新应用当前预设）
    this.applyPreset(this.currentPreset);
  }

  /**
   * 禁用均衡器
   */
  disable(): void {
    this.enabled = false;
    // 将所有增益设为 0
    this.filters.forEach(filter => {
      filter.gain.value = 0;
    });
  }

  /**
   * 是否启用
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * 重置为平坦响应
   */
  reset(): void {
    this.applyPreset('flat');
  }

  /**
   * 获取频段数量
   */
  getBandCount(): number {
    return this.filters.length;
  }

  /**
   * 获取频段频率
   */
  getBandFrequency(index: number): number {
    if (index >= 0 && index < this.filters.length) {
      return this.filters[index].frequency.value;
    }
    return 0;
  }

  /**
   * 获取所有频段频率
   */
  getAllFrequencies(): number[] {
    return this.filters.map(filter => filter.frequency.value);
  }

  /**
   * 设置频段 Q 值
   */
  setBandQ(index: number, q: number): void {
    if (index >= 0 && index < this.filters.length) {
      this.filters[index].Q.value = clamp(q, 0.1, 10);
    }
  }

  /**
   * 导出当前配置
   */
  exportConfig(): EqualizerBand[] {
    return this.filters.map(filter => ({
      frequency: filter.frequency.value,
      gain: filter.gain.value,
      Q: filter.Q.value,
      type: filter.type,
    }));
  }

  /**
   * 导入配置
   */
  importConfig(bands: EqualizerBand[]): void {
    const minLength = Math.min(bands.length, this.filters.length);
    for (let i = 0; i < minLength; i++) {
      const band = bands[i];
      const filter = this.filters[i];

      filter.frequency.value = band.frequency;
      filter.gain.value = clamp(band.gain, -40, 40);
      if (band.Q !== undefined) {
        filter.Q.value = clamp(band.Q, 0.1, 10);
      }
      if (band.type) {
        filter.type = band.type;
      }
    }

    this.currentPreset = 'custom';
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    this.filters.forEach(filter => filter.disconnect());
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.disconnect();
    this.filters = [];
    this.sourceNode = null;
  }
}

