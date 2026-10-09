// 小程序请求层骨架：三通道（本地 / callContainer / 公网直连+回退）
// 放到 miniprogram/services/api.ts。
//
// 配套文件（全文在 templates/miniprogram-scaffold/utils/ 里，直接拷）：
//   utils/config.ts    —— API_MODE / CLOUD_ENV / CLOUD_SERVICE / BASE_URL / DIRECT_BASE / APP_SHARED_KEY
//   utils/identity.ts  —— identityHeaders()（本地 X-User-Id 模拟；云端由网关注入）
//
// 可整体删除的部分：③ 文件上传段（uploadFileAs + 三个辅助函数）——你的产品没有
// 文件上传就删掉；② 直连段（directRequest/openRequest）——没有开放端点就删掉。
// 本文件所有函数均已 export，开着 noUnusedLocals 的严格 tsconfig 也能直接通过 tsc。
//
// ★ 前置：callContainer 必须先 wx.cloud.init（见 app.ts 模板 / 03 §3.2）

import { BASE_URL, API_MODE, CLOUD_ENV, CLOUD_SERVICE, DIRECT_BASE, APP_SHARED_KEY } from '../utils/config';
import { identityHeaders } from '../utils/identity';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const GATEWAY_FAIL_RE = /-606\d{3}|system ?error/i;

// 有密钥才带 x-app-key（APP_SHARED_KEY 留空时不下发，本地无 guard 也能跑）
function sharedKeyHeader(): Record<string, string> {
  return APP_SHARED_KEY ? { 'x-app-key': APP_SHARED_KEY } : {};
}

function httpError(data: unknown, statusCode: number): Error & { statusCode?: number } {
  const d = data as { error?: string; detail?: string } | undefined;
  const e = new Error([d?.error, d?.detail].filter(Boolean).join('｜') || `HTTP ${statusCode}`) as Error & { statusCode?: number };
  e.statusCode = statusCode;
  return e;
}

// ① callContainer 通道（账本数据；网关自动注入 x-wx-openid）
function cloudRequest<T>(method: string, path: string, data?: unknown, header?: Record<string, string>): Promise<T> {
  return new Promise((resolve, reject) => {
    wx.cloud.callContainer({
      config: { env: CLOUD_ENV },
      path, method: method as 'GET',
      header: { 'X-WX-SERVICE': CLOUD_SERVICE, ...(header || {}) },  // ★ 必带
      data,
      success: (r) => (r.statusCode < 400 ? resolve(r.data as T) : reject(httpError(r.data, r.statusCode))),
      fail: (e) => reject(new Error(e.errMsg || '云调用失败，请检查网络')),
    });
  });
}

// 网关瞬时拒客自动重试（仅 cloud 模式 + 网关类错误）
async function gatewayRetry<T>(fn: () => Promise<T>): Promise<T> {
  const delays = [2000, 6000, 12000];
  for (let i = 0; ; i++) {
    try { return await fn(); } catch (e) {
      const msg = String((e as Error)?.message ?? e ?? '');
      if (i >= delays.length || API_MODE !== 'cloud' || !GATEWAY_FAIL_RE.test(msg)) throw e;
      console.warn(`[api] 网关瞬时失败，${delays[i] / 1000}s 后重试:`, msg.slice(0, 80));
      await sleep(delays[i]);
    }
  }
}

// 统一请求入口（身份类数据走这里）
export function request<T>(method: 'GET' | 'POST' | 'DELETE', url: string, data?: Record<string, unknown>): Promise<T> {
  const header = { ...sharedKeyHeader(), ...identityHeaders() }; // ★ 所有通道统一带头
  if (API_MODE === 'cloud') return gatewayRetry(() => cloudRequest<T>(method, url, data, header));
  return new Promise((resolve, reject) => {
    wx.request({ url: `${BASE_URL}${url}`, method, data, header,
      success: (r) => (r.statusCode < 400 ? resolve(r.data as T) : reject(httpError(r.data, r.statusCode))),
      fail: (e) => reject(new Error(e.errMsg || '网络错误')),
    });
  });
}

// ② 公网直连（开放端点优先，失败回退；4xx 不回退——通道是通的，服务端拒绝）
function directRequest<T>(method: string, path: string, data?: Record<string, unknown>): Promise<T> {
  return new Promise((resolve, reject) => {
    wx.request({ url: `${DIRECT_BASE}${path}`, method: method as 'GET', data,
      header: { 'content-type': 'application/json', ...sharedKeyHeader() },
      success: (r) => (r.statusCode < 400 ? resolve(r.data as T) : reject(httpError(r.data, r.statusCode))),
      fail: (e) => reject(new Error(e.errMsg || '直连请求失败')),
    });
  });
}

export async function openRequest<T>(method: 'GET' | 'POST', url: string, data?: Record<string, unknown>): Promise<T> {
  if (API_MODE === 'cloud' && DIRECT_BASE) {
    try { return await directRequest<T>(method, url, data); } catch (e) {
      const status = (e as Error & { statusCode?: number }).statusCode;
      if (status && status < 500) throw e;
      console.warn('[api] 直连失败，回退 callContainer:', String((e as Error).message).slice(0, 80));
    }
  }
  return request<T>(method, url, data);
}

// ③ 文件上传三通道：直连 multipart 优先（省 1/3 体积）→ 回退 callContainer JSON base64
export async function uploadFileAs<T>(filePath: string, name: string, url: string): Promise<T> {
  if (API_MODE === 'cloud' && DIRECT_BASE) {
    try { return await multipartUpload<T>(DIRECT_BASE, filePath, name, url, sharedKeyHeader()); }
    catch (e) {
      const status = (e as Error & { statusCode?: number }).statusCode;
      if (status && status < 500) throw e;
      console.warn('[api] 直连上传失败，回退 callContainer:', String((e as Error).message).slice(0, 80));
    }
  }
  if (API_MODE === 'local') return multipartUpload<T>(BASE_URL, filePath, name, url, { ...sharedKeyHeader(), ...identityHeaders() });
  const b64 = await readFileBase64(filePath);
  return request<T>('POST', url, { [`${name}_base64`]: b64, mime: guessMime(name, filePath) });
}

// —— 上传辅助（直连/本地/回退三通道共用，完整可抄）——

export function multipartUpload<T>(base: string, filePath: string, name: string, url: string, header: Record<string, string>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    wx.uploadFile({
      url: `${base}${url}`, filePath, name, header,
      success: (r) => {
        try {
          const data = JSON.parse(r.data) as T & { error?: string; detail?: string };
          if (r.statusCode < 400) resolve(data);
          else reject(httpError(data, r.statusCode));
        } catch {
          reject(new Error(`响应不是 JSON（HTTP ${r.statusCode}）`));
        }
      },
      fail: (e) => reject(new Error(e.errMsg || '上传失败')),
    });
  });
}

export function readFileBase64(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    wx.getFileSystemManager().readFile({
      filePath, encoding: 'base64',
      success: (r) => resolve(String(r.data)),
      fail: (e) => reject(new Error(e.errMsg || '读文件失败')),
    });
  });
}

export function guessMime(name: string, filePath: string): string {
  const p = filePath.toLowerCase();
  if (name === 'audio') return p.endsWith('.wav') ? 'audio/wav' : 'audio/mpeg';
  return p.endsWith('.png') ? 'image/png' : 'image/jpeg';
}
