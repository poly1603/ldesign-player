/**
 * 音频增强处理模块
 * 提供音频降噪、人声增强、空间音效等功能
 */

export interface AudioEnhancerOptions {
  /** 音频上下文 */
  audioContext: AudioContext;
  /** 是否启用人声增强 */
  enableVocalEnhance?: boolean;
  /** 是否启用低音增强 */
  enableBassBoost?: boolean;
  /** 是否启用空间音效 */
  enableSpatialAudio?: boolean;
  /** 是否启用响度均衡 */
  enableLoudnessNormalization?: boolean;
}

export interface SpatialAudioConfig {
  /** 房间大小 (0-1) */
  roomSize: number;
  /** 混响强度 (0-1) */
  wetLevel: number;
  /** 干声强度 (0-1) */
  dryLevel: number;
  /** 预延迟 (ms) */
  preDelay: number;
}

export interface VocalEnhanceConfig {
  /** 人声频率范围增强 (中频 300Hz-4kHz) */
  midBoost: number;
  /** 清晰度增强 (高频 4kHz-8kHz) */
  clarityBoost: number;
  /** 压缩比 */
  compressionRatio: number;
}

export interface BassBoostConfig {
  /** 增强频率 (Hz) */
  frequency: number;
  /** 增益 (dB) */
  gain: number;
  /** Q 值 */
  q: number;
}

export class AudioEnhancer {
  private audioContext: AudioContext;
  private inputNode: AudioNode | null = null;
  private outputNode: AudioNode | null = null;

  // 音频处理节点
  private vocalEnhancer: {
    lowShelf: BiquadFilterNode;
    midPeak: BiquadFilterNode;
    highShelf: BiquadFilterNode;
    compressor: DynamicsCompressorNode;
  } | null = null;

  private bassBooster: BiquadFilterNode | null = null;
  private spatialProcessor: ConvolverNode | null = null;
  private spatialGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private loudnessCompressor: DynamicsCompressorNode | null = null;

  // 状态
  private vocalEnhanceEnabled = false;
  private bassBoostEnabled = false;
  private spatialAudioEnabled = false;
  private loudnessNormEnabled = false;

  // 配置
  private spatialConfig: SpatialAudioConfig = {
    roomSize: 0.5,
    wetLevel: 0.3,
    dryLevel: 0.7,
    preDelay: 20,
  };

  private vocalConfig: VocalEnhanceConfig = {
    midBoost: 3,
    clarityBoost: 2,
    compressionRatio: 4,
  };

  private bassConfig: BassBoostConfig = {
    frequency: 100,
    gain: 6,
    q: 1,
  };

  constructor(options: AudioEnhancerOptions) {
    this.audioContext = options.audioContext;

    if (options.enableVocalEnhance) {
      this.initVocalEnhancer();
      this.vocalEnhanceEnabled = true;
    }

    if (options.enableBassBoost) {
      this.initBassBooster();
      this.bassBoostEnabled = true;
    }

    if (options.enableSpatialAudio) {
      this.initSpatialProcessor();
      this.spatialAudioEnabled = true;
    }

    if (options.enableLoudnessNormalization) {
      this.initLoudnessNormalizer();
      this.loudnessNormEnabled = true;
    }
  }

  /**
   * 初始化人声增强器
   */
  private initVocalEnhancer(): void {
    // 低频衰减
    const lowShelf = this.audioContext.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 300;
    lowShelf.gain.value = -2;

    // 中频增强
    const midPeak = this.audioContext.createBiquadFilter();
    midPeak.type = 'peaking';
    midPeak.frequency.value = 2000;
    midPeak.Q.value = 1;
    midPeak.gain.value = this.vocalConfig.midBoost;

    // 高频增强（清晰度）
    const highShelf = this.audioContext.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 4000;
    highShelf.gain.value = this.vocalConfig.clarityBoost;

    // 压缩器（让人声更突出）
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.knee.value = 30;
    compressor.ratio.value = this.vocalConfig.compressionRatio;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;

    this.vocalEnhancer = { lowShelf, midPeak, highShelf, compressor };
  }

  /**
   * 初始化低音增强器
   */
  private initBassBooster(): void {
    this.bassBooster = this.audioContext.createBiquadFilter();
    this.bassBooster.type = 'lowshelf';
    this.bassBooster.frequency.value = this.bassConfig.frequency;
    this.bassBooster.gain.value = this.bassConfig.gain;
  }

  /**
   * 初始化空间音效处理器
   */
  private initSpatialProcessor(): void {
    this.spatialProcessor = this.audioContext.createConvolver();
    this.spatialGain = this.audioContext.createGain();
    this.dryGain = this.audioContext.createGain();

    // 生成简单的混响 IR
    this.generateReverbIR();
  }

  /**
   * 生成混响脉冲响应
   */
  private generateReverbIR(): void {
    if (!this.spatialProcessor) return;

    const sampleRate = this.audioContext.sampleRate;
    const duration = 2; // 2秒混响
    const length = sampleRate * duration;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);
    const decay = this.spatialConfig.roomSize * 3;

    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // 指数衰减的白噪声
        channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * decay));
      }
    }

    this.spatialProcessor.buffer = impulse;
  }

  /**
   * 初始化响度均衡器
   */
  private initLoudnessNormalizer(): void {
    this.loudnessCompressor = this.audioContext.createDynamicsCompressor();
    this.loudnessCompressor.threshold.value = -20;
    this.loudnessCompressor.knee.value = 40;
    this.loudnessCompressor.ratio.value = 12;
    this.loudnessCompressor.attack.value = 0;
    this.loudnessCompressor.release.value = 0.25;
  }

  /**
   * 连接音频源
   */
  connect(source: AudioNode, destination: AudioNode): void {
    this.inputNode = source;
    this.outputNode = destination;

    this.rebuildChain();
  }

  /**
   * 重建音频处理链
   */
  private rebuildChain(): void {
    if (!this.inputNode || !this.outputNode) return;

    // 先断开所有连接
    try {
      this.inputNode.disconnect();
    } catch {
      // 忽略
    }

    let currentNode: AudioNode = this.inputNode;

    // 人声增强
    if (this.vocalEnhanceEnabled && this.vocalEnhancer) {
      currentNode.connect(this.vocalEnhancer.lowShelf);
      this.vocalEnhancer.lowShelf.connect(this.vocalEnhancer.midPeak);
      this.vocalEnhancer.midPeak.connect(this.vocalEnhancer.highShelf);
      this.vocalEnhancer.highShelf.connect(this.vocalEnhancer.compressor);
      currentNode = this.vocalEnhancer.compressor;
    }

    // 低音增强
    if (this.bassBoostEnabled && this.bassBooster) {
      currentNode.connect(this.bassBooster);
      currentNode = this.bassBooster;
    }

    // 空间音效
    if (this.spatialAudioEnabled && this.spatialProcessor && this.spatialGain && this.dryGain) {
      // 并行处理：干声 + 湿声
      currentNode.connect(this.dryGain);
      currentNode.connect(this.spatialProcessor);
      this.spatialProcessor.connect(this.spatialGain);

      this.dryGain.gain.value = this.spatialConfig.dryLevel;
      this.spatialGain.gain.value = this.spatialConfig.wetLevel;

      // 创建混合节点
      const merger = this.audioContext.createGain();
      this.dryGain.connect(merger);
      this.spatialGain.connect(merger);
      currentNode = merger;
    }

    // 响度均衡
    if (this.loudnessNormEnabled && this.loudnessCompressor) {
      currentNode.connect(this.loudnessCompressor);
      currentNode = this.loudnessCompressor;
    }

    // 连接到输出
    currentNode.connect(this.outputNode);
  }

  /**
   * 启用/禁用人声增强
   */
  setVocalEnhance(enabled: boolean): void {
    if (enabled && !this.vocalEnhancer) {
      this.initVocalEnhancer();
    }
    this.vocalEnhanceEnabled = enabled;
    this.rebuildChain();
  }

  /**
   * 设置人声增强参数
   */
  setVocalEnhanceConfig(config: Partial<VocalEnhanceConfig>): void {
    this.vocalConfig = { ...this.vocalConfig, ...config };

    if (this.vocalEnhancer) {
      this.vocalEnhancer.midPeak.gain.value = this.vocalConfig.midBoost;
      this.vocalEnhancer.highShelf.gain.value = this.vocalConfig.clarityBoost;
      this.vocalEnhancer.compressor.ratio.value = this.vocalConfig.compressionRatio;
    }
  }

  /**
   * 启用/禁用低音增强
   */
  setBassBoost(enabled: boolean): void {
    if (enabled && !this.bassBooster) {
      this.initBassBooster();
    }
    this.bassBoostEnabled = enabled;
    this.rebuildChain();
  }

  /**
   * 设置低音增强参数
   */
  setBassBoostConfig(config: Partial<BassBoostConfig>): void {
    this.bassConfig = { ...this.bassConfig, ...config };

    if (this.bassBooster) {
      this.bassBooster.frequency.value = this.bassConfig.frequency;
      this.bassBooster.gain.value = this.bassConfig.gain;
      this.bassBooster.Q.value = this.bassConfig.q;
    }
  }

  /**
   * 启用/禁用空间音效
   */
  setSpatialAudio(enabled: boolean): void {
    if (enabled && !this.spatialProcessor) {
      this.initSpatialProcessor();
    }
    this.spatialAudioEnabled = enabled;
    this.rebuildChain();
  }

  /**
   * 设置空间音效参数
   */
  setSpatialConfig(config: Partial<SpatialAudioConfig>): void {
    this.spatialConfig = { ...this.spatialConfig, ...config };

    // 重新生成 IR
    this.generateReverbIR();

    if (this.spatialGain && this.dryGain) {
      this.spatialGain.gain.value = this.spatialConfig.wetLevel;
      this.dryGain.gain.value = this.spatialConfig.dryLevel;
    }
  }

  /**
   * 启用/禁用响度均衡
   */
  setLoudnessNormalization(enabled: boolean): void {
    if (enabled && !this.loudnessCompressor) {
      this.initLoudnessNormalizer();
    }
    this.loudnessNormEnabled = enabled;
    this.rebuildChain();
  }

  /**
   * 获取当前状态
   */
  getState(): {
    vocalEnhance: boolean;
    bassBoost: boolean;
    spatialAudio: boolean;
    loudnessNorm: boolean;
    vocalConfig: VocalEnhanceConfig;
    bassConfig: BassBoostConfig;
    spatialConfig: SpatialAudioConfig;
  } {
    return {
      vocalEnhance: this.vocalEnhanceEnabled,
      bassBoost: this.bassBoostEnabled,
      spatialAudio: this.spatialAudioEnabled,
      loudnessNorm: this.loudnessNormEnabled,
      vocalConfig: { ...this.vocalConfig },
      bassConfig: { ...this.bassConfig },
      spatialConfig: { ...this.spatialConfig },
    };
  }

  /**
   * 重置所有设置
   */
  reset(): void {
    this.vocalEnhanceEnabled = false;
    this.bassBoostEnabled = false;
    this.spatialAudioEnabled = false;
    this.loudnessNormEnabled = false;

    this.vocalConfig = {
      midBoost: 3,
      clarityBoost: 2,
      compressionRatio: 4,
    };

    this.bassConfig = {
      frequency: 100,
      gain: 6,
      q: 1,
    };

    this.spatialConfig = {
      roomSize: 0.5,
      wetLevel: 0.3,
      dryLevel: 0.7,
      preDelay: 20,
    };

    this.rebuildChain();
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    try {
      this.inputNode?.disconnect();
      this.vocalEnhancer?.compressor.disconnect();
      this.bassBooster?.disconnect();
      this.spatialProcessor?.disconnect();
      this.spatialGain?.disconnect();
      this.dryGain?.disconnect();
      this.loudnessCompressor?.disconnect();
    } catch {
      // 忽略
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.disconnect();
    this.vocalEnhancer = null;
    this.bassBooster = null;
    this.spatialProcessor = null;
    this.spatialGain = null;
    this.dryGain = null;
    this.loudnessCompressor = null;
    this.inputNode = null;
    this.outputNode = null;
  }
}

/**
 * 预设音效配置
 */
export const AUDIO_ENHANCE_PRESETS = {
  /** 人声清晰 */
  vocalClear: {
    vocalEnhance: true,
    vocalConfig: { midBoost: 4, clarityBoost: 3, compressionRatio: 4 },
  },
  /** 低音增强 */
  bassHeavy: {
    bassBoost: true,
    bassConfig: { frequency: 80, gain: 8, q: 0.8 },
  },
  /** 温暖音色 */
  warm: {
    vocalEnhance: true,
    vocalConfig: { midBoost: 2, clarityBoost: -1, compressionRatio: 2 },
    bassBoost: true,
    bassConfig: { frequency: 150, gain: 3, q: 1.2 },
  },
  /** 现场感 */
  live: {
    spatialAudio: true,
    spatialConfig: { roomSize: 0.6, wetLevel: 0.35, dryLevel: 0.65, preDelay: 30 },
  },
  /** 播客/有声书 */
  podcast: {
    vocalEnhance: true,
    vocalConfig: { midBoost: 5, clarityBoost: 4, compressionRatio: 6 },
    loudnessNorm: true,
  },
  /** 夜间模式（压缩动态范围） */
  nightMode: {
    loudnessNorm: true,
    bassBoost: true,
    bassConfig: { frequency: 100, gain: -2, q: 1 },
  },
};

/**
 * 创建音频增强器的便捷函数
 */
export function createAudioEnhancer(options: AudioEnhancerOptions): AudioEnhancer {
  return new AudioEnhancer(options);
}
