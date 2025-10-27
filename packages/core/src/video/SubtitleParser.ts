/**
 * 字幕解析器 - 支持 SRT 和 VTT 格式
 */

import type { SubtitleCue } from '../types/video';

export class SubtitleParser {
  private cues: SubtitleCue[] = [];

  /**
   * 解析 SRT 格式字幕
   */
  parseSRT(content: string): void {
    this.cues = [];

    const blocks = content.trim().split(/\n\s*\n/);

    for (const block of blocks) {
      const lines = block.split('\n');
      if (lines.length < 3) continue;

      // 第一行是序号，跳过
      // 第二行是时间
      const timeLine = lines[1];
      const timeMatch = timeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);

      if (timeMatch) {
        const start = this.parseTimestamp(
          timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]
        );
        const end = this.parseTimestamp(
          timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]
        );

        // 剩余行是文本
        const text = lines.slice(2).join('\n');

        this.cues.push({ start, end, text });
      }
    }

    this.sortCues();
  }

  /**
   * 解析 WebVTT 格式字幕
   */
  parseVTT(content: string): void {
    this.cues = [];

    // 移除 WEBVTT 头部
    const lines = content.split('\n');
    let startIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('WEBVTT')) {
        startIndex = i + 1;
        break;
      }
    }

    const blocks = lines.slice(startIndex).join('\n').trim().split(/\n\s*\n/);

    for (const block of blocks) {
      const blockLines = block.split('\n');
      if (blockLines.length < 2) continue;

      // 查找时间行（可能有可选的 cue identifier）
      let timeLine = '';
      let textStartIndex = 0;

      for (let i = 0; i < blockLines.length; i++) {
        if (blockLines[i].includes('-->')) {
          timeLine = blockLines[i];
          textStartIndex = i + 1;
          break;
        }
      }

      if (!timeLine) continue;

      const timeMatch = timeLine.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/);

      if (timeMatch) {
        const start = this.parseTimestamp(
          timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]
        );
        const end = this.parseTimestamp(
          timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]
        );

        const text = blockLines.slice(textStartIndex).join('\n');

        this.cues.push({ start, end, text });
      }
    }

    this.sortCues();
  }

  /**
   * 从 URL 加载字幕
   */
  async loadFromUrl(url: string): Promise<void> {
    const response = await fetch(url);
    const content = await response.text();

    // 根据内容判断格式
    if (content.includes('WEBVTT')) {
      this.parseVTT(content);
    } else {
      this.parseSRT(content);
    }
  }

  /**
   * 解析时间戳
   */
  private parseTimestamp(hours: string, minutes: string, seconds: string, milliseconds: string): number {
    return (
      parseInt(hours, 10) * 3600 +
      parseInt(minutes, 10) * 60 +
      parseInt(seconds, 10) +
      parseInt(milliseconds, 10) / 1000
    );
  }

  /**
   * 排序字幕
   */
  private sortCues(): void {
    this.cues.sort((a, b) => a.start - b.start);
  }

  /**
   * 获取所有字幕
   */
  getCues(): SubtitleCue[] {
    return this.cues;
  }

  /**
   * 根据时间获取当前字幕
   */
  getCurrentCue(currentTime: number): SubtitleCue | null {
    for (const cue of this.cues) {
      if (currentTime >= cue.start && currentTime <= cue.end) {
        return cue;
      }
    }
    return null;
  }

  /**
   * 获取指定范围内的字幕
   */
  getCuesInRange(startTime: number, endTime: number): SubtitleCue[] {
    return this.cues.filter(
      cue => cue.start <= endTime && cue.end >= startTime
    );
  }

  /**
   * 搜索字幕
   */
  search(keyword: string): SubtitleCue[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.cues.filter(cue =>
      cue.text.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * 导出为 SRT 格式
   */
  exportToSRT(): string {
    let srt = '';

    this.cues.forEach((cue, index) => {
      srt += `${index + 1}\n`;
      srt += `${this.formatTimestamp(cue.start)} --> ${this.formatTimestamp(cue.end)}\n`;
      srt += `${cue.text}\n\n`;
    });

    return srt;
  }

  /**
   * 格式化时间戳（SRT 格式）
   */
  private formatTimestamp(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const millis = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
  }

  /**
   * 清空字幕
   */
  clear(): void {
    this.cues = [];
  }
}

