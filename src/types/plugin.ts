/**
 * 插件系统类型定义
 */

import type { EventEmitter } from '../core/EventEmitter';

/**
 * 插件接口
 */
export interface IPlugin {
  name: string;
  version: string;
  install(player: any): void;
  uninstall(): void;
}

/**
 * 插件配置
 */
export interface PluginConfig {
  [key: string]: any;
}

/**
 * 插件构造函数
 */
export type PluginConstructor = new (config?: PluginConfig) => IPlugin;

/**
 * 插件管理器接口
 */
export interface IPluginManager {
  register(plugin: PluginConstructor, config?: PluginConfig): void;
  unregister(name: string): void;
  get(name: string): IPlugin | undefined;
  has(name: string): boolean;
  getAll(): IPlugin[];
}

