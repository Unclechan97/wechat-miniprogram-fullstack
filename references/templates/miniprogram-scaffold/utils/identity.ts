// 身份头构造：本地开发用 X-User-Id 模拟；云端身份由 callContainer 网关注入 x-wx-openid，此处不传
// 服务端配对要求见 miniprogram-scaffold/README.md（ALLOW_MOCK_IDENTITY 生产必须关）
import { API_MODE } from './config';

const MOCK_USER_ID_KEY = 'mock_user_id';

export function getMockUserId(): string {
  let id = wx.getStorageSync<string>(MOCK_USER_ID_KEY);
  if (!id) {
    id = `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    wx.setStorageSync(MOCK_USER_ID_KEY, id);
  }
  return id;
}

export function identityHeaders(): Record<string, string> {
  if (API_MODE === 'local') return { 'X-User-Id': getMockUserId() };
  return {}; // 云端：x-wx-openid 由 callContainer 网关注入
}
