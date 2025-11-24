/**
 * 波形处理 Web Worker
 * 将波形数据处理移到后台线程，避免阻塞主线程
 */

export interface WaveformWorkerInput {
  channelData: Float32Array;
  width: number;
  normalize: boolean;
}

export interface WaveformWorkerOutput {
  peaks: Array<{ min: number; max: number }>;
}

// Worker 上下文
self.onmessage = (e: MessageEvent<WaveformWorkerInput>) => {
  const { channelData, width, normalize } = e.data;
  const peaks: Array<{ min: number; max: number }> = [];
  const step = Math.ceil(channelData.length / width);

  // 计算归一化系数
  let max = 0;
  if (normalize) {
    for (let i = 0; i < channelData.length; i += step) {
      const absValue = Math.abs(channelData[i]);
      if (absValue > max) max = absValue;
    }
  } else {
    max = 1;
  }

  // 计算每个采样点的峰值
  for (let i = 0; i < width; i++) {
    const index = i * step;
    let minValue = 1.0;
    let maxValue = -1.0;

    for (let j = 0; j < step; j++) {
      const datum = channelData[index + j] || 0;
      if (datum < minValue) minValue = datum;
      if (datum > maxValue) maxValue = datum;
    }

    peaks.push({
      min: minValue / max,
      max: maxValue / max,
    });
  }

  const result: WaveformWorkerOutput = { peaks };
  self.postMessage(result);
};
