/**
 * 歌词解析器 - 支持 LRC 格式
 */

import type { LyricLine } from '../types/audio';
import { parseTime } from '../utils/helpers';

export class LyricsParser {
  private lyrics: LyricLine[] = [];
  private metadata: Record<string, string> = {};

  /**
   * 解析 LRC 格式歌词
   */
  parse(lrcContent: string): void {
    this.lyrics = [];
    this.metadata = {};

    const lines = lrcContent.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // 解析元数据标签 [ar:艺术家], [ti:标题], [al:专辑] 等
      const metadataMatch = trimmedLine.match(/^\[([a-z]+):(.+)\]$/i);
      if (metadataMatch) {
        this.metadata[metadataMatch[1].toLowerCase()] = metadataMatch[2].trim();
        continue;
      }

      // 解析时间标签 [mm:ss.xx]歌词
      const timeMatches = trimmedLine.matchAll(/\[(\d{2}):(\d{2})\.?(\d{2,3})?\]/g);
      const matches = Array.from(timeMatches);

      if (matches.length > 0) {
        // 提取歌词文本（移除所有时间标签）
        const text = trimmedLine.replace(/\[\d{2}:\d{2}\.?\d{0,3}\]/g, '').trim();

        // 一行可能有多个时间标签
        for (const match of matches) {
          const minutes = parseInt(match[1], 10);
          const seconds = parseInt(match[2], 10);
          const milliseconds = match[3] ? parseInt(match[3].padEnd(3, '0'), 10) : 0;

          const time = minutes * 60 + seconds + milliseconds / 1000;

          this.lyrics.push({ time, text });
        }
      }
    }

    // 按时间排序
    this.lyrics.sort((a, b) => a.time - b.time);

    // 计算每行歌词的持续时间
    for (let i = 0; i < this.lyrics.length - 1; i++) {
      this.lyrics[i].duration = this.lyrics[i + 1].time - this.lyrics[i].time;
    }
  }

  /**
   * 从 URL 加载并解析歌词
   */
  async loadFromUrl(url: string): Promise<void> {
    const response = await fetch(url);
    const content = await response.text();
    this.parse(content);
  }

  /**
   * 获取所有歌词行
   */
  getLyrics(): LyricLine[] {
    return this.lyrics;
  }

  /**
   * 获取元数据
   */
  getMetadata(): Record<string, string> {
    return { ...this.metadata };
  }

  /**
   * 根据时间获取当前歌词
   */
  getCurrentLine(currentTime: number): LyricLine | null {
    if (this.lyrics.length === 0) return null;

    // 二分查找最接近的歌词行
    let left = 0;
    let right = this.lyrics.length - 1;
    let result: LyricLine | null = null;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const lyric = this.lyrics[mid];

      if (lyric.time <= currentTime) {
        result = lyric;
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }

    return result;
  }

  /**
   * 根据时间获取当前歌词索引
   */
  getCurrentLineIndex(currentTime: number): number {
    const currentLine = this.getCurrentLine(currentTime);
    if (!currentLine) return -1;

    return this.lyrics.indexOf(currentLine);
  }

  /**
   * 获取指定范围内的歌词
   */
  getLyricsInRange(startTime: number, endTime: number): LyricLine[] {
    return this.lyrics.filter(
      lyric => lyric.time >= startTime && lyric.time <= endTime
    );
  }

  /**
   * 搜索歌词
   */
  search(keyword: string): LyricLine[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.lyrics.filter(lyric =>
      lyric.text.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * 导出为 LRC 格式
   */
  exportToLRC(): string {
    let lrc = '';

    // 导出元数据
    for (const [key, value] of Object.entries(this.metadata)) {
      lrc += `[${key}:${value}]\n`;
    }

    lrc += '\n';

    // 导出歌词
    for (const lyric of this.lyrics) {
      const minutes = Math.floor(lyric.time / 60);
      const seconds = lyric.time % 60;
      const milliseconds = Math.floor((seconds % 1) * 100);
      const wholeSeconds = Math.floor(seconds);

      const timeTag = `[${String(minutes).padStart(2, '0')}:${String(wholeSeconds).padStart(2, '0')}.${String(milliseconds).padStart(2, '0')}]`;
      lrc += `${timeTag}${lyric.text}\n`;
    }

    return lrc;
  }

  /**
   * 清空歌词
   */
  clear(): void {
    this.lyrics = [];
    this.metadata = {};
  }
}

