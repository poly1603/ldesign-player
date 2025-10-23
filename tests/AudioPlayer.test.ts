/**
 * AudioPlayer 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AudioPlayer } from '../src/core/AudioPlayer';
import { PlayState } from '../src/types/player';

describe('AudioPlayer', () => {
  let player: AudioPlayer;

  beforeEach(() => {
    player = new AudioPlayer({
      volume: 0.8,
      muted: false,
    });
  });

  afterEach(() => {
    player.destroy();
  });

  describe('初始化', () => {
    it('应该正确初始化配置', () => {
      const state = player.getState();
      expect(state.volume).toBe(0.8);
      expect(state.muted).toBe(false);
      expect(state.playState).toBe(PlayState.IDLE);
    });

    it('应该使用默认配置', () => {
      const defaultPlayer = new AudioPlayer();
      const state = defaultPlayer.getState();
      expect(state.volume).toBe(1);
      expect(state.muted).toBe(false);
      defaultPlayer.destroy();
    });
  });

  describe('音量控制', () => {
    it('应该正确设置音量', () => {
      player.setVolume(0.5);
      expect(player.getVolume()).toBe(0.5);
    });

    it('应该限制音量范围在 0-1', () => {
      player.setVolume(1.5);
      expect(player.getVolume()).toBe(1);

      player.setVolume(-0.5);
      expect(player.getVolume()).toBe(0);
    });

    it('应该正确切换静音状态', () => {
      player.mute();
      expect(player.isMuted()).toBe(true);

      player.unmute();
      expect(player.isMuted()).toBe(false);
    });
  });

  describe('播放速率', () => {
    it('应该正确设置播放速率', () => {
      player.setPlaybackRate(1.5);
      expect(player.getPlaybackRate()).toBe(1.5);
    });

    it('应该限制播放速率范围在 0.5-2', () => {
      player.setPlaybackRate(3);
      expect(player.getPlaybackRate()).toBe(2);

      player.setPlaybackRate(0.25);
      expect(player.getPlaybackRate()).toBe(0.5);
    });
  });

  describe('循环模式', () => {
    it('应该正确设置循环模式', () => {
      player.setLoopMode('single');
      expect(player.getLoopMode()).toBe('single');

      player.setLoopMode('list');
      expect(player.getLoopMode()).toBe('list');

      player.setLoopMode('random');
      expect(player.getLoopMode()).toBe('random');
    });
  });

  describe('播放列表', () => {
    it('应该获取播放列表管理器', () => {
      const playlistManager = player.getPlaylistManager();
      expect(playlistManager).toBeDefined();
      expect(playlistManager.length()).toBe(0);
    });

    it('应该正确添加轨道到播放列表', () => {
      const playlistManager = player.getPlaylistManager();
      playlistManager.add({
        id: '1',
        title: '测试歌曲',
        src: 'test.mp3',
      });

      expect(playlistManager.length()).toBe(1);
      const track = playlistManager.get(0);
      expect(track?.title).toBe('测试歌曲');
    });
  });

  describe('状态管理', () => {
    it('应该获取当前状态', () => {
      const state = player.getState();
      expect(state).toBeDefined();
      expect(state.playState).toBe(PlayState.IDLE);
      expect(state.currentTime).toBe(0);
      expect(state.duration).toBe(0);
    });
  });

  describe('事件系统', () => {
    it('应该正确触发和监听事件', (done) => {
      player.on('volumechange', ({ volume, muted }) => {
        expect(volume).toBe(0.6);
        expect(muted).toBe(false);
        done();
      });

      player.setVolume(0.6);
    });

    it('应该支持一次性事件监听', (done) => {
      let callCount = 0;

      player.once('volumechange', () => {
        callCount++;
      });

      player.setVolume(0.7);
      player.setVolume(0.8);

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 100);
    });
  });

  describe('销毁', () => {
    it('应该正确销毁播放器', () => {
      const testPlayer = new AudioPlayer();
      testPlayer.destroy();

      expect(() => testPlayer.play()).not.toThrow();
    });
  });
});

