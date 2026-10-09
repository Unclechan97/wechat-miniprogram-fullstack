// 通道与环境配置：所有环境相关值集中在这里（配套 services/api.ts 使用）
// 本地开发：API_MODE='local' + BASE_URL 指到本机服务
// 上云后：  API_MODE='cloud' + 填 CLOUD_ENV / CLOUD_SERVICE

export const API_MODE: 'cloud' | 'local' = 'local';

export const CLOUD_ENV = '';       // 云托管环境 ID（cloud 模式必填）
export const CLOUD_SERVICE = '';   // 云托管服务名（cloud 模式必填）

export const BASE_URL = 'http://127.0.0.1:3000';  // 本地服务地址（local 模式用）

// 可选：公网直连通道——只有"不依赖微信身份的开放端点"才可用；没有就留空
export const DIRECT_BASE = '';
export const APP_SHARED_KEY = '';  // 与服务端 APP_SHARED_KEY 一致；留空则不带该头
